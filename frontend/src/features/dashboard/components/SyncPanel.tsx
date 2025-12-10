"use client";

import type { SyncStatus } from "@/types";
import { useMemo } from "react";
import { Panel } from "@/ui/primitives/Panel";

type SyncPanelProps = {
    status: SyncStatus;
    onRetry: () => void;
};

function formatRelative(date?: string) {
    if (!date) return "Never";
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 0) return "Just now";
    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
}

export function SyncPanel({ status, onRetry }: SyncPanelProps) {
    const statusColor = useMemo(() => {
        switch (status.state) {
            case "syncing":
                return "text-amber-300";
            case "error":
                return "text-rose-300";
            case "success":
                return "text-emerald-300";
            default:
                return "text-slate-400";
        }
    }, [status.state]);

    const statusCopy: Record<SyncStatus["state"], string> = {
        idle: "Waiting for the next cron window. Keep this tab open to see new receipts appear.",
        syncing:
            "Background workers are querying Gmail and updating Mongo right now.",
        success:
            "Latest ingest finished successfully. Refresh to pull the newest receipts.",
        error: "We hit an issue calling Gmail or Ollama. Check logs and retry once resolved.",
    };

    const cadence =
        status.state === "syncing"
            ? "Running now"
            : "Every ~60s (configurable)";

    return (
        <Panel className="bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/90 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Gmail ingest
                    </p>
                    <h3 className="text-lg font-semibold text-white">
                        Sync orchestrator
                    </h3>
                </div>
                <span
                    className={`rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold ${statusColor}`}
                >
                    {status.state.toUpperCase()}
                </span>
            </div>
            <p className="text-sm text-slate-300">
                {status.message ?? statusCopy[status.state]}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                        Last synced
                    </p>
                    <p className="text-white">
                        {formatRelative(status.lastSynced)}
                    </p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                        Next window
                    </p>
                    <p>{cadence}</p>
                </div>
                <button
                    onClick={onRetry}
                    className="ml-auto rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-400/60 hover:text-emerald-200"
                    type="button"
                >
                    Refresh data
                </button>
            </div>
        </Panel>
    );
}
