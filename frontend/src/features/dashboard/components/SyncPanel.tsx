"use client";

import type { SyncStatus } from "@/types";
import { useMemo } from "react";

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

    return (
        <section className="rounded-2xl border border-slate-900/60 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/90 p-5 shadow-[0_35px_60px_-15px_rgba(15,23,42,0.55)]">
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
                {status.message ??
                    "Receipts pipeline continuously pulls Gmail messages with trusted issuers and pushes parsed transactions into MongoDB."}
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
                    <p>~60s cadence</p>
                </div>
                <button
                    onClick={onRetry}
                    className="ml-auto rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-400/60 hover:text-emerald-200"
                    type="button"
                >
                    Retry sync
                </button>
            </div>
        </section>
    );
}
