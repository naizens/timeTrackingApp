import { useEffect, useState } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // Get initial state
    window.api.window.isMaximized().then(setIsMaximized)
    // Subscribe to changes pushed from main process
    const cleanup = window.api.window.onMaximizedChange(setIsMaximized)
    return cleanup
  }, [])

  return (
    // -webkit-app-region: drag makes the entire bar draggable as a window handle
    <div
      className="flex items-center justify-between h-9 bg-gray-900 select-none shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: App name */}
      <div className="flex items-center gap-2 px-4">
        <span className="text-white text-xs font-semibold tracking-wide">Time Tracker</span>
      </div>

      {/* Right: Window control buttons */}
      {/* Must be no-drag so click events are not captured by the drag handler */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <TitleBarButton onClick={() => window.api.window.minimize()} label="Minimieren">
          <Minus size={12} />
        </TitleBarButton>

        <TitleBarButton
          onClick={() => window.api.window.maximizeToggle()}
          label={isMaximized ? 'Wiederherstellen' : 'Maximieren'}
        >
          {isMaximized ? <Square size={10} /> : <Maximize2 size={11} />}
        </TitleBarButton>

        <TitleBarButton
          onClick={() => window.api.window.close()}
          label="Schließen"
          hoverClass="hover:bg-red-600"
        >
          <X size={12} />
        </TitleBarButton>
      </div>
    </div>
  )
}

function TitleBarButton({
  onClick,
  label,
  children,
  hoverClass = 'hover:bg-gray-700'
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
  hoverClass?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`
        flex items-center justify-center w-11 h-9
        text-gray-400 hover:text-white
        transition-colors duration-100 ${hoverClass}
      `}
    >
      {children}
    </button>
  )
}
