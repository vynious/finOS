"use client";

import type { ReceiptFilters } from "@/types";

type ReceiptFiltersProps = {
    filters: ReceiptFilters;
    categories: string[];
    onChange: (next: ReceiptFilters) => void;
    onReset: () => void;
};

export function ReceiptFilters({
    filters,
    categories,
    onChange,
    onReset,
}: ReceiptFiltersProps) {
    return (
        <div className="rounded-2xl border border-slate-900/60 bg-slate-950/60 p-4 text-sm text-slate-300">
            <div className="flex flex-wrap items-center gap-4">
                <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-900 bg-slate-900/50 px-3 py-2">
                    <span className="text-slate-500">🔍</span>
                    <input
                        type="search"
                        value={filters.search ?? ""}
                        onChange={(event) =>
                            onChange({ ...filters, search: event.target.value })
                        }
                        placeholder="Search merchant, issuer, notes"
                        className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                    />
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900/50 px-3 py-2">
                    <span className="text-slate-500">🏷️</span>
                    <select
                        value={filters.category ?? ""}
                        onChange={(event) =>
                            onChange({
                                ...filters,
                                category: event.target.value || undefined,
                            })
                        }
                        className="bg-transparent text-white outline-none"
                    >
                        <option value="">All categories</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900/50 px-3 py-2">
                    <span className="text-slate-500">$</span>
                    <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="Min"
                        value={filters.minAmount ?? ""}
                        onChange={(event) =>
                            onChange({
                                ...filters,
                                minAmount: event.target.value
                                    ? Number(event.target.value)
                                    : undefined,
                            })
                        }
                        className="w-20 bg-transparent text-white outline-none placeholder:text-slate-500"
                    />
                    <span className="text-slate-600">—</span>
                    <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="Max"
                        value={filters.maxAmount ?? ""}
                        onChange={(event) =>
                            onChange({
                                ...filters,
                                maxAmount: event.target.value
                                    ? Number(event.target.value)
                                    : undefined,
                            })
                        }
                        className="w-20 bg-transparent text-white outline-none placeholder:text-slate-500"
                    />
                </label>
                <button
                    type="button"
                    onClick={onReset}
                    className="rounded-xl border border-slate-800 px-4 py-2 font-semibold text-white transition hover:border-emerald-400/60 hover:text-emerald-200"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
