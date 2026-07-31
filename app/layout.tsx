import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: { default: "Happy Town — Электронный дневник", template: "%s · Happy Town" },
  description: "Электронный дневник и система отслеживания прогресса учебного центра Happy Town.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
  openGraph: {
    title: "Happy Town — Электронный дневник",
    description: "Учимся. Растём. Видим прогресс.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Happy Town — Электронный дневник" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body className={geist.variable}>{children}</body></html>;
}
