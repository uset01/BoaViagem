import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-manrope",
});

const DESCRICAO =
  "Calcule o lucro ou prejuízo do frete antes de aceitar, comparando com o piso mínimo da ANTT.";

export const metadata: Metadata = {
  metadataBase: new URL("https://boaviagem.app"),
  title: "Lucro na Estrada",
  description: DESCRICAO,
  openGraph: {
    title: "Lucro na Estrada",
    description: DESCRICAO,
    siteName: "Lucro na Estrada",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} font-sans antialiased bg-bg text-ink`}>
        {children}
      </body>
    </html>
  );
}
