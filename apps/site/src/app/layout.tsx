import { SmoothScroll } from "@/ui/SmoothScroll";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted so builds never need the network.
const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces-latin-full-normal.woff2", style: "normal" },
    { path: "../fonts/fraunces-latin-full-italic.woff2", style: "italic" },
  ],
  weight: "560 640", // Frozen to the one instance the site uses: opsz 72, SOFT 100
  variable: "--font-serif",
  display: "swap",
});

const geist = localFont({
  src: "../fonts/geist-variable.woff2",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://roomie-site-sigma.vercel.app"),
  title: "Roomie · Make your place feel like home",
  description:
    "Roomie splits chores by effort, works around busy weeks, and does the reminding, so nobody has to play the parent. Coming soon on the App Store and Google Play.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable}`}>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
