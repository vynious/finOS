"use client";

import {
    Box,
    Tooltip,
    chakra,
    usePrefersReducedMotion,
} from "@chakra-ui/react";
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    type GraphEdge,
    type GraphNode,
    EDGES,
    NODES,
} from "@/components/graphNodes";

export type GraphHeroHandle = {
    startActivation: (mode?: "cta" | "demo") => void;
};

type GraphHeroProps = {
    activationTrigger?: number;
};

type Phase = "idle" | "activating" | "active";

type Size = { width: number; height: number };

const svgStrokeWidth = (base: number, hovered: boolean) =>
    hovered ? base + 1 : base;

const getPoint = (
    node: GraphNode,
    size: Size,
    anchor: "left" | "right" | "center",
) => {
    const x =
        node.pos.x * size.width +
        (anchor === "left"
            ? -node.dim.width / 2
            : anchor === "right"
              ? node.dim.width / 2
              : 0);
    const y = node.pos.y * size.height;
    return { x, y };
};

const bezierPath = (
    from: { x: number; y: number },
    to: { x: number; y: number },
) => {
    const dx = Math.max(40, Math.abs(to.x - from.x) * 0.4);
    const c1 = { x: from.x + dx, y: from.y };
    const c2 = { x: to.x - dx, y: to.y };
    return `M ${from.x} ${from.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`;
};

const useSize = (ref: React.RefObject<HTMLElement | null>) => {
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

const NodeBox = ({
    node,
    isActive,
    onHover,
}: {
    node: GraphNode;
    isActive: boolean;
    onHover?: (id: string | null) => void;
}) => {
    const interactive = node.kind !== "source" ? true : node.id === "source3";
    const handleEnter = () => onHover?.(node.id);
    const handleLeave = () => onHover?.(null);
    const boxProps =
        node.kind === "core"
            ? {
                  borderRadius: "18px",
                  bg: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
                  w: `${node.dim.width}px`,
                  h: `${node.dim.height}px`,
                  transform: isActive ? "scale(1.02)" : "scale(1)",
              }
            : node.kind === "dest"
              ? {
                    borderRadius: "14px",
                    bg: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isActive
                        ? "0 14px 36px rgba(0,0,0,0.45)"
                        : "0 10px 24px rgba(0,0,0,0.3)",
                    w: `${node.dim.width}px`,
                    h: `${node.dim.height}px`,
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                }
              : {
                    borderRadius: "12px",
                    w: `${node.dim.width}px`,
                    h: `${node.dim.height}px`,
                };

    return (
        <Tooltip label={node.label} isDisabled={!node.label} openDelay={80}>
            <Box
                role={interactive ? "button" : "presentation"}
                tabIndex={interactive ? 0 : -1}
                aria-label={node.label ?? node.id}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onFocus={handleEnter}
                onBlur={handleLeave}
                display="flex"
                alignItems="center"
                justifyContent="center"
                transition="transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease"
                {...boxProps}
                sx={{
                    outline: "none",
                    _focusVisible: {
                        boxShadow: "0 0 0 2px rgba(139,92,246,0.45)",
                    },
                }}
            >
                {node.kind === "core" ? (
                    <Box
                        w="58px"
                        h="58px"
                        borderRadius="999px"
                        bg="white"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="#0a0b10"
                        boxShadow="0 10px 28px rgba(0,0,0,0.4)"
                    >
                        <chakra.span fontSize="20px" fontWeight="bold">
                            ▼
                        </chakra.span>
                    </Box>
                ) : node.kind === "dest" ? (
                    <chakra.span fontSize="18px" color="rgba(255,255,255,0.75)">
                        ▢
                    </chakra.span>
                ) : (
                    <chakra.span fontSize="18px" color="rgba(255,255,255,0.85)">
                        ●
                    </chakra.span>
                )}
            </Box>
        </Tooltip>
    );
};

const GraphHero = forwardRef<GraphHeroHandle, GraphHeroProps>(
    ({ activationTrigger = 0 }, ref) => {
        const containerRef = useRef<HTMLDivElement | null>(null);
        const size = useSize(containerRef);
        const prefersReducedMotion = usePrefersReducedMotion();
        const [phase, setPhase] = useState<Phase>("idle");
        const [hoveredDest, setHoveredDest] = useState<string | null>(null);
        const [visibleEdges, setVisibleEdges] = useState<Set<string>>(
            new Set(),
        );
        const [sourceVisible, setSourceVisible] = useState(false);

        const nodes = useMemo<GraphNode[]>(() => NODES, []);
        const edges = useMemo<GraphEdge[]>(() => EDGES, []);

        const activationTimeouts = useRef<number[]>([]);

        const clearTimers = () => {
            activationTimeouts.current.forEach((id) => clearTimeout(id));
            activationTimeouts.current = [];
        };

        const startActivation = useCallback(
            (mode?: "cta" | "demo") => {
                void mode;
                clearTimers();
                const nextVisible = new Set<string>();
                setSourceVisible(true);
                setPhase("activating");
                edges
                    .filter((e) => e.kind === "wire")
                    .forEach((edge) => {
                        const delay = (edge.staggerIndex ?? 0) * 180;
                        const id = window.setTimeout(() => {
                            nextVisible.add(edge.id);
                            setVisibleEdges(new Set(nextVisible));
                        }, delay);
                        activationTimeouts.current.push(id);
                    });
                const totalDelay =
                    (Math.max(...edges.map((e) => e.staggerIndex ?? 0)) + 1) *
                        180 +
                    700;
                const doneId = window.setTimeout(() => {
                    setPhase("active");
                }, totalDelay);
                activationTimeouts.current.push(doneId);
            },
            [edges],
        );

        useImperativeHandle(ref, () => ({
            startActivation,
        }));

        useEffect(() => {
            if (activationTrigger > 0) startActivation();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [activationTrigger]);

        useEffect(() => clearTimers, []);

        const edgePath = (edge: GraphEdge) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode || size.width === 0) return "";
            const fromAnchor =
                fromNode.kind === "core"
                    ? "right"
                    : fromNode.kind === "source"
                      ? "right"
                      : "left";
            const toAnchor = toNode.kind === "dest" ? "left" : "center";
            const start = getPoint(fromNode, size, fromAnchor);
            const end = getPoint(toNode, size, toAnchor);
            return bezierPath(start, end);
        };

        const edgeOpacity = (edge: GraphEdge) => {
            if (edge.kind === "sourceLink") {
                if (phase === "idle" && !sourceVisible) return 0;
                return phase === "active" ? 0.35 : 0.6;
            }
            const base =
                phase === "idle"
                    ? 0
                    : phase === "active"
                      ? 0.38
                      : visibleEdges.has(edge.id)
                        ? 0.8
                        : 0.05;
            if (hoveredDest && edge.to === hoveredDest)
                return Math.max(base, 0.9);
            return base;
        };

        const edgeStroke = (edge: GraphEdge) => edge.color;

        const edgeWidth = (edge: GraphEdge) => {
            const base = edge.kind === "sourceLink" ? 2 : 4;
            if (hoveredDest && edge.to === hoveredDest)
                return svgStrokeWidth(base, true);
            return svgStrokeWidth(base, false);
        };

        const dashProps = (edge: GraphEdge) => {
            if (prefersReducedMotion || edge.kind === "sourceLink") return {};
            const active = visibleEdges.has(edge.id);
            return active
                ? {
                      strokeDasharray: "800",
                      strokeDashoffset: 0,
                      transition: "stroke-dashoffset 0.7s ease",
                  }
                : { strokeDasharray: "800", strokeDashoffset: 800 };
        };

        return (
            <Box
                ref={containerRef}
                position="relative"
                w="full"
                h="full"
                bg="linear-gradient(135deg, rgba(255,255,255,0.04), rgba(7,8,10,0.8))"
                border="1px solid rgba(255,255,255,0.08)"
                borderRadius="xl"
                overflow="hidden"
                boxShadow="0 30px 80px rgba(0,0,0,0.55)"
                _before={{
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(60% 60% at 20% 20%, rgba(255,255,255,0.06), transparent)",
                    pointerEvents: "none",
                }}
            >
                <Box position="absolute" inset={0} pointerEvents="none">
                    <svg
                        width="100%"
                        height="100%"
                        style={{ position: "absolute", inset: 0 }}
                        aria-hidden
                    >
                        {edges.map((edge) => {
                            const path = edgePath(edge);
                            if (!path) return null;
                            return (
                                <path
                                    key={edge.id}
                                    d={path}
                                    fill="none"
                                    stroke={edgeStroke(edge)}
                                    strokeWidth={edgeWidth(edge)}
                                    strokeLinecap="round"
                                    opacity={edgeOpacity(edge)}
                                    style={{
                                        transition:
                                            "opacity 220ms ease, stroke-width 180ms ease",
                                        ...dashProps(edge),
                                    }}
                                />
                            );
                        })}
                    </svg>
                </Box>

                {nodes.map((node) => {
                    const left = node.pos.x * size.width - node.dim.width / 2;
                    const top = node.pos.y * size.height - node.dim.height / 2;
                    return (
                        <Box
                            key={node.id}
                            position="absolute"
                            left={left}
                            top={top}
                            style={{ transition: "transform 180ms ease" }}
                        >
                            <NodeBox
                                node={node}
                                isActive={
                                    phase !== "idle" &&
                                    (node.kind === "core" ||
                                        node.kind === "source" ||
                                        node.id === hoveredDest)
                                }
                                onHover={
                                    node.kind === "dest"
                                        ? setHoveredDest
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

GraphHero.displayName = "GraphHero";

export default GraphHero;
