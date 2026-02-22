// ─── Cron-Based Feed Scheduler ───────────────────────────────────────
// Polls feeds on configurable intervals (2-5 minutes per feed).
// Uses conditional HTTP headers (ETag, Last-Modified) to skip
// parsing when the feed hasn't changed (304 Not Modified).

import cron from "node-cron";
import { parseStringPromise } from "xml2js";
import type { FeedConfig } from "./feeds.js";
import { RSS_FEEDS } from "./feeds.js";
import {
    generateArticleId,
    upsertArticle,
    getFeedCache,
    setFeedCache,
    type StoredArticle,
} from "./db.js";
import { logFetchMetric } from "./metrics.js";
import { triggerQueueProcessing } from "./translator.js";

// ─── Per-Feed Cron Tasks ─────────────────────────────────────────────
const cronTasks: ReturnType<typeof cron.schedule>[] = [];

/**
 * Start the scheduler. Sets up a cron job for each feed
 * based on its pollIntervalMinutes.
 */
export function startScheduler(): void {
    console.log("⏰ Starting feed scheduler...");

    for (const feed of RSS_FEEDS) {
        // node-cron uses standard cron syntax: sec min hour dom month dow
        // For "every N minutes": `*/${N} * * * *`
        const cronExpression = `*/${feed.pollIntervalMinutes} * * * *`;

        const task = cron.schedule(cronExpression, () => {
            fetchAndStoreFeed(feed).catch((err) =>
                console.error(`Scheduler error for ${feed.source}:`, err)
            );
        });

        cronTasks.push(task);
        console.log(
            `  📡 ${feed.source} [${feed.category}/${feed.subcategory}] → every ${feed.pollIntervalMinutes}m`
        );
    }

    // Do an initial fetch of all feeds immediately
    console.log("🚀 Running initial feed fetch...");
    fetchAllFeeds();
}

export function stopScheduler(): void {
    for (const task of cronTasks) {
        task.stop();
    }
    cronTasks.length = 0;
    console.log("⏰ Scheduler stopped.");
}

// ─── Fetch All Feeds ─────────────────────────────────────────────────
export async function fetchAllFeeds(): Promise<void> {
    const results = await Promise.allSettled(
        RSS_FEEDS.map((feed) => fetchAndStoreFeed(feed))
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    console.log(`📦 Initial fetch complete: ${succeeded} ok, ${failed} failed`);
}

// ─── Single Feed Fetch ───────────────────────────────────────────────
async function fetchAndStoreFeed(feed: FeedConfig): Promise<void> {
    const startTime = Date.now();
    let articlesAdded = 0;
    let totalArticlesInFeed = 0;
    let skipped304 = false;

    try {
        // Build headers for conditional request
        const headers: Record<string, string> = {
            "User-Agent": "QNA-Aggregator/1.0 (RSS Reader)",
            Accept: "application/rss+xml, application/xml, text/xml, */*",
        };

        const cache = getFeedCache(feed.url);
        if (cache?.etag) {
            headers["If-None-Match"] = cache.etag;
        }
        if (cache?.lastModified) {
            headers["If-Modified-Since"] = cache.lastModified;
        }

        const response = await fetch(feed.url, {
            headers,
            signal: AbortSignal.timeout(15000), // 15s timeout
        });

        // Handle 304 Not Modified
        if (response.status === 304) {
            skipped304 = true;
            logFetchMetric({
                feedUrl: feed.url,
                source: feed.source,
                timestamp: new Date(),
                durationMs: Date.now() - startTime,
                articlesAdded: 0,
                totalArticlesInFeed: 0,
                skipped304: true,
            });
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Store cache headers for next request
        const etag = response.headers.get("etag") || undefined;
        const lastModified = response.headers.get("last-modified") || undefined;
        if (etag || lastModified) {
            setFeedCache(feed.url, { etag, lastModified });
        }

        // Parse XML
        const xml = await response.text();
        const result = await parseStringPromise(xml, { explicitArray: false });

        // Handle both RSS and Atom feeds
        let items: any[] = [];

        if (result.rss?.channel) {
            // RSS 2.0
            const channel = result.rss.channel;
            items = channel.item
                ? Array.isArray(channel.item)
                    ? channel.item
                    : [channel.item]
                : [];
        } else if (result.feed?.entry) {
            // Atom
            items = Array.isArray(result.feed.entry)
                ? result.feed.entry
                : [result.feed.entry];
        }

        totalArticlesInFeed = items.length;

        // Process and deduplicate articles
        for (const item of items) {
            // Extract fields (handle both RSS and Atom formats)
            const rawGuid =
                item.guid?._
                    ? item.guid._
                    : typeof item.guid === "string"
                        ? item.guid
                        : item.id || null;
            const link =
                typeof item.link === "string"
                    ? item.link
                    : item.link?.$?.href || item.link?.href || "";
            const title =
                typeof item.title === "string"
                    ? item.title
                    : item.title?._ || "";
            const description =
                item.description ||
                item.summary ||
                item.content?._ ||
                item["content:encoded"] ||
                "";
            const pubDate =
                item.pubDate || item.published || item.updated || "";

            const id = generateArticleId(rawGuid, link);

            const article: StoredArticle = {
                id,
                guid: rawGuid,
                title: cleanHtml(title),
                description: cleanHtml(description),
                link,
                pubDate,
                category: feed.category,
                subcategory: feed.subcategory,
                source: feed.source,
                sourceLocale: feed.sourceLocale,
                ingestedAt: new Date().toISOString(),
                translations: {},
            };

            const isNew = upsertArticle(article);
            if (isNew) articlesAdded++;
        }

        // If new articles were added, trigger background translation
        if (articlesAdded > 0) {
            triggerQueueProcessing();
        }

        logFetchMetric({
            feedUrl: feed.url,
            source: feed.source,
            timestamp: new Date(),
            durationMs: Date.now() - startTime,
            articlesAdded,
            totalArticlesInFeed,
            skipped304: false,
        });
    } catch (err) {
        logFetchMetric({
            feedUrl: feed.url,
            source: feed.source,
            timestamp: new Date(),
            durationMs: Date.now() - startTime,
            articlesAdded: 0,
            totalArticlesInFeed: 0,
            skipped304: false,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

/**
 * Strip HTML tags from a string for cleaner display.
 */
function cleanHtml(str: string): string {
    if (!str) return "";
    return str
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ") // Collapse whitespace
        .trim()
        .slice(0, 1000); // Limit description length
}
