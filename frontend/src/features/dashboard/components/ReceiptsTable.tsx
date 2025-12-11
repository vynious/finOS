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

    const toTitleCase = (value: string) =>
        value
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    if (loading) {
        return (
            <Box
                rounded="2xl"
                border="1px solid"
                borderColor="border.subtle"
                bg="bg.surface"
                p={10}
                textAlign="center"
                fontSize="sm"
                color="text.secondary"
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
                bg="bg.surface"
                p={10}
                textAlign="center"
                fontSize="sm"
                color="text.secondary"
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
            bg="bg.surface"
            boxShadow="var(--shadow)"
            overflow="hidden"
        >
            {/* Mobile cards */}
            <Stack spacing={4} p={4} display={{ base: "block", md: "none" }}>
                {receipts.map((receipt) => (
                    <Box
                        key={receipt.id}
                        as="button"
                        type="button"
                        onClick={() => onSelect(receipt)}
                        w="full"
                        textAlign="left"
                        rounded="xl"
                        border="1px solid"
                        borderColor="border.subtle"
                        bg="bg.table"
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
                                    title={receipt.merchant}
                                >
                                    {toTitleCase(receipt.merchant)}
                                </Text>
                                <Text
                                    fontSize="xs"
                                    color="text.secondary"
                                    noOfLines={1}
                                >
                                    {receipt.issuer}
                                </Text>
                            </Box>
                            <Box textAlign="right">
                                <Text
                                    fontWeight="semibold"
                                    color="text.primary"
                                    fontFamily="mono"
                                >
                                    {convertAmount(receipt)}
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
                                    bg="bg.row"
                                    color="text.primary"
                                >
                                    {cat}
                                </Badge>
                            ))}
                        </Flex>
                        <Text mt={3} fontSize="xs" color="text.secondary">
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

            {/* Desktop table */}
            <Box display={{ base: "none", md: "block" }}>
                <TableContainer>
                    <Table size="sm" variant="unstyled" color="text.primary">
                        <Thead
                            bg="bg.table"
                            borderBottom="1px solid"
                            borderColor="border.subtle"
                        >
                            <Tr>
                                <Th
                                    px={4}
                                    py={3}
                                    color="text.secondary"
                                    fontWeight="medium"
                                    borderRight="1px solid"
                                    borderColor="border.subtle"
                                    textAlign="left"
                                >
                                    Merchant
                                </Th>
                                <Th
                                    px={4}
                                    py={3}
                                    color="text.secondary"
                                    fontWeight="medium"
                                    borderRight="1px solid"
                                    borderColor="border.subtle"
                                    textAlign="center"
                                >
                                    Issuer
                                </Th>
                                <Th
                                    px={4}
                                    py={3}
                                    color="text.secondary"
                                    fontWeight="medium"
                                    borderRight="1px solid"
                                    borderColor="border.subtle"
                                    textAlign="center"
                                >
                                    Categories
                                </Th>
                                <Th
                                    px={4}
                                    py={3}
                                    textAlign="center"
                                    color="text.secondary"
                                    fontWeight="medium"
                                    borderRight="1px solid"
                                    borderColor="border.subtle"
                                >
                                    Amount
                                </Th>
                                <Th
                                    px={4}
                                    py={3}
                                    color="text.secondary"
                                    fontWeight="medium"
                                    borderRight="1px solid"
                                    borderColor="border.subtle"
                                    textAlign="center"
                                >
                                    Timestamp
                                </Th>
                            </Tr>
                        </Thead>
                        <Tbody bg="bg.table">
                            {receipts.map((receipt, idx) => {
                                const isSelected = receipt.id === selectedId;
                                return (
                                    <Tr
                                        key={receipt.id}
                                        cursor="pointer"
                                        borderTop="1px solid"
                                        borderColor="border.subtle"
                                        bg={
                                            isSelected
                                                ? "bg.row"
                                                : idx % 2 === 0
                                                  ? "bg.table"
                                                  : "bg.row"
                                        }
                                        _hover={{
                                            bg: "bg.row",
                                        }}
                                        onClick={() => onSelect(receipt)}
                                    >
                                        <Td
                                            px={4}
                                            py={3}
                                            maxW="180px"
                                            border="none"
                                            borderRight="1px solid"
                                            borderColor="border.subtle"
                                            textAlign="left"
                                        >
                                            <Text
                                                noOfLines={1}
                                                fontWeight="semibold"
                                                color="text.primary"
                                                title={receipt.merchant}
                                            >
                                                {toTitleCase(receipt.merchant)}
                                            </Text>
                                        </Td>
                                        <Td
                                            px={4}
                                            py={3}
                                            maxW="160px"
                                            border="none"
                                            borderRight="1px solid"
                                            borderColor="border.subtle"
                                            textAlign="center"
                                        >
                                            <Text
                                                noOfLines={1}
                                                color="text.secondary"
                                            >
                                                {receipt.issuer}
                                            </Text>
                                        </Td>
                                        <Td
                                            px={4}
                                            py={3}
                                            border="none"
                                            borderRight="1px solid"
                                            borderColor="border.subtle"
                                            textAlign="center"
                                        >
                                            <Flex wrap="wrap" gap={1}>
                                                {receipt.categories?.map(
                                                    (cat) => (
                                                        <Badge
                                                            key={cat}
                                                            rounded="full"
                                                            px={2}
                                                            py={0.5}
                                                            bg="bg.subtle"
                                                            color="text.primary"
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
                                            textAlign="center"
                                            fontWeight="semibold"
                                            border="none"
                                            fontFamily="mono"
                                            color={
                                                receipt.amount < 0
                                                    ? "status.success"
                                                    : "text.primary"
                                            }
                                            borderRight="1px solid"
                                            borderColor="border.subtle"
                                        >
                                            {convertAmount(receipt)}
                                        </Td>
                                        <Td
                                            px={4}
                                            py={3}
                                            color="text.secondary"
                                            border="none"
                                            borderRight="1px solid"
                                            borderColor="border.subtle"
                                            textAlign="center"
                                        >
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
