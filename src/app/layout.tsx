import type { Metadata } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/components/CartProvider";
import { SupportChat } from "@/components/SupportChat";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Edmacars Store — Tecnología y Accesorios",
  description:
    "Tienda online de productos tecnológicos de primera mano. Smartphones, laptops, gaming y más. El Salvador.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${bebas.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <CartProvider>
            <Header />
            <div className="flex flex-1 flex-col">{children}</div>
            <Footer />
            <SupportChat />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}