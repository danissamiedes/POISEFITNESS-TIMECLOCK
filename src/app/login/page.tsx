import { getBrandLogoUrl } from "@/lib/branding";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const logoUrl = await getBrandLogoUrl();
  return <LoginForm logoUrl={logoUrl} />;
}
