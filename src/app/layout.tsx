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
  metadataBase: new URL("https://simsforhire.com"),
  title: {
    default: "Sims For Hire — Racing Simulator Rentals Miami & South Florida",
    template: "%s | Sims For Hire",
  },
  description:
    "South Florida's premier racing simulator rental company. Rent professional-grade sim rigs for corporate events, brand activations, and private experiences in Miami. Full-motion & non-motion simulators.",
  keywords: [
    "sim racing rental",
    "racing simulator rental",
    "rent racing simulator",
    "rent sim rig Miami",
    "Miami sim racing rental",
    "simulator rental near me",
    "South Florida simulator rental",
    "professional racing simulator rental",
    "iRacing simulator hire",
    "mobile sim cockpit delivery",
    "pro sim rig hire",
    "sim racing equipment rental",
    "full motion simulator rental",
    "corporate racing simulator event",
    "brand activation simulator",
    "racing simulator Miami",
    "Wynwood sim racing",
    "simulator hire Florida",
    "racing rig rental",
    "home sim racing setup rental",
  ],
  authors: [{ name: "Sims For Hire", url: "https://simsforhire.com" }],
  creator: "Sims For Hire",
  publisher: "Sims For Hire",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Sims For Hire — Racing Simulator Rentals Miami & South Florida",
    description:
      "Rent professional-grade racing simulators for events, brand activations, and corporate experiences in Miami & South Florida. Full-motion and non-motion rigs, fully staffed.",
    siteName: "Sims For Hire",
    type: "website",
    url: "https://simsforhire.com",
    locale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sims For Hire — Premium Racing Simulator Rentals in Miami",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sims For Hire — Racing Simulator Rentals Miami",
    description:
      "Rent professional-grade racing simulators for events, brand activations, and corporate experiences in Miami & South Florida.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://simsforhire.com",
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
