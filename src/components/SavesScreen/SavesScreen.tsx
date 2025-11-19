import './SavesScreen.css'

interface SavesScreenProps {
  onBack: () => void
}

export function SavesScreen({ onBack }: SavesScreenProps) {
  // Моковые сохранения
  const mockSaves = [
    { id: 1, name: 'Мой первый город', date: '2024-01-15 14:30', size: '2.5 MB' },
    { id: 2, name: 'Мегаполис', date: '2024-01-14 10:15', size: '5.1 MB' },
    { id: 3, name: 'Тестовый мир', date: '2024-01-13 18:45', size: '1.8 MB' },
  ]

  return (
    <div className="saves-screen">
      <div className="saves-content">
        <h1 className="saves-title">Сохранения</h1>
        <div className="saves-list">
          {mockSaves.map((save) => (
            <div key={save.id} className="save-item">
              <div className="save-info">
                <div className="save-name">{save.name}</div>
                <div className="save-meta">
                  <span>{save.date}</span>
                  <span>{save.size}</span>
                </div>
              </div>
              <div className="save-actions">
                <button className="save-button save-button-load">Загрузить</button>
                <button className="save-button save-button-delete">Удалить</button>
              </div>
            </div>
          ))}
        </div>
        <button className="back-button" onClick={onBack}>
          Назад
        </button>
      </div>
    </div>
  )
}

