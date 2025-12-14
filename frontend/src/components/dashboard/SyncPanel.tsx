"use client";

import type { SyncStatus } from "@/types";
import { useMemo } from "react";
import { Badge, Box, Button, Flex, Text } from "@chakra-ui/react";

type SyncPanelProps = {
    status: SyncStatus;
    onRetry: () => void;
};

function formatRelative(date?: string) {
    if (!date) return "Never";
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 0) return "Just now";
    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
}

export function SyncPanel({ status, onRetry }: SyncPanelProps) {
    const statusColor = useMemo(() => {
        switch (status.state) {
            case "syncing":
                return "#f59e0b";
            case "error":
                return "#f43f5e";
            case "success":
                return "#10b981";
            default:
                return "var(--muted)";
        }
    }, [status.state]);

    const statusCopy: Record<SyncStatus["state"], string> = {
        idle: "Waiting for the next cron window. Keep this tab open to see new receipts appear.",
        syncing:
            "Background workers are querying Gmail and updating Mongo right now.",
        success:
            "Latest ingest finished successfully. Refresh to pull the newest receipts.",
        error: "We hit an issue calling Gmail or Ollama. Check logs and retry once resolved.",
    };

    const cadence =
        status.state === "syncing"
            ? "Running now"
            : "Every ~60s (configurable)";

    return (
        <Box
            rounded="2xl"
            border="1px solid"
            borderColor="var(--border)"
            bg="var(--surface)"
            p={5}
            boxShadow="var(--shadow)"
        >
            <Flex mb={4} align="center" justify="space-between">
                <Box>
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.3em"
                        color="var(--muted)"
                    >
                        Gmail ingest
                    </Text>
                    <Text as="h3" fontSize="lg" fontWeight="semibold">
                        Sync orchestrator
                    </Text>
                </Box>
                <Badge
                    px={4}
                    py={1}
                    rounded="full"
                    border="1px solid"
                    borderColor="var(--border)"
                    bg="var(--surface-soft)"
                    color={statusColor}
                    fontWeight="semibold"
                    fontSize="xs"
                >
                    {status.state.toUpperCase()}
                </Badge>
            </Flex>
            <Text fontSize="sm" color="var(--muted)">
                {status.message ?? statusCopy[status.state]}
            </Text>
            <Flex
                mt={4}
                wrap="wrap"
                align="center"
                gap={4}
                fontSize="sm"
                color="var(--muted)"
            >
                <Box>
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.2em"
                        color="var(--muted)"
                    >
                        Last synced
                    </Text>
                    <Text color="var(--foreground)">
                        {formatRelative(status.lastSynced)}
                    </Text>
                </Box>
                <Box>
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.2em"
                        color="var(--muted)"
                    >
                        Next window
                    </Text>
                    <Text color="var(--foreground)">{cadence}</Text>
                </Box>
                <Button
                    ml="auto"
                    variant="outline"
                    borderColor="var(--border)"
                    bg="var(--surface-soft)"
                    color="var(--foreground)"
                    _hover={{
                        borderColor: "var(--accent)",
                        color: "var(--accent)",
                    }}
                    onClick={onRetry}
                    size="sm"
                >
                    Refresh data
                </Button>
            </Flex>
        </Box>
    );
}
