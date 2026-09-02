import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Lab Debian Docker | ASJ XI-XII TKJ",
  description: "Lab interaktif Administrasi Sistem Jaringan TKJ: OS jaringan, DHCP, remote server, DNS, FTP, web, database, mail, proxy, hosting, keamanan, dan troubleshooting.",
  openGraph: {
    title: "Lab Debian Docker — ASJ XI-XII TKJ",
    description: "Praktik ASJ mendalam dari konsep ke server lab Docker yang aman, bertahap, dan interaktif.",
    type: "website",
    locale: "id_ID",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Lab Debian Docker untuk ASJ XI-XII TKJ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lab Debian Docker — ASJ XI-XII TKJ",
    description: "Praktik ASJ mendalam dengan Docker lab.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body>{children}</body>
    </html>
  );
}
