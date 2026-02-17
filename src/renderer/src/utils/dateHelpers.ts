import { eachDayOfInterval, isWeekend, parseISO, differenceInMinutes, parse } from 'date-fns'

/** Count business days (Mon–Fri) in an inclusive date range */
export function countBusinessDays(startDate: string, endDate: string): number {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  if (end < start) return 0
  return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d)).length
}

/** Sum up used days from entries that overlap the given year */
export function usedDaysInYear<T extends { startDate: string; endDate: string }>(
  entries: T[],
  year: number
): number {
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  return entries
    .filter((e) => e.startDate <= yearEnd && e.endDate >= yearStart)
    .reduce((sum, e) => {
      // Clamp to year boundaries using string comparison (ISO dates are lexicographically sortable)
      const start = e.startDate < yearStart ? yearStart : e.startDate
      const end = e.endDate > yearEnd ? yearEnd : e.endDate
      return sum + countBusinessDays(start, end)
    }, 0)
}

/** Compute net work minutes from time strings and break */
export function computeNetMinutes(
  startTime: string,
  endTime: string,
  breakMinutes: number
): number {
  if (!startTime || !endTime) return 0
  const ref = new Date()
  const s = parse(startTime, 'HH:mm', ref)
  const e = parse(endTime, 'HH:mm', ref)
  return Math.max(0, differenceInMinutes(e, s) - breakMinutes)
}

/** Format minutes as "7h 30min" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

/**
 * Compute overtime in minutes for a single work day.
 * Positive = overtime, negative = undertime.
 * Only meaningful for days of type 'work'.
 */
export function computeOvertimeMinutes(netWorkMinutes: number, workHoursPerDay: number): number {
  return netWorkMinutes - workHoursPerDay * 60
}

/**
 * Format an overtime value (can be negative) as "+1h 30min" or "−0h 45min".
 * Returns null if overtime is exactly 0.
 */
export function formatOvertime(overtimeMinutes: number): string | null {
  if (overtimeMinutes === 0) return null
  const sign = overtimeMinutes > 0 ? '+' : '−'
  const abs = Math.abs(overtimeMinutes)
  return `${sign}${formatMinutes(abs)}`
}
