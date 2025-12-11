import { Badge, Box, Flex, Stack, Text } from "@chakra-ui/react";
import { formatDateTime } from "@/lib/dates";

export type ActivityEvent = {
    id: string;
    title: string;
    detail: string;
    timestamp: string;
};

type ActivityLogProps = {
    entries: ActivityEvent[];
};

export function ActivityLog({ entries }: ActivityLogProps) {
    return (
        <Box
            border="1px solid"
            borderColor="var(--border)"
            bg="var(--surface)"
            rounded="2xl"
            p={5}
            color="var(--foreground)"
            fontSize="sm"
            boxShadow="var(--shadow)"
        >
            <Flex mb={4} align="center" justify="space-between">
                <Box>
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.1em"
                        color="var(--muted)"
                    >
                        Activity
                    </Text>
                    <Text as="h3" fontWeight="semibold" fontSize="md">
                        System timeline
                    </Text>
                </Box>
                <Badge
                    px={3}
                    py={1}
                    rounded="full"
                    border="1px solid"
                    borderColor="var(--border)"
                    bg="var(--surface-soft)"
                    color="var(--muted)"
                    fontSize="xs"
                >
                    {entries.length} events
                </Badge>
            </Flex>

            {entries.length === 0 ? (
                <Box
                    rounded="xl"
                    border="1px dashed"
                    borderColor="var(--border)"
                    bg="var(--surface-soft)"
                    p={4}
                    textAlign="center"
                    fontSize="xs"
                    color="var(--muted)"
                >
                    No ingest activity yet. Connect Gmail and run a sync to
                    populate this timeline.
                </Box>
            ) : (
                <Stack spacing={4}>
                    {entries.map((event, idx) => (
                        <Box key={event.id} position="relative" pl={5}>
                            {idx !== entries.length - 1 && (
                                <Box
                                    position="absolute"
                                    left="8px"
                                    top="16px"
                                    h="full"
                                    w="1px"
                                    bg="var(--border)"
                                />
                            )}
                            <Box
                                position="absolute"
                                left={0}
                                top={1}
                                w="10px"
                                h="10px"
                                rounded="full"
                                bg="rgba(52,211,153,0.8)"
                                boxShadow="0 0 6px rgba(16,185,129,0.8)"
                            />
                            <Stack spacing={1}>
                                <Text fontWeight="semibold" fontSize="sm">
                                    {event.title}
                                </Text>
                                <Text color="var(--muted)">{event.detail}</Text>
                                <Text fontSize="xs" color="var(--muted)">
                                    {formatDateTime(event.timestamp, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </Text>
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            )}
        </Box>
    );
}
