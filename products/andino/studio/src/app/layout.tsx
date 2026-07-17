import type { Metadata } from "next";
import Link from "next/link";
import { geistMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Andino Studio",
  description: "Command Center for Drone Evolution",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/agent", label: "Agent" },
  { href: "/design", label: "Design" },
  { href: "/flight", label: "Flight" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <header className="h-[52px] shrink-0 border-b border-border-subtle bg-bg-void/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-accent-400 text-xl glow-text">◆</span>
              <span className="font-bold text-base text-text-primary">Andino Studio</span>
            </div>
            <nav className="flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200 relative after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-accent-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Connected
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
