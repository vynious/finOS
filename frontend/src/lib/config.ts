const FALLBACK_API_BASE = "http://localhost:4000";

export type CurrencyCode = string;

export const currencyRates: Record<string, number> = {
    USD: 1, // base
    EUR: 1.08,
    SGD: 0.74,
    GBP: 1.27,
    JPY: 0.0066,
    AUD: 0.68,
    CAD: 0.74,
    INR: 0.012,
    CHF: 1.13,
    HKD: 0.13,
};

export const currencyLabels: Record<string, string> = Object.fromEntries(
    Object.keys(currencyRates).map((code) => [code, code]),
);

export const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    SGD: "S$",
    GBP: "£",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$",
    INR: "₹",
    CHF: "CHF",
    HKD: "HK$",
};

export const config = {
    apiBaseUrl:
        process.env.NEXT_PUBLIC_API_BASE ??
        process.env.API_BASE_URL ??
        FALLBACK_API_BASE,
};
