import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roomie Case Study",
  description:
    "Roomie: a product design case study by Pema Ghising. Designing a household app where fair isn't the same as equal.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
