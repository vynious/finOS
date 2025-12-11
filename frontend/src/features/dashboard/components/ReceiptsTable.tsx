"use client";

import { useCallback, useMemo, useState } from "react";

import { useCurrency } from "@/context/currency-context";
import type { CurrencyCode } from "@/lib/config";
import type { Receipt } from "@/types";
import {
    Badge,
    Box,
    Button,
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
import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
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
    type SortKey = "merchant" | "issuer" | "amount" | "timestamp";
    type SortDir = "asc" | "desc";
    const [sort, setSort] = useState<{ key: SortKey | null; dir: SortDir }>({
        key: null,
        dir: "asc",
    });
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

    const sortedReceipts = useMemo(() => {
        if (!sort.key) return receipts;
        const next = [...receipts];
        next.sort((a, b) => {
            const dirFactor = sort.dir === "asc" ? 1 : -1;
            switch (sort.key) {
                case "merchant":
                    return (
                        a.merchant.localeCompare(b.merchant, undefined, {
                            sensitivity: "base",
                        }) * dirFactor
                    );
                case "issuer":
                    return (
                        (a.issuer ?? "").localeCompare(
                            b.issuer ?? "",
                            undefined,
                            {
                                sensitivity: "base",
                            },
                        ) * dirFactor
                    );
                case "amount":
                    return (a.amount - b.amount) * dirFactor;
                case "timestamp":
                default:
                    return (
                        (new Date(a.timestamp).getTime() -
                            new Date(b.timestamp).getTime()) *
                        dirFactor
                    );
            }
        });
        return next;
    }, [receipts, sort]);

    const toggleSort = (key: SortKey) => {
        setSort((prev) => {
            if (prev.key === key) {
                return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
            }
            return { key, dir: "asc" };
        });
    };

    const SortButton = ({
        label,
        sortKey,
        align = "center",
        border,
    }: {
        label: string;
        sortKey: SortKey;
        align?: "left" | "center" | "right";
        border?: boolean;
    }) => (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort(sortKey)}
            justifyContent={
                align === "left"
                    ? "flex-start"
                    : align === "right"
                      ? "flex-end"
                      : "center"
            }
            w="full"
            px={0}
            py={3}
            color="text.secondary"
            fontWeight="medium"
            rightIcon={
                sort.key === sortKey ? (
                    sort.dir === "asc" ? (
                        <TriangleUpIcon boxSize={3} />
                    ) : (
                        <TriangleDownIcon boxSize={3} />
                    )
                ) : (
                    <TriangleUpIcon opacity={0.2} boxSize={3} />
                )
            }
            borderRight={border ? "1px solid" : undefined}
            borderColor={border ? "border.subtle" : undefined}
        >
            {label}
        </Button>
    );

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
                {sortedReceipts.map((receipt) => (
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
                                <Th p={0}>
                                    <SortButton
                                        label="Merchant"
                                        sortKey="merchant"
                                        align="center"
                                        border
                                    />
                                </Th>
                                <Th p={0}>
                                    <SortButton
                                        label="Issuer"
                                        sortKey="issuer"
                                        border
                                    />
                                </Th>
                                <Th p={0}>
                                    <SortButton
                                        label="Categories"
                                        sortKey="merchant"
                                        border
                                    />
                                </Th>
                                <Th p={0}>
                                    <SortButton
                                        label="Amount"
                                        sortKey="amount"
                                        border
                                    />
                                </Th>
                                <Th p={0}>
                                    <SortButton
                                        label="Timestamp"
                                        sortKey="timestamp"
                                        align="center"
                                    />
                                </Th>
                            </Tr>
                        </Thead>
                        <Tbody bg="bg.table">
                            {sortedReceipts.map((receipt, idx) => {
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
