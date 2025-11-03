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

const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://listingsignal.com";
const ogImageUrl = `${rawSiteUrl}/logo.png`;
const defaultTitle = "Listing Signal™ | Data-Backed Timing for Home Sellers";
const defaultDescription =
  "Listing Signal™ analyzes live market data to reveal when and how to list your home for maximum value. Get a personalized timing score and strategy in minutes.";

export const metadata: Metadata = {
  metadataBase: new URL(rawSiteUrl),
  title: {
    default: defaultTitle,
    template: "%s | Listing Signal™",
  },
  description: defaultDescription,
  keywords: [
    "Listing Signal",
    "home selling timing",
    "real estate analytics",
    "sell my house",
    "real estate data",
    "home valuation report",
    "listing strategy",
  ],
  authors: [{ name: "Listing Signal" }],
  creator: "Listing Signal",
  publisher: "Listing Signal",
  category: "Real Estate",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: rawSiteUrl,
    siteName: "Listing Signal",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Listing Signal dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
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
