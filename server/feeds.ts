// ─── Feed Configuration ──────────────────────────────────────────────
// Each feed has a polling interval in minutes (2-5 range),
// category/subcategory for UI, and a source label.

export interface FeedConfig {
    url: string;
    category: string;
    subcategory: string;
    source: string;
    /** Polling interval in minutes (2-5) */
    pollIntervalMinutes: number;
    /** Source language — used for translation direction */
    sourceLocale: string;
}

export const RSS_FEEDS: FeedConfig[] = [
    // ─── QNA (Qatar News Agency) ───────────────────────────────────────
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Economy-Local",
        category: "Economy",
        subcategory: "Local",
        source: "QNA",
        pollIntervalMinutes: 3,
        sourceLocale: "en",
    },
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Economy-International",
        category: "Economy",
        subcategory: "International",
        source: "QNA",
        pollIntervalMinutes: 3,
        sourceLocale: "en",
    },
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Sport-Local",
        category: "Sport",
        subcategory: "Local",
        source: "QNA",
        pollIntervalMinutes: 3,
        sourceLocale: "en",
    },
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Sport-International",
        category: "Sport",
        subcategory: "International",
        source: "QNA",
        pollIntervalMinutes: 3,
        sourceLocale: "en",
    },
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Miscellaneous-International",
        category: "Miscellaneous",
        subcategory: "International",
        source: "QNA",
        pollIntervalMinutes: 4,
        sourceLocale: "en",
    },
    {
        url: "https://qna.org.qa/en/Pages/RSS-Feeds/Qatar",
        category: "Qatar",
        subcategory: "General",
        source: "QNA",
        pollIntervalMinutes: 2,
        sourceLocale: "en",
    },

    // ─── Doha News ─────────────────────────────────────────────────────
    {
        url: "https://dohanews.co/feed/",
        category: "Qatar",
        subcategory: "General",
        source: "Doha News",
        pollIntervalMinutes: 3,
        sourceLocale: "en",
    },

    // ─── Marhaba Qatar ─────────────────────────────────────────────────
    {
        url: "https://marhaba.qa/feed/",
        category: "Qatar",
        subcategory: "Lifestyle",
        source: "Marhaba",
        pollIntervalMinutes: 5,
        sourceLocale: "en",
    },

    // ─── Al Arab (Arabic sources) ──────────────────────────────────────
    {
        url: "https://alarab.qa/category/%D9%82%D8%B7%D8%B1-%D8%A8%D8%B9%D9%8A%D9%88%D9%86-%D8%A7%D9%84%D8%B9%D8%B1%D8%A8/feed",
        category: "Qatar",
        subcategory: "Arab Eyes",
        source: "Al Arab",
        pollIntervalMinutes: 3,
        sourceLocale: "ar",
    },
    {
        url: "https://alarab.qa/category/%D8%AA%D8%AD%D9%82%D9%8A%D9%82%D8%A7%D8%AA/feed",
        category: "Investigations",
        subcategory: "General",
        source: "Al Arab",
        pollIntervalMinutes: 4,
        sourceLocale: "ar",
    },
    {
        url: "https://alarab.qa/category/%D9%86%D9%81%D8%AD%D8%A7%D8%AA-%D8%B1%D9%85%D8%B6%D8%A7%D9%86/feed",
        category: "Culture",
        subcategory: "Ramadan",
        source: "Al Arab",
        pollIntervalMinutes: 5,
        sourceLocale: "ar",
    },
    {
        url: "https://alarab.qa/category/%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF-%D9%85%D8%AD%D9%84%D9%8A/feed",
        category: "Economy",
        subcategory: "Local",
        source: "Al Arab",
        pollIntervalMinutes: 3,
        sourceLocale: "ar",
    },

    // ─── Gulf Times ────────────────────────────────────────────────────
    {
        url: "https://www.gulf-times.com/rssFeed/15",
        category: "Qatar",
        subcategory: "General",
        source: "Gulf Times",
        pollIntervalMinutes: 2,
        sourceLocale: "en",
    },
    {
        url: "https://www.gulf-times.com/rssFeed/5",
        category: "Economy",
        subcategory: "Business",
        source: "Gulf Times",
        pollIntervalMinutes: 3,
        sourceLocale: "en",
    },
];
