const FALLBACK_API_BASE = "http://localhost:3000";

export const currencyRates = {
    USD: 1, // base
    EUR: 1.08,
    SGD: 0.74,
    GBP: 1.27,
} as const;

export const currencyLabels: Record<keyof typeof currencyRates, string> = {
    USD: "USD",
    EUR: "EUR",
    SGD: "SGD",
    GBP: "GBP",
};

export const currencySymbols: Record<keyof typeof currencyRates, string> = {
    USD: "$",
    EUR: "€",
    SGD: "S$",
    GBP: "£",
};

export const config = {
    apiBaseUrl:
        process.env.NEXT_PUBLIC_API_BASE ??
        process.env.API_BASE_URL ??
        FALLBACK_API_BASE,
};

export type CurrencyCode = keyof typeof currencyRates;
