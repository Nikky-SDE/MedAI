import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AlertTriangle } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'medAI - Your Personal Health Assistant',
  description: 'AI-powered multimodal medical guidance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        <div className="bg-amber-100 border-b border-amber-200 p-3 text-center flex flex-col sm:flex-row items-center justify-center text-amber-900 text-sm font-medium z-50 shadow-sm relative sticky top-0">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mb-1 sm:mb-0" />
          <p>
            <strong className="font-bold">Medical Disclaimer:</strong> medAI is an informational tool powered by AI. It is NOT a substitute for professional medical diagnosis, advice, or treatment. Always consult a certified healthcare professional. In case of an emergency, immediately contact local emergency services.
          </p>
        </div>
        <main className="flex-grow">{children}</main>
      </body>
    </html>
  )
}
