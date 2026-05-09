import type { Metadata, Viewport } from "next"
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
  description: "Advanced management interface for CLE Perfume operations.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "CLE Admin",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/admin-icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/admin-icon.png", sizes: "512x512", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#111827",
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
