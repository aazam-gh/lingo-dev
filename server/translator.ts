// ─── Translation Queue ───────────────────────────────────────────────
// Background translation queue using Lingo.dev SDK.
// When new articles are inserted, translation jobs are enqueued.
// Batch translates multiple articles at once.

import { LingoDotDevEngine } from "lingo.dev/sdk";
import {
    getUntranslatedArticles,
    storeTranslation,
    type StoredArticle,
} from "./db.js";

// ─── Configuration ───────────────────────────────────────────────────
/** Languages to auto-translate into */
const ENABLED_LOCALES = ["en", "ar"];

/** Max articles to translate in one batch */
const BATCH_SIZE = 20;

/** Delay between batches (ms) to avoid rate limiting */
const BATCH_DELAY_MS = 2000;

/** Delay between queue processing cycles */
const QUEUE_PROCESS_INTERVAL_MS = 30_000; // 30 seconds

// ─── Queue State ─────────────────────────────────────────────────────
interface TranslationJob {
    articleId: string;
    locale: string;
    article: StoredArticle;
}

let isProcessing = false;
let processInterval: ReturnType<typeof setInterval> | null = null;
let lingoDotDev: LingoDotDevEngine | null = null;

// ─── Initialize ──────────────────────────────────────────────────────
export function initTranslationQueue(apiKey: string): void {
    lingoDotDev = new LingoDotDevEngine({ apiKey });

    console.log(
        `🌐 Translation queue initialized (locales: ${ENABLED_LOCALES.join(", ")})`
    );

    // Start processing loop
    processInterval = setInterval(processQueue, QUEUE_PROCESS_INTERVAL_MS);

    // Run once immediately
    setTimeout(processQueue, 5000);
}

export function stopTranslationQueue(): void {
    if (processInterval) {
        clearInterval(processInterval);
        processInterval = null;
    }
}

// ─── Queue Processing ────────────────────────────────────────────────
async function processQueue(): Promise<void> {
    if (isProcessing || !lingoDotDev) return;
    isProcessing = true;

    try {
        for (const locale of ENABLED_LOCALES) {
            const untranslated = getUntranslatedArticles(locale);
            if (untranslated.length === 0) continue;

            // Filter out articles whose sourceLocale matches the target locale
            const needsTranslation = untranslated.filter(
                (a) => a.sourceLocale !== locale
            );
            if (needsTranslation.length === 0) continue;

            console.log(
                `🌐 Translating ${needsTranslation.length} articles to ${locale}...`
            );

            // Process in batches
            for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
                const batch = needsTranslation.slice(i, i + BATCH_SIZE);
                await translateBatch(batch, locale);

                // Delay between batches
                if (i + BATCH_SIZE < needsTranslation.length) {
                    await sleep(BATCH_DELAY_MS);
                }
            }
        }
    } catch (err) {
        console.error("❌ Translation queue error:", err);
    } finally {
        isProcessing = false;
    }
}

async function translateBatch(
    articles: StoredArticle[],
    targetLocale: string
): Promise<void> {
    if (!lingoDotDev) return;

    try {
        // Build a single object for batch translation
        const textObj: Record<string, string> = {};
        for (const article of articles) {
            textObj[`${article.id}__title`] = article.title;
            textObj[`${article.id}__desc`] = article.description;
        }

        // Determine source locale (use first article's source locale, or default "en")
        const sourceLocale = articles[0]?.sourceLocale || "en";

        const translated = await lingoDotDev.localizeObject(textObj, {
            sourceLocale,
            targetLocale,
        });

        // Store translations
        for (const article of articles) {
            const translatedTitle =
                translated[`${article.id}__title`] || article.title;
            const translatedDesc =
                translated[`${article.id}__desc`] || article.description;
            storeTranslation(article.id, targetLocale, translatedTitle, translatedDesc);
        }

        console.log(
            `  ✅ Batch translated ${articles.length} articles → ${targetLocale}`
        );
    } catch (err) {
        console.error(
            `  ❌ Batch translation failed (${targetLocale}):`,
            err instanceof Error ? err.message : err
        );
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Manually trigger translation for a specific locale (called from API).
 * This is used for on-demand translation from the frontend.
 */
export async function translateOnDemand(
    texts: Record<string, string>,
    sourceLocale: string,
    targetLocale: string
): Promise<Record<string, string>> {
    if (!lingoDotDev) {
        throw new Error("Translation engine not initialized");
    }

    return lingoDotDev.localizeObject(texts, {
        sourceLocale,
        targetLocale,
    });
}

/**
 * Force process the queue immediately (e.g., after new articles are ingested)
 */
export function triggerQueueProcessing(): void {
    // Don't await — fire and forget
    setTimeout(processQueue, 1000);
}
