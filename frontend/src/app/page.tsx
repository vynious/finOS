import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { Button, Container, Flex, Heading, SimpleGrid, Stack, Text, Box } from "@chakra-ui/react";

import { config } from "@/lib/config";
import type { ApiResponse, PublicUser } from "@/types";

const heroHighlights = [
    {
        title: "Google OAuth + JWT",
        detail: "PKCE sign-in, token vault in MongoDB, session cookie issued by Axum.",
    },
    {
        title: "Ingestion cadence",
        detail: "Tokio job queries Gmail every ~60 seconds and skips anything already synced.",
    },
    {
        title: "LLM structuring",
        detail: "Ollama turns raw receipt HTML into clean merchants, totals, and categories.",
    },
];

const pipelineSteps = [
    {
        title: "Authenticate fast",
        detail: "Users complete the Google OAuth flow, we store refresh/access tokens, and issue a JWT session.",
    },
    {
        title: "Pull trusted mail",
        detail: "IngestorService builds Gmail queries from issuer allow-lists + `last_synced` timestamps.",
    },
    {
        title: "Parse + enrich",
        detail: "EmailService sanitizes HTML, calls Ollama locally, and normalizes currency + owners.",
    },
    {
        title: "Serve dashboards",
        detail: "ReceiptService persists transactions, while the Next.js dashboard streams analytics.",
    },
];

const dashboardCallouts = [
    {
        title: "Spend pulse",
        detail: "InsightsGrid charts totals, anomalies, and top merchants directly from ingested receipts.",
    },
    {
        title: "Sync health",
        detail: "SyncPanel mirrors the background job status so teams know when Gmail ingest last succeeded.",
    },
    {
        title: "Receipt workspace",
        detail: "Drill into receipts, retag categories, and jump back to the Gmail thread in a single drawer.",
    },
];

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

    return (
        <Box minH="100vh" bg="var(--background)" color="var(--foreground)">
            <Container maxW="6xl" px={6} py={{ base: 12, md: 16 }}>
                <Stack spacing={10} align="center" textAlign="center">
                    <Flex
                        align="center"
                        gap={2}
                        rounded="full"
                        border="1px solid"
                        borderColor="var(--border)"
                        bg="var(--surface-soft)"
                        px={4}
                        py={2}
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.3em"
                        color="var(--accent)"
                    >
                        FinOS
                        <Text as="span" color="var(--muted)">
                            Gmail-native finance OS
                        </Text>
                    </Flex>
                    <Heading as="h1" size={{ base: "2xl", md: "3xl" }} maxW="3xl">
                        Turn Gmail receipts into a live spend command center.
                    </Heading>
                    <Text fontSize={{ base: "md", md: "lg" }} maxW="3xl" color="var(--muted)">
                        FinOS authenticates with Google, ingests purchase confirmations, and gives finance teams a dashboard that feels like Ramp + Plaid, without building another data pipe.
                    </Text>
                    <Flex gap={4} wrap="wrap" justify="center">
                        <Button
                            as="a"
                            href={`${config.apiBaseUrl}/auth/google/login`}
                            bg="var(--accent)"
                            color="var(--background)"
                            _hover={{ opacity: 0.9 }}
                            px={6}
                            py={3}
                        >
                            Connect Gmail
                        </Button>
                        <Button
                            as={Link}
                            href="/dashboard"
                            variant="outline"
                            borderColor="var(--border)"
                            color="var(--foreground)"
                            _hover={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                            px={6}
                            py={3}
                        >
                            Explore dashboard →
                        </Button>
                    </Flex>
                    <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} w="full">
                        {heroHighlights.map((item) => (
                            <Box
                                key={item.title}
                                rounded="2xl"
                                border="1px solid"
                                borderColor="var(--border)"
                                bg="var(--surface)"
                                p={5}
                                textAlign="left"
                                color="var(--muted)"
                            >
                                <Text
                                    fontSize="xs"
                                    textTransform="uppercase"
                                    letterSpacing="0.3em"
                                    color="var(--muted)"
                                >
                                    {item.title}
                                </Text>
                                <Text mt={2} fontSize="md" fontWeight="semibold" color="var(--foreground)">
                                    {item.detail}
                                </Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Container>

            <Box bg="var(--surface)" py={12}>
                <Container maxW="6xl" px={6}>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6} alignItems="stretch">
                        <Box>
                            <Text
                                fontSize="xs"
                                textTransform="uppercase"
                                letterSpacing="0.3em"
                                color="var(--muted)"
                            >
                                Why FinOS
                            </Text>
                            <Heading size="lg" mt={2}>
                                Purpose-built for revenue and finance teams.
                            </Heading>
                            <Text mt={4} color="var(--muted)">
                                Instead of forwarding PDFs, FinOS reads your receipts directly from Gmail using secure OAuth scopes. Transactions are normalized, enriched, and surfaced with anomaly detection in under 60 seconds.
                            </Text>
                        </Box>
                        <Stack spacing={4} rounded="2xl" bg="var(--surface-soft)" p={6} fontSize="sm" color="var(--muted)">
                            <Box>
                                <Text
                                    fontSize="xs"
                                    textTransform="uppercase"
                                    letterSpacing="0.3em"
                                    color="var(--muted)"
                                >
                                    What you get
                                </Text>
                                <Stack mt={3} spacing={2}>
                                    <Text>• PKCE OAuth + JWT session out of the box</Text>
                                    <Text>• Gmail ingestion tuned per issuer + user</Text>
                                    <Text>• Receipts normalized for analytics tooling</Text>
                                </Stack>
                            </Box>
                            <Box
                                rounded="2xl"
                                border="1px solid"
                                borderColor="var(--border)"
                                bg="var(--surface)"
                                p={4}
                            >
                                <Text
                                    fontSize="xs"
                                    textTransform="uppercase"
                                    letterSpacing="0.3em"
                                    color="var(--muted)"
                                >
                                    Cron cadence
                                </Text>
                                <Text color="var(--accent)">~60s Tokio heartbeat (configurable)</Text>
                                <Text fontSize="xs" color="var(--muted)">
                                    Change the interval inside `start_sync_job`.
                                </Text>
                            </Box>
                        </Stack>
                    </SimpleGrid>
                </Container>
            </Box>

            <Container maxW="6xl" px={6} py={12}>
                <Box rounded="3xl" border="1px solid" borderColor="var(--border)" bg="var(--surface)" p={8}>
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.3em"
                        color="var(--muted)"
                    >
                        How FinOS works
                    </Text>
                    <SimpleGrid mt={6} columns={{ base: 1, md: 2 }} spacing={6}>
                        {pipelineSteps.map((step, idx) => (
                            <Box
                                key={step.title}
                                rounded="2xl"
                                border="1px solid"
                                borderColor="var(--border)"
                                bg="var(--surface-soft)"
                                p={5}
                            >
                                <Text
                                    fontSize="xs"
                                    fontWeight="semibold"
                                    textTransform="uppercase"
                                    letterSpacing="0.3em"
                                    color="var(--accent)"
                                >
                                    Step {idx + 1}
                                </Text>
                                <Text mt={2} fontSize="xl" fontWeight="semibold" color="var(--foreground)">
                                    {step.title}
                                </Text>
                                <Text mt={2} fontSize="sm" color="var(--muted)">
                                    {step.detail}
                                </Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Box>
            </Container>

            <Container maxW="6xl" px={6} pb={16}>
                <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={6}>
                    {dashboardCallouts.map((card) => (
                        <Box
                            key={card.title}
                            rounded="2xl"
                            border="1px solid"
                            borderColor="var(--border)"
                            bg="var(--surface)"
                            p={6}
                            color="var(--muted)"
                        >
                            <Text
                                fontSize="xs"
                                textTransform="uppercase"
                                letterSpacing="0.3em"
                                color="var(--muted)"
                            >
                                Dashboard
                            </Text>
                            <Text mt={2} fontSize="xl" fontWeight="semibold" color="var(--foreground)">
                                {card.title}
                            </Text>
                            <Text mt={2} fontSize="sm">
                                {card.detail}
                            </Text>
                        </Box>
                    ))}
                </SimpleGrid>
            </Container>

            <Box
                as="footer"
                borderTop="1px solid"
                borderColor="var(--border)"
                bg="var(--surface)"
                py={8}
                textAlign="center"
                fontSize="sm"
                color="var(--muted)"
            >
                Built for finance teams that live inside Gmail. Ready when you are.
            </Box>
        </Box>
    );
}
