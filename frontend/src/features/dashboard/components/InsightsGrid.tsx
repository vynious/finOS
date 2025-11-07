import { useCurrency } from "@/context/currency-context";
import type {
    Anomaly,
    CategorySlice,
    DateRange,
    InsightSummary,
    TimeSeriesPoint,
} from "@/types";

type InsightsGridProps = {
    summary: InsightSummary;
    series: TimeSeriesPoint[];
    categories: CategorySlice[];
    anomalies: Anomaly[];
    email?: string | null;
    range: DateRange;
};

const rangeLabels: Record<DateRange, string> = {
    "7d": "last 7 days",
    "30d": "last 30 days",
    "90d": "last 90 days",
    "365d": "last year",
    custom: "custom range",
};

function buildPath(points: TimeSeriesPoint[]) {
    if (!points.length) return "";
    const values = points.map((p) => p.total);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    return points
        .map((point, idx) => {
            const x = (idx / (points.length - 1 || 1)) * 100;
            const y = 100 - ((point.total - min) / range) * 100;
            return `${idx === 0 ? "M" : "L"} ${x},${y}`;
        })
        .join(" ");
}

function donutBg(slices: CategorySlice[]) {
    if (!slices.length) return "conic-gradient(#1f2937 0deg 360deg)";
    let cursor = 0;
    const segments = slices.map((slice, idx) => {
        const start = cursor;
        const sweep = (slice.percent / 100) * 360;
        cursor += sweep;
        const colors = ["#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa"];
        const color = colors[idx % colors.length];
        return `${color} ${start}deg ${start + sweep}deg`;
    });
    return `conic-gradient(${segments.join(",")})`;
}

export function InsightsGrid({
    summary,
    series,
    categories,
    anomalies,
    email,
    range,
}: InsightsGridProps) {
    const { format, currency } = useCurrency();
    const rangeLabel = rangeLabels[range] ?? range;
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: "Total spend",
                        value: format(summary.totalSpend, currency),
                        badge: email
                            ? `Account: ${email}`
                            : "Connect Gmail to ingest",
                    },
                    {
                        label: "Transactions",
                        value: summary.txCount.toString(),
                        badge:
                            summary.txCount === 1
                                ? "1 receipt this period"
                                : `${summary.txCount} receipts ${rangeLabel}`,
                    },
                    {
                        label: "Avg ticket",
                        value: format(summary.avgTicket, currency),
                        badge: `Average over ${rangeLabel}`,
                    },
                    {
                        label: "Top merchant",
                        value: summary.topMerchant?.name ?? "—",
                        badge: summary.topMerchant
                            ? format(summary.topMerchant.total, currency)
                            : "No spend recorded",
                    },
                ].map((metric) => (
                    <div
                        key={metric.label}
                        className="rounded-2xl border border-slate-900/60 bg-slate-950/60 px-5 py-4 shadow-inner"
                    >
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                            {metric.label}
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-white">
                            {metric.value}
                        </p>
                        <p className="text-sm text-emerald-300">
                            {metric.badge}
                        </p>
                    </div>
                ))}
            </section>

            <article className="col-span-12 rounded-3xl border border-slate-900/60 bg-gradient-to-br from-slate-900/90 to-slate-950/70 p-6 lg:col-span-8">
                <header className="mb-4 flex items-center justify-between text-sm">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                            Spend over time
                        </p>
                        <h3 className="text-lg font-semibold text-white">
                            Gmail-ingested receipts
                        </h3>
                    </div>
                    <p className="text-slate-400">
                        Brush to zoom · UTC aligned
                    </p>
                </header>
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="h-56 w-full text-emerald-300"
                >
                    <defs>
                        <linearGradient
                            id="areaGradient"
                            x1="0"
                            x2="0"
                            y1="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#34d399"
                                stopOpacity="0.5"
                            />
                            <stop
                                offset="100%"
                                stopColor="#34d399"
                                stopOpacity="0"
                            />
                        </linearGradient>
                    </defs>
                    <path
                        d={`${buildPath(series)} L 100,100 L 0,100 Z`}
                        fill="url(#areaGradient)"
                        stroke="none"
                    />
                    <path
                        d={buildPath(series)}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="mt-4 flex justify-between text-xs text-slate-500">
                    {series.slice(0, 4).map((point) => (
                        <span key={point.date}>
                            {new Date(point.date).toLocaleDateString(
                                undefined,
                                {
                                    month: "short",
                                    day: "numeric",
                                },
                            )}
                        </span>
                    ))}
                </div>
            </article>

            <article className="col-span-12 rounded-3xl border border-slate-900/60 bg-slate-950/70 p-6 lg:col-span-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Category mix
                </p>
                <div className="mt-4 flex flex-col items-center gap-4">
                    <div
                        className="relative h-40 w-40 rounded-full"
                        style={{ backgroundImage: donutBg(categories) }}
                    >
                        <div className="absolute inset-5 rounded-full bg-slate-950/95 text-center">
                            <p className="mt-6 text-xs uppercase text-slate-500">
                                Top
                            </p>
                            <p className="text-lg font-semibold text-white">
                                {categories[0]?.label ?? "—"}
                            </p>
                            <p className="text-sm text-slate-400">
                                {categories[0]
                                    ? `${categories[0].percent.toFixed(1)}%`
                                    : "0%"}
                            </p>
                        </div>
                    </div>
                    <ul className="w-full space-y-2 text-sm">
                        {categories.slice(0, 4).map((slice, idx) => (
                            <li
                                key={slice.label}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                            backgroundColor: [
                                                "#34d399",
                                                "#60a5fa",
                                                "#fbbf24",
                                                "#f472b6",
                                            ][idx % 4],
                                        }}
                                    />
                                    <span>{slice.label}</span>
                                </div>
                                <span className="text-slate-400">
                                    {slice.percent.toFixed(1)}%
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </article>

            <article className="col-span-12 rounded-3xl border border-slate-900/60 bg-slate-950/60 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Anomaly alerts
                </p>
                <div className="mt-4 space-y-3">
                    {anomalies.length ? (
                        anomalies.map((alert) => (
                            <div
                                key={alert.id}
                                className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
                            >
                                <p className="font-semibold">
                                    {alert.merchant}
                                </p>
                                <p>{alert.description}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-400">
                            No spikes detected for the selected window.
                        </p>
                    )}
                </div>
            </article>
        </div>
    );
}
