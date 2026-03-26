import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veloura Cakes",
  description: "A polished cake shop management system demo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
