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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,500..700,100,0;1,9..144,500..700,100,0&family=Geist:wght@300;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
