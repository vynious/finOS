"use client";

import {
    Box,
    Flex,
    Stack,
    Switch,
    Text,
} from "@chakra-ui/react";

type SettingsPanelProps = {
    email: string;
};

export function SettingsPanel({ email }: SettingsPanelProps) {
    return (
        <Box
            rounded="2xl"
            border="1px solid"
            borderColor="var(--border)"
            bg="var(--surface)"
            p={5}
            color="var(--foreground)"
            fontSize="sm"
            boxShadow="var(--shadow)"
        >
            <Box mb={4}>
                <Text
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.3em"
                    color="var(--muted)"
                >
                    Controls
                </Text>
                <Text as="h3" fontSize="lg" fontWeight="semibold">
                    Account & Notifications
                </Text>
            </Box>
            <Stack spacing={4}>
                <Box
                    rounded="xl"
                    border="1px solid"
                    borderColor="var(--border)"
                    bg="var(--surface-soft)"
                    p={4}
                >
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.2em"
                        color="var(--muted)"
                    >
                        Connected Gmail
                    </Text>
                    <Text fontWeight="semibold">{email}</Text>
                    <Text fontSize="xs" color="var(--muted)">
                        OAuth token stored securely in Mongo tokens collection
                    </Text>
                </Box>

                {[
                    {
                        title: "Sync alerts",
                        subtitle: "Notify me if Gmail ingest fails",
                    },
                    {
                        title: "Budget nudges",
                        subtitle: "Slack me when category spend nears budget",
                    },
                    {
                        title: "Auto-tag AI",
                        subtitle: "Let Ollama suggest merchant categories",
                    },
                ].map((item) => (
                    <Flex
                        key={item.title}
                        align="center"
                        justify="space-between"
                        rounded="xl"
                        border="1px solid"
                        borderColor="var(--border)"
                        bg="var(--surface-soft)"
                        px={4}
                        py={3}
                    >
                        <Box>
                            <Text fontWeight="semibold">{item.title}</Text>
                            <Text fontSize="xs" color="var(--muted)">
                                {item.subtitle}
                            </Text>
                        </Box>
                        <Switch defaultChecked colorScheme="teal" size="md" />
                    </Flex>
                ))}
            </Stack>
        </Box>
    );
}
