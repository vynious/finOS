// Client component because Chakra UI primitives rely on browser APIs.
"use client";

import { Alert, AlertDescription, AlertTitle } from "@chakra-ui/react";

type Feedback = {
    id: string;
    title: string;
    detail: string;
    tone?: "info" | "success" | "warning" | "error";
};

export function SystemFeedback({ notice }: { notice?: Feedback }) {
    if (!notice) return null;

    return (
        <Alert
            status={notice.tone ?? "info"}
            variant="subtle"
            rounded="2xl"
            borderWidth="1px"
            borderColor="var(--border)"
            bg="var(--surface)"
            color="var(--foreground)"
        >
            <AlertTitle fontWeight="semibold">{notice.title}</AlertTitle>
            <AlertDescription>{notice.detail}</AlertDescription>
        </Alert>
    );
}
