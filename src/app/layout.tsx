import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saladas no Pote + Molhos Irresistíveis",
  description: "Área de receitas — acesso exclusivo pra quem comprou.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
