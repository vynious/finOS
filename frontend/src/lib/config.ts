const FALLBACK_API_BASE = "http://localhost:3000";

export const config = {
    apiBaseUrl:
        process.env.NEXT_PUBLIC_API_BASE ??
        process.env.API_BASE_URL ??
        FALLBACK_API_BASE,
};
