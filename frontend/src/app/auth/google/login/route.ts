import { NextResponse } from "next/server";

import { config } from "@/lib/config";

export async function GET() {
    const target = `${config.apiBaseUrl}/auth/google/login`;
    return NextResponse.redirect(target);
}
