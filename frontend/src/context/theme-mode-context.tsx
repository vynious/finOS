"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "dark" | "light";

type ThemeContextValue = {
    mode: ThemeMode;
    toggle: () => void;
    setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "finos-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>("dark");

    // Hydrate from localStorage and prefers-color-scheme
    useEffect(() => {
        const stored = (typeof window !== "undefined"
            ? window.localStorage.getItem(STORAGE_KEY)
            : null) as ThemeMode | null;
        if (stored === "light" || stored === "dark") {
            setModeState(stored);
        } else if (typeof window !== "undefined") {
            const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
            setModeState(prefersLight ? "light" : "dark");
        }
    }, []);

    // Apply data-theme to html
    useEffect(() => {
        if (typeof document === "undefined") return;
        const root = document.documentElement;
        if (mode === "light") {
            root.setAttribute("data-theme", "light");
        } else {
            root.removeAttribute("data-theme");
        }
        window.localStorage.setItem(STORAGE_KEY, mode);
    }, [mode]);

    const value = useMemo<ThemeContextValue>(
        () => ({
            mode,
            toggle: () => setModeState((prev) => (prev === "dark" ? "light" : "dark")),
            setMode: (next) => setModeState(next),
        }),
        [mode],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useThemeMode must be used within ThemeProvider");
    }
    return ctx;
}
