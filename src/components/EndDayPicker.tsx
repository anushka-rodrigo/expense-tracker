'use client'
import { lastDayOfMonth, monthLabel } from '@/lib/dates'

export default function EndDayPicker({
  startDate,
  value,
  onChange,
  className,
}: {
  startDate: string
  value: string
  onChange: (iso: string) => void
  className?: string
}) {
  if (!startDate) {
    return (
      <select disabled className={className}>
        <option>Pick a start date first</option>
      </select>
    )
  }

  const ym = startDate.slice(0, 7)
  const startDay = Number(startDate.slice(8, 10))
  const lastDay = Number(lastDayOfMonth(startDate).slice(8, 10))
  const days: number[] = []
  for (let d = startDay + 1; d <= lastDay; d++) days.push(d)

  if (days.length === 0) {
    return (
      <select disabled className={className}>
        <option>No later day this month</option>
      </select>
    )
  }

  const selected = value && value.slice(0, 7) === ym ? String(Number(value.slice(8, 10))) : ''

  return (
    <select
      value={selected}
      onChange={(e) =>
        onChange(e.target.value ? `${ym}-${e.target.value.padStart(2, '0')}` : '')
      }
      className={className}
    >
      <option value="">End day…</option>
      {days.map((d) => (
        <option key={d} value={d}>
          {d} {monthLabel(ym)}
        </option>
      ))}
    </select>
  )
}