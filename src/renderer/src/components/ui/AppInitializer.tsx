import { useEffect, type ReactNode } from 'react'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useVacationStore } from '@renderer/store/useVacationStore'
import { useTodoStore } from '@renderer/store/useTodoStore'
import { useSettingsStore } from '@renderer/store/useSettingsStore'

// Loads all initial data from the main process on app start.
// Runs all loads in parallel to minimize startup latency.
export function AppInitializer({ children }: { children: ReactNode }) {
  const loadMonth = useCalendarStore((s) => s.loadMonth)
  const currentYearMonth = useCalendarStore((s) => s.currentYearMonth)
  const loadAll = useVacationStore((s) => s.loadAll)
  const loadTodos = useTodoStore((s) => s.loadAll)
  const loadSettings = useSettingsStore((s) => s.load)

  useEffect(() => {
    Promise.all([loadSettings(), loadAll(), loadTodos(), loadMonth(currentYearMonth)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally runs once on mount only

  return <>{children}</>
}
