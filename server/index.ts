import express from "express";
import cors from "cors";
import { parseStringPromise } from "xml2js";
import dotenv from "dotenv";
import { LingoDotDevEngine } from "lingo.dev/sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const RSS_FEEDS = [
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Economy-Local",
        category: "Economy",
        subcategory: "Local",
    },
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Economy-International",
        category: "Economy",
        subcategory: "International",
    },
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Sport-Local",
        category: "Sport",
        subcategory: "Local",
    },
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Sport-International",
        category: "Sport",
        subcategory: "International",
    },
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Miscellaneous-International",
        category: "Miscellaneous",
        subcategory: "International",
    },
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Qatar",
        category: "Qatar",
        subcategory: "General",
    },
];

interface FeedItem {
    id: string;
    title: string;
    description: string;
    link: string;
    pubDate: string;
    category: string;
    subcategory: string;
}

async function fetchFeed(feed: {
    url: string;
    category: string;
    subcategory: string;
}): Promise<FeedItem[]> {
    try {
        const response = await fetch(feed.url);
        const xml = await response.text();
        const result = await parseStringPromise(xml, { explicitArray: false });

        const channel = result.rss?.channel;
        if (!channel || !channel.item) return [];

        const items = Array.isArray(channel.item)
            ? channel.item
            : [channel.item];

        return items.map((item: any) => ({
            id: item.guid || `${feed.category}-${Date.now()}-${Math.random()}`,
            title: item.title || "",
            description: item.description || "",
            link: item.link || "",
            pubDate: item.pubDate || "",
            category: feed.category,
            subcategory: feed.subcategory,
        }));
    } catch (error) {
        console.error(`Error fetching feed ${feed.url}:`, error);
        return [];
    }
}

// GET /api/feeds - Fetch all RSS feeds
app.get("/api/feeds", async (_req, res) => {
    try {
        const feedPromises = RSS_FEEDS.map((feed) => fetchFeed(feed));
        const allFeeds = await Promise.all(feedPromises);
        const items = allFeeds.flat();

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

// POST /api/translate - Translate content using Lingo.dev SDK
app.post("/api/translate", async (req, res) => {
    try {
        const { texts, targetLocale, sourceLocale = "en" } = req.body;

        if (!texts || !targetLocale) {
            res.status(400).json({ error: "Missing texts or targetLocale" });
            return;
        }

        const apiKey = process.env.LINGODOTDEV_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: "LINGODOTDEV_API_KEY not configured" });
            return;
        }

        const lingoDotDev = new LingoDotDevEngine({ apiKey });

        // Translate an object where keys are IDs and values are texts
        const textObj: Record<string, string> = {};
        for (const [key, value] of Object.entries(texts)) {
            textObj[key] = value as string;
        }

        const translated = await lingoDotDev.localizeObject(textObj, {
            sourceLocale,
            targetLocale,
        });

        res.json({ translated });
    } catch (error) {
        console.error("Translation error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
