import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";
import { APP_NAME, ACCENT } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${APP_NAME} Time Clock`,
  description: `Employee clock in / clock out for ${APP_NAME}.`,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: `${APP_NAME} Clock`,
  },
};

export const viewport: Viewport = {
  themeColor: ACCENT,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
