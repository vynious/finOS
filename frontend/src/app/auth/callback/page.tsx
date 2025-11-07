"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useSessionContext } from "@/context/session-context";

export default function AuthCallbackPage() {
    const router = useRouter();
    const session = useSessionContext();
    const [status, setStatus] = useState<"loading" | "error">("loading");
    const [message, setMessage] = useState<string>("Fetching user profile…");

    useEffect(() => {
        let isMounted = true;
        session
            .refresh()
            .then((ok) => {
                if (!isMounted) return;
                if (ok) {
                    router.replace("/dashboard");
                } else {
                    setStatus("error");
                    setMessage(
                        "We couldn't confirm your session. Please retry the Google login.",
                    );
                }
            })
            .catch((err) => {
                if (!isMounted) return;
                setStatus("error");
                setMessage(
                    err instanceof Error
                        ? err.message
                        : "Unexpected error bootstrapping session.",
                );
            });
        return () => {
            isMounted = false;
        };
    }, [router, session]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-white">
            <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">
                    FinOS
                </p>
                <h1 className="text-3xl font-semibold">
                    Finalizing your session…
                </h1>
                <p className="text-slate-300">{message}</p>
            </div>
            {status === "loading" ? (
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-400" />
            ) : (
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => router.replace("/")}
                        className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-slate-900"
                    >
                        Return home
                    </button>
                    <button
                        type="button"
                        onClick={session.connectGmail}
                        className="block w-full text-sm text-slate-400 underline"
                    >
                        Retry Google login
                    </button>
                </div>
            )}
        </main>
    );
}
