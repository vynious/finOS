import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { config } from "@/lib/config";
import type { ApiResponse, PublicUser } from "@/types";
import HeroSection from "@/components/hero/HeroSection";

async function getSession(): Promise<PublicUser | null> {
    const sessionCookie = (await cookies()).get("session");
    if (!sessionCookie) return null;

    try {
        const response = await fetch(`${config.apiBaseUrl}/users/me`, {
            method: "GET",
            credentials: "include",
            headers: {
                cookie: `session=${sessionCookie.value}`,
            },
        });
        if (!response.ok) {
            return null;
        }
        const payload: ApiResponse<PublicUser> = await response.json();
        return payload.success ? (payload.data ?? null) : null;
    } catch {
        return null;
    }
}

export default async function LandingPage() {
    const user = await getSession();
    if (user) {
        redirect("/dashboard");
    }

    return <HeroSection />;
}
