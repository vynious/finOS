"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/ui/layout/AppShell";
import { SystemFeedback } from "@/ui/system/SystemFeedback";

import {
    ActivityLog,
    type ActivityEvent,
} from "@/features/dashboard/components/ActivityLog";
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
import type {
    Receipt,
    ReceiptFilters as ReceiptFiltersType,
    SyncStatus,
} from "@/types";

type InlineNotice = {
    id: string;
    title: string;
    detail: string;
    tone?: "info" | "success" | "warning" | "danger";
};

const DEFAULT_RANGE: ReceiptFiltersType["range"] = "30d";

const formatReceiptAmount = (receipt: Receipt) =>
    new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: receipt.currency ?? "USD",
    }).format(receipt.amount);

function buildActivityEntries(
    receipts: Receipt[],
    email?: string | null,
): ActivityEvent[] {
    if (!receipts.length) {
        return email
            ? [
                  {
                      id: "activity-placeholder",
                      title: "Awaiting Gmail sync",
                      detail: `No receipts ingested yet for ${email}.`,
                      timestamp: new Date().toISOString(),
                  },
              ]
            : [];
    }

    const sorted = [...receipts].sort(
        (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return sorted.slice(0, 6).map((receipt) => ({
        id: receipt.id,
        title: `Processed ${receipt.merchant}`,
        detail: `${receipt.owner} via ${receipt.issuer ?? "Gmail"} · ${formatReceiptAmount(receipt)}`,
        timestamp: receipt.timestamp,
    }));
}

const buildSyncStatus = (email?: string | null): SyncStatus => ({
    state: "idle",
    lastSynced: undefined,
    message: email
        ? `Waiting for Gmail ingest for ${email}`
        : "Connect Gmail to start ingesting receipts.",
});

export default function DashboardPage() {
    const session = useSessionContext();
    const { convert, supported } = useCurrency();
    const [filters, setFilters] = useState<ReceiptFiltersType>(() => ({
        email: session.email ?? "",
        range: DEFAULT_RANGE,
    }));
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(
        null,
    );
    const [activeSection, setActiveSection] = useState<
        "transactions" | "settings"
    >("transactions");
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
        buildSyncStatus(session.email),
    );
    const [inlineNotice, setInlineNotice] = useState<
        InlineNotice | undefined
    >();

    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            email: session.email ?? "",
        }));
    }, [session.email]);

    const { receipts, filtered, loading, error, refresh, updateCategories } =
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

    const activityEntries = useMemo(
        () => buildActivityEntries(receipts, session.email ?? filters.email),
        [receipts, session.email, filters.email],
    );

    useEffect(() => {
        if (!session.email) {
            setSyncStatus(buildSyncStatus(undefined));
            return;
        }

        if (loading) {
            setSyncStatus((prev) => ({
                ...prev,
                state: "syncing",
                message: `Syncing Gmail for ${session.email}…`,
            }));
            return;
        }

        if (error) {
            setSyncStatus((prev) => ({
                ...prev,
                state: "error",
                message: `Couldn't load receipts for ${session.email}: ${error}`,
            }));
            return;
        }

        if (receipts.length) {
            setSyncStatus({
                state: "success",
                lastSynced: new Date().toISOString(),
                message: `Loaded ${receipts.length} receipts for ${session.email}`,
            });
        } else {
            setSyncStatus({
                state: "idle",
                lastSynced: undefined,
                message: `No receipts found for ${session.email} yet.`,
            });
        }
    }, [session.email, loading, error, receipts]);

    const handleRetry = async () => {
        setSyncStatus((prev) => ({
            ...prev,
            state: "syncing",
            message: session.email
                ? `Syncing Gmail for ${session.email}…`
                : "Syncing Gmail…",
        }));
        await refresh();
    };

    const resetFilters = () =>
        setFilters((prev) => ({
            email: session.email ?? "",
            range: DEFAULT_RANGE,
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
                                    title: "Unable to load receipts",
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
                            email={session.email}
                            range={filters.range}
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
                        <ActivityLog entries={activityEntries} />
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
