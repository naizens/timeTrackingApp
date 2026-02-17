import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MonthView } from './MonthView'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import { useHolidayStore } from '@renderer/store/useHolidayStore'
import { Select } from '@renderer/components/ui/Select'
import { GERMAN_STATES, type GermanStateCode } from '@renderer/types/store'

const STATE_OPTIONS = Object.entries(GERMAN_STATES).map(([value, label]) => ({
  value,
  label
}))

export function CalendarPage() {
  const { currentYearMonth, setCurrentYearMonth } = useCalendarStore()
  const { settings, update: updateSettings } = useSettingsStore()
  const holidayError = useHolidayStore(
    (s) => s.errors[`${currentYearMonth.split('-')[0]}-${settings.germanState}`]
  )

  const currentDate = parseISO(`${currentYearMonth}-01`)

  const goToPrev = () => {
    const prev = subMonths(currentDate, 1)
    setCurrentYearMonth(format(prev, 'yyyy-MM'))
  }

  const goToNext = () => {
    const next = addMonths(currentDate, 1)
    setCurrentYearMonth(format(next, 'yyyy-MM'))
  }

  const goToToday = () => {
    setCurrentYearMonth(format(new Date(), 'yyyy-MM'))
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Month navigation */}
          <button
            onClick={goToPrev}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Vorheriger Monat"
          >
            <ChevronLeft size={18} />
          </button>

          <h2 className="text-xl font-bold text-gray-900 min-w-44 text-center">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </h2>

          <button
            onClick={goToNext}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Nächster Monat"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Heute
          </button>
        </div>

        {/* State selector */}
        <div className="w-56">
          <Select
            value={settings.germanState}
            onChange={(e) => updateSettings({ germanState: e.target.value as GermanStateCode })}
            options={STATE_OPTIONS}
          />
        </div>
      </div>

      {/* Offline / API error warning */}
      {holidayError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2.5 rounded-lg">
          Feiertage konnten nicht geladen werden (Offline-Modus). Gespeicherte Daten werden
          verwendet.
        </div>
      )}

      {/* Calendar grid */}
      <MonthView />
    </div>
  )
}
