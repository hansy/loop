import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css"; // This will point to (default)/globals.css
import { ToastProvider } from "@/components/providers/ToastProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WalletProvider from "@/components/providers/WalletProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import NextTopLoader from "nextjs-toploader";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Loop",
  description: "A video player with a paywall",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <NextTopLoader />
        <WalletProvider>
          <NetworkProvider>
            <AuthProvider>
              <ToastProvider>
                <Navbar />
                <main className="flex-grow">{children}</main>
                <Footer />
              </ToastProvider>
            </AuthProvider>
          </NetworkProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
