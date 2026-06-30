import type { Metadata } from "next";
import { Montserrat, Fredoka } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query";
import { Toaster } from "@/components/ui/sonner";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fredoka = Fredoka({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Peluchel",
  description: "Los mejores peluches los encuentras aquí",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${fredoka.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
