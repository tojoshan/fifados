import Navigation from '@/components/Navigation'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'FIFA2',
  description: '¿Qué tan fifado estás?',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
