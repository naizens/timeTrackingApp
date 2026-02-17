import { registerCalendarHandlers } from './calendarHandlers'
import { registerVacationHandlers } from './vacationHandlers'
import { registerTodoHandlers } from './todoHandlers'
import { registerHolidayHandlers } from './holidayHandlers'
import { registerSettingsHandlers } from './settingsHandlers'
import { registerWindowHandlers } from './windowHandlers'

// Call this once after initStore() and before createWindow()
export function registerAllIpcHandlers(): void {
  registerCalendarHandlers()
  registerVacationHandlers()
  registerTodoHandlers()
  registerHolidayHandlers()
  registerSettingsHandlers()
  registerWindowHandlers()
}
