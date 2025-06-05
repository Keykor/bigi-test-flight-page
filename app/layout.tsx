import { Inter } from 'next/font/google'
import { EventTrackerProvider } from '@/context/EventTrackerProvider'
import type { Metadata } from 'next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <EventTrackerProvider>
          {children}
        </EventTrackerProvider>
      </body>
    </html>
  )
}
