import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wine Library",
  description: "Personal wine cellar catalog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
