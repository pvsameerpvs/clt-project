import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Providers } from "@/contexts/providers";
import { getSiteUrl } from "@/lib/public-config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const siteUrl = getSiteUrl();
const brandLogoPath = "/logo-cle-favicon.png";
const brandLogoUrl = `${siteUrl}${brandLogoPath}`;
const siteDescription = "Discover luxury fragrances crafted for the modern individual.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "CLE Perfume",
  title: "CLE Perfume | The Essence of Elegance",
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      {
        url: brandLogoPath,
        type: "image/png",
      },
    ],
    shortcut: brandLogoPath,
    apple: [
      {
        url: brandLogoPath,
        type: "image/png",
      },
    ],
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "CLE Perfume",
    title: "CLE Perfume | The Essence of Elegance",
    description: siteDescription,
    images: [
      {
        url: brandLogoPath,
        width: 873,
        height: 609,
        alt: "CLE Perfume logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "CLE Perfume | The Essence of Elegance",
    description: siteDescription,
    images: [brandLogoPath],
  },
  manifest: "/manifest.webmanifest",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CLE Perfume",
  url: siteUrl,
  logo: brandLogoUrl,
  image: brandLogoUrl,
  sameAs: [],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CLE Perfume",
  url: siteUrl,
  publisher: {
    "@type": "Organization",
    name: "CLE Perfume",
    logo: {
      "@type": "ImageObject",
      url: brandLogoUrl,
    },
  },
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} scroll-smooth`}>
      <body className="antialiased font-sans bg-white text-black min-h-screen flex flex-col relative">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd, websiteJsonLd]),
          }}
        />
        <Providers>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          {/* <Chatbot /> */}
          <Toaster  
            position="bottom-right" 
            toastOptions={{ 
              classNames: {
                toast: '!bg-black !text-white !rounded-none !border-black p-4 border',
                title: 'text-white font-serif tracking-wide text-base',
                description: '!text-neutral-400 mt-1',
                actionButton: '!bg-white !text-black rounded-none uppercase tracking-widest text-[10px] font-bold px-3 py-4 hover:bg-neutral-200'
              }
            }} 
          />
        </Providers>
      </body>
    </html>
  );
}
