"use client";

import { useCallback, useMemo } from "react";

import { useCurrency } from "@/context/currency-context";
import type { CurrencyCode } from "@/lib/config";
import type { Receipt } from "@/types";
import {
    Badge,
    Box,
    Flex,
    Stack,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
} from "@chakra-ui/react";
import { formatDateTime } from "@/lib/dates";

type ReceiptsTableProps = {
    receipts: Receipt[];
    loading?: boolean;
    selectedId?: string | null;
    onSelect: (receipt: Receipt) => void;
};

export function ReceiptsTable({
    receipts,
    loading,
    selectedId,
    onSelect,
}: ReceiptsTableProps) {
    const { convert, format, supported } = useCurrency();
    const supportedSet = useMemo(
        () => new Set<CurrencyCode>(supported),
        [supported],
    );

    const convertAmount = useCallback(
        (receipt: Receipt) => {
            const baseCurrency = supportedSet.has(
                receipt.currency as CurrencyCode,
            )
                ? (receipt.currency as CurrencyCode)
                : "USD";
            return format(convert(receipt.amount, baseCurrency));
        },
        [convert, format, supportedSet],
    );

    const formatOriginalAmount = useCallback((receipt: Receipt) => {
        const currencyCode = (receipt.currency ?? "USD").toUpperCase();
        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: currencyCode,
            }).format(receipt.amount);
        } catch {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: "USD",
            }).format(receipt.amount);
        }
    }, []);

    if (loading) {
        return (
            <Box
                rounded="2xl"
                border="1px solid"
                borderColor="border.subtle"
                bg="bg.elevated"
                p={10}
                textAlign="center"
                fontSize="sm"
                color="text.muted"
                boxShadow="var(--shadow)"
            >
                Fetching receipts from FinOS…
            </Box>
        );
    }

    if (!receipts.length) {
        return (
            <Box
                rounded="2xl"
                border="1px solid"
                borderColor="border.subtle"
                bg="bg.elevated"
                p={10}
                textAlign="center"
                fontSize="sm"
                color="text.muted"
                boxShadow="var(--shadow)"
            >
                No receipts match the selected filters.
            </Box>
        );
    }

    return (
        <Box
            rounded="2xl"
            border="1px solid"
            borderColor="border.subtle"
            bg="bg.elevated"
            boxShadow="var(--shadow)"
            overflow="hidden"
        >
            <Stack spacing={4} p={4} display={{ base: "block", md: "none" }}>
                {receipts.map((receipt) => (
                    <Box
                        key={receipt.id}
                        as="button"
                        type="button"
                        onClick={() => onSelect(receipt)}
                        w="full"
                        textAlign="left"
                        rounded="2xl"
                        border="1px solid"
                        borderColor="border.subtle"
                        bg="bg.subtle"
                        p={4}
                        fontSize="sm"
                        color="text.primary"
                    >
                        <Flex
                            justify="space-between"
                            gap={3}
                            align="flex-start"
                        >
                            <Box minW={0}>
                                <Text
                                    fontSize="md"
                                    fontWeight="semibold"
                                    noOfLines={1}
                                    color="text.primary"
                                >
                                    {receipt.merchant}
                                </Text>
                                <Text
                                    fontSize="xs"
                                    color="text.muted"
                                    noOfLines={1}
                                >
                                    {receipt.owner}
                                </Text>
                                <Text
                                    fontSize="xs"
                                    color="text.muted"
                                    noOfLines={1}
                                >
                                    {receipt.issuer}
                                </Text>
                            </Box>
                            <Box textAlign="right">
                                <Text
                                    fontWeight="semibold"
                                    color="text.primary"
                                >
                                    {convertAmount(receipt)}
                                </Text>
                                <Text fontSize="xs" color="text.muted">
                                    {formatOriginalAmount(receipt)}
                                </Text>
                            </Box>
                        </Flex>
                        <Flex mt={3} wrap="wrap" gap={1} fontSize="xs">
                            {receipt.categories?.map((cat) => (
                                <Badge
                                    key={cat}
                                    rounded="full"
                                    px={2}
                                    py={0.5}
                                    bg="bg.subtle"
                                    color="text.primary"
                                >
                                    {cat}
                                </Badge>
                            ))}
                        </Flex>
                        <Text mt={3} fontSize="xs" color="text.muted">
                            {formatDateTime(receipt.timestamp, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </Text>
                    </Box>
                ))}
            </Stack>

            <Box display={{ base: "none", md: "block" }}>
                <TableContainer>
                    <Table size="sm" variant="simple" color="var(--foreground)">
                        <Thead bg="var(--surface-soft)">
                            <Tr>
                                <Th px={4} py={3}>
                                    Merchant
                                </Th>
                                <Th px={4} py={3}>
                                    Owner
                                </Th>
                                <Th px={4} py={3}>
                                    Issuer
                                </Th>
                                <Th px={4} py={3}>
                                    Categories
                                </Th>
                                <Th px={4} py={3} textAlign="right">
                                    Amount
                                </Th>
                                <Th px={4} py={3}>
                                    Timestamp
                                </Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {receipts.map((receipt) => {
                                const isSelected = receipt.id === selectedId;
                                return (
                                    <Tr
                                        key={receipt.id}
                                        cursor="pointer"
                                        borderTop="1px solid"
                                        borderColor="var(--border)"
                                        bg={
                                            isSelected
                                                ? "var(--surface-soft)"
                                                : "transparent"
                                        }
                                        _hover={{
                                            bg: "var(--surface-soft)",
                                        }}
                                        onClick={() => onSelect(receipt)}
                                    >
                                        <Td
                                            px={4}
                                            py={3}
                                            maxW="180px"
                                            fontWeight="semibold"
                                        >
                                            <Text noOfLines={1}>
                                                {receipt.merchant}
                                            </Text>
                                        </Td>
                                        <Td
                                            px={4}
                                            py={3}
                                            maxW="160px"
                                            color="var(--muted)"
                                        >
                                            <Text noOfLines={1}>
                                                {receipt.owner}
                                            </Text>
                                        </Td>
                                        <Td
                                            px={4}
                                            py={3}
                                            maxW="160px"
                                            color="var(--muted)"
                                        >
                                            <Text noOfLines={1}>
                                                {receipt.issuer}
                                            </Text>
                                        </Td>
                                        <Td px={4} py={3}>
                                            <Flex wrap="wrap" gap={1}>
                                                {receipt.categories?.map(
                                                    (cat) => (
                                                        <Badge
                                                            key={cat}
                                                            rounded="full"
                                                            px={2}
                                                            py={0.5}
                                                            bg="var(--surface-soft)"
                                                            color="var(--foreground)"
                                                            fontSize="xs"
                                                        >
                                                            {cat}
                                                        </Badge>
                                                    ),
                                                )}
                                            </Flex>
                                        </Td>
                                        <Td
                                            px={4}
                                            py={3}
                                            textAlign="right"
                                            fontWeight="semibold"
                                        >
                                            {convertAmount(receipt)}
                                            <Text
                                                as="span"
                                                ml={2}
                                                fontSize="xs"
                                                color="var(--muted)"
                                            >
                                                {formatOriginalAmount(receipt)}
                                            </Text>
                                        </Td>
                                        <Td px={4} py={3} color="var(--muted)">
                                            {formatDateTime(receipt.timestamp, {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
}
