import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/app/providers";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Shotgun Notifier",
  description: "Real-time sale notifications for Shotgun.live organizers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={cn("font-sans antialiased", geist.variable)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
