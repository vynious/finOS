"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { useCurrency } from "@/context/currency-context";
import type { CurrencyCode } from "@/lib/config";
import type { Receipt } from "@/types";
import { formatDateTime } from "@/lib/dates";
import {
    Box,
    Button,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    Flex,
    HStack,
    Input,
    Stack,
    Tag,
    TagCloseButton,
    TagLabel,
    Text,
    Textarea,
} from "@chakra-ui/react";

type ReceiptDrawerProps = {
    receipt?: Receipt | null;
    onClose: () => void;
    onUpdateCategories: (
        receiptId: string,
        categories: string[],
    ) => Promise<void | boolean>;
};

export function ReceiptDrawer({
    receipt,
    onClose,
    onUpdateCategories,
}: ReceiptDrawerProps) {
    const { convert, format, supported } = useCurrency();
    const [localCategories, setLocalCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const [suggestions] = useState<string[]>([
        "Groceries",
        "Dining",
        "Transport",
        "Subscriptions",
        "Utilities",
        "Shopping",
        "Travel",
        "Health",
        "Income",
    ]);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    useEffect(() => {
        setLocalCategories(receipt?.categories ?? []);
        setNewCategory("");
        setStatus("idle");
        setSaving(false);
    }, [receipt]);

    useEffect(() => {
        if (!receipt) return;
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [receipt, onClose]);

    const supportedSet = useMemo(
        () => new Set<CurrencyCode>(supported),
        [supported],
    );

    const canSave = useMemo(() => {
        if (!receipt) return false;
        const original = receipt.categories ?? [];
        if (original.length !== localCategories.length) return true;
        return original.some((cat, idx) => cat !== localCategories[idx]);
    }, [receipt, localCategories]);

    const drawerTitleId = useId();

    if (!receipt) return null;

    const baseCurrency = supportedSet.has(receipt.currency as CurrencyCode)
        ? (receipt.currency as CurrencyCode)
        : "USD";
    const convertedAmount = format(convert(receipt.amount, baseCurrency));
    const originalAmount = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: receipt.currency ?? "USD",
    }).format(receipt.amount);

    const addCategory = () => {
        const trimmed = newCategory.trim();
        if (!trimmed) return;
        if (localCategories.includes(trimmed)) {
            setNewCategory("");
            return;
        }
        setLocalCategories((prev) => [...prev, trimmed]);
        setNewCategory("");
    };

    const removeCategory = (category: string) => {
        setLocalCategories((prev) => prev.filter((cat) => cat !== category));
    };

    const handleSave = async () => {
        if (!receipt) return;
        setSaving(true);
        try {
            const result = await onUpdateCategories(
                receipt.id,
                localCategories,
            );
            setStatus(result === false ? "error" : "success");
        } catch (err) {
            console.error(err);
            setStatus("error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer isOpen onClose={onClose} size="md" placement="right">
            <DrawerOverlay />
            <DrawerContent
                bg="var(--surface)"
                color="var(--foreground)"
                borderLeft="1px solid"
                borderColor="var(--border)"
            >
                <DrawerCloseButton />
                <DrawerHeader id={drawerTitleId}>
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.3em"
                        color="var(--muted)"
                    >
                        Receipt detail
                    </Text>
                    <Text
                        fontSize="2xl"
                        fontWeight="semibold"
                        color="var(--foreground)"
                    >
                        {receipt.merchant}
                    </Text>
                    <Text fontSize="sm" color="var(--muted)">
                        {receipt.issuer}
                    </Text>
                    <Stack mt={4} spacing={1} color="var(--muted)">
                        <Text
                            fontSize="3xl"
                            fontWeight="semibold"
                            color="var(--foreground)"
                        >
                            {convertedAmount}
                        </Text>
                        <Text fontSize="sm">
                            {originalAmount} {receipt.currency ?? "USD"}
                        </Text>
                    </Stack>
                </DrawerHeader>

                <DrawerBody>
                    <Stack spacing={6} fontSize="sm">
                        <Box>
                            <Text
                                fontSize="xs"
                                textTransform="uppercase"
                                letterSpacing="0.2em"
                                color="var(--muted)"
                            >
                                Timestamp
                            </Text>
                            <Text color="var(--foreground)">
                                {formatDateTime(receipt.timestamp, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </Text>
                        </Box>

                        <Box>
                            <Text
                                fontSize="xs"
                                textTransform="uppercase"
                                letterSpacing="0.2em"
                                color="var(--muted)"
                                mb={2}
                            >
                                Categories
                            </Text>
                            <Flex wrap="wrap" gap={2}>
                                {localCategories.map((cat) => (
                                    <Tag
                                        key={cat}
                                        size="md"
                                        rounded="full"
                                        bg="var(--surface-soft)"
                                        color="var(--foreground)"
                                    >
                                        <TagLabel>{cat}</TagLabel>
                                        <TagCloseButton
                                            onClick={() => removeCategory(cat)}
                                        />
                                    </Tag>
                                ))}
                                {!localCategories.length && (
                                    <Text fontSize="xs" color="var(--muted)">
                                        No categories assigned yet.
                                    </Text>
                                )}
                            </Flex>
                            <HStack mt={4} spacing={2}>
                                <Input
                                    value={newCategory}
                                    onChange={(event) =>
                                        setNewCategory(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            addCategory();
                                        }
                                    }}
                                    placeholder="Add or edit category"
                                    borderColor="var(--border)"
                                    bg="var(--surface-soft)"
                                    color="var(--foreground)"
                                    _focus={{
                                        borderColor: "var(--accent)",
                                        boxShadow: "none",
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    borderColor="var(--accent)"
                                    color="var(--accent)"
                                    onClick={addCategory}
                                >
                                    Add
                                </Button>
                            </HStack>
                            <Box
                                mt={4}
                                rounded="xl"
                                border="1px solid"
                                borderColor="var(--border)"
                                bg="var(--surface-soft)"
                                p={3}
                            >
                                <Text
                                    fontSize="xs"
                                    textTransform="uppercase"
                                    letterSpacing="0.2em"
                                    color="var(--muted)"
                                >
                                    Suggestions
                                </Text>
                                <Flex wrap="wrap" gap={2} mt={2}>
                                    {suggestions.map((suggestion) => (
                                        <Tag
                                            key={suggestion}
                                            size="md"
                                            rounded="full"
                                            border="1px solid"
                                            borderColor="var(--border)"
                                            color="var(--foreground)"
                                            cursor="pointer"
                                            onClick={() => {
                                                if (
                                                    localCategories.includes(
                                                        suggestion,
                                                    )
                                                )
                                                    return;
                                                setLocalCategories((prev) => [
                                                    ...prev,
                                                    suggestion,
                                                ]);
                                            }}
                                            _hover={{
                                                borderColor: "var(--accent)",
                                                color: "var(--accent)",
                                            }}
                                        >
                                            <TagLabel>{suggestion}</TagLabel>
                                        </Tag>
                                    ))}
                                </Flex>
                            </Box>
                            <Button
                                mt={4}
                                w="full"
                                bg="var(--accent)"
                                color="var(--background)"
                                _hover={{ opacity: 0.9 }}
                                isDisabled={!canSave || saving}
                                onClick={handleSave}
                            >
                                {saving ? "Saving…" : "Save categories"}
                            </Button>
                            <Box aria-live="polite">
                                {status === "success" && (
                                    <Text
                                        mt={2}
                                        fontSize="xs"
                                        color="var(--accent)"
                                    >
                                        Categories updated.
                                    </Text>
                                )}
                                {status === "error" && (
                                    <Text mt={2} fontSize="xs" color="tomato">
                                        Something went wrong—try again.
                                    </Text>
                                )}
                            </Box>
                        </Box>

                        {receipt.msgId && (
                            <Box>
                                <Text
                                    fontSize="xs"
                                    textTransform="uppercase"
                                    letterSpacing="0.2em"
                                    color="var(--muted)"
                                >
                                    Gmail source
                                </Text>
                                <Text
                                    as="a"
                                    href={`https://mail.google.com/mail/u/0/#inbox/${receipt.msgId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    color="var(--accent)"
                                >
                                    Open Gmail thread ↗
                                </Text>
                            </Box>
                        )}

                        <Box>
                            <Text
                                fontSize="xs"
                                textTransform="uppercase"
                                letterSpacing="0.2em"
                                color="var(--muted)"
                            >
                                Notes
                            </Text>
                            <Textarea
                                mt={2}
                                placeholder="Add reviewer notes"
                                defaultValue={receipt.notes}
                                rows={4}
                                borderColor="var(--border)"
                                bg="var(--surface-soft)"
                                color="var(--foreground)"
                                _focus={{
                                    borderColor: "var(--accent)",
                                    boxShadow: "none",
                                }}
                            />
                        </Box>
                    </Stack>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
}
