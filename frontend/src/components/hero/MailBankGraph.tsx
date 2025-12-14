"use client";

import {
    Box,
    Tooltip,
    chakra,
    usePrefersReducedMotion,
} from "@chakra-ui/react";
import React, {
    forwardRef,
    type RefObject,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    createMailBankGraphConfig,
    type MailBankGraphConfig,
    type MailEdge,
    type MailNode,
} from "./mailBankGraphConfig";
import { useThemeMode } from "@/context/theme-mode-context";

export type MailBankGraphHandle = {
    startActivation: (source?: "cta" | "demo") => void;
};

type MailBankGraphProps = {
    bankCount?: 3 | 4;
    activationTrigger?: number;
};

type Phase = "idle" | "activating" | "active";

type Size = { width: number; height: number };

const useContainerSize = (ref: RefObject<HTMLElement | null>) => {
    const [size, setSize] = useState<Size>({ width: 0, height: 0 });

    useEffect(() => {
        if (!ref.current) return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            setSize({ width, height });
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [ref]);

    return size;
};

const anchorPoint = (
    node: MailNode,
    size: Size,
    side: "left" | "right",
): { x: number; y: number } => {
    const x =
        node.position.x * size.width +
        (side === "left" ? -node.size.width / 2 : node.size.width / 2);
    const y = node.position.y * size.height;
    return { x, y };
};

const bezierPath = (
    from: { x: number; y: number },
    to: { x: number; y: number },
) => {
    const dx = Math.abs(to.x - from.x);
    const cpOffset = Math.max(40, dx * 0.42);
    const c1 = { x: from.x + cpOffset, y: from.y };
    const c2 = { x: to.x - cpOffset, y: to.y };
    return `M ${from.x} ${from.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`;
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const GmailIcon = ({
    accent,
    tone,
}: {
    accent: string;
    tone: "light" | "dark";
}) => (
    <chakra.svg
        viewBox="0 0 64 64"
        width="42px"
        height="42px"
        fill="none"
        stroke="none"
    >
        <rect
            x="10"
            y="16"
            width="44"
            height="32"
            rx="6"
            fill={
                tone === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)"
            }
            stroke={accent}
            strokeWidth="2"
        />
        <path
            d="M12 18 L32 34 L52 18"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </chakra.svg>
);

const BankIcon = ({
    active,
    tone,
}: {
    active: boolean;
    tone: "light" | "dark";
}) => (
    <chakra.svg
        viewBox="0 0 64 64"
        width="32px"
        height="32px"
        fill="none"
        stroke="none"
    >
        <rect
            x="14"
            y="18"
            width="36"
            height="26"
            rx="7"
            fill={
                active
                    ? tone === "light"
                        ? "rgba(0,0,0,0.08)"
                        : "rgba(255,255,255,0.16)"
                    : tone === "light"
                      ? "rgba(0,0,0,0.04)"
                      : "rgba(255,255,255,0.08)"
            }
            stroke={
                tone === "light" ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.22)"
            }
            strokeWidth="2"
        />
        <rect
            x="20"
            y="24"
            width="8"
            height="14"
            rx="3"
            fill={
                tone === "light" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.22)"
            }
        />
        <rect
            x="32"
            y="24"
            width="8"
            height="14"
            rx="3"
            fill={
                tone === "light" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.22)"
            }
        />
    </chakra.svg>
);

const FinOSIcon = ({
    glow,
    tone,
}: {
    glow: boolean;
    tone: "light" | "dark";
}) => (
    <chakra.svg
        viewBox="0 0 64 64"
        width="46px"
        height="46px"
        fill="none"
        stroke="none"
    >
        <path
            d="M12 46 L32 14 L52 46 Z"
            fill={
                glow
                    ? "url(#finosGradient)"
                    : tone === "light"
                      ? "rgba(0,0,0,0.1)"
                      : "rgba(255,255,255,0.12)"
            }
            stroke={
                tone === "light" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.36)"
            }
            strokeWidth="2"
        />
        <defs>
            <linearGradient id="finosGradient" x1="12" y1="14" x2="52" y2="46">
                <stop
                    offset="0%"
                    stopColor={tone === "light" ? "#7c3aed" : "#8b5cf6"}
                    stopOpacity="0.85"
                />
                <stop
                    offset="100%"
                    stopColor={tone === "light" ? "#0ea5e9" : "#22d3ee"}
                    stopOpacity="0.75"
                />
            </linearGradient>
        </defs>
    </chakra.svg>
);

const NodeTile = ({
    node,
    isActive,
    isHovered,
    isGlow,
    onHover,
    onLeave,
    onTrigger,
}: {
    node: MailNode;
    isActive: boolean;
    isHovered: boolean;
    isGlow: boolean;
    onHover?: () => void;
    onLeave?: () => void;
    onTrigger?: () => void;
}) => {
    const isBank = node.kind === "bank";
    const { mode } = useThemeMode();
    const tone: "light" | "dark" = mode === "light" ? "light" : "dark";
    const interactive = node.kind !== "bank";
    const baseScale = isBank ? 1 : 1;
    const hoverScale = isBank ? 1.05 : isActive || isGlow ? 1.03 : 1.01;
    const accent =
        tone === "light" ? "rgba(124,58,237,0.78)" : "rgba(149,134,255,0.8)";

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (!interactive) return;
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onTrigger?.();
        }
    };

    const content =
        node.kind === "gmail" ? (
            <GmailIcon accent={accent} tone={tone} />
        ) : node.kind === "bank" ? (
            <BankIcon active={isActive} tone={tone} />
        ) : (
            <FinOSIcon glow={isGlow || isActive} tone={tone} />
        );

    const borderRadius =
        node.kind === "gmail"
            ? "22px"
            : node.kind === "finos"
              ? "20px"
              : "18px";

    const bg =
        node.kind === "gmail"
            ? tone === "light"
                ? "linear-gradient(160deg, rgba(255,255,255,0.9), rgba(238,240,255,0.85))"
                : "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(10,14,28,0.75))"
            : node.kind === "finos"
              ? tone === "light"
                  ? "linear-gradient(150deg, rgba(255,255,255,0.9), rgba(236,239,255,0.9))"
                  : "linear-gradient(150deg, rgba(255,255,255,0.08), rgba(9,11,20,0.85))"
              : isActive
                ? tone === "light"
                    ? "linear-gradient(150deg, rgba(0,0,0,0.06), rgba(246,248,255,0.95))"
                    : "linear-gradient(150deg, rgba(255,255,255,0.12), rgba(6,8,16,0.92))"
                : tone === "light"
                  ? "linear-gradient(150deg, rgba(0,0,0,0.04), rgba(247,249,255,0.9))"
                  : "linear-gradient(150deg, rgba(255,255,255,0.06), rgba(5,7,14,0.9))";

    const border =
        node.kind === "gmail"
            ? tone === "light"
                ? "1px solid rgba(124,58,237,0.5)"
                : "1px solid rgba(149,134,255,0.65)"
            : node.kind === "bank"
              ? isActive
                  ? tone === "light"
                      ? "1px solid rgba(0,0,0,0.12)"
                      : "1px solid rgba(255,255,255,0.16)"
                  : tone === "light"
                    ? "1px solid rgba(0,0,0,0.08)"
                    : "1px solid rgba(255,255,255,0.08)"
              : isGlow
                ? tone === "light"
                    ? "1px solid rgba(14,165,233,0.6)"
                    : "1px solid rgba(125,211,252,0.7)"
                : tone === "light"
                  ? "1px solid rgba(0,0,0,0.12)"
                  : "1px solid rgba(255,255,255,0.1)";

    const shadow =
        node.kind === "gmail"
            ? isActive
                ? tone === "light"
                    ? "0 20px 45px -30px rgba(124,58,237,0.4)"
                    : "0 18px 55px -28px rgba(96,165,250,0.55)"
                : "0 16px 48px -34px rgba(0,0,0,0.9)"
            : node.kind === "bank"
              ? isActive
                  ? tone === "light"
                      ? "0 14px 38px -30px rgba(0,0,0,0.25)"
                      : "0 16px 42px -32px rgba(0,0,0,0.85)"
                  : "0 12px 32px -30px rgba(0,0,0,0.8)"
              : isGlow
                ? tone === "light"
                    ? "0 18px 45px -30px rgba(14,165,233,0.45)"
                    : "0 18px 55px -28px rgba(34,211,238,0.8)"
                : "0 16px 48px -34px rgba(0,0,0,0.9)";

    return (
        <Tooltip label={node.label} openDelay={60} hasArrow>
            <Box
                role={interactive ? "button" : "group"}
                tabIndex={0}
                aria-label={node.label}
                onMouseEnter={onHover}
                onMouseLeave={onLeave}
                onFocus={onHover}
                onBlur={onLeave}
                onClick={interactive ? onTrigger : undefined}
                onKeyDown={handleKeyDown}
                position="relative"
                w={`${node.size.width}px`}
                h={`${node.size.height}px`}
                borderRadius={borderRadius}
                bg={bg}
                border={border}
                boxShadow={shadow}
                display="flex"
                alignItems="center"
                justifyContent="center"
                transition="transform 200ms ease, box-shadow 220ms ease, border-color 200ms ease, background 220ms ease"
                transform={`scale(${
                    node.kind === "bank"
                        ? isHovered
                            ? 1.05
                            : isActive
                              ? 1.03
                              : 1
                        : isActive
                          ? hoverScale
                          : baseScale
                })`}
                sx={{
                    outline: "none",
                    _focusVisible: {
                        boxShadow:
                            "0 0 0 2px rgba(125,211,252,0.55), 0 10px 40px rgba(0,0,0,0.45)",
                    },
                    "&::before":
                        node.kind === "gmail"
                            ? {
                                  content: '""',
                                  position: "absolute",
                                  inset: "-8px",
                                  borderRadius: "26px",
                                  background:
                                      tone === "light"
                                          ? "linear-gradient(145deg, rgba(124,58,237,0.3), rgba(96,165,250,0.2))"
                                          : "linear-gradient(145deg, rgba(149,134,255,0.35), rgba(96,165,250,0.18))",
                                  opacity: isActive || isGlow ? 0.9 : 0.55,
                                  filter: "blur(1px)",
                                  zIndex: 0,
                              }
                            : undefined,
                }}
            >
                <Box position="relative" zIndex={1}>
                    {content}
                </Box>
            </Box>
        </Tooltip>
    );
};

const MailBankGraph = forwardRef<MailBankGraphHandle, MailBankGraphProps>(
    ({ bankCount = 3, activationTrigger = 0 }, ref) => {
        const containerRef = useRef<HTMLDivElement | null>(null);
        const size = useContainerSize(containerRef);
        const prefersReducedMotion = usePrefersReducedMotion();
        const { mode } = useThemeMode();
        const isLight = mode === "light";
        const [phase, setPhase] = useState<Phase>("idle");
        const [drawnEdges, setDrawnEdges] = useState<Set<string>>(new Set());
        const [activatedBanks, setActivatedBanks] = useState<Set<string>>(
            new Set(),
        );
        const [finosGlow, setFinosGlow] = useState(false);
        const [hoveredNode, setHoveredNode] = useState<string | null>(null);
        const [pulse, setPulse] = useState(false);

        const activationTimers = useRef<number[]>([]);
        const pulseInterval = useRef<number | null>(null);
        const pulseTimeout = useRef<number | null>(null);
        const lastDemoTrigger = useRef<number>(0);

        const config: MailBankGraphConfig = useMemo(
            () => createMailBankGraphConfig(bankCount),
            [bankCount],
        );

        const renderSize: Size =
            size.width === 0 || size.height === 0
                ? { width: 960, height: 540 }
                : size;

        const nodeMap = useMemo(() => {
            const map = new Map<string, MailNode>();
            config.nodes.forEach((node) => map.set(node.id, node));
            return map;
        }, [config.nodes]);

        const gmailEdges = useMemo(
            () => config.edges.filter((edge) => edge.kind === "gmailToBank"),
            [config.edges],
        );
        const bankEdges = useMemo(
            () => config.edges.filter((edge) => edge.kind === "bankToFinOS"),
            [config.edges],
        );

        const clearTimers = () => {
            activationTimers.current.forEach((id) => clearTimeout(id));
            activationTimers.current = [];
            if (pulseInterval.current) {
                clearInterval(pulseInterval.current);
                pulseInterval.current = null;
            }
            if (pulseTimeout.current) {
                clearTimeout(pulseTimeout.current);
                pulseTimeout.current = null;
            }
        };

        const startActivation = useCallback(
            (source?: "cta" | "demo") => {
                void source;
                clearTimers();
                setPhase("activating");
                setDrawnEdges(new Set());
                setActivatedBanks(new Set());
                setFinosGlow(false);
                setPulse(false);

                const lineStagger = prefersReducedMotion ? 140 : 170;
                const drawDuration = prefersReducedMotion ? 220 : 620;

                gmailEdges.forEach((edge, idx) => {
                    const startAt = idx * lineStagger;
                    const drawId = window.setTimeout(() => {
                        setDrawnEdges((prev) => {
                            const next = new Set(prev);
                            next.add(edge.id);
                            return next;
                        });
                    }, startAt);
                    const bankId = window.setTimeout(
                        () => {
                            setActivatedBanks((prev) => {
                                const next = new Set(prev);
                                next.add(edge.to);
                                return next;
                            });
                        },
                        startAt + drawDuration - 120,
                    );
                    activationTimers.current.push(drawId, bankId);
                });

                const secondWaveStart =
                    gmailEdges.length * lineStagger + drawDuration + 180;

                bankEdges.forEach((edge, idx) => {
                    const startAt = secondWaveStart + idx * lineStagger;
                    const drawId = window.setTimeout(() => {
                        setDrawnEdges((prev) => {
                            const next = new Set(prev);
                            next.add(edge.id);
                            return next;
                        });
                    }, startAt);
                    activationTimers.current.push(drawId);
                });

                const finosAt =
                    secondWaveStart +
                    bankEdges.length * lineStagger +
                    drawDuration;

                const finosId = window.setTimeout(() => {
                    setFinosGlow(true);
                }, finosAt - 120);
                const doneId = window.setTimeout(() => {
                    setPhase("active");
                }, finosAt + 120);

                activationTimers.current.push(finosId, doneId);
            },
            [bankEdges, gmailEdges, prefersReducedMotion],
        );

        const triggerDemo = useCallback(() => {
            const now = Date.now();
            if (now - lastDemoTrigger.current < 800) return;
            lastDemoTrigger.current = now;
            startActivation("demo");
        }, [startActivation]);

        useImperativeHandle(
            ref,
            () => ({
                startActivation,
            }),
            [startActivation],
        );

        useEffect(() => {
            if (activationTrigger > 0) startActivation();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [activationTrigger]);

        useEffect(
            () => () => {
                clearTimers();
            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [],
        );

        useEffect(() => {
            if (prefersReducedMotion || phase !== "active") return;
            if (pulseInterval.current) {
                clearInterval(pulseInterval.current);
            }
            pulseInterval.current = window.setInterval(() => {
                setPulse(true);
                if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
                pulseTimeout.current = window.setTimeout(() => {
                    setPulse(false);
                }, 900);
            }, 9500);

            return () => {
                if (pulseInterval.current) {
                    clearInterval(pulseInterval.current);
                    pulseInterval.current = null;
                }
                if (pulseTimeout.current) {
                    clearTimeout(pulseTimeout.current);
                    pulseTimeout.current = null;
                }
            };
        }, [phase, prefersReducedMotion]);

        const pathForEdge = (edge: MailEdge) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return "";
            const fromAnchor =
                edge.kind === "gmailToBank" ? "right" : ("right" as const);
            const toAnchor = "left" as const;
            const start = anchorPoint(fromNode, renderSize, fromAnchor);
            const end = anchorPoint(toNode, renderSize, toAnchor);
            return bezierPath(start, end);
        };

        const edgeOpacity = (edge: MailEdge) => {
            const isDrawn = drawnEdges.has(edge.id);
            const isHovered =
                hoveredNode === edge.from ||
                hoveredNode === edge.to ||
                (hoveredNode === "gmail" && edge.kind === "gmailToBank");
            const activeBank =
                activatedBanks.has(edge.from) || activatedBanks.has(edge.to);

            const idleOpacity = edge.kind === "gmailToBank" ? 0.05 : 0.06;
            const base =
                phase === "idle"
                    ? idleOpacity
                    : isDrawn
                      ? phase === "activating"
                          ? 0.78
                          : 0.46
                      : 0.08;

            const boosted = isHovered ? 0.38 : activeBank ? 0.18 : 0;
            const pulsed = pulse && phase === "active" ? 0.08 : 0;

            return clamp(base + boosted + pulsed, 0, 1);
        };

        const edgeWidth = (edge: MailEdge) => {
            const base = edge.kind === "gmailToBank" ? 3 : 3.6;
            const hovered =
                hoveredNode === edge.from ||
                hoveredNode === edge.to ||
                (hoveredNode === "finos" && edge.to === "finos");
            return hovered ? base + 0.8 : base;
        };

        const dashProps = (edge: MailEdge) => {
            const isDrawn = drawnEdges.has(edge.id);
            if (prefersReducedMotion) {
                return {
                    style: {
                        transition: "opacity 240ms ease",
                    },
                };
            }
            return {
                pathLength: 1,
                strokeDasharray: 1,
                strokeDashoffset: isDrawn ? 0 : 1,
                style: {
                    transition: isDrawn
                        ? "stroke-dashoffset 680ms ease, opacity 220ms ease"
                        : "opacity 220ms ease",
                },
            };
        };

        const graphBg = "inherit";
        const gmailStroke = isLight
            ? "rgba(55,65,81,0.55)"
            : "rgba(210,214,230,0.8)";
        const bankStrokePaletteLight = [
            "#5b6c8a",
            "#5f7adb",
            "#4895e6",
            "#6c6ff7",
        ];

        return (
            <Box
                ref={containerRef}
                position="relative"
                w="full"
                h="full"
                bg={graphBg}
                border="none"
                borderRadius="0"
                overflow="hidden"
                boxShadow="none"
            >
                <Box
                    position="absolute"
                    inset={0}
                    pointerEvents="none"
                    bg="inherit"
                >
                    <svg
                        width="100%"
                        height="100%"
                        style={{ position: "absolute", inset: 0 }}
                        aria-hidden
                    >
                        {config.edges.map((edge) => {
                            const path = pathForEdge(edge);
                            if (!path) return null;
                            const dash = dashProps(edge);
                            const { style: dashStyle, ...dashRest } = dash;
                            const bankIdx =
                                edge.kind === "bankToFinOS"
                                    ? bankEdges.findIndex(
                                          (b) => b.id === edge.id,
                                      )
                                    : -1;
                            const strokeColor =
                                edge.kind === "gmailToBank"
                                    ? isLight
                                        ? gmailStroke
                                        : edge.color
                                    : isLight && bankIdx >= 0
                                      ? (bankStrokePaletteLight[bankIdx] ??
                                        bankStrokePaletteLight[
                                            bankStrokePaletteLight.length - 1
                                        ])
                                      : edge.color;
                            return (
                                <path
                                    key={edge.id}
                                    d={path}
                                    fill="none"
                                    stroke={strokeColor}
                                    strokeWidth={edgeWidth(edge)}
                                    strokeLinecap="round"
                                    opacity={edgeOpacity(edge)}
                                    {...dashRest}
                                    style={dashStyle}
                                />
                            );
                        })}
                    </svg>
                </Box>

                {config.nodes.map((node) => {
                    const left =
                        node.position.x * renderSize.width -
                        node.size.width / 2;
                    const top =
                        node.position.y * renderSize.height -
                        node.size.height / 2;

                    const isActiveBank =
                        node.kind === "bank" && activatedBanks.has(node.id);

                    const isHovered = hoveredNode === node.id;

                    const handleHover = () => {
                        setHoveredNode(node.id);
                        if (node.kind === "gmail" || node.kind === "finos") {
                            triggerDemo();
                        }
                    };

                    return (
                        <Box
                            key={node.id}
                            position="absolute"
                            left={left}
                            top={top}
                            style={{
                                transition:
                                    "transform 180ms ease, filter 180ms ease",
                            }}
                        >
                            <NodeTile
                                node={node}
                                isActive={
                                    node.kind === "gmail"
                                        ? isHovered || phase !== "idle"
                                        : node.kind === "finos"
                                          ? finosGlow || isHovered
                                          : isActiveBank || isHovered
                                }
                                isHovered={isHovered}
                                isGlow={node.kind === "finos" && finosGlow}
                                onHover={handleHover}
                                onLeave={() => setHoveredNode(null)}
                                onTrigger={
                                    node.kind === "gmail" ||
                                    node.kind === "finos"
                                        ? triggerDemo
                                        : undefined
                                }
                            />
                        </Box>
                    );
                })}
            </Box>
        );
    },
);

MailBankGraph.displayName = "MailBankGraph";

export default MailBankGraph;
