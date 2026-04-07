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
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} font-sans antialiased bg-[#0A0A0A] text-white min-h-screen`}
      >
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://simsforhire.com/images/simsforhire-logo-white.png"
              alt="SimsForHire"
              className="h-10 w-auto sm:h-12"
            />
          </div>

          {children}
        </div>
      </body>
    </html>
  );
}
