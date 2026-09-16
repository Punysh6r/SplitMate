import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import { SplitMateProvider } from "@/lib/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SplitMate — divide gastos con amigos",
  description:
    "Crea grupos, registra gastos compartidos y liquida cuentas con el mínimo de transferencias.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-clip">
        <SplitMateProvider>
          <AppHeader />
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
        </SplitMateProvider>
      </body>
    </html>
  );
}
