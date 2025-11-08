"use client";

import type { DateRange, ReceiptFilters } from "@/types";

type ReceiptFiltersProps = {
    filters: ReceiptFilters;
    categories: string[];
    onChange: (next: ReceiptFilters) => void;
    onReset: () => void;
};

const rangeOptions: { label: string; value: DateRange }[] = [
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
    { label: "1y", value: "365d" },
];

export function ReceiptFilters({
    filters,
    categories,
    onChange,
    onReset,
}: ReceiptFiltersProps) {
    return (
        <section className="space-y-4 rounded-2xl border border-slate-900/60 bg-slate-950/60 p-4 text-sm text-slate-300">
            <header className="flex flex-wrap items-center gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        Filters
                    </p>
                    <p className="text-slate-300">
                        Viewing receipts for{" "}
                        <span className="text-white">{filters.email}</span>
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onReset}
                    className="ml-auto rounded-xl border border-slate-800 px-4 py-2 font-semibold text-white transition hover:border-emerald-400/60 hover:text-emerald-200"
                >
                    Reset all
                </button>
            </header>
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900 p-1 text-xs uppercase tracking-widest text-slate-400">
                    {rangeOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            aria-pressed={filters.range === opt.value}
                            onClick={() =>
                                onChange({ ...filters, range: opt.value })
                            }
                            className={`rounded-full px-3 py-1 transition ${
                                opt.value === filters.range
                                    ? "bg-emerald-400/20 text-white"
                                    : "hover:bg-slate-800"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <span className="rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5 text-xs text-slate-300">
                    {filters.email}
                </span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
                <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-900 bg-slate-900/50 px-3 py-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        Search
                    </span>
                    <input
                        type="search"
                        value={filters.search ?? ""}
                        onChange={(event) =>
                            onChange({ ...filters, search: event.target.value })
                        }
                        placeholder="Merchant, issuer, notes"
                        className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                        aria-label="Search receipts"
                    />
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900/50 px-3 py-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        Category
                    </span>
                    <select
                        value={filters.category ?? ""}
                        onChange={(event) =>
                            onChange({
                                ...filters,
                                category: event.target.value || undefined,
                            })
                        }
                        className="bg-transparent text-white outline-none"
                        aria-label="Filter by category"
                    >
                        <option value="">All</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900/50 px-3 py-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        Amount
                    </span>
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
                        aria-label="Minimum amount"
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
                        aria-label="Maximum amount"
                    />
                </label>
            </div>
        </section>
    );
}
