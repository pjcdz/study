import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyApp - Resúmenes y Flashcards",
  description: "Genera resúmenes y flashcards de tus documentos y textos",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" }
    ],
    shortcut: [
      { url: "/logo.png", type: "image/png" }
    ],
    apple: [
      { url: "/logo.png", type: "image/png" }
    ],
    other: [
      {
        rel: "icon",
        url: "/logo.png",
      }
    ]
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
