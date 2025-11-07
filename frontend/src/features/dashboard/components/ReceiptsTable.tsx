"use client";

import { useCallback, useMemo } from "react";

import { useCurrency } from "@/context/currency-context";
import type { CurrencyCode } from "@/lib/config";
import type { Receipt } from "@/types";

type ReceiptsTableProps = {
    receipts: Receipt[];
    loading?: boolean;
    selectedId?: string | null;
    onSelect: (receipt: Receipt) => void;
};

export function ReceiptsTable({
    receipts,
    loading,
    selectedId,
    onSelect,
}: ReceiptsTableProps) {
    const { convert, format, supported } = useCurrency();
    const supportedSet = useMemo(
        () => new Set<CurrencyCode>(supported),
        [supported],
    );

    const convertAmount = useCallback(
        (receipt: Receipt) => {
            const baseCurrency = supportedSet.has(
                receipt.currency as CurrencyCode,
            )
                ? (receipt.currency as CurrencyCode)
                : "USD";
            return format(convert(receipt.amount, baseCurrency));
        },
        [convert, format, supportedSet],
    );

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-900/60 bg-slate-950/60 p-10 text-center text-sm text-slate-500">
                Fetching receipts from FinOS…
            </div>
        );
    }

    if (!receipts.length) {
        return (
            <div className="rounded-2xl border border-slate-900/60 bg-slate-950/60 p-10 text-center text-sm text-slate-500">
                No receipts match the selected filters.
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-900/60 bg-slate-950/60">
            <div className="space-y-4 p-4 md:hidden">
                {receipts.map((receipt) => (
                    <button
                        key={receipt.id}
                        type="button"
                        onClick={() => onSelect(receipt)}
                        className="w-full rounded-2xl border border-slate-900 bg-slate-950/80 p-4 text-left text-sm text-slate-200"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-base font-semibold text-white">
                                    {receipt.merchant}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {receipt.issuer}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-white">
                                    {convertAmount(receipt)}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {new Intl.NumberFormat(undefined, {
                                        style: "currency",
                                        currency: receipt.currency ?? "USD",
                                    }).format(receipt.amount)}
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1 text-xs">
                            {receipt.categories?.map((cat) => (
                                <span
                                    key={cat}
                                    className="rounded-full bg-slate-900 px-2 py-0.5"
                                >
                                    {cat}
                                </span>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                            {new Date(receipt.timestamp).toLocaleString()}
                        </p>
                    </button>
                ))}
            </div>
            <div className="hidden md:block">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-5 py-3">Merchant</th>
                            <th className="px-5 py-3">Issuer</th>
                            <th className="px-5 py-3">Categories</th>
                            <th className="px-5 py-3 text-right">Amount</th>
                            <th className="px-5 py-3">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receipts.map((receipt) => {
                            const isSelected = receipt.id === selectedId;
                            return (
                                <tr
                                    key={receipt.id}
                                    className={`cursor-pointer border-t border-slate-900/40 transition ${
                                        isSelected
                                            ? "bg-slate-900/80"
                                            : "hover:bg-slate-900/40"
                                    }`}
                                    onClick={() => onSelect(receipt)}
                                >
                                    <td className="px-5 py-4 font-semibold text-white">
                                        {receipt.merchant}
                                    </td>
                                    <td className="px-5 py-4 text-slate-400">
                                        {receipt.issuer}
                                    </td>
                                    <td className="px-5 py-4 text-slate-200">
                                        <div className="flex flex-wrap gap-1">
                                            {receipt.categories?.map((cat) => (
                                                <span
                                                    key={cat}
                                                    className="rounded-full bg-slate-900 px-2 py-0.5 text-xs"
                                                >
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right font-semibold text-white">
                                        {convertAmount(receipt)}
                                        <span className="ml-2 text-xs text-slate-500">
                                            {new Intl.NumberFormat(undefined, {
                                                style: "currency",
                                                currency:
                                                    receipt.currency ?? "USD",
                                            }).format(receipt.amount)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-400">
                                        {new Date(
                                            receipt.timestamp,
                                        ).toLocaleString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
