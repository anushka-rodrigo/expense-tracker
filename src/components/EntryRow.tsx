'use client'
import { useState } from 'react'
import { updateEntry, deleteEntry } from '@/app/actions'
import { lastDayOfMonth } from '@/lib/dates'
import type { Entry } from '@/lib/types'

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const field =
  'w-full bg-[#1C1C21] border border-[#2A2A30] rounded-md px-3 py-2 text-sm placeholder:text-[#5A5A62] focus:outline-none focus:border-[#D4B483] [color-scheme:dark]'

export default function EntryRow({ entry }: { entry: Entry }) {
  const [view, setView] = useState<'closed' | 'actions' | 'edit' | 'confirm'>('closed')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [isRange, setIsRange] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  function openEdit() {
    setIsRange(!!entry.end_date)
    setStartDate(entry.start_date)
    setEndDate(entry.end_date ?? '')
    setName(entry.name)
    setDescription(entry.description ?? '')
    setAmount(String(entry.amount))
    setError('')
    setView('edit')
  }

  function changeStart(v: string) {
    setStartDate(v)
    if (endDate && (endDate < v || endDate.slice(0, 7) !== v.slice(0, 7))) setEndDate('')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (isRange && !endDate) return setError('Pick an end date for the range.')

    setBusy(true)
    const res = await updateEntry(entry.id, {
      kind: entry.kind,
      startDate,
      endDate: isRange ? endDate : null,
      name,
      description: entry.kind === 'expense' ? description : '',
      amount,
    })
    setBusy(false)

    if (res.error) return setError(res.error)
    setView('closed')
  }

  async function remove() {
    setError('')
    setBusy(true)
    const res = await deleteEntry(entry.kind, entry.id)
    setBusy(false)
    if (res.error) setError(res.error)
  }

  if (view === 'edit') {
    return (
      <form onSubmit={save} className="space-y-2 border border-[#2A2A30] rounded-md p-3 bg-[#18181C]">
        <label className="flex items-center gap-2 text-xs text-[#86858C]">
          <input type="checkbox" checked={isRange} onChange={(e) => setIsRange(e.target.checked)} />
          Date range
        </label>

        <div className={isRange ? 'grid grid-cols-2 gap-2' : ''}>
          <input type="date" required value={startDate} onChange={(e) => changeStart(e.target.value)} className={field} />
          {isRange && (
            <input
              type="date"
              required
              value={endDate}
              min={startDate || undefined}
              max={startDate ? lastDayOfMonth(startDate) : undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className={field}
            />
          )}
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} placeholder="Name" className={field} />
        {entry.kind === 'expense' && (
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            placeholder="Brief description (optional)"
            className={field}
          />
        )}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          placeholder="Amount (Rs.)"
          className={`${field} font-mono`}
        />

        {error && <p className="text-xs text-[#C97B7B]">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-[#D4B483] text-[#131316] font-medium rounded-md py-2 text-sm disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setView('closed')}
            className="flex-1 border border-[#2A2A30] text-[#86858C] rounded-md py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setView(view === 'closed' ? 'actions' : 'closed')}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm leading-5 break-words">{entry.name}</p>
          {entry.description && (
            <p className="text-xs text-[#86858C] break-words">{entry.description}</p>
          )}
        </div>
        <p
          className={`text-sm font-mono whitespace-nowrap leading-5 ${
            entry.kind === 'income' ? 'text-[#7FB88F]' : 'text-[#C97B7B]'
          }`}
        >
          {entry.kind === 'income' ? '+' : '−'} {fmt(entry.amount)}
        </p>
      </button>

      {view === 'actions' && (
        <div className="flex gap-5 mt-2 text-xs">
          <button type="button" onClick={openEdit} className="text-[#D4B483]">Edit</button>
          <button type="button" onClick={() => setView('confirm')} className="text-[#C97B7B]">Delete</button>
        </div>
      )}

      {view === 'confirm' && (
        <div className="flex items-center gap-4 mt-2 text-xs">
          <span className="text-[#86858C]">Delete this entry?</span>
          <button type="button" onClick={remove} disabled={busy} className="text-[#C97B7B] disabled:opacity-50">
            {busy ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button type="button" onClick={() => setView('closed')} disabled={busy} className="text-[#86858C]">
            Cancel
          </button>
        </div>
      )}

      {error && <p className="text-xs text-[#C97B7B] mt-1">{error}</p>}
    </div>
  )
}