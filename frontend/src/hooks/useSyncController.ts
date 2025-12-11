"use client";

import { useEffect, useMemo, useState } from "react";

import { triggerReceiptSync } from "@/lib/receipts";
import type { Receipt, SyncStatus } from "@/types";

const toIso = (ts?: number | null) => {
    if (!ts) return undefined;
    const ms = ts > 10_000_000_000 ? ts : ts * 1000;
    return new Date(ms).toISOString();
};

const buildSyncStatus = (
    email?: string | null,
    lastSynced?: number | null,
): SyncStatus => ({
    state: "idle",
    lastSynced: toIso(lastSynced),
    message: email
        ? `Waiting for Gmail ingest for ${email}`
        : "Connect Gmail to start ingesting receipts.",
});

type SyncControllerParams = {
    email?: string | null;
    profileLastSynced?: number | null;
    loading: boolean;
    error: string | null;
    receipts: Receipt[];
    refresh: (signal?: AbortSignal) => Promise<boolean | void>;
};

export function useSyncController({
    email,
    profileLastSynced,
    loading,
    error,
    receipts,
    refresh,
}: SyncControllerParams) {
    const initialStatus = useMemo(
        () => buildSyncStatus(email, profileLastSynced),
        [email, profileLastSynced],
    );
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(initialStatus);

    useEffect(() => {
        if (!email) {
            setSyncStatus(buildSyncStatus(undefined));
            return;
        }

        if (loading) {
            setSyncStatus((prev) => ({
                ...prev,
                state: "syncing",
                message: `Syncing Gmail for ${email}…`,
            }));
            return;
        }

        if (error) {
            setSyncStatus((prev) => ({
                ...prev,
                state: "error",
                message: `Couldn't load receipts for ${email}: ${error}`,
            }));
            return;
        }

        if (receipts.length) {
            setSyncStatus({
                state: "success",
                lastSynced:
                    syncStatus.lastSynced ??
                    toIso(profileLastSynced) ??
                    new Date().toISOString(),
                message: `Loaded ${receipts.length} receipts`,
            });
        } else {
            setSyncStatus({
                state: "idle",
                lastSynced: toIso(profileLastSynced),
                message: `No receipts found.`,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email, loading, error, receipts, profileLastSynced]);

    const handleRetry = async () => {
        if (!email) {
            setSyncStatus({
                state: "error",
                lastSynced: toIso(profileLastSynced),
                message: "No email available for sync.",
            });
            return;
        }

        setSyncStatus({
            state: "syncing",
            lastSynced: toIso(profileLastSynced),
            message: `Syncing Gmail for ${email}…`,
        });

        try {
            await triggerReceiptSync(email, profileLastSynced ?? undefined);
            await refresh();
            setSyncStatus({
                state: "success",
                lastSynced: new Date().toISOString(),
                message: `Triggered ingest for ${email}`,
            });
        } catch (err) {
            setSyncStatus({
                state: "error",
                lastSynced: toIso(profileLastSynced),
                message: (err as Error).message,
            });
        }
    };

    return { syncStatus, handleRetry };
}

export { toIso };
