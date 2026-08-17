/**
 * White-label branding, driven by build-time env vars so one codebase can
 * serve multiple companies. Each deployment (Vercel project) sets its own:
 *   NEXT_PUBLIC_APP_NAME      e.g. "BOOKKEEPINGPOINT"   (default "POISE")
 *   NEXT_PUBLIC_ACCENT        hex, e.g. "#2563eb"       (default pink #db2777)
 *   NEXT_PUBLIC_ACCENT_HOVER  hex, e.g. "#1d4ed8"
 *   NEXT_PUBLIC_ACCENT_LIGHT  hex, e.g. "#eff6ff"
 *
 * The accent hexes are also consumed by tailwind.config.ts for CSS utilities;
 * ACCENT here is for places that need the raw value at runtime (e.g. maps).
 * NEXT_PUBLIC_* values are inlined at build, so these work on client & server.
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "POISE";
export const ACCENT = process.env.NEXT_PUBLIC_ACCENT?.trim() || "#db2777";
