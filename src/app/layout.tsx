import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SimsForHire",
    template: "%s | SimsForHire",
  },
  description: "Premium sourcing & white-glove delivery. Your trusted partner for quality products at the best prices.",
  openGraph: {
    title: "SimsForHire",
    description: "Premium sourcing & white-glove delivery. Your trusted partner for quality products at the best prices.",
    siteName: "SimsForHire",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SimsForHire",
    description: "Premium sourcing & white-glove delivery. Your trusted partner for quality products at the best prices.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
