"use client";

import { useRef, useState } from "react";
import {
    AspectRatio,
    Box,
    Button,
    Container,
    Heading,
    Stack,
    Text,
    VStack,
} from "@chakra-ui/react";

import MailBankGraph, {
    type MailBankGraphHandle,
} from "@/components/hero/MailBankGraph";
import { config } from "@/lib/config";

export function HeroSection() {
    const [activationTrigger, setActivationTrigger] = useState(0);
    const graphRef = useRef<MailBankGraphHandle | null>(null);
    const triggerActivation = () => {
        setActivationTrigger((tick) => tick + 1);
        graphRef.current?.startActivation("cta");
    };

    return (
        <Box
            bg="var(--background)"
            color="var(--foreground)"
            position="relative"
            overflow="hidden"
            _before={{
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                    "radial-gradient(60% 45% at 50% 0%, rgba(255,255,255,0.045) 0%, rgba(5,8,22,0) 70%)",
                pointerEvents: "none",
            }}
        >
            <Container
                maxW="5xl"
                px={6}
                pt={{ base: 9, md: 14 }}
                pb={{ base: 12, md: 16 }}
                position="relative"
            >
                <Stack spacing={{ base: 5, md: 6 }} align="center">
                    <VStack spacing={1} textAlign="center">
                        <Heading
                            as="h1"
                            fontSize={{ base: "2xl", md: "4xl" }}
                            lineHeight="1.1"
                            letterSpacing="-0.02em"
                        >
                            Gmail receipts to data
                        </Heading>
                        <Text
                            maxW="52ch"
                            fontSize={{ base: "sm", md: "md" }}
                            color="var(--muted)"
                        >
                            converging in a single control plane.
                        </Text>
                    </VStack>

                    <Box
                        w="full"
                        maxW="960px"
                        mx="auto"
                        px={{ base: 4, md: 6 }}
                        py={{ base: 4, md: 5 }}
                        rounded="2xl"
                        border="1px solid rgba(255,255,255,0.08)"
                        bg="rgba(7,10,18,0.82)"
                        bgGradient="linear(to-b, rgba(255,255,255,0.025), rgba(255,255,255,0))"
                        boxShadow="inset 0 1px 0 rgba(255,255,255,0.05), 0 34px 90px -70px rgba(0,0,0,0.9)"
                        overflow="hidden"
                        position="relative"
                        backdropFilter="blur(10px)"
                        _before={{
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            background:
                                "radial-gradient(70% 70% at 15% 20%, rgba(255,255,255,0.05), transparent)",
                            pointerEvents: "none",
                        }}
                    >
                        <AspectRatio ratio={16 / 9} maxH="50vh">
                            <Box w="full" h="full">
                                <MailBankGraph
                                    ref={graphRef}
                                    activationTrigger={activationTrigger}
                                />
                            </Box>
                        </AspectRatio>
                    </Box>

                    <VStack spacing={2}>
                        <Text
                            fontSize="sm"
                            color="var(--muted)"
                            textAlign="center"
                        >
                            Start by connecting Gmail receipts — we&apos;ll do
                            the rest.
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
                            onClick={triggerActivation}
                        >
                            Connect Gmail
                        </Button>
                        <Text
                            fontSize="xs"
                            color="var(--text-subtle)"
                            textAlign="center"
                        >
                            Read-only access.
                        </Text>
                    </VStack>
                </Stack>
            </Container>
        </Box>
    );
}

export default HeroSection;
