import type { Receipt, ReceiptFilters, ReceiptList, SyncStatus } from "@/types";

const today = new Date();

function daysAgo(days: number) {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

export const sampleReceipts: Receipt[] = [
    {
        id: "tx-001",
        msgId: "msg-1001",
        owner: "finance@finos.app",
        issuer: "Ramp",
        merchant: "AWS",
        amount: 1823.55,
        currency: "USD",
        categories: ["Cloud", "Infrastructure"],
        timestamp: daysAgo(1),
        notes: "EC2 + RDS reserved instances",
    },
    {
        id: "tx-002",
        msgId: "msg-1002",
        owner: "finance@finos.app",
        issuer: "Stripe",
        merchant: "Figma",
        amount: 720.0,
        currency: "USD",
        categories: ["Design", "SaaS"],
        timestamp: daysAgo(3),
    },
    {
        id: "tx-003",
        msgId: "msg-1003",
        owner: "finance@finos.app",
        issuer: "Amex",
        merchant: "Notion",
        amount: 450.0,
        currency: "USD",
        categories: ["Productivity", "SaaS"],
        timestamp: daysAgo(5),
    },
    {
        id: "tx-004",
        msgId: "msg-1004",
        owner: "finance@finos.app",
        issuer: "Brex",
        merchant: "Google Cloud",
        amount: 2450.12,
        currency: "USD",
        categories: ["Cloud", "AI"],
        timestamp: daysAgo(6),
        notes: "Spend spike due to new LLM training job",
    },
    {
        id: "tx-005",
        msgId: "msg-1005",
        owner: "finance@finos.app",
        issuer: "Bill.com",
        merchant: "OpenAI",
        amount: 1360.4,
        currency: "USD",
        categories: ["AI", "Research"],
        timestamp: daysAgo(8),
    },
    {
        id: "tx-006",
        msgId: "msg-1006",
        owner: "finance@finos.app",
        issuer: "Brex",
        merchant: "Canva",
        amount: 215.0,
        currency: "USD",
        categories: ["Marketing", "SaaS"],
        timestamp: daysAgo(9),
    },
    {
        id: "tx-007",
        msgId: "msg-1007",
        owner: "finance@finos.app",
        issuer: "Bill.com",
        merchant: "Miro",
        amount: 320.0,
        currency: "USD",
        categories: ["Research", "SaaS"],
        timestamp: daysAgo(11),
    },
    {
        id: "tx-008",
        msgId: "msg-1008",
        owner: "finance@finos.app",
        issuer: "Amex",
        merchant: "Linear",
        amount: 190.0,
        currency: "USD",
        categories: ["Engineering", "SaaS"],
        timestamp: daysAgo(13),
    },
    {
        id: "tx-009",
        msgId: "msg-1009",
        owner: "finance@finos.app",
        issuer: "Ramp",
        merchant: "Slack",
        amount: 870.0,
        currency: "USD",
        categories: ["Productivity", "Collaboration"],
        timestamp: daysAgo(14),
    },
    {
        id: "tx-010",
        msgId: "msg-1010",
        owner: "finance@finos.app",
        issuer: "Stripe",
        merchant: "GitHub",
        amount: 640.0,
        currency: "USD",
        categories: ["Engineering", "SaaS"],
        timestamp: daysAgo(18),
    },
    {
        id: "tx-011",
        msgId: "msg-1011",
        owner: "finance@finos.app",
        issuer: "Bill.com",
        merchant: "Datadog",
        amount: 980.0,
        currency: "USD",
        categories: ["Observability", "SaaS"],
        timestamp: daysAgo(20),
    },
    {
        id: "tx-012",
        msgId: "msg-1012",
        owner: "finance@finos.app",
        issuer: "Amex",
        merchant: "Zoom",
        amount: 260.0,
        currency: "USD",
        categories: ["Collaboration", "SaaS"],
        timestamp: daysAgo(22),
    },
];

export const defaultReceiptList: ReceiptList = {
    transactions: sampleReceipts,
};

export const defaultFilters: ReceiptFilters = {
    email: "finance@finos.app",
    range: "30d",
};

export const sampleSyncStatus: SyncStatus = {
    state: "success",
    lastSynced: new Date(today.getTime() - 1000 * 60 * 37).toISOString(),
    message: "Processing completed via Gmail ingest",
};

export const sampleActivity = [
    {
        id: "act-001",
        title: "Sync completed",
        detail: "12 new receipts parsed via Gmail",
        timestamp: new Date(today.getTime() - 1000 * 60 * 40).toISOString(),
    },
    {
        id: "act-002",
        title: "Ollama parser update",
        detail: "LLM prompt refined for merchant detection",
        timestamp: new Date(today.getTime() - 1000 * 60 * 80).toISOString(),
    },
    {
        id: "act-003",
        title: "User onboarded",
        detail: "ops@finos.app connected Gmail",
        timestamp: new Date(today.getTime() - 1000 * 60 * 120).toISOString(),
    },
];
