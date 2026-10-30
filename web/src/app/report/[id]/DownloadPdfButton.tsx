'use client'

import { Download } from 'lucide-react'

export function DownloadPdfButton() {
  const downloadReport = () => {
    // Uses the browser's native print-to-pdf pipeline, rendering crisp vector fonts and styling
    window.print()
  }

  return (
    <button 
      type="button"
      onClick={downloadReport}
      className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-md shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.99] flex-shrink-0"
      title="Download or print report PDF"
      aria-label="Download assessment as PDF"
    >
      <Download className="w-4 h-4" />
      <span>Download PDF</span>
    </button>
  )
}
