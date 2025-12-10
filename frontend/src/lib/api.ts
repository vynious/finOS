"use client";

import { config } from "@/lib/config";

export class ApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export async function apiFetch<T>(
    path: string,
    init: RequestInit = {},
): Promise<T> {
    const endpoint = path.startsWith("http")
        ? path
        : `${config.apiBaseUrl}${path}`;

    const headers = new Headers(init.headers ?? {});
    const hasJsonBody =
        init.body &&
        typeof init.body === "string" &&
        !headers.has("Content-Type");
    if (hasJsonBody) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(endpoint, {
        credentials: "include",
        ...init,
        headers,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        const message =
            text ||
            response.statusText ||
            `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status);
    }

    return (await response.json()) as T;
}
