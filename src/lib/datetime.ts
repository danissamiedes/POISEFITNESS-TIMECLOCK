/**
 * All punch times are stored in UTC (Postgres timestamptz). The studio operates
 * in the Philippines, so every time shown to a user is formatted in Asia/Manila
 * (UTC+8) regardless of the server's or the device's own timezone.
 */
export const TIME_ZONE = "Asia/Manila";
export const TIME_ZONE_LABEL = "PHT";

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
});

// en-CA yields YYYY-MM-DD, which we use as a stable per-day key in Manila time.
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** e.g. "Aug 14, 2026, 3:45 PM" (Philippine time). */
export function formatDateTime(iso: string | Date): string {
  return dateTimeFmt.format(new Date(iso));
}

/** e.g. "Aug 14, 2026" (Philippine time). */
export function formatDate(iso: string | Date): string {
  return dateFmt.format(new Date(iso));
}

/** "YYYY-MM-DD" in Manila time — for grouping/comparing by calendar day. */
export function manilaDayKey(iso: string | Date): string {
  return dayKeyFmt.format(new Date(iso));
}
