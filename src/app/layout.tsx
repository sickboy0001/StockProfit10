import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/organisms/Header";
import { AuthProvider } from "@/contexts/AuthContext"; // ★ AuthProvider をインポート

import { Toaster } from "sonner"; // ★ sonnerのToasterをインポート

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "spt-v0.0",
  description: "spt stock-profit-ten",
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
        {/* ★ QueryClientプロバイダーでラップ */}
        <AuthProvider>
          {/* ★ AuthProvider でラップ */}
          <Header /> {/* ヘッダーコンポーネントをここに追加 */}
          <main className="flex-grow container mx-auto px-4">
            {/* メインコンテンツ用のラッパーを追加 (任意) */}
            {children}
            <Toaster /> {/* ★ Toaster を追加 */}
          </main>
          <footer className="border-t py-4 text-center text-sm text-muted-foreground">
            © 2025 StockProfit10
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
