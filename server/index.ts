import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { getAllArticles, getArticleCount } from "./db.js";
import { getMetrics } from "./metrics.js";
import { startScheduler } from "./scheduler.js";
import {
    initTranslationQueue,
    translateOnDemand,
} from "./translator.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── Initialize Translation Engine ──────────────────────────────────
const apiKey = process.env.LINGODOTDEV_API_KEY;
if (apiKey) {
    initTranslationQueue(apiKey);
} else {
    console.warn("⚠️  LINGODOTDEV_API_KEY not set — translation disabled");
}

// ─── Start Feed Scheduler ────────────────────────────────────────────
startScheduler();

// ─── API Routes ──────────────────────────────────────────────────────

/**
 * GET /api/feeds
 * Returns all stored articles, sorted by pubDate descending.
 * Includes pre-computed translations if available.
 */
app.get("/api/feeds", (_req, res) => {
    try {
        const articles = getAllArticles();

        // Map to the frontend's expected shape
        const items = articles.map((article) => ({
            id: article.id,
            title: article.title,
            description: article.description,
            link: article.link,
            pubDate: article.pubDate,
            category: article.category,
            subcategory: article.subcategory,
            source: article.source,
            sourceLocale: article.sourceLocale,
            translations: article.translations,
        }));

        // Sort by pubDate descending
        items.sort(
            (a, b) =>
                new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        );

        res.json({ items, totalCount: items.length });
    } catch (error) {
        console.error("Error fetching feeds:", error);
        res.status(500).json({ error: "Failed to fetch feeds" });
    }
});

/**
 * POST /api/translate
 * On-demand translation for the frontend.
 * For articles not yet translated in the background.
 */
app.post("/api/translate", async (req, res) => {
    try {
        const { texts, targetLocale, sourceLocale = "en" } = req.body;

        if (!texts || !targetLocale) {
            res.status(400).json({ error: "Missing texts or targetLocale" });
            return;
        }

        if (!apiKey) {
            res
                .status(500)
                .json({ error: "LINGODOTDEV_API_KEY not configured" });
            return;
        }

        const translated = await translateOnDemand(
            texts,
            sourceLocale,
            targetLocale
        );

        res.json({ translated });
    } catch (error) {
        console.error("Translation error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
});

/**
 * GET /api/metrics
 * Returns feed fetch metrics and summary stats.
 */
app.get("/api/metrics", (_req, res) => {
    try {
        const metrics = getMetrics();
        res.json({
            ...metrics,
            articleCount: getArticleCount(),
        });
    } catch (error) {
        console.error("Error fetching metrics:", error);
        res.status(500).json({ error: "Failed to fetch metrics" });
    }
});

// ─── Start Server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Metrics available at http://localhost:${PORT}/api/metrics`);
});
