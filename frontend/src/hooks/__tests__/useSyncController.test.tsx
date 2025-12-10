"use client";

import { act, renderHook } from "@testing-library/react";

import { useSyncController } from "../useSyncController";

vi.mock("@/lib/receipts", () => ({
    triggerReceiptSync: vi.fn().mockResolvedValue(true),
}));

describe("useSyncController", () => {
    const refresh = vi.fn().mockResolvedValue(true);

    beforeEach(() => {
        refresh.mockClear();
    });

    it("returns idle status when no email is present", () => {
        const { result } = renderHook(() =>
            useSyncController({
                email: null,
                profileLastSynced: null,
                loading: false,
                error: null,
                receipts: [],
                refresh,
            }),
        );

        expect(result.current.syncStatus.state).toBe("idle");
        expect(result.current.syncStatus.message).toContain("Connect Gmail");
    });

    it("transitions to success after retry", async () => {
        const { result } = renderHook(() =>
            useSyncController({
                email: "test@example.com",
                profileLastSynced: null,
                loading: false,
                error: null,
                receipts: [],
                refresh,
            }),
        );

        await act(async () => {
            await result.current.handleRetry();
        });

        expect(result.current.syncStatus.state).toBe("success");
        expect(refresh).toHaveBeenCalled();
    });
});
