type Feedback = {
    id: string;
    title: string;
    detail: string;
    tone?: "info" | "success" | "warning" | "danger";
};

export function SystemFeedback({ notice }: { notice?: Feedback }) {
    if (!notice) return null;
    const palette: Record<NonNullable<Feedback["tone"]>, string> = {
        info: "border-sky-400/40 bg-sky-500/10 text-sky-200",
        success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
        warning: "border-amber-400/40 bg-amber-500/10 text-amber-200",
        danger: "border-rose-400/40 bg-rose-500/10 text-rose-200",
    };
    const tone = notice.tone ?? "info";
    return (
        <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-inner ${palette[tone]}`}
        >
            <p className="font-semibold">{notice.title}</p>
            <p>{notice.detail}</p>
        </div>
    );
}
