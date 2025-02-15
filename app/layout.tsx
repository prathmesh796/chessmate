import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChessDataProvider } from "../context/ChessDataContext";
import type { AppProps } from "next/app"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chessmate",
  description: "A scrapper for your chess.com account.",
};

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-chess_bg`}>
        <ChessDataProvider>
          {children}
        </ChessDataProvider>
      </body>
    </html>
  );
}
