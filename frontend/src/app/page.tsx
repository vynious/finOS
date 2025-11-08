import Link from "next/link";
import { redirect } from "next/navigation";

import { cookies } from "next/headers";

import { config } from "@/lib/config";
import type { ApiResponse, PublicUser } from "@/types";

const heroHighlights = [
    {
        title: "Google OAuth + JWT",
        detail: "PKCE sign-in, token vault in MongoDB, session cookie issued by Axum.",
    },
    {
        title: "Ingestion cadence",
        detail: "Tokio job queries Gmail every ~60 seconds and skips anything already synced.",
    },
    {
        title: "LLM structuring",
        detail: "Ollama turns raw receipt HTML into clean merchants, totals, and categories.",
    },
];

const pipelineSteps = [
    {
        title: "Authenticate fast",
        detail: "Users complete the Google OAuth flow, we store refresh/access tokens, and issue a JWT session.",
    },
    {
        title: "Pull trusted mail",
        detail: "IngestorService builds Gmail queries from issuer allow-lists + `last_synced` timestamps.",
    },
    {
        title: "Parse + enrich",
        detail: "EmailService sanitizes HTML, calls Ollama locally, and normalizes currency + owners.",
    },
    {
        title: "Serve dashboards",
        detail: "ReceiptService persists transactions, while the Next.js dashboard streams analytics.",
    },
];

const dashboardCallouts = [
    {
        title: "Spend pulse",
        detail: "InsightsGrid charts totals, anomalies, and top merchants directly from ingested receipts.",
    },
    {
        title: "Sync health",
        detail: "SyncPanel mirrors the background job status so teams know when Gmail ingest last succeeded.",
    },
    {
        title: "Receipt workspace",
        detail: "Drill into receipts, retag categories, and jump back to the Gmail thread in a single drawer.",
    },
];

async function getSession(): Promise<PublicUser | null> {
    const sessionCookie = (await cookies()).get("session");
    if (!sessionCookie) return null;

    try {
        const response = await fetch(`${config.apiBaseUrl}/users/me`, {
            method: "GET",
            credentials: "include",
            headers: {
                cookie: `session=${sessionCookie.value}`,
            },
        });
        if (!response.ok) {
            return null;
        }
        const payload: ApiResponse<PublicUser> = await response.json();
        return payload.success ? (payload.data ?? null) : null;
    } catch {
        return null;
    }
}

export default async function LandingPage() {
    const user = await getSession();
    if (user) {
        redirect("/dashboard");
    }

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
                <div className="flex flex-wrap justify-center gap-4 text-sm sm:text-base">
                    <a
                        href={`${config.apiBaseUrl}/auth/google/login`}
                        className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-emerald-400/30 transition hover:scale-[1.02]"
                    >
                        Connect Gmail
                    </a>
                    <Link
                        href="/dashboard"
                        className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-white hover:border-emerald-300"
                    >
                        Explore dashboard →
                    </Link>
                </div>
                <div className="mx-auto grid gap-4 text-left sm:grid-cols-3">
                    {heroHighlights.map((item) => (
                        <article
                            key={item.title}
                            className="rounded-2xl border border-slate-900/60 bg-slate-950/60 p-5 text-left text-sm text-slate-300"
                        >
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                                {item.title}
                            </p>
                            <p className="mt-2 text-base text-white">
                                {item.detail}
                            </p>
                        </article>
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
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                                What you get
                            </p>
                            <ul className="mt-3 space-y-2">
                                <li>
                                    • PKCE OAuth + JWT session out of the box
                                </li>
                                <li>
                                    • Gmail ingestion tuned per issuer + user
                                </li>
                                <li>
                                    • Receipts normalized for analytics tooling
                                </li>
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-slate-900 bg-slate-950/80 p-4 text-sm text-slate-300">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                                Cron cadence
                            </p>
                            <p className="text-emerald-300">
                                ~60s Tokio heartbeat (configurable)
                            </p>
                            <p className="text-xs text-slate-500">
                                Change the interval inside `start_sync_job`.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-900/60 bg-slate-950/70 p-8">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        How FinOS works
                    </p>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        {pipelineSteps.map((step, idx) => (
                            <article
                                key={step.title}
                                className="rounded-2xl border border-slate-900 bg-slate-950/70 p-5"
                            >
                                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                                    Step {idx + 1}
                                </span>
                                <h3 className="mt-2 text-xl font-semibold text-white">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-sm text-slate-300">
                                    {step.detail}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="grid gap-8 sm:grid-cols-3">
                    {dashboardCallouts.map((card) => (
                        <article
                            key={card.title}
                            className="rounded-2xl border border-slate-900/60 bg-slate-950/60 p-6 text-slate-300"
                        >
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                                Dashboard
                            </p>
                            <h3 className="mt-2 text-xl font-semibold text-white">
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
