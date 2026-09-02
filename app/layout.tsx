import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lab Debian Docker | ASJ XI TKJ",
  description: "Modul praktik Debian Server ringan dengan Docker untuk ASJ kelas XI TKJ.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
