// ─── In-Memory Article Database ──────────────────────────────────────
// Stores articles with deduplication via GUID (fallback: link hash).
// Supports upsert logic for idempotent ingestion.

import { createHash } from "crypto";

export interface StoredArticle {
    /** Unique key: GUID if present, else SHA-256 of link */
    id: string;
    guid: string | null;
    title: string;
    description: string;
    link: string;
    pubDate: string;
    category: string;
    subcategory: string;
    source: string;
    sourceLocale: string;
    /** ISO timestamp of when we first ingested this article */
    ingestedAt: string;
    /** Translations keyed by locale code */
    translations: Record<
        string,
        { title: string; description: string; translatedAt: string }
    >;
}

export interface FeedCacheEntry {
    etag?: string;
    lastModified?: string;
}

// ─── Storage ─────────────────────────────────────────────────────────
/** Articles keyed by dedup ID */
const articles = new Map<string, StoredArticle>();

/** Feed cache headers keyed by feed URL */
const feedCache = new Map<string, FeedCacheEntry>();

// ─── Helpers ─────────────────────────────────────────────────────────
export function generateArticleId(
    guid: string | null | undefined,
    link: string
): string {
    if (guid && typeof guid === "string" && guid.trim().length > 0) {
        return guid.trim();
    }
    // Fallback: hash the link
    return createHash("sha256").update(link || "").digest("hex");
}

// ─── Article Operations ──────────────────────────────────────────────

/**
 * Upsert an article. Returns true if it was a new insert, false if it already existed.
 * If the article exists, we skip (idempotent — no overwrite).
 */
export function upsertArticle(article: StoredArticle): boolean {
    if (articles.has(article.id)) {
        return false; // Already exists, skip
    }
    articles.set(article.id, article);
    return true;
}

export function getArticle(id: string): StoredArticle | undefined {
    return articles.get(id);
}

export function getAllArticles(): StoredArticle[] {
    return Array.from(articles.values());
}

export function getArticleCount(): number {
    return articles.size;
}

/**
 * Get articles that need translation for a given locale.
 * Returns articles that don't yet have a translation for the specified locale.
 */
export function getUntranslatedArticles(locale: string): StoredArticle[] {
    return Array.from(articles.values()).filter(
        (article) => !article.translations[locale]
    );
}

/**
 * Store a translation for a given article and locale.
 */
export function storeTranslation(
    articleId: string,
    locale: string,
    title: string,
    description: string
): void {
    const article = articles.get(articleId);
    if (article) {
        article.translations[locale] = {
            title,
            description,
            translatedAt: new Date().toISOString(),
        };
    }
}

// ─── Feed Cache Operations ───────────────────────────────────────────

export function getFeedCache(feedUrl: string): FeedCacheEntry | undefined {
    return feedCache.get(feedUrl);
}

export function setFeedCache(feedUrl: string, entry: FeedCacheEntry): void {
    feedCache.set(feedUrl, entry);
}
