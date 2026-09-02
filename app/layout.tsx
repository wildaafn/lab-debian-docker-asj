import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Lab Debian Docker | ASJ XI TKJ",
  description: "Lab interaktif Debian Server dengan Docker: praktik, uji, kumpulkan XP, dan naik level untuk ASJ kelas XI TKJ.",
  openGraph: {
    title: "Lab Debian Docker — ASJ XI TKJ",
    description: "Praktik. Uji. Naik Level. Belajar administrasi Debian Server melalui lab Docker yang aman dan interaktif.",
    type: "website",
    locale: "id_ID",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Lab Debian Docker untuk ASJ XI TKJ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lab Debian Docker — ASJ XI TKJ",
    description: "Praktik. Uji. Naik Level.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
