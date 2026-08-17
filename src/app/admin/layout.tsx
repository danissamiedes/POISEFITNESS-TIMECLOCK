import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { AdminNav } from "@/components/AdminNav";
import { Logo } from "@/components/Logo";
import { APP_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Logo className="h-9 w-9" />
              <span className="text-lg font-semibold text-gray-900">
                {APP_NAME} Admin
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              Clock view
            </Link>
            <span className="hidden text-xs text-gray-400 sm:inline">
              {admin.full_name}
            </span>
            <SignOutButton />
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
