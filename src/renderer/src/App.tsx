import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AppInitializer } from './components/ui/AppInitializer'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { CalendarPage } from './components/calendar/CalendarPage'
import { VacationPage } from './components/vacation/VacationPage'
import { TodoPage } from './components/todo/TodoPage'
import { SettingsPage } from './components/SettingsPage'

// HashRouter is required for Electron's file:// protocol.
// HTML5 history routing does not work with file:// URLs.

export default function App() {
  return (
    <HashRouter>
      <AppInitializer>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/vacation" element={<VacationPage />} />
            <Route path="/todos" element={<TodoPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AppLayout>
      </AppInitializer>
    </HashRouter>
  )
}
