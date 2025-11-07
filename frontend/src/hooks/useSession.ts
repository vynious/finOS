"use client";

import { useCallback, useEffect, useState } from "react";

const LOCAL_EMAIL_KEY = "finos.session.email";
export type SessionState = {
    email: string | null;
    isAuthenticated: boolean;
    loading: boolean;
};

export function useSession(defaultEmail = "finance@finos.app") {
    const [state, setState] = useState<SessionState>({
        email: null,
        isAuthenticated: false,
        loading: true,
    });

    useEffect(() => {
        const stored = window.localStorage.getItem(LOCAL_EMAIL_KEY);
        if (stored) {
            setState({ email: stored, isAuthenticated: true, loading: false });
        } else {
            // assume the backend issued a cookie and we know the primary account
            setState({
                email: defaultEmail,
                isAuthenticated: true,
                loading: false,
            });
            window.localStorage.setItem(LOCAL_EMAIL_KEY, defaultEmail);
        }
    }, [defaultEmail]);

    const connectGmail = useCallback(() => {
        window.location.href = `/auth/google/login`;
    }, []);

    const logout = useCallback(() => {
        window.localStorage.removeItem(LOCAL_EMAIL_KEY);
        setState({ email: null, isAuthenticated: false, loading: false });
    }, []);

    const updateEmail = useCallback((email: string) => {
        window.localStorage.setItem(LOCAL_EMAIL_KEY, email);
        setState({ email, isAuthenticated: true, loading: false });
    }, []);

    return {
        ...state,
        connectGmail,
        logout,
        updateEmail,
    };
}
