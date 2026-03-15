import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Providers } from "@/contexts/providers";

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

export const metadata: Metadata = {
  title: "CLE Perfumes | The Essence of Elegance",
  description: "Discover luxury fragrances crafted for the modern individual.",
};

import { Toaster } from "@/components/ui/sonner";
import { Chatbot } from "@/components/chat-bot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} scroll-smooth`}>
      <body className="antialiased font-sans bg-white text-black min-h-screen flex flex-col relative">
        <Providers>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <Chatbot />
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
