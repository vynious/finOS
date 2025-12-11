import { useCurrency } from "@/context/currency-context";
import type {
    Anomaly,
    CategorySlice,
    DateRange,
    InsightSummary,
    TimeSeriesPoint,
} from "@/types";
import {
    Box,
    Flex,
    Grid,
    GridItem,
    SimpleGrid,
    Stack,
    Text,
} from "@chakra-ui/react";
import { formatDate } from "@/lib/dates";

type InsightsGridProps = {
    summary: InsightSummary;
    series: TimeSeriesPoint[];
    categories: CategorySlice[];
    anomalies: Anomaly[];
    email?: string | null;
    range: DateRange;
};

const rangeLabels: Record<DateRange, string> = {
    "7d": "last 7 days",
    "30d": "last 30 days",
    "90d": "last 90 days",
    "365d": "last year",
    custom: "custom range",
};

function buildPath(points: TimeSeriesPoint[]) {
    if (!points.length) return "";
    const values = points.map((p) => p.total);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    return points
        .map((point, idx) => {
            const x = (idx / (points.length - 1 || 1)) * 100;
            const y = 100 - ((point.total - min) / range) * 100;
            return `${idx === 0 ? "M" : "L"} ${x},${y}`;
        })
        .join(" ");
}

function donutBg(slices: CategorySlice[]) {
    if (!slices.length) return "conic-gradient(#1f2937 0deg 360deg)";
    let cursor = 0;
    const segments = slices.map((slice, idx) => {
        const start = cursor;
        const sweep = (slice.percent / 100) * 360;
        cursor += sweep;
        const colors = ["#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa"];
        const color = colors[idx % colors.length];
        return `${color} ${start}deg ${start + sweep}deg`;
    });
    return `conic-gradient(${segments.join(",")})`;
}

export function InsightsGrid({
    summary,
    series,
    categories,
    anomalies,
    email,
    range,
}: InsightsGridProps) {
    const { format, currency } = useCurrency();
    const rangeLabel = rangeLabels[range] ?? range;

    return (
        <Grid templateColumns={{ base: "1fr", lg: "repeat(12, 1fr)" }} gap={6}>
            <GridItem colSpan={12}>
                <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
                    {[
                        {
                            label: "Total spend",
                            value: format(summary.totalSpend, currency),
                            badge: email
                                ? `Account: ${email}`
                                : "Connect Gmail to ingest",
                        },
                        {
                            label: "Transactions",
                            value: summary.txCount.toString(),
                            badge:
                                summary.txCount === 1
                                    ? "1 receipt this period"
                                    : `${summary.txCount} receipts ${rangeLabel}`,
                        },
                        {
                            label: "Avg ticket",
                            value: format(summary.avgTicket, currency),
                            badge: `Average over ${rangeLabel}`,
                        },
                        {
                            label: "Top merchant",
                            value: summary.topMerchant?.name ?? "—",
                            badge: summary.topMerchant
                                ? format(summary.topMerchant.total, currency)
                                : "No spend recorded",
                        },
                    ].map((metric) => (
                        <Box
                            key={metric.label}
                            rounded="2xl"
                            border="1px solid"
                            borderColor="border.subtle"
                            bg="bg.elevated"
                            px={5}
                            py={4}
                            boxShadow="var(--shadow)"
                        >
                            <Text
                                fontSize="xs"
                                textTransform="uppercase"
                                letterSpacing="0.2em"
                                color="text.muted"
                            >
                                {metric.label}
                            </Text>
                            <Text
                                mt={2}
                                noOfLines={1}
                                fontSize="2xl"
                                fontWeight="semibold"
                                color="text.primary"
                            >
                                {metric.value}
                            </Text>
                            <Text fontSize="sm" color="accent.primary">
                                {metric.badge}
                            </Text>
                        </Box>
                    ))}
                </SimpleGrid>
            </GridItem>

            <GridItem colSpan={{ base: 12, lg: 8 }}>
                <Box
                    rounded="3xl"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="bg.elevated"
                    p={6}
                    boxShadow="var(--shadow)"
                >
                    <Flex
                        mb={4}
                        align="center"
                        justify="space-between"
                        fontSize="sm"
                    >
                        <Box>
                            <Text
                                fontSize="xs"
                                textTransform="uppercase"
                                letterSpacing="0.2em"
                                color="text.muted"
                            >
                                Spend over time
                            </Text>
                            <Text
                                as="h3"
                                fontSize="lg"
                                fontWeight="semibold"
                                color="text.primary"
                            >
                                Gmail-ingested receipts
                            </Text>
                        </Box>
                        <Text color="text.muted">
                            Brush to zoom · UTC aligned
                        </Text>
                    </Flex>
                    <Box
                        as="svg"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        h="14rem"
                        w="full"
                        color="var(--accent)"
                    >
                        <defs>
                            <linearGradient
                                id="areaGradient"
                                x1="0"
                                x2="0"
                                y1="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#34d399"
                                    stopOpacity="0.5"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#34d399"
                                    stopOpacity="0"
                                />
                            </linearGradient>
                        </defs>
                        <path
                            d={`${buildPath(series)} L 100,100 L 0,100 Z`}
                            fill="url(#areaGradient)"
                            stroke="none"
                        />
                        <path
                            d={buildPath(series)}
                            fill="none"
                            stroke="#34d399"
                            strokeWidth="2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                    </Box>
                    <Flex
                        mt={4}
                        justify="space-between"
                        fontSize="xs"
                        color="text.muted"
                    >
                        {series.slice(0, 4).map((point) => (
                            <Text as="span" key={point.date}>
                                {formatDate(point.date, {
                                    month: "short",
                                    day: "numeric",
                                })}
                            </Text>
                        ))}
                    </Flex>
                </Box>
            </GridItem>

            <GridItem colSpan={{ base: 12, lg: 4 }}>
                <Box
                    rounded="3xl"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="bg.elevated"
                    p={6}
                    boxShadow="var(--shadow)"
                >
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.2em"
                        color="text.muted"
                    >
                        Category mix
                    </Text>
                    <Stack mt={4} spacing={4} align="center">
                        <Box
                            position="relative"
                            w="10rem"
                            h="10rem"
                            rounded="full"
                            style={{ backgroundImage: donutBg(categories) }}
                        >
                            <Box
                                position="absolute"
                                inset={5}
                                rounded="full"
                                bg="var(--surface-soft)"
                                textAlign="center"
                            >
                                <Text
                                    mt={6}
                                    fontSize="xs"
                                    textTransform="uppercase"
                                    color="var(--muted)"
                                >
                                    Top
                                </Text>
                                <Text
                                    fontSize="lg"
                                    fontWeight="semibold"
                                    color="var(--foreground)"
                                >
                                    {categories[0]?.label ?? "—"}
                                </Text>
                                <Text fontSize="sm" color="var(--muted)">
                                    {categories[0]
                                        ? `${categories[0].percent.toFixed(1)}%`
                                        : "0%"}
                                </Text>
                            </Box>
                        </Box>
                        <Stack
                            as="ul"
                            spacing={2}
                            w="full"
                            fontSize="sm"
                            color="text.primary"
                        >
                            {categories.slice(0, 4).map((slice, idx) => (
                                <Flex
                                    as="li"
                                    key={slice.label}
                                    align="center"
                                    justify="space-between"
                                >
                                    <Flex align="center" gap={2}>
                                        <Box
                                            w={2}
                                            h={2}
                                            rounded="full"
                                            bg={
                                                [
                                                    "#34d399",
                                                    "#60a5fa",
                                                    "#fbbf24",
                                                    "#f472b6",
                                                ][idx % 4]
                                            }
                                        />
                                        <Text>{slice.label}</Text>
                                    </Flex>
                                    <Text color="var(--muted)">
                                        {slice.percent.toFixed(1)}%
                                    </Text>
                                </Flex>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            </GridItem>

            <GridItem colSpan={12}>
                <Box
                    rounded="3xl"
                    border="1px solid"
                    borderColor="border.subtle"
                    bg="bg.elevated"
                    p={6}
                    boxShadow="var(--shadow)"
                >
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.2em"
                        color="text.muted"
                    >
                        Anomaly alerts
                    </Text>
                    <Stack mt={4} spacing={3}>
                        {anomalies.length ? (
                            anomalies.map((alert) => (
                                <Box
                                    key={alert.id}
                                    rounded="2xl"
                                    border="1px solid"
                                    borderColor="rgba(245, 158, 11, 0.4)"
                                    bg="rgba(245, 158, 11, 0.15)"
                                    px={4}
                                    py={3}
                                    fontSize="sm"
                                    color="var(--foreground)"
                                >
                                    <Text fontWeight="semibold">
                                        {alert.merchant}
                                    </Text>
                                    <Text>{alert.description}</Text>
                                </Box>
                            ))
                        ) : (
                            <Text fontSize="sm" color="var(--muted)">
                                No spikes detected for the selected window.
                            </Text>
                        )}
                    </Stack>
                </Box>
            </GridItem>
        </Grid>
    );
}
