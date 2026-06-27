import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tapp.",
  description: "NFC digital receipts for modern merchants"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
