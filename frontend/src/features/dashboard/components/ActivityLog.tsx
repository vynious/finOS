type Activity = {
    id: string;
    title: string;
    detail: string;
    timestamp: string;
};

type ActivityLogProps = {
    entries: Activity[];
};

export function ActivityLog({ entries }: ActivityLogProps) {
    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-200 shadow-inner">
            <header className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                        Activity
                    </p>
                    <h3 className="text-base font-semibold text-white">
                        System timeline
                    </h3>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {entries.length} events
                </span>
            </header>
            <ol className="space-y-4">
                {entries.map((event, idx) => (
                    <li key={event.id} className="relative pl-5">
                        {idx !== entries.length - 1 && (
                            <span className="absolute left-[8px] top-4 h-full w-px bg-slate-800" />
                        )}
                        <span className="absolute left-0 top-1 h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-semibold text-white">
                                {event.title}
                            </p>
                            <p className="text-slate-400">{event.detail}</p>
                            <p className="text-xs text-slate-500">
                                {new Date(event.timestamp).toLocaleString(
                                    undefined,
                                    {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        month: "short",
                                        day: "numeric",
                                    },
                                )}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}
