'use client'
import { useEffect, useState } from 'react'
import EntryForm from './EntryForm'

export default function EntryPanel() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {/* phone: floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-[#D4B483] px-5 py-3 text-sm font-medium text-[#131316] shadow-lg"
      >
        <span className="text-lg leading-none">+</span> Add entry
      </button>

      {/* phone: dim background while the sheet is open */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${
          open ? 'fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl' : 'hidden'
        } border border-[#2A2A30] bg-[#18181C] p-4 lg:block lg:sticky lg:top-6 lg:z-auto lg:max-h-none lg:overflow-visible lg:rounded-lg`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">New entry</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="lg:hidden px-1 text-xl leading-none text-[#86858C]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <EntryForm onSaved={() => setOpen(false)} />
      </aside>
    </>
  )
}