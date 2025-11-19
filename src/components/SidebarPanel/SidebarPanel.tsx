import { ReactNode } from 'react'
import './SidebarPanel.css'

interface SidebarPanelProps {
  children: ReactNode
  position?: 'left' | 'right'
  onClose?: () => void
}

export function SidebarPanel({ children, position = 'right', onClose }: SidebarPanelProps) {
  return (
    <div className={`sidebar-panel sidebar-panel-${position}`}>
      {onClose && (
        <button className="sidebar-panel-close" onClick={onClose} title="Закрыть">
          ✕
        </button>
      )}
      <div className="sidebar-panel-content">
        {children}
      </div>
    </div>
  )
}

