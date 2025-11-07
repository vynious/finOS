import type {
    Anomaly,
    CategorySlice,
    InsightSummary,
    Receipt,
    ReceiptFilters,
    TimeSeriesPoint,
} from "@/types";

type AmountProjector = (receipt: Receipt) => number;

const defaultProjector: AmountProjector = (receipt) => receipt.amount;

const rangeToDays: Record<ReceiptFilters["range"], number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "365d": 365,
    custom: 90,
};

function inRange(receipt: Receipt, filters: ReceiptFilters) {
    const txDate = new Date(receipt.timestamp);
    const cutoff = new Date();
    const days = rangeToDays[filters.range] ?? 30;
    cutoff.setDate(cutoff.getDate() - days);
    return txDate >= cutoff;
}

export function applyFilters(
    receipts: Receipt[],
    filters: ReceiptFilters,
): Receipt[] {
    let data = receipts.filter((receipt) => inRange(receipt, filters));

    if (filters.category) {
        data = data.filter((r) =>
            r.categories?.some(
                (cat) => cat.toLowerCase() === filters.category?.toLowerCase(),
            ),
        );
    }
    if (filters.merchant) {
        data = data.filter((r) =>
            r.merchant.toLowerCase().includes(filters.merchant!.toLowerCase()),
        );
    }
    if (filters.minAmount !== undefined) {
        data = data.filter((r) => r.amount >= (filters.minAmount ?? 0));
    }
    if (filters.maxAmount !== undefined) {
        data = data.filter((r) => r.amount <= (filters.maxAmount ?? Infinity));
    }
    if (filters.search) {
        const term = filters.search.toLowerCase();
        data = data.filter(
            (r) =>
                r.merchant.toLowerCase().includes(term) ||
                r.issuer?.toLowerCase().includes(term) ||
                r.categories?.some((cat) => cat.toLowerCase().includes(term)) ||
                r.notes?.toLowerCase().includes(term),
        );
    }

    return data;
}

export function buildSummary(
    receipts: Receipt[],
    project: AmountProjector = defaultProjector,
): InsightSummary {
    const txCount = receipts.length;
    const totalSpend = receipts.reduce((acc, tx) => acc + project(tx), 0);
    const avgTicket = txCount === 0 ? 0 : totalSpend / txCount;

    const merchantTotals = receipts.reduce<Record<string, number>>(
        (acc, tx) => {
            acc[tx.merchant] = (acc[tx.merchant] ?? 0) + project(tx);
            return acc;
        },
        {},
    );

    const [topMerchantName, topMerchantTotal] =
        Object.entries(merchantTotals).sort((a, b) => b[1] - a[1])[0] ?? [];

    return {
        totalSpend,
        avgTicket,
        txCount,
        topMerchant: topMerchantName
            ? { name: topMerchantName, total: topMerchantTotal }
            : undefined,
    };
}

export function buildTimeSeries(receipts: Receipt[]): TimeSeriesPoint[] {
    return buildTimeSeriesWithProjector(receipts, defaultProjector);
}

export function buildTimeSeriesWithProjector(
    receipts: Receipt[],
    project: AmountProjector,
): TimeSeriesPoint[] {
    const buckets = receipts.reduce<Record<string, number>>((acc, tx) => {
        const dateKey = new Date(tx.timestamp).toISOString().slice(0, 10);
        acc[dateKey] = (acc[dateKey] ?? 0) + project(tx);
        return acc;
    }, {});

    return Object.entries(buckets)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, total]) => ({ date, total }));
}

export function buildCategorySlices(
    receipts: Receipt[],
    project: AmountProjector = defaultProjector,
): CategorySlice[] {
    const totals = receipts.reduce<Record<string, number>>((acc, tx) => {
        tx.categories?.forEach((cat) => {
            acc[cat] = (acc[cat] ?? 0) + project(tx);
        });
        return acc;
    }, {});
    const grandTotal = Object.values(totals).reduce((acc, v) => acc + v, 0);
    return Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([label, value]) => ({
            label,
            value,
            percent: grandTotal === 0 ? 0 : (value / grandTotal) * 100,
        }));
}

export function detectAnomalies(receipts: Receipt[]): Anomaly[] {
    return detectAnomaliesWithProjector(receipts, defaultProjector);
}

export function detectAnomaliesWithProjector(
    receipts: Receipt[],
    project: AmountProjector,
): Anomaly[] {
    const mean =
        receipts.reduce((acc, tx) => acc + project(tx), 0) /
        Math.max(1, receipts.length);
    const threshold = mean * 1.5;
    return receipts
        .filter((tx) => project(tx) > threshold)
        .map((tx) => ({
            id: `anom-${tx.id}`,
            merchant: tx.merchant,
            delta: project(tx) - mean,
            description: `${tx.merchant} spend is ${((project(tx) / mean - 1) * 100) | 0}% above average`,
        }));
}
