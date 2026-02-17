import type { HolidayEntry } from '@renderer/types/store'

interface HolidayBadgeProps {
  holiday: HolidayEntry
}

export function HolidayBadge({ holiday }: HolidayBadgeProps) {
  return (
    <div
      title={holiday.hinweis ? `${holiday.name}: ${holiday.hinweis}` : holiday.name}
      className="absolute bottom-1 left-1 right-1 truncate text-[9px] font-semibold
                 text-red-700 bg-red-50 rounded px-1 leading-4 border border-red-200"
    >
      {holiday.name}
    </div>
  )
}
