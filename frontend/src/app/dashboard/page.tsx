"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/ui/layout/AppShell";
import { SystemFeedback } from "@/ui/system/SystemFeedback";

import { ActivityLog } from "@/features/dashboard/components/ActivityLog";
import { InsightsGrid } from "@/features/dashboard/components/InsightsGrid";
import { ReceiptDrawer } from "@/features/dashboard/components/ReceiptDrawer";
import { ReceiptFilters } from "@/features/dashboard/components/ReceiptFilters";
import { ReceiptsTable } from "@/features/dashboard/components/ReceiptsTable";
import { SettingsPanel } from "@/features/dashboard/components/SettingsPanel";
import { SyncPanel } from "@/features/dashboard/components/SyncPanel";
import { useCurrency } from "@/context/currency-context";
import { useSessionContext } from "@/context/session-context";
import { useReceipts } from "@/hooks/useReceipts";
import {
    buildCategorySlices,
    buildSummary,
    buildTimeSeriesWithProjector,
    detectAnomaliesWithProjector,
} from "@/lib/analytics";
import type { CurrencyCode } from "@/lib/config";
import {
    defaultFilters,
    sampleActivity,
    sampleSyncStatus,
} from "@/lib/sampleData";
import type { Receipt, SyncStatus } from "@/types";

type InlineNotice = {
    id: string;
    title: string;
    detail: string;
    tone?: "info" | "success" | "warning" | "danger";
};

export default function DashboardPage() {
    const session = useSessionContext();
    const { convert, supported } = useCurrency();
    const [filters, setFilters] = useState(defaultFilters);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(
        null,
    );
    const [activeSection, setActiveSection] = useState<
        "transactions" | "settings"
    >("transactions");
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(sampleSyncStatus);
    const [inlineNotice, setInlineNotice] = useState<
        InlineNotice | undefined
    >();

    useEffect(() => {
        if (session.email) {
            setFilters((prev) => ({ ...prev, email: session.email! }));
        }
    }, [session.email]);

    const { filtered, loading, error, refresh, updateCategories } =
        useReceipts(filters);

    const supportedSet = useMemo(
        () => new Set<CurrencyCode>(supported),
        [supported],
    );

    const amountProjector = useCallback(
        (receipt: Receipt) => {
            const baseCurrency = supportedSet.has(
                receipt.currency as CurrencyCode,
            )
                ? (receipt.currency as CurrencyCode)
                : "USD";
            return convert(receipt.amount, baseCurrency);
        },
        [convert, supportedSet],
    );

    const summary = useMemo(
        () => buildSummary(filtered, amountProjector),
        [filtered, amountProjector],
    );
    const series = useMemo(
        () => buildTimeSeriesWithProjector(filtered, amountProjector),
        [filtered, amountProjector],
    );
    const categories = useMemo(
        () => buildCategorySlices(filtered, amountProjector),
        [filtered, amountProjector],
    );
    const anomalies = useMemo(
        () => detectAnomaliesWithProjector(filtered, amountProjector),
        [filtered, amountProjector],
    );

    const availableCategories = useMemo(() => {
        const unique = new Set<string>();
        filtered.forEach((receipt) =>
            receipt.categories?.forEach((cat) => unique.add(cat)),
        );
        return Array.from(unique);
    }, [filtered]);

    const handleRetry = async () => {
        setSyncStatus((prev) => ({
            ...prev,
            state: "syncing",
            message: "Manual sync triggered",
        }));
        const result = await refresh();
        setSyncStatus({
            state: result === false ? "error" : "success",
            lastSynced: new Date().toISOString(),
            message:
                result === false
                    ? "Sync failed. Check OAuth tokens."
                    : "Manual sync completed via Gmail ingest.",
        });
    };

    const resetFilters = () =>
        setFilters((prev) => ({
            ...defaultFilters,
            email: prev.email,
        }));

    const handleCategoryUpdate = async (
        receiptId: string,
        categories: string[],
    ) => {
        const success = await updateCategories(receiptId, categories);
        if (success) {
            setSelectedReceipt((prev) =>
                prev && prev.id === receiptId ? { ...prev, categories } : prev,
            );
            setInlineNotice({
                id: `categories-${Date.now()}`,
                title: "Categories saved",
                detail: "These tags will sync with FinOS on next ingest.",
                tone: "success",
            });
        } else {
            setInlineNotice({
                id: `categories-error-${Date.now()}`,
                title: "Unable to save categories",
                detail: "Please try again in a few seconds.",
                tone: "danger",
            });
        }
        return success;
    };

    useEffect(() => {
        if (!inlineNotice) return;
        const timer = setTimeout(() => setInlineNotice(undefined), 5000);
        return () => clearTimeout(timer);
    }, [inlineNotice]);

    useEffect(() => {
        if (activeSection !== "transactions") {
            setSelectedReceipt(null);
        }
    }, [activeSection]);

    if (session.loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
                Preparing FinOS…
            </div>
        );
    }

    if (!session.isAuthenticated || !session.email) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 text-center text-white">
                <h1 className="text-4xl font-semibold">
                    Connect Gmail to unlock FinOS
                </h1>
                <p className="max-w-xl text-slate-300">
                    We authenticate with Google using PKCE and store tokens
                    securely in MongoDB. Click below to complete OAuth and
                    return to the dashboard.
                </p>
                <button
                    onClick={session.connectGmail}
                    className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-slate-900"
                    type="button"
                >
                    Connect Gmail
                </button>
            </div>
        );
    }

    return (
        <>
            <AppShell
                email={session.email}
                dateRange={filters.range}
                onRangeChange={(range) =>
                    setFilters((prev) => ({ ...prev, range }))
                }
                onLogout={session.logout}
                activeSection={activeSection}
                onSectionChange={(section) => setActiveSection(section)}
            >
                {activeSection === "transactions" ? (
                    <div className="space-y-6">
                        {inlineNotice && (
                            <SystemFeedback notice={inlineNotice} />
                        )}
                        {error && (
                            <SystemFeedback
                                notice={{
                                    id: "api-error",
                                    title: "Live API fallback",
                                    detail: error,
                                    tone: "warning",
                                }}
                            />
                        )}
                        <InsightsGrid
                            summary={summary}
                            series={series}
                            categories={categories}
                            anomalies={anomalies}
                        />
                        <SyncPanel status={syncStatus} onRetry={handleRetry} />
                        <ReceiptFilters
                            filters={filters}
                            categories={availableCategories}
                            onChange={setFilters}
                            onReset={resetFilters}
                        />
                        <ReceiptsTable
                            receipts={filtered}
                            loading={loading}
                            selectedId={selectedReceipt?.id}
                            onSelect={setSelectedReceipt}
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <SettingsPanel email={session.email} />
                        <ActivityLog entries={sampleActivity} />
                    </div>
                )}
            </AppShell>
            {activeSection === "transactions" && (
                <ReceiptDrawer
                    receipt={selectedReceipt}
                    onClose={() => setSelectedReceipt(null)}
                    onUpdateCategories={handleCategoryUpdate}
                />
            )}
        </>
    );
}
