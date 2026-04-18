import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Récap Quotidien",
  description: "Synthèse quotidienne de tes réseaux sociaux",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="header">
          <div className="container header-inner">
            <Link href="/" className="brand">Récap Quotidien</Link>
            <nav className="nav">
              <Link href="/">Aujourd&apos;hui</Link>
              <Link href="/historique">Historique</Link>
              <Link href="/sources">Sources</Link>
            </nav>
          </div>
        </header>
        <main className="container main">{children}</main>
        <footer className="footer">
          <div className="container">Généré avec Claude Haiku 4.5 · Données locales (SQLite)</div>
        </footer>
      </body>
    </html>
  );
}
