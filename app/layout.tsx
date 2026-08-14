import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description = "Små steg för hemmet, jobbet och allt däremellan.";

  return {
    title: "Emels Tasks",
    description,
    manifest: "/manifest.webmanifest",
    openGraph: { title: "Emels Tasks", description, images: [`${origin}/og.png`] },
    twitter: { card: "summary_large_image", title: "Emels Tasks", description, images: [`${origin}/og.png`] },
  };
}

export const viewport: Viewport = { themeColor: "#f8f4ec", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="sv"><body>{children}</body></html>;
}
