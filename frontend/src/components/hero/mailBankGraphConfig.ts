export type MailNodeKind = "gmail" | "bank" | "finos";

export type MailNode = {
    id: string;
    kind: MailNodeKind;
    label: string;
    position: { x: number; y: number }; // normalized 0..1
    size: { width: number; height: number };
};

export type MailEdge = {
    id: string;
    from: string;
    to: string;
    kind: "gmailToBank" | "bankToFinOS";
    color: string;
};

export type MailBankGraphConfig = {
    nodes: MailNode[];
    edges: MailEdge[];
};

const bankYPositions: Record<3 | 4, number[]> = {
    3: [0.32, 0.5, 0.68],
    4: [0.28, 0.46, 0.64, 0.8],
};

/**
 * Deterministic layout for the Gmail -> Banks -> FinOS wiring diagram.
 */
export const createMailBankGraphConfig = (
    bankCount: 3 | 4 = 3,
): MailBankGraphConfig => {
    const clampedCount = bankCount === 4 ? 4 : 3;
    const banks: MailNode[] = bankYPositions[clampedCount].map((y, index) => ({
        id: `bank-${index + 1}`,
        kind: "bank",
        label: `Bank ${String.fromCharCode(65 + index)}`,
        position: { x: 0.52, y },
        size: { width: 70, height: 70 },
    }));

    const nodes: MailNode[] = [
        {
            id: "gmail",
            kind: "gmail",
            label: "Gmail",
            position: { x: 0.22, y: 0.5 },
            size: { width: 88, height: 88 },
        },
        ...banks,
        {
            id: "finos",
            kind: "finos",
            label: "FinOS",
            position: { x: 0.8, y: 0.5 },
            size: { width: 102, height: 102 },
        },
    ];

    const edges: MailEdge[] = [
        ...banks.map<MailEdge>((bank) => ({
            id: `gmail-${bank.id}`,
            from: "gmail",
            to: bank.id,
            kind: "gmailToBank",
            color: "rgba(210,214,230,0.8)",
        })),
        ...banks.map<MailEdge>((bank, idx) => ({
            id: `${bank.id}-finos`,
            from: bank.id,
            to: "finos",
            kind: "bankToFinOS",
            color: idx === 1 ? "#7dd3fc" : idx === 2 ? "#a5b4fc" : "#b5e4ff",
        })),
    ];

    return { nodes, edges };
};
