"use client";

import {
    ChakraProvider,
    ColorModeScript,
    extendTheme,
    type ThemeConfig,
} from "@chakra-ui/react";
import { CurrencyProvider } from "@/context/currency-context";
import { SessionProvider } from "@/context/session-context";
import { ThemeProvider } from "@/context/theme-mode-context";

const config: ThemeConfig = {
    initialColorMode: "dark",
    useSystemColorMode: false,
};

const theme = extendTheme({
    config,
    colors: {
        bg: {
            base: "var(--bg-base)",
            elevated: "var(--bg-elevated)",
            subtle: "var(--bg-subtle)",
        },
        border: {
            subtle: "var(--border-subtle)",
            emphasis: "var(--border-emphasis)",
        },
        text: {
            primary: "var(--text-primary)",
            muted: "var(--text-muted)",
            subtle: "var(--text-subtle)",
        },
        accent: {
            primary: "var(--accent-primary)",
            secondary: "var(--accent-secondary)",
        },
        status: {
            success: "var(--status-success)",
            warning: "var(--status-warning)",
            error: "var(--status-error)",
        },
    },
    styles: {
        global: {
            body: {
                bg: "var(--bg-base)",
                color: "var(--text-primary)",
            },
        },
    },
});

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            <ColorModeScript initialColorMode={config.initialColorMode} />
            <ChakraProvider theme={theme}>
                <ThemeProvider>
                    <SessionProvider>
                        <CurrencyProvider>{children}</CurrencyProvider>
                    </SessionProvider>
                </ThemeProvider>
            </ChakraProvider>
        </>
    );
}
