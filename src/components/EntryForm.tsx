'use client'
import { useEffect, useState } from 'react'
import { addEntry } from '@/app/actions'
import { toISODate } from '@/lib/dates'
import EndDayPicker from './EndDayPicker'

const field =
  'w-full bg-[#1C1C21] border border-[#2A2A30] rounded-md px-3 py-2.5 text-sm placeholder:text-[#5A5A62] focus:outline-none focus:border-[#D4B483] [color-scheme:dark]'

function Segment<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <div className="flex bg-[#1C1C21] border border-[#2A2A30] rounded-md p-0.5">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`flex-1 rounded px-3 py-1.5 text-sm ${
            value === o.v ? 'bg-[#2A2A30] text-[#F2F1EE]' : 'text-[#86858C]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function EntryForm({ onSaved }: { onSaved?: () => void }) {
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const [mode, setMode] = useState<'single' | 'range'>('single')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // set on the client so the date uses the user's own timezone
  useEffect(() => setStartDate(toISODate(new Date())), [])

  function changeStart(v: string) {
    setStartDate(v)
    if (endDate && (endDate <= v || endDate.slice(0, 7) !== v.slice(0, 7))) setEndDate('')
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'range' && !endDate) return setError('Pick an end date for the range.')

    setSaving(true)
    const res = await addEntry({
      kind,
      startDate,
      endDate: mode === 'range' ? endDate : null,
      name,
      description: kind === 'expense' ? description : '',
      amount,
    })
    setSaving(false)

    if (res.error) return setError(res.error)
    setName('')
    setDescription('')
    setAmount('')
    setEndDate('')
    onSaved?.()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Segment
        value={kind}
        onChange={setKind}
        options={[{ v: 'expense', label: 'Expense' }, { v: 'income', label: 'Income' }]}
      />
      <Segment
        value={mode}
        onChange={setMode}
        options={[{ v: 'single', label: 'Single date' }, { v: 'range', label: 'Date range' }]}
      />

      <div className={mode === 'range' ? 'grid grid-cols-2 gap-2' : ''}>
        <div>
          {mode === 'range' && <label className="block text-xs text-[#86858C] mb-1">From</label>}
          <input type="date" required value={startDate} onChange={(e) => changeStart(e.target.value)} className={field} />
        </div>
        {mode === 'range' && (
          <div>
            <label className="block text-xs text-[#86858C] mb-1">To</label>
            <EndDayPicker startDate={startDate} value={endDate} onChange={setEndDate} className={field} />
          </div>
        )}
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={100}
        placeholder={kind === 'expense' ? 'Expense (e.g. Food, Travel)' : 'Income (e.g. Occupation, Given by Family)'}
        className={field}
      />
      {kind === 'expense' && (
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
        placeholder={mode === 'range' ? 'Total amount for these days (Rs.)' : 'Amount (Rs.)'}
        className={`${field} font-mono`}
      />

      {error && <p className="text-sm text-[#C97B7B]">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#D4B483] text-[#131316] font-medium rounded-md py-2.5 text-sm hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving…' : kind === 'expense' ? 'Add expense' : 'Add income'}
      </button>
    </form>
  )
}