import { useState, useRef, useEffect } from 'react'
import { SidebarPanel } from '../SidebarPanel'
import './GameUI.css'

interface GameUIProps {
  onBack: () => void
}

type BuildCategory = 'roads' | 'zoning' | 'water' | 'electricity' | 'public' | 'parks' | null
type ToolType = 'demolish' | 'landscape' | null

export function GameUI({ onBack }: GameUIProps) {
  const [hoveredCategory, setHoveredCategory] = useState<BuildCategory>(null)
  const [activeTool, setActiveTool] = useState<ToolType>(null)
  const [activePanel, setActivePanel] = useState<'policies' | 'stats' | 'heatmaps' | null>(null)
  const [panelPosition, setPanelPosition] = useState<'left' | 'right'>('right')
  const bottomButtonsRef = useRef<HTMLDivElement>(null)

  // Определяем позицию панели в зависимости от расположения кнопок
  useEffect(() => {
    if (activePanel && bottomButtonsRef.current) {
      const rect = bottomButtonsRef.current.getBoundingClientRect()
      const screenWidth = window.innerWidth
      const buttonCenter = rect.left + rect.width / 2
      
      // Если кнопка ближе к левому краю, показываем панель слева
      setPanelPosition(buttonCenter < screenWidth / 2 ? 'left' : 'right')
    }
  }, [activePanel])

  const buildCategories = [
    {
      id: 'roads' as BuildCategory,
      icon: '🛣️',
      label: 'Дороги',
      items: [
        { icon: '🛣️', label: 'Обычная дорога' },
        { icon: '🛤️', label: 'Автомагистраль' },
        { icon: '➡️', label: 'Односторонняя' },
        { icon: '🌉', label: 'Мост' },
        { icon: '🚇', label: 'Туннель' }
      ]
    },
    {
      id: 'zoning' as BuildCategory,
      icon: '🏘️',
      label: 'Зонирование',
      items: [
        { icon: '🏠', label: 'Жилая зона' },
        { icon: '🏪', label: 'Коммерческая зона' },
        { icon: '🏭', label: 'Промышленная зона' },
        { icon: '🏢', label: 'Офисная зона' }
      ]
    },
    {
      id: 'water' as BuildCategory,
      icon: '💧',
      label: 'Вода',
      items: [
        { icon: '💧', label: 'Водонасосная станция' },
        { icon: '🗼', label: 'Водонапорная башня' },
        { icon: '🏭', label: 'Очистные сооружения' },
        { icon: '🚰', label: 'Водопровод' }
      ]
    },
    {
      id: 'electricity' as BuildCategory,
      icon: '⚡',
      label: 'Электричество',
      items: [
        { icon: '🏭', label: 'Угольная ТЭС' },
        { icon: '🌀', label: 'Ветряная электростанция' },
        { icon: '☀️', label: 'Солнечная панель' },
        { icon: '⚡', label: 'Линия электропередач' }
      ]
    },
    {
      id: 'public' as BuildCategory,
      icon: '🏛️',
      label: 'Общественные здания',
      items: [
        { icon: '🏫', label: 'Школа' },
        { icon: '🏥', label: 'Больница' },
        { icon: '🚒', label: 'Пожарная часть' },
        { icon: '🚓', label: 'Полиция' },
        { icon: '⚰️', label: 'Кладбище' }
      ]
    },
    {
      id: 'parks' as BuildCategory,
      icon: '🌳',
      label: 'Парки и развлечения',
      items: [
        { icon: '🌳', label: 'Парк' },
        { icon: '🌲', label: 'Сквер' },
        { icon: '🏟️', label: 'Стадион' },
        { icon: '🦁', label: 'Зоопарк' }
      ]
    }
  ]

  return (
    <div className="game-ui">
      {/* Нижняя панель управления */}
      <div className="ui-bottom-bar">
        {/* Выпадающее меню строительства (над основным меню) */}
        {hoveredCategory && (
          <div 
            className="build-dropdown-layer"
            onMouseEnter={() => setHoveredCategory(hoveredCategory)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div className="build-dropdown-grid">
              {buildCategories
                .find(cat => cat.id === hoveredCategory)
                ?.items.map((item, index) => (
                  <div key={index} className="build-dropdown-item" title={item.label}>
                    <div className="build-dropdown-item-icon">{item.icon}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Верхняя секция - Строительство и инструменты */}
        <div className="ui-top-section">
          <div className="build-tools">
            {/* Категории строительства */}
            {buildCategories.map((category) => (
              <div
                key={category.id}
                className="build-category-button"
                onMouseEnter={() => setHoveredCategory(category.id)}
                title={category.label}
              >
                <div className="build-category-icon">{category.icon}</div>
              </div>
            ))}

            {/* Инструменты */}
            <div className="tools-separator"></div>
            
            <div
              className={`tool-button ${activeTool === 'demolish' ? 'active' : ''}`}
              onClick={() => setActiveTool(activeTool === 'demolish' ? null : 'demolish')}
              title="Снос"
            >
              <div className="tool-icon">🔨</div>
            </div>
            
            <div
              className={`tool-button ${activeTool === 'landscape' ? 'active' : ''}`}
              onClick={() => setActiveTool(activeTool === 'landscape' ? null : 'landscape')}
              title="Ландшафт"
            >
              <div className="tool-icon">⛰️</div>
            </div>

            {/* Элементы спроса */}
            <div className="tools-separator"></div>
            
            <div className="demand-indicators">
              <div className="demand-item" title="Спрос на жильё">
                <div className="demand-bar demand-residential" style={{ height: '75%' }}></div>
              </div>
              <div className="demand-item" title="Спрос на коммерцию">
                <div className="demand-bar demand-commercial" style={{ height: '45%' }}></div>
              </div>
              <div className="demand-item" title="Спрос на промышленность">
                <div className="demand-bar demand-industrial" style={{ height: '30%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя секция - Финансы, статистика, политики */}
        <div className="ui-bottom-section">
          <div className="bottom-section-left">
            {/* Название города */}
            <div className="city-name">
              <h2>Мой Город</h2>
            </div>

            {/* Финансы */}
            <div className="finance-info">
              <div className="finance-item">
                <span className="finance-label">Бюджет:</span>
                <span className="finance-value positive">₽1,250,000</span>
              </div>
              <div className="finance-item">
                <span className="finance-label">Доходы:</span>
                <span className="finance-value positive">+₽250,000</span>
              </div>
              <div className="finance-item">
                <span className="finance-label">Расходы:</span>
                <span className="finance-value negative">-₽180,000</span>
              </div>
            </div>

            {/* Статистика */}
            <div className="quick-stats">
              <div className="quick-stat-item">
                <span className="quick-stat-label">Население</span>
                <span className="quick-stat-value">12,450</span>
              </div>
              <div className="quick-stat-item">
                <span className="quick-stat-label">Счастье</span>
                <span className="quick-stat-value">75%</span>
              </div>
            </div>
          </div>

          <div className="bottom-section-right" ref={bottomButtonsRef}>
            {/* Кнопки управления */}
            <button
              className={`bottom-button ${activePanel === 'policies' ? 'active' : ''}`}
              onClick={() => setActivePanel(activePanel === 'policies' ? null : 'policies')}
              title="Политики"
            >
              📜
            </button>
            <button
              className={`bottom-button ${activePanel === 'stats' ? 'active' : ''}`}
              onClick={() => setActivePanel(activePanel === 'stats' ? null : 'stats')}
              title="Статистика"
            >
              📊
            </button>
            <button
              className={`bottom-button ${activePanel === 'heatmaps' ? 'active' : ''}`}
              onClick={() => setActivePanel(activePanel === 'heatmaps' ? null : 'heatmaps')}
              title="Тепловые карты"
            >
              🗺️
            </button>
            <button className="bottom-button bottom-button-menu" onClick={onBack} title="Меню">
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Панели управления (сайдбары) */}
      {activePanel === 'policies' && (
        <SidebarPanel position={panelPosition} onClose={() => setActivePanel(null)}>
          <h2>Политики</h2>
          <div className="policies-list">
            <div className="policy-item">
              <div className="policy-info">
                <h3>Налог на недвижимость</h3>
                <p>Влияет на стоимость жизни</p>
              </div>
              <div className="policy-controls">
                <input type="range" min="0" max="100" defaultValue="20" />
                <span>20%</span>
              </div>
            </div>
            <div className="policy-item">
              <div className="policy-info">
                <h3>Экологические стандарты</h3>
                <p>Снижает загрязнение</p>
              </div>
              <div className="policy-controls">
                <input type="range" min="0" max="100" defaultValue="50" />
                <span>50%</span>
              </div>
            </div>
            <div className="policy-item">
              <div className="policy-info">
                <h3>Образование</h3>
                <p>Повышает уровень жизни</p>
              </div>
              <div className="policy-controls">
                <input type="range" min="0" max="100" defaultValue="60" />
                <span>60%</span>
              </div>
            </div>
          </div>
        </SidebarPanel>
      )}

      {activePanel === 'stats' && (
        <SidebarPanel position={panelPosition} onClose={() => setActivePanel(null)}>
          <h2>Статистика</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-title">Население</div>
              <div className="stat-card-value">12,450</div>
              <div className="stat-card-change">+5.2%</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-title">Доходы</div>
              <div className="stat-card-value">₽250,000</div>
              <div className="stat-card-change">+2.1%</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-title">Расходы</div>
              <div className="stat-card-value">₽180,000</div>
              <div className="stat-card-change">-1.5%</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-title">Загрязнение</div>
              <div className="stat-card-value">35%</div>
              <div className="stat-card-change">-3.2%</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-title">Трафик</div>
              <div className="stat-card-value">42%</div>
              <div className="stat-card-change">+1.8%</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-title">Стоимость земли</div>
              <div className="stat-card-value">₽5,200</div>
              <div className="stat-card-change">+8.5%</div>
            </div>
          </div>
        </SidebarPanel>
      )}

      {activePanel === 'heatmaps' && (
        <SidebarPanel position={panelPosition} onClose={() => setActivePanel(null)}>
          <h2>Тепловые карты</h2>
          <div className="heatmap-options">
            <button className="heatmap-button">Загрязнение</button>
            <button className="heatmap-button">Трафик</button>
            <button className="heatmap-button">Стоимость земли</button>
            <button className="heatmap-button">Плотность населения</button>
          </div>
          <div className="heatmap-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#00ff00' }}></div>
              <span>Низкий</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ffff00' }}></div>
              <span>Средний</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ff0000' }}></div>
              <span>Высокий</span>
            </div>
          </div>
        </SidebarPanel>
      )}
    </div>
  )
}

