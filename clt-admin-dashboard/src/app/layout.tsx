import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CLT Admin Dashboard",
  description: "Standalone admin dashboard for CLE Perfumes",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
