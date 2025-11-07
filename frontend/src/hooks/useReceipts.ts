"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { applyFilters } from "@/lib/analytics";
import { config } from "@/lib/config";
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
                const endpoint = `${config.apiBaseUrl}/receipts/${encodeURIComponent(email)}`;
                const response = await fetch(endpoint, {
                    credentials: "include",
                    signal,
                });
                if (response.status === 401 || response.status === 403) {
                    setReceipts([]);
                    setError(null);
                    return false;
                }
                if (!response.ok) {
                    throw new Error(
                        `Failed to load receipts (${response.status})`,
                    );
                }
                const payload: ApiResponse<BackendReceiptList> =
                    await response.json();
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
            const nextCategories = categories.filter(
                (cat) => cat.trim() !== "",
            );
            setReceipts((prev) =>
                prev.map((receipt) =>
                    receipt.id === receiptId
                        ? { ...receipt, categories: nextCategories }
                        : receipt,
                ),
            );
            // TODO: integrate with backend PATCH endpoint when available.
            await new Promise((resolve) => setTimeout(resolve, 300));
            return true;
        },
        [],
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
