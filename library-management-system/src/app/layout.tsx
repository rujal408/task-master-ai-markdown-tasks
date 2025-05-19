import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { useSkipLink } from "@/lib/accessibility";
import { Container } from "@/components/ui/container";
import { ResponsiveNav } from "@/components/ui/responsive-nav";
import { ResponsiveTest } from "@/lib/responsive-test";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Library Management System",
  description: "A modern library management system built with Next.js",
};

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Books",
    href: "/books",
  },
  {
    title: "Members",
    href: "/members",
    roles: ["ADMIN", "LIBRARIAN"],
  },
  {
    title: "Transactions",
    href: "/transactions",
    roles: ["ADMIN", "LIBRARIAN"],
  },
  {
    title: "Admin",
    href: "/admin",
    roles: ["ADMIN"],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background`}>
        {/* Skip links for keyboard navigation */}
        <div className="sr-only focus:not-sr-only">
          <a
            href="#main-content"
            className="absolute left-2 top-2 z-50 rounded bg-primary px-4 py-2 text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Skip to main content
          </a>
          <a
            href="#main-nav"
            className="absolute left-2 top-16 z-50 rounded bg-primary px-4 py-2 text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Skip to navigation
          </a>
        </div>

        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <header role="banner" className="sticky top-0 z-40 w-full border-b bg-background">
              <Container>
                <div className="flex h-16 items-center justify-between">
                  <div className="flex items-center gap-6">
                    <a href="/" className="flex items-center space-x-2">
                      <span className="text-xl font-bold">Library</span>
                    </a>
                  </div>
                  <ResponsiveNav items={navItems} />
                </div>
              </Container>
            </header>

            <main id="main-content" role="main" tabIndex={-1} className="flex-1">
              <Container>{children}</Container>
            </main>

            <footer role="contentinfo" className="border-t py-6 md:py-0">
              <Container>
                <div className="flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                  <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Built with Next.js and Tailwind CSS
                  </p>
                </div>
              </Container>
            </footer>

            {process.env.NODE_ENV === "development" && <ResponsiveTest />}
          </div>
        </Providers>
      </body>
    </html>
  );
}
