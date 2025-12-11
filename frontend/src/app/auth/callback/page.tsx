"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useSessionContext } from "@/context/session-context";
import { Button, Flex, Spinner, Stack, Text } from "@chakra-ui/react";

export default function AuthCallbackPage() {
    const router = useRouter();
    const session = useSessionContext();
    const [status, setStatus] = useState<"loading" | "error">("loading");
    const [message, setMessage] = useState<string>("Fetching user profile…");

    useEffect(() => {
        let isMounted = true;
        session
            .refresh()
            .then((ok) => {
                if (!isMounted) return;
                if (ok) {
                    router.replace("/dashboard");
                } else {
                    setStatus("error");
                    setMessage(
                        "We couldn't confirm your session. Please retry the Google login.",
                    );
                }
            })
            .catch((err) => {
                if (!isMounted) return;
                setStatus("error");
                setMessage(
                    err instanceof Error
                        ? err.message
                        : "Unexpected error bootstrapping session.",
                );
            });
        return () => {
            isMounted = false;
        };
    }, [router, session]);

    return (
        <Flex
            minH="100vh"
            direction="column"
            align="center"
            justify="center"
            gap={4}
            bg="var(--background)"
            color="var(--foreground)"
            px={6}
            textAlign="center"
        >
            <Stack spacing={3} align="center">
                <Text
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.4em"
                    color="var(--accent)"
                >
                    FinOS
                </Text>
                <Text fontSize="3xl" fontWeight="semibold">
                    Finalizing your session…
                </Text>
                <Text color="var(--muted)">{message}</Text>
            </Stack>
            {status === "loading" ? (
                <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="var(--border)"
                    color="var(--accent)"
                    size="xl"
                />
            ) : (
                <Stack spacing={3} align="center">
                    <Button
                        onClick={() => router.replace("/")}
                        bg="var(--accent)"
                        color="var(--background)"
                        _hover={{ opacity: 0.9 }}
                    >
                        Return home
                    </Button>
                    <Button
                        variant="link"
                        color="var(--muted)"
                        onClick={session.connectGmail}
                    >
                        Retry Google login
                    </Button>
                </Stack>
            )}
        </Flex>
    );
}
