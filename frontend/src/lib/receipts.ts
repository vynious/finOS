import { apiFetch } from "@/lib/api";
import { currencyRates } from "@/lib/config";
import type {
    ApiResponse,
    BackendReceipt,
    BackendReceiptList,
    Receipt,
} from "@/types";

const DEFAULT_OWNER = "unknown@finos.app";
const DEFAULT_MERCHANT = "Unknown merchant";
const DEFAULT_ISSUER = "Unknown issuer";
const DEFAULT_CURRENCY = "USD";

function normalizeTimestamp(value?: number | null): number {
    if (!value) return Date.now();
    // Backend stores epoch seconds; treat large values as already in ms.
    return value > 10_000_000_000 ? value : value * 1000;
}

function normalizeCategories(categories?: (string | null)[] | null): string[] {
    if (!categories) return [];
    return categories
        .map((category) => category?.trim())
        .filter((category): category is string => Boolean(category));
}

function sanitizeCurrency(code?: string | null): string {
    const normalized = code?.trim().toUpperCase();
    if (!normalized) return DEFAULT_CURRENCY;
    if (normalized.length !== 3) return DEFAULT_CURRENCY;
    if (!/^[A-Z]{3}$/.test(normalized)) return DEFAULT_CURRENCY;
    if (!currencyRates[normalized]) return DEFAULT_CURRENCY;
    return normalized;
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
        const currency = sanitizeCurrency(receipt.currency);
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
            currency,
            categories: normalizeCategories(receipt.categories),
            timestamp: new Date(timestampMs).toISOString(),
        };
    });
}

export async function triggerReceiptSync(
    email: string,
    lastSynced?: number | null,
) {
    const payload = await apiFetch<ApiResponse<BackendReceiptList>>("/sync", {
        method: "POST",
        body: JSON.stringify({
            email,
            last_synced: lastSynced ?? undefined,
        }),
    });
    if (!payload.success || !payload.data) {
        throw new Error(payload.error ?? "Backend declined the sync request.");
    }

    return mapBackendReceipts(payload.data.transactions, email);
}
