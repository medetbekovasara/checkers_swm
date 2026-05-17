import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chaos Checkers",
  description: "AI-powered multiplayer checkers platform with swap and chaos mechanics."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
