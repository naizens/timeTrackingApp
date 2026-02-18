import { useMemo, useEffect, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth
} from 'date-fns'
import { de } from 'date-fns/locale'
import { DayCell } from './DayCell'
import { DayEntryModal } from './DayEntryModal'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useHolidayStore } from '@renderer/store/useHolidayStore'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import {
  computeNetMinutes,
  computeOvertimeMinutes,
  formatOvertime
} from '@renderer/utils/dateHelpers'
import type { HolidayEntry } from '@renderer/types/store'

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function MonthView() {
  const { currentYearMonth, workDays, loadMonth } = useCalendarStore()
  const { fetchHolidays, getHolidaysForMonth } = useHolidayStore()
  const settings = useSettingsStore((s) => s.settings)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Stable Date object for the first of the displayed month, only changes with currentYearMonth
  const currentDate = useMemo(() => {
    const [y, m] = currentYearMonth.split('-').map(Number)
    return new Date(y, m - 1, 1)
  }, [currentYearMonth])

  useEffect(() => {
    const [y, m] = currentYearMonth.split('-').map(Number)
    loadMonth(currentYearMonth)
    fetchHolidays(y, settings.germanState)
    // Pre-fetch adjacent year for smooth navigation near year boundary
    if (m === 1) fetchHolidays(y - 1, settings.germanState)
    if (m === 12) fetchHolidays(y + 1, settings.germanState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYearMonth, settings.germanState])

  const holidaysByDate = useMemo<Record<string, HolidayEntry[]>>(() => {
    const monthHolidays = getHolidaysForMonth(currentYearMonth, settings.germanState)
    const map: Record<string, HolidayEntry[]> = {}
    monthHolidays.forEach((h) => {
      if (!map[h.date]) map[h.date] = []
      map[h.date].push(h)
    })
    return map
  }, [currentYearMonth, settings.germanState, getHolidaysForMonth])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Monthly stats: total work minutes and total overtime
  const { totalWorkMinutes, totalOvertimeMinutes } = useMemo(() => {
    let work = 0
    let overtime = 0
    days
      .filter((d) => isSameMonth(d, currentDate))
      .forEach((d) => {
        const key = format(d, 'yyyy-MM-dd')
        const wd = workDays[key]
        if (!wd) return

        if (wd.type === 'work' && wd.workStartTime && wd.workEndTime) {
          const net = computeNetMinutes(wd.workStartTime, wd.workEndTime, wd.breakMinutes)
          work += net
          overtime += computeOvertimeMinutes(net, settings.workHoursPerDay)
        } else if (wd.type === 'school_day') {
          // School day counts as full target hours, zero overtime
          work += settings.workHoursPerDay * 60
        }
      })
    return { totalWorkMinutes: work, totalOvertimeMinutes: overtime }
  }, [days, currentDate, workDays, settings.workHoursPerDay])

  const totalHours = (totalWorkMinutes / 60).toFixed(1)
  const overtimeLabel = formatOvertime(totalOvertimeMinutes)

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Month summary bar */}
      {totalWorkMinutes > 0 && (
        <div className="flex items-center gap-4 text-sm bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
          <span className="text-gray-600">
            Netto: <span className="font-semibold text-blue-700">{totalHours}h</span>
          </span>
          {overtimeLabel && (
            <span
              className={`font-semibold ${totalOvertimeMinutes > 0 ? 'text-orange-600' : 'text-red-600'}`}
            >
              Überstunden: {overtimeLabel}
            </span>
          )}
          <span className="text-gray-400 text-xs">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </span>
        </div>
      )}

      {/* Calendar grid */}
      <div className="flex-1 min-h-0 flex flex-col border-l border-t border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7">
          {WEEKDAY_LABELS.map((d) => (
            <div
              key={d}
              className="bg-gray-100 text-center text-xs font-semibold text-gray-500 py-2 border-b border-r border-gray-200"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            return (
              <DayCell
                key={dateStr}
                date={day}
                isCurrentMonth={isSameMonth(day, currentDate)}
                workDay={workDays[dateStr]}
                holidays={holidaysByDate[dateStr] ?? []}
                workHoursPerDay={settings.workHoursPerDay}
                onClick={setSelectedDate}
              />
            )
          })}
        </div>
      </div>

      {/* key forces a full remount when the date changes so form state resets cleanly */}
      <DayEntryModal
        key={selectedDate?.toISOString() ?? ''}
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  )
}
