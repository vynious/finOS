import { config } from "@/lib/config";
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

export async function triggerReceiptSync(
    email: string,
    lastSynced?: number | null,
) {
    const endpoint = `${config.apiBaseUrl}/sync`;
    const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email,
            last_synced: lastSynced ?? undefined,
        }),
    });

    if (!response.ok) {
        throw new Error(`Sync failed (${response.status})`);
    }

    const payload: ApiResponse<BackendReceiptList> = await response.json();
    if (!payload.success || !payload.data) {
        throw new Error(payload.error ?? "Backend declined the sync request.");
    }

    return mapBackendReceipts(payload.data.transactions, email);
}
