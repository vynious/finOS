"use client";

import { useMemo } from "react";

import type { DateRange, ReceiptFilters } from "@/types";
import {
    Badge,
    Box,
    Button,
    Flex,
    HStack,
    Input,
    Select,
    Stack,
    Text,
} from "@chakra-ui/react";

type ReceiptFiltersProps = {
    filters: ReceiptFilters;
    categories: string[];
    onChange: (next: ReceiptFilters) => void;
    onReset: () => void;
};

const rangeOptions: { label: string; value: DateRange }[] = [
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
    { label: "1y", value: "365d" },
];

export function ReceiptFilters({
    filters,
    categories,
    onChange,
    onReset,
}: ReceiptFiltersProps) {
    const sortedCategories = useMemo(
        () => [...categories].sort((a, b) => a.localeCompare(b)),
        [categories],
    );

    return (
        <Box
            rounded="2xl"
            border="1px solid"
            borderColor="border.subtle"
            bg="bg.elevated"
            p={5}
            color="text.primary"
            fontSize="sm"
            boxShadow="var(--shadow)"
        >
            <Flex
                align="center"
                gap={3}
                wrap="wrap"
                justify="space-between"
                mb={4}
            >
                <Box>
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.2em"
                        color="text.muted"
                    >
                        Filters
                    </Text>
                    <Text>
                        Viewing receipts for{" "}
                        <Text as="span" fontWeight="semibold">
                            {filters.email}
                        </Text>
                    </Text>
                </Box>
                <Button
                    onClick={onReset}
                    variant="outline"
                    borderColor="border.subtle"
                    bg="bg.subtle"
                    color="text.primary"
                    _hover={{
                        borderColor: "accent.primary",
                        color: "accent.primary",
                    }}
                >
                    Reset all
                </Button>
            </Flex>

            <HStack spacing={3} align="center" wrap="wrap" mb={4}>
                <HStack
                    spacing={1}
                    rounded="full"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="bg.subtle"
                    p={1}
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.2em"
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
                                opt.value === filters.range
                                    ? "accent.primary"
                                    : "transparent"
                            }
                            color={
                                opt.value === filters.range
                                    ? "bg.base"
                                    : "text.primary"
                            }
                            _hover={{
                                bg:
                                    opt.value === filters.range
                                        ? "accent.primary"
                                        : "bg.elevated",
                            }}
                            onClick={() =>
                                onChange({ ...filters, range: opt.value })
                            }
                        >
                            {opt.label}
                        </Button>
                    ))}
                </HStack>
                <Badge
                    rounded="full"
                    px={4}
                    py={1.5}
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="bg.subtle"
                    color="text.primary"
                >
                    {filters.email}
                </Badge>
            </HStack>

            <Stack
                spacing={4}
                direction={{ base: "column", md: "row" }}
                flexWrap="wrap"
            >
                <HStack
                    flex="1"
                    spacing={3}
                    rounded="xl"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="bg.subtle"
                    px={4}
                    py={3}
                >
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.3em"
                        color="text.muted"
                    >
                        Search
                    </Text>
                    <Input
                        variant="unstyled"
                        value={filters.search ?? ""}
                        onChange={(event) =>
                            onChange({ ...filters, search: event.target.value })
                        }
                        placeholder="Merchant, issuer, notes"
                        color="text.primary"
                        _placeholder={{ color: "text.muted" }}
                        aria-label="Search receipts"
                    />
                </HStack>

                <HStack
                    spacing={3}
                    rounded="xl"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="bg.subtle"
                    px={4}
                    py={3}
                >
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.3em"
                        color="text.muted"
                    >
                        Category
                    </Text>
                    <Select
                        variant="unstyled"
                        value={filters.category ?? ""}
                        onChange={(event) =>
                            onChange({
                                ...filters,
                                category: event.target.value || undefined,
                            })
                        }
                        color="text.primary"
                        aria-label="Filter by category"
                    >
                        <option value="">All</option>
                        {sortedCategories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </Select>
                </HStack>

                <HStack
                    spacing={3}
                    rounded="xl"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="bg.subtle"
                    px={4}
                    py={3}
                >
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.3em"
                        color="text.muted"
                    >
                        Amount
                    </Text>
                    <Input
                        type="number"
                        min={0}
                        w="20"
                        variant="unstyled"
                        placeholder="Min"
                        value={filters.minAmount ?? ""}
                        onChange={(event) =>
                            onChange({
                                ...filters,
                                minAmount: event.target.value
                                    ? Number(event.target.value)
                                    : undefined,
                            })
                        }
                        color="text.primary"
                        _placeholder={{ color: "text.muted" }}
                        aria-label="Minimum amount"
                    />
                    <Text color="text.muted">—</Text>
                    <Input
                        type="number"
                        min={0}
                        w="20"
                        variant="unstyled"
                        placeholder="Max"
                        value={filters.maxAmount ?? ""}
                        onChange={(event) =>
                            onChange({
                                ...filters,
                                maxAmount: event.target.value
                                    ? Number(event.target.value)
                                    : undefined,
                            })
                        }
                        color="text.primary"
                        _placeholder={{ color: "text.muted" }}
                        aria-label="Maximum amount"
                    />
                </HStack>
            </Stack>
        </Box>
    );
}
