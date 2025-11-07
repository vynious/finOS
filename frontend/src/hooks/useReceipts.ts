"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { applyFilters } from "@/lib/analytics";
import { config } from "@/lib/config";
import { sampleReceipts } from "@/lib/sampleData";
import type { Receipt, ReceiptFilters } from "@/types";

export function useReceipts(filters: ReceiptFilters) {
    const [receipts, setReceipts] = useState<Receipt[]>(sampleReceipts);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReceipts = useCallback(
        async (signal?: AbortSignal) => {
            let success = false;
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(
                    `${config.apiBaseUrl}/receipts/${filters.email}`,
                    {
                        credentials: "include",
                        signal,
                    },
                );
                if (!response.ok) {
                    throw new Error(
                        `Failed to load receipts (${response.status})`,
                    );
                }
                const payload = await response.json();
                const items: Receipt[] =
                    payload?.data?.transactions ?? payload?.transactions ?? [];
                if (items.length) {
                    setReceipts(items);
                }
                success = items.length > 0;
                return success;
            } catch (err) {
                if ((err as Error)?.name === "AbortError") return false;
                console.warn("Falling back to sample data", err);
                setError((err as Error).message);
                setReceipts(sampleReceipts);
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
