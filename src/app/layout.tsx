import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/components/auth/auth-provider"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "NORDCC Surveys - Survey Platform operated by the NORDCC",
  description: "Surveys created by the NORDCC for businesses operating in the Netherlands",

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>

        <Analytics/>
        <AuthProvider>{children}</AuthProvider>
       
      </body>
    </html>
  )
}
