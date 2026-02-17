import { isToday, isWeekend } from 'date-fns'
import type { WorkDay, HolidayEntry } from '@renderer/types/store'
import { HolidayBadge } from './HolidayBadge'
import {
  computeNetMinutes,
  computeOvertimeMinutes,
  formatMinutes,
  formatOvertime
} from '@renderer/utils/dateHelpers'

interface DayCellProps {
  date: Date
  isCurrentMonth: boolean
  workDay?: WorkDay
  holidays: HolidayEntry[]
  workHoursPerDay: number
  onClick: (date: Date) => void
}

export function DayCell({
  date,
  isCurrentMonth,
  workDay,
  holidays,
  workHoursPerDay,
  onClick
}: DayCellProps) {
  const dayNum = date.getDate()
  const isHoliday = holidays.length > 0
  const weekend = isWeekend(date)
  const today = isToday(date)

  const netMins = workDay
    ? computeNetMinutes(workDay.workStartTime, workDay.workEndTime, workDay.breakMinutes)
    : 0

  // Only show overtime for explicit work days (not vacation/sick/holiday)
  const overtimeMins =
    workDay?.type === 'work' && netMins > 0
      ? computeOvertimeMinutes(netMins, workHoursPerDay)
      : null

  const overtimeLabel = overtimeMins !== null ? formatOvertime(overtimeMins) : null

  const bgColor = () => {
    if (!isCurrentMonth) return 'bg-gray-50'
    if (workDay?.type === 'vacation') return 'bg-blue-50'
    if (workDay?.type === 'sick') return 'bg-yellow-50'
    if (workDay?.type === 'paid_absence') return 'bg-purple-50'
    if (workDay?.type === 'school_day') return 'bg-teal-50'
    if (isHoliday) return 'bg-red-50'
    if (weekend) return 'bg-gray-50'
    if (workDay?.type === 'work') return 'bg-green-50'
    return 'bg-white'
  }

  return (
    <div
      onClick={() => onClick(date)}
      className={`
        relative min-h-[80px] p-2 cursor-pointer border-b border-r border-gray-200
        transition-colors duration-100 hover:brightness-95
        ${bgColor()}
        ${!isCurrentMonth ? 'opacity-40' : ''}
      `}
    >
      {/* Day number */}
      <div
        className={`
        flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mb-1
        ${
          today
            ? 'bg-blue-600 text-white'
            : weekend || !isCurrentMonth
              ? 'text-gray-400'
              : 'text-gray-700'
        }
      `}
      >
        {dayNum}
      </div>

      {/* Work time summary */}
      {workDay?.workStartTime && workDay?.workEndTime && isCurrentMonth && (
        <div className="text-[10px] text-gray-600 leading-tight">
          <div>
            {workDay.workStartTime}–{workDay.workEndTime}
          </div>
          {netMins > 0 && <div className="text-blue-600 font-medium">{formatMinutes(netMins)}</div>}
        </div>
      )}

      {/* Overtime / undertime indicator */}
      {overtimeLabel && isCurrentMonth && (
        <div
          className={`
          text-[9px] font-bold leading-tight mt-0.5
          ${overtimeMins! > 0 ? 'text-orange-600' : 'text-red-500'}
        `}
        >
          {overtimeLabel}
        </div>
      )}

      {/* Type labels */}
      {isCurrentMonth && workDay?.type === 'vacation' && (
        <div className="text-[10px] font-semibold text-blue-700">Urlaub</div>
      )}
      {isCurrentMonth && workDay?.type === 'sick' && (
        <div className="text-[10px] font-semibold text-yellow-700">Krank</div>
      )}
      {isCurrentMonth && workDay?.type === 'paid_absence' && (
        <div className="text-[10px] font-semibold text-purple-700">Fehltag</div>
      )}
      {isCurrentMonth && workDay?.type === 'school_day' && (
        <div className="text-[10px] font-semibold text-teal-700">Berufsschule</div>
      )}

      {/* Holiday badge */}
      {isHoliday && isCurrentMonth && <HolidayBadge holiday={holidays[0]} />}
    </div>
  )
}
