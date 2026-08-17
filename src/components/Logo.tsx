import { getBrandLogoUrl } from "@/lib/branding";

/**
 * POISE brand mark. Renders the studio's uploaded logo (set in Admin →
 * Settings → Branding), falling back to the bundled placeholder.
 * Server component — the logo URL is read from company_settings.
 */
export async function Logo({ className = "h-10 w-10" }: { className?: string }) {
  const src = await getBrandLogoUrl();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="POISE Fitness Studio"
      className={`${className} rounded-xl object-cover`}
    />
  );
}
