"use client";

import { useCallback, useEffect, useState } from "react";

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
            const response = await fetch(`${config.apiBaseUrl}/users/me`, {
                credentials: "include",
                signal,
            });

            if (response.status === 401 || response.status === 403) {
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

            if (!response.ok) {
                throw new Error(`Failed to load session (${response.status})`);
            }

            const payload: ApiResponse<PublicUser> = await response.json();
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

    const logout = useCallback(() => {
        window.localStorage.removeItem(LOCAL_EMAIL_KEY);
        setState({
            email: null,
            name: null,
            profile: null,
            isAuthenticated: false,
            loading: false,
            error: null,
        });
    }, []);

    return {
        ...state,
        connectGmail,
        logout,
        refresh: loadProfile,
    };
}
