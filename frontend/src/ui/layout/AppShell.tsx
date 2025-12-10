"use client";

import { useCurrency } from "@/context/currency-context";
import { useTheme } from "@/context/theme-context";
import type { DateRange } from "@/types";
import { useMemo, useState } from "react";

type SectionKey = "transactions" | "settings";

type AppShellProps = {
    email: string;
    dateRange: DateRange;
    onRangeChange: (range: DateRange) => void;
    onLogout: () => void;
    activeSection: SectionKey;
    onSectionChange: (section: SectionKey) => void;
    children: React.ReactNode;
};

const rangeOptions: { label: string; value: DateRange }[] = [
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
    { label: "1y", value: "365d" },
];

const navItems: { key: SectionKey; label: string; icon: string }[] = [
    { key: "transactions", label: "Transactions", icon: "📄" },
    { key: "settings", label: "Settings", icon: "⚙️" },
];

const sectionMeta: Record<
    SectionKey,
    { kicker: string; title: string; description: string }
> = {
    transactions: {
        kicker: "Spend intelligence",
        title: "Transactions",
        description: "Monitor ingest health, filters, and detailed receipts.",
    },
    settings: {
        kicker: "Workspace",
        title: "Settings",
        description: "Manage Gmail connections and automation preferences.",
    },
};

export function AppShell({
    email,
    dateRange,
    onRangeChange,
    onLogout,
    activeSection,
    onSectionChange,
    children,
}: AppShellProps) {
    const { currency, setCurrency, supported } = useCurrency();
    const { theme, toggleTheme } = useTheme();
    const initials = useMemo(
        () =>
            email
                .split("@")[0]
                .split(".")
                .map((chunk) => chunk[0]?.toUpperCase())
                .slice(0, 2)
                .join("") || "FF",
        [email],
    );

    const [navOpen, setNavOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)] lg:grid lg:grid-cols-[240px_1fr]">
            {navOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setNavOpen(false)}
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-slate-900/80 bg-slate-950/95 px-6 py-8 transition-transform duration-200 lg:static lg:translate-x-0 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="mb-10 flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                        ⧉
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            FinOS
                        </p>
                        <h1 className="text-xl font-semibold text-white">
                            Command
                        </h1>
                    </div>
                </div>
                <nav className="space-y-2 text-sm text-slate-400">
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => onSectionChange(item.key)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                                activeSection === item.key
                                    ? "bg-slate-900 text-white"
                                    : "hover:bg-slate-900/50 hover:text-white"
                            }`}
                            type="button"
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto space-y-3 text-xs text-slate-400">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                    Theme
                                </p>
                                <p className="text-sm text-white">
                                    {theme === "dark" ? "Dark" : "Light"} mode
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-emerald-400/60 hover:text-emerald-200"
                            >
                                Toggle
                            </button>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="font-semibold text-white">
                            Connected Gmail
                        </p>
                        <p className="truncate text-xs text-slate-400">
                            {email}
                        </p>
                        <button
                            onClick={onLogout}
                            className="mt-3 w-full rounded-xl border border-slate-800/60 bg-slate-950/40 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-600 hover:text-white"
                            type="button"
                        >
                            Sign out
                        </button>
                    </div>
                    <p>Version 0.2.0 · Secure OAuth via Google</p>
                </div>
            </aside>

            <main className="flex flex-col">
                <header className="sticky top-0 z-20 border-b border-slate-900/60 bg-slate-950/80 px-4 py-4 backdrop-blur md:px-6 lg:px-10">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
                                {sectionMeta[activeSection].kicker}
                            </p>
                            <h2 className="text-xl font-semibold text-white sm:text-2xl">
                                {sectionMeta[activeSection].title}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {sectionMeta[activeSection].description}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-xl text-white lg:hidden"
                                onClick={() => setNavOpen((prev) => !prev)}
                                aria-label="Toggle navigation"
                            >
                                ☰
                            </button>
                            {activeSection === "transactions" && (
                                <div className="hidden items-center gap-3 lg:flex">
                                    <span className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-300">
                                        {email}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900 p-1 text-sm text-slate-400">
                                            {rangeOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() =>
                                                        onRangeChange(opt.value)
                                                    }
                                                    className={`rounded-full px-3 py-1 transition ${
                                                        opt.value === dateRange
                                                            ? "bg-emerald-400/20 text-white"
                                                            : "hover:bg-slate-800"
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        <label className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs uppercase tracking-widest text-slate-400">
                                            Currency
                                            <select
                                                value={currency}
                                                onChange={(event) =>
                                                    setCurrency(
                                                        event.target
                                                            .value as (typeof supported)[number],
                                                    )
                                                }
                                                className="bg-transparent text-white outline-none"
                                            >
                                                {supported.map((code) => (
                                                    <option
                                                        key={code}
                                                        value={code}
                                                    >
                                                        {code}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/20 text-sm text-emerald-300">
                                            {initials}
                                        </span>
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Signed in
                                            </p>
                                            <p className="text-sm text-white">
                                                {email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {activeSection === "transactions" && (
                        <div className="mt-4 flex flex-wrap items-center gap-3 lg:hidden">
                            <div className="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900 p-1 text-sm text-slate-400">
                                {rangeOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => onRangeChange(opt.value)}
                                        className={`rounded-full px-3 py-1 transition ${
                                            opt.value === dateRange
                                                ? "bg-emerald-400/20 text-white"
                                                : "hover:bg-slate-800"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <label className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs uppercase tracking-widest text-slate-400">
                                Currency
                                <select
                                    value={currency}
                                    onChange={(event) =>
                                        setCurrency(
                                            event.target
                                                .value as (typeof supported)[number],
                                        )
                                    }
                                    className="bg-transparent text-white outline-none"
                                >
                                    {supported.map((code) => (
                                        <option key={code} value={code}>
                                            {code}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <span className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-300">
                                {email}
                            </span>
                        </div>
                    )}
                </header>
                <section className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                    {children}
                </section>
            </main>
        </div>
    );
}
