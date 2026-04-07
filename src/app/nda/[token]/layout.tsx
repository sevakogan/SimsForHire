import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NDA — SimsForHire",
  description:
    "Non-Disclosure Agreement for SimsForHire contractors and team members.",
  robots: { index: false, follow: false },
};

export default function NdaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} font-sans antialiased bg-[#F5F5F7] min-h-screen`}
      >
        {/* Top nav bar */}
        <header className="sticky top-0 z-50 bg-[#1D1D1F] px-4 py-3 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://simsforhire.com/images/simsforhire-logo-white.png"
            alt="SimsForHire"
            className="h-8 w-auto"
          />
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
