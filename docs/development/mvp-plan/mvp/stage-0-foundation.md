# Этап 0: Фундамент

**Теги**: `stage:mvp-0`, `arch:core`, `arch:ecs`, `arch:events`, `arch:simulation`, `status:mvp`

**Цель**: Создать архитектурное ядро игры, на котором будут строиться все последующие модули.

---

## Компоненты

### 0.1. Игровое ядро (Core)

**Теги**: `arch:core`, `arch:ecs`, `arch:events`, `arch:module`, `arch:commands`, `arch:simulation`

- **GameCore** — центральная точка управления
- **TickManager** — управление временем и тиками симуляции
- **ECSManager** — Entity-Component-System для игровых объектов
- **EventBus** — событийная шина для межмодульной коммуникации
- **ModuleManager** — регистрация и управление модулями
- **CommandProcessor** — обработка команд от UI

📖 **Документация**: 
- [Игровое ядро](../../architecture/core.md)
- [Жизненный цикл тика](../../simulation/lifecycle.md)
- [События и команды](../../simulation/commands-events.md)

### 0.2. Интеграция с Phaser

**Теги**: `tech:phaser`, `arch:renderer`, `arch:core`

- Инициализация `Phaser.Game`
- Базовая сцена (`MainScene`)
- Связь Phaser с `GameCore`
- Настройка камеры и viewport

📖 **Документация**: 
- [Интеграция с Phaser](../../tech-stack/phaser-integration.md)
- [Слой представления](../../architecture/renderer.md)

### 0.3. Инфраструктурные сервисы

**Теги**: `arch:infrastructure`, `map:isometric`, `map:chunks`

- **IsometricMath** — математика изометрической проекции
- **ChunkManager** — управление чанками карты (подготовка)
- **TileRenderer** — базовый рендер тайлов
- **GameWorld** — модель игрового мира

📖 **Документация**: 
- [Инфраструктурные сервисы](../../architecture/infrastructure.md)

### 0.4. Базовый UI

**Теги**: `arch:ui`, `gameplay:time-control`

- HUD (верхняя панель)
- Меню паузы
- Кнопки управления временем (пауза, нормальная скорость, ускорение)

📖 **Документация**: 
- [UI-слой](../../architecture/ui.md)

---

## Критерии готовности

- ✅ Ядро инициализируется и запускается
- ✅ Тики выполняются с фиксированной частотой
- ✅ События публикуются и обрабатываются
- ✅ Phaser-сцена отображается
- ✅ Камера управляется (движение, зум)

---

## Связанные этапы

- **Следующий этап**: [Этап 1: Базовая карта и редактор](./stage-1-map-editor.md)

---

[← Назад к плану разработки](../index.md)

