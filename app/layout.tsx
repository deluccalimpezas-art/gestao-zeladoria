import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Secretaria DeLucca - Gestão Inteligente",
    description: "Sistema de gestão de condomínios e RH",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className="antialiased bg-slate-900 text-slate-200">
                {children}
            </body>
        </html>
    );
}
