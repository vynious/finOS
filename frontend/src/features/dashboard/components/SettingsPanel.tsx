"use client";

type SettingsPanelProps = {
    email: string;
};

export function SettingsPanel({ email }: SettingsPanelProps) {
    return (
        <section className="rounded-2xl border border-slate-900/60 bg-slate-950/60 p-5 text-sm text-slate-200">
            <header className="mb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Controls
                </p>
                <h3 className="text-lg font-semibold text-white">
                    Account & Notifications
                </h3>
            </header>
            <div className="space-y-4">
                <div className="rounded-xl border border-slate-900 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                        Connected Gmail
                    </p>
                    <p className="text-white">{email}</p>
                    <p className="text-xs text-slate-500">
                        OAuth token stored securely in Mongo tokens collection
                    </p>
                </div>
                <label className="flex items-center justify-between rounded-xl border border-slate-900 bg-slate-900/60 px-4 py-3">
                    <div>
                        <p className="font-semibold text-white">Sync alerts</p>
                        <p className="text-xs text-slate-400">
                            Notify me if Gmail ingest fails
                        </p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5" />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-slate-900 bg-slate-900/60 px-4 py-3">
                    <div>
                        <p className="font-semibold text-white">
                            Budget nudges
                        </p>
                        <p className="text-xs text-slate-400">
                            Slack me when category spend nears budget
                        </p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5" />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-slate-900 bg-slate-900/60 px-4 py-3">
                    <div>
                        <p className="font-semibold text-white">Auto-tag AI</p>
                        <p className="text-xs text-slate-400">
                            Let Ollama suggest merchant categories
                        </p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5" />
                </label>
            </div>
        </section>
    );
}
