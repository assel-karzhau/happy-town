import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: { default: "Happy Town — управление учебным центром", template: "%s · Happy Town" },
  description: "Единая панель Happy Town для администратора, учителей и родителей.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
  openGraph: {
    title: "Happy Town — панель администратора",
    description: "Управление всей структурой учебного центра в одном интерфейсе.",
    images: [{ url: "/og-admin.png", width: 1200, height: 630, alt: "Happy Town — панель администратора" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-admin.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body className={geist.variable}>{children}</body></html>;
}
