import type { BackendReceipt, Receipt } from "@/types";

const DEFAULT_OWNER = "unknown@finos.app";
const DEFAULT_MERCHANT = "Unknown merchant";
const DEFAULT_ISSUER = "Unknown issuer";
const DEFAULT_CURRENCY = "USD";

function normalizeTimestamp(value?: number | null): number {
    if (!value) return Date.now();
    // Backend stores epoch seconds; treat large values as already in ms.
    return value > 10_000_000_000 ? value : value * 1000;
}

function normalizeCategories(
    categories?: (string | null)[] | null,
): string[] {
    if (!categories) return [];
    return categories
        .map((category) => category?.trim())
        .filter((category): category is string => Boolean(category));
}

export function mapBackendReceipts(
    receipts: BackendReceipt[] = [],
    fallbackOwner?: string,
): Receipt[] {
    const ownerFallback = fallbackOwner?.trim() || DEFAULT_OWNER;
    return receipts.map((receipt, index) => {
        const owner = receipt.owner?.trim() || ownerFallback;
        const merchant =
            receipt.merchant?.trim() ??
            receipt.issuer?.trim() ??
            DEFAULT_MERCHANT;
        const issuer = receipt.issuer?.trim() || DEFAULT_ISSUER;
        const timestampMs = normalizeTimestamp(receipt.timestamp);
        const idSource =
            receipt.msg_id ??
            [owner, merchant, timestampMs].filter(Boolean).join(":");

        return {
            id: idSource || `receipt-${index}`,
            msgId: receipt.msg_id ?? undefined,
            owner,
            issuer,
            merchant,
            amount: receipt.amount ?? 0,
            currency: (receipt.currency ?? DEFAULT_CURRENCY).toUpperCase(),
            categories: normalizeCategories(receipt.categories),
            timestamp: new Date(timestampMs).toISOString(),
        };
    });
}
