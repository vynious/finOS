"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch, ApiError } from "@/lib/api";
import { applyFilters } from "@/lib/analytics";
import { mapBackendReceipts } from "@/lib/receipts";
import type {
    ApiResponse,
    BackendReceiptList,
    Receipt,
    ReceiptFilters,
} from "@/types";

export function useReceipts(filters: ReceiptFilters) {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReceipts = useCallback(
        async (signal?: AbortSignal) => {
            let success = false;
            try {
                setError(null);
                const email = filters.email?.trim();
                if (!email) {
                    setReceipts([]);
                    return false;
                }
                setLoading(true);
                const payload = await apiFetch<ApiResponse<BackendReceiptList>>(
                    `/receipts/${encodeURIComponent(email)}`,
                    { signal },
                );
                if (!payload.success) {
                    throw new Error(
                        payload.error ??
                            "Backend declined the receipts request.",
                    );
                }
                const normalized = mapBackendReceipts(
                    payload.data?.transactions ?? [],
                    email,
                );
                setReceipts(normalized);
                success = true;
                return success;
            } catch (err) {
                if ((err as Error)?.name === "AbortError") return false;
                if (
                    err instanceof ApiError &&
                    (err.status === 401 || err.status === 403)
                ) {
                    setReceipts([]);
                    setError(null);
                    return false;
                }
                console.warn("Failed to load receipts", err);
                setError((err as Error).message);
                setReceipts([]);
                return false;
            } finally {
                setLoading(false);
            }
        },
        [filters.email],
    );

    useEffect(() => {
        const controller = new AbortController();
        fetchReceipts(controller.signal);
        return () => controller.abort();
    }, [fetchReceipts]);

    const filtered = useMemo(
        () => applyFilters(receipts, filters),
        [receipts, filters],
    );

    const updateCategories = useCallback(
        async (receiptId: string, categories: string[]) => {
            const previous = receipts;
            const nextCategories = categories
                .map((cat) => cat.trim())
                .filter((cat) => cat !== "");

            // optimistic update
            setReceipts((prev) =>
                prev.map((receipt) =>
                    receipt.id === receiptId
                        ? { ...receipt, categories: nextCategories }
                        : receipt,
                ),
            );

            try {
                const payload = await apiFetch<
                    ApiResponse<{ categories: string[] }>
                >(`/receipts/${encodeURIComponent(receiptId)}/categories`, {
                    method: "PUT",
                    body: JSON.stringify({ categories: nextCategories }),
                });
                if (!payload.success) {
                    throw new Error(
                        payload.error ??
                            "Backend declined the category update.",
                    );
                }
                return true;
            } catch (err) {
                // rollback
                setReceipts(previous);
                console.warn("Failed to update categories", err);
                return false;
            }
        },
        [receipts],
    );

    return {
        receipts,
        filtered,
        loading,
        error,
        refresh: fetchReceipts,
        updateCategories,
    };
}
