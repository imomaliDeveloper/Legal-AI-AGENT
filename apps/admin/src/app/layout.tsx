import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LEGAL AID AI - Boshqaruv Paneli',
  description: 'O‘zbekiston huquqiy axborot va media boshqaruv intellektual platformasi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
