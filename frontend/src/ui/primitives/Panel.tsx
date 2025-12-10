"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PanelProps = {
    children: ReactNode;
    className?: string;
    padded?: boolean;
};

export function Panel({ children, className, padded = true }: PanelProps) {
    return (
        <section
            className={cn(
                "rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] shadow-[var(--shadow)]",
                padded ? "p-5" : "",
                className,
            )}
        >
            {children}
        </section>
    );
}
