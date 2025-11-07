"use client";

import { useEffect, useMemo, useState } from "react";

import { useCurrency } from "@/context/currency-context";
import type { CurrencyCode } from "@/lib/config";
import type { Receipt } from "@/types";

type ReceiptDrawerProps = {
    receipt?: Receipt | null;
    onClose: () => void;
    onUpdateCategories: (
        receiptId: string,
        categories: string[],
    ) => Promise<void | boolean>;
};

export function ReceiptDrawer({
    receipt,
    onClose,
    onUpdateCategories,
}: ReceiptDrawerProps) {
    const { convert, format, supported } = useCurrency();
    const [localCategories, setLocalCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    useEffect(() => {
        setLocalCategories(receipt?.categories ?? []);
        setNewCategory("");
        setStatus("idle");
        setSaving(false);
    }, [receipt]);

    const supportedSet = useMemo(
        () => new Set<CurrencyCode>(supported),
        [supported],
    );

    const canSave = useMemo(() => {
        if (!receipt) return false;
        const original = receipt.categories ?? [];
        if (original.length !== localCategories.length) return true;
        return original.some((cat, idx) => cat !== localCategories[idx]);
    }, [receipt, localCategories]);

    if (!receipt) return null;
    const baseCurrency = supportedSet.has(receipt.currency as CurrencyCode)
        ? (receipt.currency as CurrencyCode)
        : "USD";
    const convertedAmount = format(convert(receipt.amount, baseCurrency));
    const originalAmount = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: receipt.currency ?? "USD",
    }).format(receipt.amount);

    const addCategory = () => {
        const trimmed = newCategory.trim();
        if (!trimmed) return;
        if (localCategories.includes(trimmed)) {
            setNewCategory("");
            return;
        }
        setLocalCategories((prev) => [...prev, trimmed]);
        setNewCategory("");
    };

    const removeCategory = (category: string) => {
        setLocalCategories((prev) => prev.filter((cat) => cat !== category));
    };

    const handleSave = async () => {
        if (!receipt) return;
        setSaving(true);
        try {
            const result = await onUpdateCategories(
                receipt.id,
                localCategories,
            );
            setStatus(result === false ? "error" : "success");
        } catch (err) {
            console.error(err);
            setStatus("error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-40 flex justify-end bg-slate-950/40 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
        >
            <aside
                className="h-full w-full max-w-md border-l border-slate-900/60 bg-slate-950/95 px-8 py-8 text-slate-200 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    type="button"
                    className="mb-6 text-sm text-slate-500 hover:text-white"
                >
                    ← Back to list
                </button>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Receipt detail
                </p>
                <h3 className="text-2xl font-semibold text-white">
                    {receipt.merchant}
                </h3>
                <p className="text-sm text-slate-400">{receipt.issuer}</p>
                <p className="text-xs text-slate-500">{receipt.owner}</p>
                <div className="mt-4 space-y-1 text-slate-300">
                    <p className="text-3xl font-semibold text-white">
                        {convertedAmount}
                    </p>
                    <p className="text-sm text-slate-500">
                        {originalAmount} {receipt.currency ?? "USD"}
                    </p>
                </div>
                <div className="mt-6 space-y-5 text-sm">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                            Timestamp
                        </p>
                        <p className="text-white">
                            {new Date(receipt.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                            Categories
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {localCategories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => removeCategory(cat)}
                                    className="group flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-200 transition hover:bg-rose-500/10 hover:text-rose-200"
                                >
                                    {cat}
                                    <span className="text-slate-500 group-hover:text-rose-200">
                                        ×
                                    </span>
                                </button>
                            ))}
                            {!localCategories.length && (
                                <span className="text-xs text-slate-500">
                                    No categories assigned yet.
                                </span>
                            )}
                        </div>
                        <div className="mt-3 flex gap-2">
                            <input
                                value={newCategory}
                                onChange={(event) =>
                                    setNewCategory(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        addCategory();
                                    }
                                }}
                                placeholder="Add or edit category"
                                className="flex-1 rounded-xl border border-slate-900 bg-slate-900/70 px-3 py-2 text-white outline-none focus:border-emerald-400"
                            />
                            <button
                                type="button"
                                onClick={addCategory}
                                className="rounded-xl border border-emerald-400/60 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300"
                            >
                                Add
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!canSave || saving}
                            className="mt-4 w-full rounded-xl bg-emerald-400/90 px-4 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-400"
                        >
                            {saving ? "Saving…" : "Save categories"}
                        </button>
                        {status === "success" && (
                            <p className="mt-2 text-xs text-emerald-300">
                                Categories updated.
                            </p>
                        )}
                        {status === "error" && (
                            <p className="mt-2 text-xs text-rose-300">
                                Something went wrong—try again.
                            </p>
                        )}
                    </div>
                    {receipt.msgId && (
                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500">
                                Gmail source
                            </p>
                            <a
                                href={`https://mail.google.com/mail/u/0/#inbox/${receipt.msgId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-300 hover:text-emerald-200"
                            >
                                Open Gmail thread ↗
                            </a>
                        </div>
                    )}
                    <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                            Notes
                        </p>
                        <textarea
                            className="mt-2 w-full rounded-xl border border-slate-900 bg-slate-900/70 p-3 text-sm text-white outline-none focus:border-emerald-400"
                            placeholder="Add reviewer notes"
                            defaultValue={receipt.notes}
                            rows={4}
                        />
                    </div>
                </div>
            </aside>
        </div>
    );
}
