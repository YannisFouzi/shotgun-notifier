import type { Metadata } from "next";
import { Geist } from "next/font/google";
import PlausibleProvider from "next-plausible";
import { Providers } from "@/app/providers";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const SITE_URL = "https://shotnotif.com";
const SITE_NAME = "ShotNotif";
const SITE_DESCRIPTION =
  "Real-time Telegram notifications for every Shotgun.live ticket sale. Set up in seconds.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <PlausibleProvider src="https://plausible.io/js/pa-pwf0XU3HSfvXbFXOZWc5n.js" />
      </head>
      <body className={cn("font-sans antialiased", geist.variable)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
