"use client";

export type NodeId =
    | "source1"
    | "source2"
    | "source3"
    | "source4"
    | "source5"
    | "core"
    | "dest1"
    | "dest2"
    | "dest3"
    | "dest4";

export type GraphNode = {
    id: NodeId;
    kind: "source" | "core" | "dest";
    label?: string;
    pos: { x: number; y: number }; // normalized 0..1
    dim: { width: number; height: number };
};

export type GraphEdge = {
    id: string;
    from: NodeId;
    to: NodeId;
    kind: "sourceLink" | "wire";
    color: string;
    staggerIndex?: number;
};

// Layout tuned to mirror the reference composition.
export const NODES: GraphNode[] = [
    {
        id: "source1",
        kind: "source",
        pos: { x: 0.1, y: 0.2 },
        dim: { width: 50, height: 50 },
    },
    {
        id: "source2",
        kind: "source",
        pos: { x: 0.1, y: 0.36 },
        dim: { width: 50, height: 50 },
    },
    {
        id: "source3",
        kind: "source",
        pos: { x: 0.1, y: 0.52 },
        dim: { width: 50, height: 50 },
        label: "Gmail",
    },
    {
        id: "source4",
        kind: "source",
        pos: { x: 0.1, y: 0.68 },
        dim: { width: 50, height: 50 },
    },
    {
        id: "source5",
        kind: "source",
        pos: { x: 0.1, y: 0.84 },
        dim: { width: 50, height: 50 },
    },
    {
        id: "core",
        kind: "core",
        pos: { x: 0.45, y: 0.5 },
        dim: { width: 110, height: 110 },
        label: "FinOS Core",
    },
    {
        id: "dest1",
        kind: "dest",
        pos: { x: 0.82, y: 0.25 },
        dim: { width: 72, height: 72 },
    },
    {
        id: "dest2",
        kind: "dest",
        pos: { x: 0.82, y: 0.45 },
        dim: { width: 72, height: 72 },
    },
    {
        id: "dest3",
        kind: "dest",
        pos: { x: 0.82, y: 0.62 },
        dim: { width: 72, height: 72 },
    },
    {
        id: "dest4",
        kind: "dest",
        pos: { x: 0.82, y: 0.8 },
        dim: { width: 72, height: 72 },
    },
];

export const EDGES: GraphEdge[] = [
    {
        id: "source-link",
        from: "source3",
        to: "core",
        kind: "sourceLink",
        color: "rgba(255,255,255,0.35)",
    },
    {
        id: "wire-1",
        from: "core",
        to: "dest1",
        kind: "wire",
        color: "#60a5fa",
        staggerIndex: 0,
    },
    {
        id: "wire-2",
        from: "core",
        to: "dest2",
        kind: "wire",
        color: "#f87171",
        staggerIndex: 1,
    },
    {
        id: "wire-3",
        from: "core",
        to: "dest3",
        kind: "wire",
        color: "#fbbf24",
        staggerIndex: 2,
    },
    {
        id: "wire-4",
        from: "core",
        to: "dest4",
        kind: "wire",
        color: "#34d399",
        staggerIndex: 3,
    },
];
