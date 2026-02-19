import { useMemo } from 'react'
import { format, getYear, eachDayOfInterval, isWeekend } from 'date-fns'
import { Umbrella, Heart, Clock, Target, TrendingUp } from 'lucide-react'
import { Card } from '@renderer/components/ui/Card'
import { useVacationStore } from '@renderer/store/useVacationStore'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import {
  usedDaysInYear,
  computeNetMinutes,
  computeOvertimeMinutes,
  formatOvertime
} from '@renderer/utils/dateHelpers'
import { useSettingsStore } from '@renderer/store/useSettingsStore'

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className={`rounded-xl p-5 border ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="p-3 rounded-lg bg-white/60">
          <Icon size={20} className="text-gray-600" />
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { vacationEntries, sickEntries, getBudgetForYear } = useVacationStore()
  const { workDays } = useCalendarStore()
  const settings = useSettingsStore((s) => s.settings)

  // Stable references derived from real current date — format/getYear are pure functions
  const currentMonth = format(new Date(), 'yyyy-MM')
  const currentYear = getYear(new Date())

  const usedVacationDays = useMemo(
    () => usedDaysInYear(vacationEntries, currentYear),
    [vacationEntries, currentYear]
  )

  const usedSickDays = useMemo(
    () => usedDaysInYear(sickEntries, currentYear),
    [sickEntries, currentYear]
  )

  const budget = getBudgetForYear(currentYear)
  const remainingDays = Math.max(0, budget - usedVacationDays)

  // Monthly net work hours and overtime balance
  const { monthlyWorkMinutes, monthlyOvertimeMinutes } = useMemo(() => {
    let work = 0
    let overtime = 0
    Object.entries(workDays)
      .filter(([date]) => date.startsWith(currentMonth))
      .forEach(([, wd]) => {
        if (wd.type === 'work' && wd.workStartTime && wd.workEndTime) {
          const net = computeNetMinutes(wd.workStartTime, wd.workEndTime, wd.breakMinutes)
          work += net
          overtime += computeOvertimeMinutes(net, settings.workHoursPerDay)
        } else if (wd.type === 'school_day') {
          work += settings.workHoursPerDay * 60
        }
      })
    return { monthlyWorkMinutes: work, monthlyOvertimeMinutes: overtime }
  }, [workDays, currentMonth, settings.workHoursPerDay])

  // Count actual business days (Mon–Fri) in the current month.
  // Derive bounds from the currentMonth string to avoid using `new Date()` inside useMemo.
  const businessDaysInMonth = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number)
    const monthStart = new Date(y, m - 1, 1)
    const monthEnd = new Date(y, m, 0) // last day of month
    return eachDayOfInterval({ start: monthStart, end: monthEnd }).filter((d) => !isWeekend(d))
      .length
  }, [currentMonth])

  const expectedMonthMinutes = settings.workHoursPerDay * 60 * businessDaysInMonth
  const monthlyOvertimeLabel = formatOvertime(monthlyOvertimeMinutes)

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">{format(new Date(), 'EEEE, d. MMMM yyyy')}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Umbrella}
          label="Remaining vacation days"
          value={budget > 0 ? remainingDays : '—'}
          sub={budget > 0 ? `${usedVacationDays} of ${budget} days used` : 'No budget set'}
          color="bg-blue-50 border-blue-100"
        />
        <StatCard
          icon={Heart}
          label="Sick days (this year)"
          value={usedSickDays}
          sub={`${currentYear}`}
          color="bg-yellow-50 border-yellow-100"
        />
        <StatCard
          icon={Clock}
          label={`Work hours (${format(new Date(currentMonth + '-01'), 'MMMM')})`}
          value={`${(monthlyWorkMinutes / 60).toFixed(1)}h`}
          sub={`${settings.workHoursPerDay}h/day planned`}
          color="bg-green-50 border-green-100"
        />
        <StatCard
          icon={Target}
          label="Monthly target"
          value={`${Math.round((monthlyWorkMinutes / expectedMonthMinutes) * 100)}%`}
          sub={`${(expectedMonthMinutes / 60).toFixed(0)}h target`}
          color="bg-purple-50 border-purple-100"
        />
        <StatCard
          icon={TrendingUp}
          label={`Overtime (${format(new Date(currentMonth + '-01'), 'MMMM')})`}
          value={monthlyOvertimeLabel ?? '±0'}
          sub={
            monthlyOvertimeMinutes > 0
              ? 'Extra hours accumulated'
              : monthlyOvertimeMinutes < 0
                ? 'Hours in deficit'
                : 'Balanced'
          }
          color={
            monthlyOvertimeMinutes > 0
              ? 'bg-orange-50 border-orange-100'
              : monthlyOvertimeMinutes < 0
                ? 'bg-red-50 border-red-100'
                : 'bg-gray-50 border-gray-100'
          }
        />
      </div>

      {/* Quick overview cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="Recent vacation entries">
          {vacationEntries.length === 0 ? (
            <p className="text-sm text-gray-400">No vacation entries yet</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {vacationEntries
                .slice(-3)
                .reverse()
                .map((e) => (
                  <li key={e.id} className="text-sm text-gray-700 flex justify-between">
                    <span>
                      {e.startDate} – {e.endDate}
                    </span>
                    {e.notes && <span className="text-gray-400 truncate ml-2">{e.notes}</span>}
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card title="Sick days (current year)">
          {sickEntries.filter((e) => e.startDate.startsWith(String(currentYear))).length === 0 ? (
            <p className="text-sm text-gray-400">No sick days recorded</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sickEntries
                .filter((e) => e.startDate.startsWith(String(currentYear)))
                .slice(-3)
                .reverse()
                .map((e) => (
                  <li key={e.id} className="text-sm text-gray-700 flex justify-between">
                    <span>
                      {e.startDate} – {e.endDate}
                    </span>
                    {e.notes && <span className="text-gray-400 truncate ml-2">{e.notes}</span>}
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
