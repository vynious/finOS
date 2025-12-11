"use client";

import { useCurrency } from "@/context/currency-context";
import type { DateRange } from "@/types";
import {
    Badge,
    Box,
    Button,
    Container,
    Flex,
    Grid,
    HStack,
    Heading,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Stack,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import {
    CloseIcon,
    HamburgerIcon,
    ChevronDownIcon,
    SunIcon,
    MoonIcon,
    CheckIcon,
} from "@chakra-ui/icons";
import { useThemeMode } from "@/context/theme-mode-context";

type SectionKey = "transactions" | "settings";

type AppShellProps = {
    email: string;
    dateRange: DateRange;
    onRangeChange: (range: DateRange) => void;
    onLogout: () => void;
    activeSection: SectionKey;
    onSectionChange: (section: SectionKey) => void;
    children: React.ReactNode;
};

type CurrencyMenuProps = {
    currency: string;
    supported: string[];
    onChange: (value: string) => void;
};

// Compact currency menu to replace the native select, keeping the same behaviour.
function CurrencyMenu({ currency, supported, onChange }: CurrencyMenuProps) {
    return (
        <Menu>
            <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                variant="ghost"
                border="1px solid"
                borderColor="border.emphasis"
                bg="bg.subtle"
                color="text.muted"
                rounded="full"
                px={3}
                py={2}
                fontSize="xs"
                _focusVisible={{
                    boxShadow: "0 0 0 1px var(--accent-primary)",
                    borderColor: "accent.primary",
                }}
            >
                <HStack spacing={2}>
                    <Text fontWeight="medium" color="text.primary">
                        Currency
                    </Text>
                    <Badge
                        rounded="full"
                        px={2}
                        py={1}
                        bg="accent.primary"
                        color="bg.base"
                        fontWeight="semibold"
                    >
                        {currency}
                    </Badge>
                </HStack>
            </MenuButton>
            <MenuList
                minW="36"
                bg="bg.elevated"
                borderColor="border.subtle"
                boxShadow="lg"
                rounded="lg"
                color="text.primary"
            >
                {supported.map((code) => {
                    const isActive = code === currency;
                    return (
                        <MenuItem
                            key={code}
                            onClick={() => onChange(code)}
                            py={2}
                            px={3}
                            bg={isActive ? "bg.subtle" : "transparent"}
                            color={isActive ? "text.primary" : "text.muted"}
                            _hover={{
                                bg: "bg.subtle",
                                color: "text.primary",
                            }}
                            icon={isActive ? <CheckIcon /> : undefined}
                        >
                            <Text fontWeight={isActive ? "semibold" : "normal"}>
                                {code}
                            </Text>
                        </MenuItem>
                    );
                })}
            </MenuList>
        </Menu>
    );
}

const rangeOptions: { label: string; value: DateRange }[] = [
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
    { label: "1y", value: "365d" },
];

const navItems: { key: SectionKey; label: string; icon: string }[] = [
    { key: "transactions", label: "Transactions", icon: "📄" },
    { key: "settings", label: "Settings", icon: "⚙️" },
];

const sectionMeta: Record<
    SectionKey,
    { kicker: string; title: string; description: string }
> = {
    transactions: {
        kicker: "Spend intelligence",
        title: "Transactions",
        description: "Monitor ingest health, filters, and detailed receipts.",
    },
    settings: {
        kicker: "Workspace",
        title: "Settings",
        description: "Manage Gmail connections and automation preferences.",
    },
};

export function AppShell({
    email,
    dateRange,
    onRangeChange,
    onLogout,
    activeSection,
    onSectionChange,
    children,
}: AppShellProps) {
    const { currency, setCurrency, supported } = useCurrency();
    const { mode, toggle } = useThemeMode();
    const initials = useMemo(
        () =>
            email
                .split("@")[0]
                .split(".")
                .map((chunk) => chunk[0]?.toUpperCase())
                .slice(0, 2)
                .join("") || "FF",
        [email],
    );

    const [navOpen, setNavOpen] = useState(false);

    return (
        <Grid
            minH="100vh"
            templateColumns={{ base: "1fr", lg: "240px 1fr" }}
            bg="bg.base"
            color="text.primary"
        >
            {navOpen && (
                <Box
                    position="fixed"
                    inset={0}
                    zIndex={30}
                    bg="blackAlpha.600"
                    display={{ base: "block", lg: "none" }}
                    onClick={() => setNavOpen(false)}
                />
            )}

            <Box
                as="aside"
                position={{ base: "fixed", lg: "relative" }}
                insetY={0}
                left={0}
                zIndex={40}
                w="240px"
                borderRight="1px solid"
                borderColor="border.subtle"
                bg="bg.elevated"
                px={6}
                py={8}
                transform={{
                    base: navOpen ? "translateX(0)" : "translateX(-100%)",
                    lg: "translateX(0)",
                }}
                transition="transform 0.2s ease"
                display="flex"
                flexDirection="column"
                gap={6}
            >
                <HStack spacing={3}>
                    <Box
                        rounded="2xl"
                        bg="accent.primary"
                        color="bg.base"
                        px={3}
                        py={2}
                        fontWeight="bold"
                    >
                        ⧉
                    </Box>
                    <Box>
                        <Text
                            fontSize="xs"
                            textTransform="uppercase"
                            letterSpacing="0.2em"
                            color="text.muted"
                        >
                            FinOS
                        </Text>
                        <Heading size="md" color="text.primary">
                            Command
                        </Heading>
                    </Box>
                </HStack>

                <VStack
                    align="stretch"
                    spacing={2}
                    fontSize="sm"
                    color="text.muted"
                >
                    {navItems.map((item) => (
                        <Button
                            key={item.key}
                            onClick={() => {
                                onSectionChange(item.key);
                                setNavOpen(false);
                            }}
                            justifyContent="flex-start"
                            gap={3}
                            variant="ghost"
                            bg={
                                activeSection === item.key
                                    ? "bg.subtle"
                                    : "transparent"
                            }
                            _hover={{ bg: "bg.subtle" }}
                            color={
                                activeSection === item.key
                                    ? "text.primary"
                                    : "text.muted"
                            }
                        >
                            <Text as="span">{item.icon}</Text>
                            {item.label}
                        </Button>
                    ))}
                </VStack>

                <VStack
                    mt="auto"
                    align="stretch"
                    spacing={3}
                    fontSize="xs"
                    color="text.muted"
                >
                    <Box
                        rounded="2xl"
                        border="1px solid"
                        borderColor="border.subtle"
                        bg="bg.subtle"
                        p={4}
                    >
                        <Text fontWeight="semibold" color="text.primary">
                            Connected Gmail
                        </Text>
                        <Text noOfLines={1} fontSize="xs" color="text.muted">
                            {email}
                        </Text>
                        <Button
                            mt={3}
                            w="full"
                            variant="outline"
                            borderColor="border.subtle"
                            bg="bg.elevated"
                            color="text.muted"
                            _hover={{
                                borderColor: "accent.primary",
                                color: "text.primary",
                            }}
                            onClick={onLogout}
                        >
                            Sign out
                        </Button>
                    </Box>
                    <Text>Version 0.2.0 · Secure OAuth via Google</Text>
                </VStack>
            </Box>

            <Grid
                as="main"
                templateRows="auto 1fr"
                minH="100vh"
                position="relative"
            >
                <Container
                    as="header"
                    position="sticky"
                    top={0}
                    zIndex={20}
                    maxW="container.xl"
                    borderBottom="1px solid"
                    borderColor="border.subtle"
                    bg="bg.base"
                    backdropFilter="blur(12px)"
                    px={{ base: 4, md: 6, lg: 10 }}
                    py={4}
                    boxShadow="sm"
                >
                    <Flex justify="space-between" gap={4} align="center">
                        <Box>
                            <Text
                                fontSize="xs"
                                textTransform="uppercase"
                                letterSpacing="0.3em"
                                color="accent.primary"
                            >
                                {sectionMeta[activeSection].kicker}
                            </Text>
                            <Heading size="lg" color="text.primary">
                                {sectionMeta[activeSection].title}
                            </Heading>
                            <Text fontSize="sm" color="text.muted">
                                {sectionMeta[activeSection].description}
                            </Text>
                        </Box>
                        <HStack spacing={3}>
                            <IconButton
                                aria-label="Toggle navigation"
                                icon={
                                    navOpen ? <CloseIcon /> : <HamburgerIcon />
                                }
                                display={{ base: "flex", lg: "none" }}
                                onClick={() => setNavOpen((prev) => !prev)}
                                border="1px solid"
                                borderColor="border.subtle"
                                bg="bg.subtle"
                                color="text.primary"
                            />
                            <IconButton
                                aria-label="Toggle theme"
                                icon={
                                    mode === "light" ? (
                                        <MoonIcon />
                                    ) : (
                                        <SunIcon />
                                    )
                                }
                                variant="ghost"
                                onClick={toggle}
                                border="1px solid"
                                borderColor="border.subtle"
                                bg="bg.subtle"
                                color="text.primary"
                                _hover={{
                                    bg: "bg.elevated",
                                    color: "accent.primary",
                                }}
                            />
                            {activeSection === "transactions" && (
                                <HStack
                                    spacing={3}
                                    display={{ base: "none", lg: "flex" }}
                                >
                                    <HStack spacing={3}>
                                        <HStack
                                            spacing={1}
                                            rounded="full"
                                            border="1px solid"
                                            borderColor="border.subtle"
                                            bg="bg.subtle"
                                            p={1}
                                            fontSize="sm"
                                            color="text.muted"
                                        >
                                            {rangeOptions.map((opt) => (
                                                <Button
                                                    key={opt.value}
                                                    size="sm"
                                                    variant="ghost"
                                                    rounded="full"
                                                    px={3}
                                                    py={1}
                                                    bg={
                                                        opt.value === dateRange
                                                            ? "accent.primary"
                                                            : "transparent"
                                                    }
                                                    color={
                                                        opt.value === dateRange
                                                            ? "bg.base"
                                                            : "text.primary"
                                                    }
                                                    _hover={{
                                                        bg:
                                                            opt.value ===
                                                            dateRange
                                                                ? "accent.primary"
                                                                : "bg.elevated",
                                                    }}
                                                    onClick={() =>
                                                        onRangeChange(opt.value)
                                                    }
                                                >
                                                    {opt.label}
                                                </Button>
                                            ))}
                                        </HStack>
                                        <CurrencyMenu
                                            currency={currency}
                                            supported={supported}
                                            onChange={(code) =>
                                                setCurrency(
                                                    code as (typeof supported)[number],
                                                )
                                            }
                                        />
                                    </HStack>
                                    <HStack
                                        spacing={2}
                                        rounded="full"
                                        border="1px solid"
                                        borderColor="border.subtle"
                                        bg="bg.subtle"
                                        px={3}
                                        py={1.5}
                                    >
                                        <Flex
                                            align="center"
                                            justify="center"
                                            w={7}
                                            h={7}
                                            rounded="full"
                                            bg="accent.primary"
                                            color="bg.base"
                                            fontSize="sm"
                                        >
                                            {initials}
                                        </Flex>
                                        <Box>
                                            <Text
                                                fontSize="xs"
                                                color="text.muted"
                                            >
                                                Signed in
                                            </Text>
                                        </Box>
                                    </HStack>
                                </HStack>
                            )}
                        </HStack>
                    </Flex>

                    {activeSection === "transactions" && (
                        <Stack
                            direction="row"
                            spacing={3}
                            mt={4}
                            align="center"
                            display={{ base: "flex", lg: "none" }}
                            flexWrap="wrap"
                        >
                            <HStack
                                spacing={1}
                                rounded="full"
                                border="1px solid"
                                borderColor="border.subtle"
                                bg="bg.subtle"
                                p={1}
                                fontSize="sm"
                                color="text.muted"
                            >
                                {rangeOptions.map((opt) => (
                                    <Button
                                        key={opt.value}
                                        size="sm"
                                        variant="ghost"
                                        rounded="full"
                                        px={3}
                                        py={1}
                                        bg={
                                            opt.value === dateRange
                                                ? "accent.primary"
                                                : "transparent"
                                        }
                                        color={
                                            opt.value === dateRange
                                                ? "bg.base"
                                                : "text.primary"
                                        }
                                        _hover={{
                                            bg:
                                                opt.value === dateRange
                                                    ? "accent.primary"
                                                    : "bg.elevated",
                                        }}
                                        onClick={() => onRangeChange(opt.value)}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </HStack>
                            <HStack
                                spacing={2}
                                rounded="full"
                                border="1px solid"
                                borderColor="border.emphasis"
                                bg="bg.subtle"
                                px={3}
                                py={1.5}
                                fontSize="xs"
                                color="text.muted"
                            >
                                <CurrencyMenu
                                    currency={currency}
                                    supported={supported}
                                    onChange={(code) =>
                                        setCurrency(
                                            code as (typeof supported)[number],
                                        )
                                    }
                                />
                            </HStack>
                        </Stack>
                    )}
                </Container>

                <Box
                    as="section"
                    flex="1"
                    overflowY="auto"
                    py={{ base: 6, lg: 8 }}
                >
                    <Container
                        maxW="container.xl"
                        px={{ base: 4, sm: 6, lg: 10 }}
                    >
                        {children}
                    </Container>
                </Box>
            </Grid>
        </Grid>
    );
}
