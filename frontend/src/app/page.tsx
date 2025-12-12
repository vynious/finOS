import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import {
    AspectRatio,
    Box,
    Button,
    Card,
    Container,
    Stack,
    Text,
    VStack,
} from "@chakra-ui/react";

import { config } from "@/lib/config";
import type { ApiResponse, PublicUser } from "@/types";
import ProviderSolarSystem from "@/components/ProviderSolarSystem";

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
        <Box bg="var(--background)" color="var(--foreground)">
            <Container
                maxW="5xl"
                px={6}
                pt={{ base: 12, md: 20 }}
                pb={{ base: 16, md: 24 }}
                minH={{ base: "70vh", md: "60vh" }}
            >
                <Stack spacing={8} align="center">
                    <Card
                        w="full"
                        maxW="960px"
                        mx="auto"
                        px={{ base: 4, md: 6 }}
                        py={{ base: 4, md: 5 }}
                        rounded="2xl"
                        border="1px solid"
                        borderColor="var(--border)"
                        bg="rgba(4,6,16,0.9)"
                        shadow="2xl"
                    >
                        <AspectRatio ratio={16 / 9} maxH="50vh">
                            <Box w="full" h="full">
                                <ProviderSolarSystem />
                            </Box>
                        </AspectRatio>
                    </Card>
                    <VStack spacing={3} mt={6}>
                        <Text
                            fontSize="sm"
                            color="var(--muted)"
                            textAlign="center"
                        >
                            Start by connecting Gmail receipts.
                        </Text>
                        <Button
                            as="a"
                            href={`${config.apiBaseUrl}/auth/google/login`}
                            bg="var(--accent)"
                            color="var(--background)"
                            _hover={{ opacity: 0.92 }}
                            px={6}
                            py={3}
                            rounded="xl"
                        >
                            Connect Gmail
                        </Button>
                    </VStack>
                </Stack>
            </Container>
        </Box>
    );
}
