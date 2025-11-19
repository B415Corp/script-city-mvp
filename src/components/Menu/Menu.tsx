import './Menu.css'

interface MenuProps {
  onNewWorld: () => void
  onSaves: () => void
  onSettings: () => void
  onMods: () => void
  onExit: () => void
}

export function Menu({ onNewWorld, onSaves, onSettings, onMods, onExit }: MenuProps) {
  return (
    <div className="menu-container">
      <div className="menu-content">
        <h1 className="menu-title">Script City</h1>
        <p className="menu-subtitle">Создайте свой мир</p>
        <div className="menu-buttons">
          <button className="menu-button" onClick={onNewWorld}>
            Новый мир
          </button>
          <button className="menu-button" onClick={onSaves}>
            Сохранения
          </button>
          <button className="menu-button" onClick={onSettings}>
            Настройки
          </button>
          <button className="menu-button" onClick={onMods}>
            Моды
          </button>
          <button className="menu-button menu-button-exit" onClick={onExit}>
            Выход
          </button>
        </div>
      </div>
    </div>
  )
}

