/**
 * POISE brand mark. Renders /brand/poise-logo.svg.
 *
 * To use the studio's real logo: replace public/brand/poise-logo.svg (or add a
 * PNG and change the src below to e.g. "/brand/poise-logo.png"). Keeping the
 * same path updates the logo everywhere it appears.
 */
export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/poise-logo.svg"
      alt="POISE Fitness Studio"
      className={`${className} rounded-xl object-cover`}
    />
  );
}
