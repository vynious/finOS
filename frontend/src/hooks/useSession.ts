"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch, ApiError } from "@/lib/api";
import { config } from "@/lib/config";
import type { ApiResponse, PublicUser } from "@/types";

const LOCAL_EMAIL_KEY = "finos.session.email";

export type SessionState = {
    email: string | null;
    name: string | null;
    profile: PublicUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
};

export function useSession() {
    const [state, setState] = useState<SessionState>({
        email: null,
        name: null,
        profile: null,
        isAuthenticated: false,
        loading: true,
        error: null,
    });

    const loadProfile = useCallback(async (signal?: AbortSignal) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const payload = await apiFetch<ApiResponse<PublicUser>>(
                "/users/me",
                { signal },
            );
            if (!payload.success || !payload.data) {
                throw new Error(
                    payload.error ?? "Backend declined the session request.",
                );
            }

            window.localStorage.setItem(LOCAL_EMAIL_KEY, payload.data.email);
            setState({
                email: payload.data.email,
                name: payload.data.name,
                profile: payload.data,
                isAuthenticated: true,
                loading: false,
                error: null,
            });
            return true;
        } catch (err) {
            if ((err as Error).name === "AbortError") {
                return false;
            }
            if (
                err instanceof ApiError &&
                (err.status === 401 || err.status === 403)
            ) {
                window.localStorage.removeItem(LOCAL_EMAIL_KEY);
                setState({
                    email: null,
                    name: null,
                    profile: null,
                    isAuthenticated: false,
                    loading: false,
                    error: null,
                });
                return false;
            }
            window.localStorage.removeItem(LOCAL_EMAIL_KEY);
            setState({
                email: null,
                name: null,
                profile: null,
                isAuthenticated: false,
                loading: false,
                error: (err as Error).message,
            });
            return false;
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        loadProfile(controller.signal);
        return () => controller.abort();
    }, [loadProfile]);

    const connectGmail = useCallback(() => {
        window.location.href = `${config.apiBaseUrl}/auth/google/login`;
    }, []);

    const logout = useCallback(async () => {
        console.log(state);
        const email =
            state.profile?.email ??
            state.email ??
            window.localStorage.getItem(LOCAL_EMAIL_KEY);

        try {
            await apiFetch<ApiResponse<null>>("/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    user_id: email,
                    provider: "google",
                }),
            });
        } catch (err) {
            // TODO(shawn): surface logout failure to the user if backend requires it.
            console.error("Logout request failed", err);
        }

        window.localStorage.removeItem(LOCAL_EMAIL_KEY);
        setState({
            email: null,
            name: null,
            profile: null,
            isAuthenticated: false,
            loading: false,
            error: null,
        });
    }, [state.email, state.profile?.email]);

    return {
        ...state,
        connectGmail,
        logout,
        refresh: loadProfile,
    };
}
