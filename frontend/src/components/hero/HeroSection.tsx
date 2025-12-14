"use client";

import { useRef, useState } from "react";
import {
    AspectRatio,
    Box,
    Button,
    Container,
    HStack,
    Heading,
    SimpleGrid,
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

            <Container
                maxW="6xl"
                px={{ base: 6, md: 10 }}
                py={{ base: 12, md: 16 }}
            >
                <VStack spacing={8} align="stretch">
                    <VStack spacing={2} textAlign="center">
                        <Heading
                            as="h2"
                            fontSize={{ base: "xl", md: "2xl" }}
                            letterSpacing="-0.01em"
                        >
                            What you get in minutes
                        </Heading>
                        <Text
                            maxW="60ch"
                            color="var(--muted)"
                            fontSize={{ base: "sm", md: "md" }}
                        >
                            Preview the outcomes right after connecting Gmail —
                            everything normalized and ready.
                        </Text>
                    </VStack>

                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
                        <Box
                            border="1px solid rgba(255,255,255,0.06)"
                            bg="linear-gradient(170deg, rgba(255,255,255,0.02), rgba(8,10,20,0.95))"
                            borderRadius="xl"
                            boxShadow="inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 50px -32px rgba(0,0,0,0.8)"
                            p={5}
                        >
                            <Text
                                fontWeight="medium"
                                color="rgba(255,255,255,0.9)"
                                mb={4}
                            >
                                Unified spend timeline
                            </Text>
                            <Box
                                border="1px solid rgba(255,255,255,0.06)"
                                borderRadius="lg"
                                bg="rgba(255,255,255,0.02)"
                                p={4}
                                mb={4}
                                position="relative"
                                overflow="hidden"
                                minH="140px"
                            >
                                <Box
                                    position="absolute"
                                    top="50%"
                                    left={4}
                                    right={4}
                                    h="2px"
                                    bg="rgba(255,255,255,0.08)"
                                />
                                <HStack
                                    spacing={3}
                                    align="flex-end"
                                    pos="relative"
                                >
                                    {[
                                        { h: 48, c: "#93c5fd" },
                                        { h: 36, c: "#a78bfa" },
                                        { h: 64, c: "#60a5fa" },
                                        { h: 28, c: "#38bdf8" },
                                        { h: 56, c: "#f472b6" },
                                    ].map((bar, idx) => (
                                        <Box key={idx} textAlign="center">
                                            <Box
                                                w="6px"
                                                h={`${bar.h}px`}
                                                bg={bar.c}
                                                borderRadius="full"
                                                boxShadow="0 6px 16px -10px rgba(0,0,0,0.7)"
                                            />
                                            <Box
                                                w="1px"
                                                h="14px"
                                                bg="rgba(255,255,255,0.2)"
                                                mt={2}
                                                mx="auto"
                                            />
                                        </Box>
                                    ))}
                                </HStack>
                                <Text
                                    position="absolute"
                                    top={3}
                                    right={4}
                                    fontSize="xs"
                                    color="rgba(255,255,255,0.6)"
                                >
                                    Week
                                </Text>
                            </Box>
                            <Text color="var(--muted)" fontSize="sm">
                                All receipts across accounts, unified in one
                                timeline
                            </Text>
                        </Box>

                        <Box
                            border="1px solid rgba(255,255,255,0.06)"
                            bg="linear-gradient(170deg, rgba(255,255,255,0.02), rgba(8,10,20,0.95))"
                            borderRadius="xl"
                            boxShadow="inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 50px -32px rgba(0,0,0,0.8)"
                            p={5}
                        >
                            <Text
                                fontWeight="medium"
                                color="rgba(255,255,255,0.9)"
                                mb={4}
                            >
                                Categorized transactions
                            </Text>
                            <Box
                                border="1px solid rgba(255,255,255,0.06)"
                                borderRadius="lg"
                                bg="rgba(255,255,255,0.02)"
                                p={3}
                                mb={4}
                                fontSize="sm"
                            >
                                <HStack
                                    color="rgba(255,255,255,0.6)"
                                    fontWeight="semibold"
                                    spacing={3}
                                    pb={2}
                                    borderBottom="1px solid rgba(255,255,255,0.04)"
                                >
                                    <Box flex="1">Date</Box>
                                    <Box flex="1.4">Merchant</Box>
                                    <Box flex="1">Category</Box>
                                    <Box flex="0.8" textAlign="right">
                                        Amount
                                    </Box>
                                </HStack>
                                {[
                                    ["Oct 12", "Lyft", "Transport", "$24.10"],
                                    ["Oct 12", "Stripe", "SaaS", "$89.00"],
                                    ["Oct 10", "Sweetgreen", "Food", "$14.25"],
                                    ["Oct 09", "Delta", "Travel", "$320.00"],
                                ].map((row, idx) => (
                                    <HStack
                                        key={row[0] + row[1]}
                                        spacing={3}
                                        py={2.5}
                                        borderBottom={
                                            idx === 3
                                                ? "none"
                                                : "1px solid rgba(255,255,255,0.03)"
                                        }
                                    >
                                        <Box
                                            flex="1"
                                            color="rgba(255,255,255,0.78)"
                                        >
                                            {row[0]}
                                        </Box>
                                        <Box
                                            flex="1.4"
                                            color="rgba(255,255,255,0.85)"
                                        >
                                            {row[1]}
                                        </Box>
                                        <Box
                                            flex="1"
                                            color="rgba(125, 211, 252, 0.9)"
                                            fontWeight="semibold"
                                        >
                                            {row[2]}
                                        </Box>
                                        <Box
                                            flex="0.8"
                                            textAlign="right"
                                            color="rgba(255,255,255,0.9)"
                                            fontWeight="semibold"
                                        >
                                            {row[3]}
                                        </Box>
                                    </HStack>
                                ))}
                            </Box>
                            <Text color="var(--muted)" fontSize="sm">
                                Receipts categorized and
                                normalized
                            </Text>
                        </Box>

                        <Box
                            border="1px solid rgba(255,255,255,0.06)"
                            bg="linear-gradient(170deg, rgba(255,255,255,0.02), rgba(8,10,20,0.95))"
                            borderRadius="xl"
                            boxShadow="inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 50px -32px rgba(0,0,0,0.8)"
                            p={5}
                        >
                            <Text
                                fontWeight="medium"
                                color="rgba(255,255,255,0.9)"
                                mb={4}
                            >
                                Monthly totals across all accounts
                            </Text>
                            <Box
                                border="1px solid rgba(255,255,255,0.06)"
                                borderRadius="lg"
                                bg="rgba(255,255,255,0.02)"
                                p={4}
                                mb={4}
                                minH="140px"
                                display="flex"
                                alignItems="flex-end"
                                gap={3}
                            >
                                {[
                                    { label: "Jul", h: 58, c: "#a5b4fc" },
                                    { label: "Aug", h: 82, c: "#60a5fa" },
                                    { label: "Sep", h: 70, c: "#22d3ee" },
                                    { label: "Oct", h: 96, c: "#f472b6" },
                                ].map((bar) => (
                                    <Box
                                        key={bar.label}
                                        flex="1"
                                        textAlign="center"
                                    >
                                        <Box
                                            mx="auto"
                                            w="32px"
                                            h={`${bar.h}px`}
                                            borderRadius="10px"
                                            bg={`linear-gradient(180deg, ${bar.c}, rgba(255,255,255,0.08))`}
                                            boxShadow="0 10px 20px -14px rgba(0,0,0,0.65)"
                                        />
                                        <Text
                                            mt={2}
                                            fontSize="xs"
                                            color="rgba(255,255,255,0.7)"
                                        >
                                            {bar.label}
                                        </Text>
                                    </Box>
                                ))}
                            </Box>
                            <Text color="var(--muted)" fontSize="sm">
                                Accurate monthly totals across all banks and
                                cards
                            </Text>
                        </Box>
                    </SimpleGrid>
                </VStack>
            </Container>

            <Container
                maxW="5xl"
                px={{ base: 6, md: 10 }}
                py={{ base: 10, md: 12 }}
            >
                <Box
                    border="1px solid rgba(255,255,255,0.08)"
                    borderRadius="lg"
                    bg="rgba(255,255,255,0.02)"
                    px={{ base: 5, md: 8 }}
                    py={{ base: 5, md: 6 }}
                    boxShadow="inset 0 1px 0 rgba(255,255,255,0.05)"
                >
                    <HStack
                        spacing={{ base: 4, md: 8 }}
                        flexWrap="wrap"
                        justify="center"
                        color="rgba(255,255,255,0.78)"
                        fontSize={{ base: "sm", md: "md" }}
                    >
                        {[
                            "Read-only Gmail access",
                            "No email content stored",
                            "Disconnect anytime",
                            "No ads. No selling data.",
                        ].map((item) => (
                            <HStack key={item} spacing={2} minW="max-content">
                                <Box
                                    as="svg"
                                    viewBox="0 0 24 24"
                                    w="20px"
                                    h="20px"
                                    color="rgba(255,255,255,0.7)"
                                    opacity={0.8}
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    fill="none"
                                >
                                    <rect
                                        x="6"
                                        y="10"
                                        width="12"
                                        height="9"
                                        rx="2"
                                        ry="2"
                                        stroke="currentColor"
                                    />
                                    <path
                                        d="M9 10V8a3 3 0 0 1 6 0v2"
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        cx="12"
                                        cy="14"
                                        r="1.2"
                                        fill="currentColor"
                                    />
                                </Box>
                                <Text>{item}</Text>
                            </HStack>
                        ))}
                    </HStack>
                </Box>
            </Container>

            <Container
                maxW="6xl"
                px={{ base: 6, md: 10 }}
                pb={{ base: 14, md: 18 }}
            >
                <VStack spacing={8}>
                    <Heading
                        as="h2"
                        fontSize={{ base: "xl", md: "2xl" }}
                        letterSpacing="-0.01em"
                        textAlign="center"
                    >
                        Why FinOS is different
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} w="full">
                        {[
                            {
                                title: "Source-first",
                                body: "Gmail is the source of truth — not fragile bank scraping.",
                            },
                            {
                                title: "Normalization layer",
                                body: "Receipts are parsed, categorized, and converted into clean structured data.",
                            },
                            {
                                title: "Single control plane",
                                body: "One place to inspect, export, and build on top of your spend data.",
                            },
                        ].map((item) => (
                            <Box
                                key={item.title}
                                border="1px solid rgba(255,255,255,0.06)"
                                borderRadius="xl"
                                bg="linear-gradient(170deg, rgba(255,255,255,0.02), rgba(8,10,20,0.95))"
                                boxShadow="inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 50px -32px rgba(0,0,0,0.8)"
                                p={{ base: 5, md: 6 }}
                            >
                                <Text
                                    fontWeight="semibold"
                                    fontSize="lg"
                                    mb={3}
                                    color="rgba(255,255,255,0.92)"
                                >
                                    {item.title}
                                </Text>
                                <Text color="var(--muted)" fontSize="sm">
                                    {item.body}
                                </Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                </VStack>
            </Container>
        </Box>
    );
}

export default HeroSection;
