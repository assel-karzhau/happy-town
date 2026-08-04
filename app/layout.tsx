import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
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
  return <html lang="ru"><body>{children}</body></html>;
}
