// ─── Metrics Logger ──────────────────────────────────────────────────
// Structured logging for feed fetch operations.

export interface FetchMetric {
    feedUrl: string;
    source: string;
    timestamp: Date;
    durationMs: number;
    articlesAdded: number;
    totalArticlesInFeed: number;
    skipped304: boolean;
    error?: string;
}

const metricsLog: FetchMetric[] = [];
const MAX_METRICS_HISTORY = 500;

export function logFetchMetric(metric: FetchMetric): void {
    metricsLog.push(metric);

    // Trim old metrics
    if (metricsLog.length > MAX_METRICS_HISTORY) {
        metricsLog.splice(0, metricsLog.length - MAX_METRICS_HISTORY);
    }

    // Pretty-print to console
    const status = metric.error
        ? `❌ FAIL`
        : metric.skipped304
            ? `⏭️  304`
            : `✅ OK`;

    const details = [
        `${status}`,
        `[${metric.source}]`,
        `${metric.durationMs}ms`,
        metric.skipped304
            ? "not modified"
            : `+${metric.articlesAdded}/${metric.totalArticlesInFeed} articles`,
    ];

    if (metric.error) {
        details.push(`error: ${metric.error}`);
    }

    console.log(`📊 Feed Fetch | ${details.join(" | ")}`);
}

export function getMetrics(): {
    recentFetches: FetchMetric[];
    summary: {
        totalFetches: number;
        totalArticlesAdded: number;
        totalFailures: number;
        total304Skips: number;
        avgDurationMs: number;
    };
} {
    const totalFetches = metricsLog.length;
    const totalArticlesAdded = metricsLog.reduce(
        (sum, m) => sum + m.articlesAdded,
        0
    );
    const totalFailures = metricsLog.filter((m) => !!m.error).length;
    const total304Skips = metricsLog.filter((m) => m.skipped304).length;
    const avgDurationMs =
        totalFetches > 0
            ? Math.round(
                metricsLog.reduce((sum, m) => sum + m.durationMs, 0) / totalFetches
            )
            : 0;

    return {
        recentFetches: metricsLog.slice(-50),
        summary: {
            totalFetches,
            totalArticlesAdded,
            totalFailures,
            total304Skips,
            avgDurationMs,
        },
    };
}
