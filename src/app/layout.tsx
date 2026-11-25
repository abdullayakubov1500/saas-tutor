import type { Metadata } from "next";
import { Great_Vibes, Cormorant_Garamond, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-great-vibes",
  display: "swap",
});

const headingFallback = Cormorant_Garamond({
  weight: ["600", "700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-heading-fallback",
  display: "swap",
});

const bodyFallback = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body-fallback",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Slovo AI — Персональный AI-репетитор по русскому языку",
  description:
    "Интеллектуальная SaaS-платформа для изучения русского языка: от начального до экспертного уровня с проверкой грамматики, квизами, произношением и аудированием.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${greatVibes.variable} ${headingFallback.variable} ${bodyFallback.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
