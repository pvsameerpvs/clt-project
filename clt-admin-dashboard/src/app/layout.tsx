import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "CLE Perfume Dashboard",
  description: "Advanced management interface for CLE Perfumes",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="font-sans h-full bg-neutral-50 text-neutral-900 overflow-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
