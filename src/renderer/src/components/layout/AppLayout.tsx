import type { ReactNode } from 'react'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
