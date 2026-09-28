'use client'
import { useState } from 'react'

export default function DownloadReportButton({ href }: { href: string }) {
  const [pressed, setPressed] = useState(false)

  function press() {
    setPressed(true)
    window.setTimeout(() => setPressed(false), 350)
  }

  return (
    <a
      href={href}
      download
      onMouseDown={press}
      onTouchStart={press}
      className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-medium transition-colors duration-150 ${
        pressed
          ? 'border-[#D4B483] bg-[#D4B483] text-[#131316]'
          : 'border-[#2A2A30] bg-[#131316] text-[#D4B483] hover:border-[#D4B483]'
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      Download PDF
    </a>
  )
}