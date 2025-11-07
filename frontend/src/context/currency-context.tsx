"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CurrencyCode,
    currencyLabels,
    currencyRates,
    currencySymbols,
} from "@/lib/config";

type CurrencyContextValue = {
    currency: CurrencyCode;
    setCurrency: (code: CurrencyCode) => void;
    convert: (amount: number, from: CurrencyCode, to?: CurrencyCode) => number;
    format: (amount: number, code?: CurrencyCode, options?: Intl.NumberFormatOptions) => string;
    supported: CurrencyCode[];
};

const STORAGE_KEY = "finos.currency";
const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY) as
            | CurrencyCode
            | null;
        if (stored && currencyRates[stored]) {
            setCurrencyState(stored);
        }
    }, []);

    const setCurrency = useCallback((code: CurrencyCode) => {
        setCurrencyState(code);
        window.localStorage.setItem(STORAGE_KEY, code);
    }, []);

    const convert = useCallback(
        (amount: number, from: CurrencyCode, to: CurrencyCode = currency) => {
            const fromRate = currencyRates[from] ?? 1;
            const toRate = currencyRates[to] ?? 1;
            const usdValue = amount * fromRate;
            return usdValue / toRate;
        },
        [currency],
    );

    const format = useCallback(
        (
            amount: number,
            code: CurrencyCode = currency,
            options: Intl.NumberFormatOptions = {},
        ) =>
            new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: code,
                ...options,
            }).format(amount),
        [currency],
    );

    const value = useMemo<CurrencyContextValue>(
        () => ({
            currency,
            setCurrency,
            convert,
            format,
            supported: Object.keys(currencyRates) as CurrencyCode[],
        }),
        [convert, currency, format, setCurrency],
    );

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const ctx = useContext(CurrencyContext);
    if (!ctx) {
        throw new Error("useCurrency must be used within CurrencyProvider");
    }
    return ctx;
}

export function describeCurrency(code: CurrencyCode) {
    return `${currencySymbols[code]} ${currencyLabels[code]}`;
}
