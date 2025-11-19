import './ModsScreen.css'

interface ModsScreenProps {
  onBack: () => void
}

export function ModsScreen({ onBack }: ModsScreenProps) {
  // Моковые моды
  const mockMods = [
    { id: 1, name: 'Больше зданий', author: 'User123', enabled: true, description: 'Добавляет новые типы зданий' },
    { id: 2, name: 'Реалистичная погода', author: 'Modder456', enabled: false, description: 'Динамическая система погоды' },
    { id: 3, name: 'Улучшенная графика', author: 'GraphicsPro', enabled: true, description: 'Повышает качество визуализации' },
  ]

  return (
    <div className="mods-screen">
      <div className="mods-content">
        <h1 className="mods-title">Моды</h1>
        
        <div className="mods-list">
          {mockMods.map((mod) => (
            <div key={mod.id} className={`mod-item ${mod.enabled ? 'mod-enabled' : ''}`}>
              <div className="mod-header">
                <div className="mod-info">
                  <div className="mod-name">{mod.name}</div>
                  <div className="mod-author">Автор: {mod.author}</div>
                  <div className="mod-description">{mod.description}</div>
                </div>
                <label className="mod-toggle">
                  <input type="checkbox" defaultChecked={mod.enabled} />
                  <span className="mod-toggle-slider"></span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mods-actions">
          <button className="mods-button">Загрузить моды</button>
          <button className="mods-button">Установить из файла</button>
        </div>

        <button className="back-button" onClick={onBack}>
          Назад
        </button>
      </div>
    </div>
  )
}

