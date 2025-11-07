export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

export type PublicUser = {
    email: string;
    name: string;
    active: boolean;
    last_synced?: number | null;
    google_sub?: string | null;
};

export type BackendReceipt = {
    msg_id?: string | null;
    owner?: string | null;
    issuer?: string | null;
    merchant?: string | null;
    amount?: number | null;
    currency?: string | null;
    categories?: (string | null)[] | null;
    timestamp?: number | null;
};

export type BackendReceiptList = {
    transactions: BackendReceipt[];
};

export type Receipt = {
    id: string;
    msgId?: string;
    owner: string;
    issuer?: string;
    merchant: string;
    amount: number;
    currency: string;
    categories: string[];
    timestamp: string; // ISO string for easier charting
    notes?: string;
};

export type ReceiptList = {
    transactions: Receipt[];
};

export type SyncState = "idle" | "syncing" | "success" | "error";

export type SyncStatus = {
    state: SyncState;
    lastSynced?: string;
    message?: string;
};

export type DateRange = "7d" | "30d" | "90d" | "365d" | "custom";

export type ReceiptFilters = {
    email: string;
    range: DateRange;
    category?: string;
    merchant?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
};

export type InsightSummary = {
    totalSpend: number;
    avgTicket: number;
    txCount: number;
    topMerchant?: {
        name: string;
        total: number;
    };
};

export type TimeSeriesPoint = {
    date: string;
    total: number;
};

export type CategorySlice = {
    label: string;
    value: number;
    percent: number;
};

export type Anomaly = {
    id: string;
    merchant: string;
    delta: number;
    description: string;
};
