import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SprintCargo - Cargo Van Delivery Marketplace",
    template: "%s | SprintCargo",
  },
  description:
    "Delivery platforms take up to 30% of every job. We charge drivers $99/month. That's it. Lower costs for drivers means lower prices for you.",
  keywords: [
    "cargo van delivery",
    "delivery marketplace",
    "freight delivery",
    "last mile delivery",
    "cargo van driver",
    "shipping marketplace",
  ],
  openGraph: {
    title: "SprintCargo - Cargo Van Delivery Marketplace",
    description:
      "Delivery platforms take up to 30% of every job. We charge drivers $99/month. That's it.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
