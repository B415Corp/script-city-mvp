import './SettingsScreen.css'

interface SettingsScreenProps {
  onBack: () => void
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  return (
    <div className="settings-screen">
      <div className="settings-content">
        <h1 className="settings-title">Настройки</h1>
        
        <div className="settings-section">
          <h2 className="settings-section-title">Графика</h2>
          <div className="settings-item">
            <label>Качество графики</label>
            <select className="settings-select">
              <option>Высокое</option>
              <option>Среднее</option>
              <option>Низкое</option>
            </select>
          </div>
          <div className="settings-item">
            <label>
              <input type="checkbox" defaultChecked /> VSync
            </label>
          </div>
          <div className="settings-item">
            <label>
              <input type="checkbox" defaultChecked /> Полноэкранный режим
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">Звук</h2>
          <div className="settings-item">
            <label>Громкость музыки</label>
            <input type="range" min="0" max="100" defaultValue="50" className="settings-slider" />
          </div>
          <div className="settings-item">
            <label>Громкость эффектов</label>
            <input type="range" min="0" max="100" defaultValue="70" className="settings-slider" />
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">Управление</h2>
          <div className="settings-item">
            <label>Скорость прокрутки</label>
            <input type="range" min="1" max="10" defaultValue="5" className="settings-slider" />
          </div>
        </div>

        <button className="back-button" onClick={onBack}>
          Назад
        </button>
      </div>
    </div>
  )
}

