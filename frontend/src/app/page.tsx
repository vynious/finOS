const checkmarks = [
    "Google OAuth + PKCE with per-user token vault",
    "24/7 Gmail ingest orchestrator with Ollama parsing",
    "Receipts persisted to Mongo for analytics-grade querying",
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <header className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-20 pt-16 text-center">
                <div className="mx-auto flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-1 text-xs uppercase tracking-[0.4em] text-emerald-300">
                    FinOS
                    <span className="text-slate-400">
                        Gmail-native finance OS
                    </span>
                </div>
                <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
                    Turn Gmail receipts into a live spend command center.
                </h1>
                <p className="text-lg text-slate-300 sm:text-xl">
                    FinOS authenticates with Google, ingests purchase
                    confirmations, and gives finance teams a dashboard that
                    feels like Ramp + Plaid, without building another data pipe.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <a
                        href="/auth/google/login"
                        className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-emerald-400/30 transition hover:scale-[1.02]"
                    >
                        Connect Gmail
                    </a>
                    <a
                        href="/dashboard"
                        className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-white hover:border-emerald-300"
                    >
                        Explore dashboard →
                    </a>
                </div>
                <div className="mx-auto grid gap-4 text-left sm:grid-cols-3">
                    {checkmarks.map((item) => (
                        <div
                            key={item}
                            className="flex items-start gap-3 rounded-2xl border border-slate-900/60 bg-slate-950/50 p-4 text-sm text-slate-300"
                        >
                            <span className="text-emerald-300">✓</span>
                            {item}
                        </div>
                    ))}
                </div>
            </header>

            <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24">
                <section className="grid gap-6 rounded-3xl border border-slate-900/60 bg-gradient-to-r from-slate-900/90 to-slate-950/80 p-8 sm:grid-cols-2">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                            Why FinOS
                        </p>
                        <h2 className="text-3xl font-semibold">
                            Purpose-built for revenue and finance teams.
                        </h2>
                        <p className="mt-4 text-slate-300">
                            Instead of forwarding PDFs, FinOS reads your
                            receipts directly from Gmail using secure OAuth
                            scopes. Transactions are normalized, enriched, and
                            surfaced with anomaly detection in under 60 seconds.
                        </p>
                    </div>
                    <div className="space-y-4 rounded-2xl bg-slate-950/70 p-6 text-sm text-slate-300">
                        <div className="flex items-center justify-between">
                            <p>Median ingest latency</p>
                            <p className="text-emerald-300">41 seconds</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p>Receipts parsed / day</p>
                            <p className="text-emerald-300">1,240+</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p>Finance teams onboarded</p>
                            <p className="text-emerald-300">97</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-8 sm:grid-cols-3">
                    {[
                        {
                            title: "Secure OAuth",
                            detail: "PKCE + Gmail readonly scope, JWT sessions, zero passwords.",
                        },
                        {
                            title: "LLM-grade parsing",
                            detail: "Ollama converts HTML receipts into structured merchants, currency, categories.",
                        },
                        {
                            title: "Finance UX",
                            detail: "Dashboards, anomaly alerts, sync transparency—the whole command center.",
                        },
                    ].map((card) => (
                        <article
                            key={card.title}
                            className="rounded-2xl border border-slate-900/60 bg-slate-950/60 p-6 text-slate-300"
                        >
                            <h3 className="text-xl font-semibold text-white">
                                {card.title}
                            </h3>
                            <p className="mt-2 text-sm">{card.detail}</p>
                        </article>
                    ))}
                </section>
            </main>

            <footer className="border-t border-slate-900/60 bg-slate-950/70 py-8 text-center text-sm text-slate-500">
                Built for finance teams that live inside Gmail. Ready when you
                are.
            </footer>
        </div>
    );
}
