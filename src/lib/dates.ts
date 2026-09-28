const pad = (n: number) => String(n).padStart(2, '0')
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isValidISODate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

export function sameMonth(a: string, b: string) {
  return a.slice(0, 7) === b.slice(0, 7)
}

export function lastDayOfMonth(iso: string) {
  const [y, m] = iso.split('-').map(Number)
  return `${y}-${pad(m)}-${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}`
}

// server may run in UTC, so pin "today" to Sri Lanka time
export function currentMonth() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }).slice(0, 7)
}

export function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}

export function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

export function dayLabel(start: string, end: string | null) {
  const [, m, d] = start.split('-').map(Number)
  if (!end) return `${d} ${MONTHS[m - 1]}`
  return `${d}–${Number(end.split('-')[2])} ${MONTHS[m - 1]}`
}