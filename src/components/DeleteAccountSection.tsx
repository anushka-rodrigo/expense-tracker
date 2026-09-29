'use client'
import { useState } from 'react'
import { deleteAccount } from '@/app/auth/actions'

const field =
  'w-full bg-[#1C1C21] border border-[#2A2A30] rounded-md px-3 py-2.5 text-sm placeholder:text-[#5A5A62] focus:outline-none focus:border-[#C97B7B] [color-scheme:dark]'

export default function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (confirmText !== 'DELETE') return setError('Type DELETE in capital letters to confirm.')

    setBusy(true)
    const res = await deleteAccount(password)
    setBusy(false)
    if (res?.error) setError(res.error)
    // On success the action redirects, so nothing else runs here.
  }

  if (!open) {
    return (
      <section className="border border-[#C97B7B]/40 rounded-lg p-4">
        <h2 className="text-sm font-medium text-[#C97B7B] mb-1">Delete account</h2>
        <p className="text-xs text-[#86858C] mb-3">
          This permanently deletes your account and every expense, income entry and AI insight you've recorded. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-[#C97B7B]/60 px-3 py-1.5 text-xs text-[#C97B7B] hover:bg-[#C97B7B] hover:text-[#131316]"
        >
          Delete my account
        </button>
      </section>
    )
  }

  return (
    <section className="border border-[#C97B7B] rounded-lg p-4">
      <h2 className="text-sm font-medium text-[#C97B7B] mb-1">Delete account</h2>
      <p className="text-xs text-[#86858C] mb-4">
        This permanently deletes your account and every expense, income entry and AI insight you've recorded. This cannot be undone.
      </p>
      <form onSubmit={handleDelete} className="space-y-3">
        <div>
          <label className="block text-xs text-[#86858C] mb-1">Confirm your password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={field}
          />
        </div>
        <div>
          <label className="block text-xs text-[#86858C] mb-1">
            Type <span className="font-mono text-[#C97B7B]">DELETE</span> to confirm
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            required
            className={field}
          />
        </div>

        {error && <p className="text-xs text-[#C97B7B]">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-[#C97B7B] text-[#131316] font-medium rounded-md py-2 text-sm disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Permanently delete my account'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setOpen(false)
              setPassword('')
              setConfirmText('')
              setError('')
            }}
            className="flex-1 border border-[#2A2A30] text-[#86858C] rounded-md py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}