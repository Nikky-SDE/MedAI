'use client'

import { Download } from 'lucide-react'

export function DownloadPdfButton() {
  const downloadReport = () => {
    // We use the browser's native print-to-pdf functionality which perfectly 
    // supports modern CSS like lab() Colors from Tailwind v4, unlike html2canvas.
    window.print()
  }

  return (
    <button 
      onClick={downloadReport}
      className={`px-5 py-2.5 flex items-center font-bold rounded-xl shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:scale-105 active:scale-95`}
    >
      <Download className="w-4 h-4 mr-2 hidden sm:block" />
      Download PDF
    </button>
  )
}
