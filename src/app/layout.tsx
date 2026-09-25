import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LeadQuizProvider } from "@/components/lead-quiz";
import { BackToTop } from "@/components/back-to-top";
import { SectionKeys } from "@/components/section-keys";
import { SITE_NAME, SITE_TAGLINE, SITE_URL, SITE_DESCRIPTION } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* Site-wide defaults only. Canonical, og:url and social titles are per page
   (src/lib/seo.ts): nested objects set here would be inherited whole by any
   page that doesn't override them. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} - Brand, Web and Growth`,
  description: SITE_DESCRIPTION,
  // Google Search Console HTML-tag verification. Inert until the env var is set.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#101417" },
  ],
};

/* Runs before first paint: applies a saved theme choice so a visitor who
   picked a theme never sees the other one flash. Stays tiny and wrapped in
   try/catch because storage can throw (private mode, blocked site data). */
const themeScript = `try{var t=localStorage.getItem("tca-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  slogan: SITE_TAGLINE,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The theme script sets data-theme before React hydrates.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-foreground"
        >
          Skip to content
        </a>
        <LeadQuizProvider>
          <Header />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </LeadQuizProvider>
        <BackToTop />
        <SectionKeys />
      </body>
    </html>
  );
}
