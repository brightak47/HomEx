import type { Metadata, Viewport } from "next";
import { Cinzel, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HomEx — Movie Premieres at Home",
  description: "The first public online premiere. Tickets, live watch parties, and cinematic discovery.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#070709",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${cinzel.variable} antialiased`}>{children}</body>
    </html>
  );
}
