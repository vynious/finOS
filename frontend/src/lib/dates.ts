export type DateInput = string | number | Date;

const DEFAULT_LOCALE = "en-US";
const DEFAULT_TIME_ZONE = "UTC";

export function formatDateTime(
    value: DateInput,
    options?: Intl.DateTimeFormatOptions,
) {
    return new Date(value).toLocaleString(DEFAULT_LOCALE, {
        timeZone: DEFAULT_TIME_ZONE,
        ...options,
    });
}

export function formatDate(
    value: DateInput,
    options?: Intl.DateTimeFormatOptions,
) {
    return new Date(value).toLocaleDateString(DEFAULT_LOCALE, {
        timeZone: DEFAULT_TIME_ZONE,
        ...options,
    });
}
