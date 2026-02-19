import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, Umbrella, CheckSquare, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar', Icon: Calendar },
  { to: '/vacation', label: 'Vacation', Icon: Umbrella },
  { to: '/todos', label: 'Tasks', Icon: CheckSquare }
]

export function Sidebar() {
  return (
    <aside className="flex flex-col w-56 bg-gray-900 shrink-0 overflow-y-auto custom-scroll">
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Settings link at bottom */}
      <div className="p-3 border-t border-gray-800">
        <NavLink
          to="/settings"
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            transition-colors duration-150
            ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }
          `}
        >
          <Settings size={16} />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
