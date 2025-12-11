"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/ui/layout/AppShell";
import { SystemFeedback } from "@/ui/system/SystemFeedback";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";

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
import { useSyncController } from "@/hooks/useSyncController";
import {
    buildCategorySlices,
    buildSummary,
    buildTimeSeriesWithProjector,
    detectAnomaliesWithProjector,
} from "@/lib/analytics";
import type { CurrencyCode } from "@/lib/config";
import type { Receipt, ReceiptFilters as ReceiptFiltersType } from "@/types";

type InlineNotice = {
    id: string;
    title: string;
    detail: string;
    tone?: "info" | "success" | "warning" | "error";
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
                      detail: `No receipts ingested yet.`,
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
        detail: `${receipt.issuer ?? "Gmail"} · ${formatReceiptAmount(receipt)}`,
        timestamp: receipt.timestamp,
    }));
}

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

    const { syncStatus, handleRetry } = useSyncController({
        email: session.email,
        profileLastSynced: session.profile?.last_synced ?? undefined,
        loading,
        error,
        receipts,
        refresh,
    });

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

    const resetFilters = () =>
        setFilters(() => ({
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
                tone: "error",
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
            <Box
                minH="100vh"
                bg="var(--background)"
                color="var(--muted)"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                Preparing FinOS…
            </Box>
        );
    }

    if (!session.isAuthenticated || !session.email) {
        return (
            <Flex
                minH="100vh"
                direction="column"
                align="center"
                justify="center"
                gap={6}
                bg="var(--background)"
                color="var(--foreground)"
                textAlign="center"
                px={6}
            >
                <Text fontSize="4xl" fontWeight="semibold">
                    Connect Gmail to unlock FinOS
                </Text>
                <Text maxW="xl" color="var(--muted)">
                    We authenticate with Google using PKCE and store tokens
                    securely in MongoDB. Click below to complete OAuth and
                    return to the dashboard.
                </Text>
                <Button
                    onClick={session.connectGmail}
                    bg="var(--accent)"
                    color="var(--background)"
                    _hover={{ opacity: 0.9 }}
                >
                    Connect Gmail
                </Button>
            </Flex>
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
                    <Stack spacing={6}>
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
                    </Stack>
                ) : (
                    <Stack spacing={6}>
                        <SettingsPanel email={session.email} />
                        <ActivityLog entries={activityEntries} />
                    </Stack>
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
