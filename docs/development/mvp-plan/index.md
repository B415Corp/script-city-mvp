# План разработки MVP и post-MVP

Последнее обновление: 2025-11-23

Этот документ описывает поэтапный план разработки Script City от базового MVP до полноценной игры с мультиплеером и расширенными механиками.

> **Важно**: Этапы не привязаны к конкретным срокам — фокус на логической последовательности и зависимостях между фичами.

---

## Содержание

### MVP

Минимально играбельная версия с основными механиками градостроительства, экономики и транспорта.

- [Этап 0: Фундамент](./mvp/stage-0-foundation.md)  
  **Теги**: `stage:mvp-0`, `arch:core`, `arch:ecs`, `arch:events`, `arch:simulation`, `tech:phaser`, `arch:renderer`, `arch:ui`, `arch:infrastructure`, `status:mvp`
- [Этап 1: Базовая карта и редактор](./mvp/stage-1-map-editor.md)  
  **Теги**: `stage:mvp-1`, `map:isometric`, `map:chunks`, `gameplay:editor`, `gameplay:construction`, `gameplay:zoning`, `transport:road-network`, `building:zoning`, `status:mvp`
- [Этап 2: Основы экономики и населения](./mvp/stage-2-economy-population.md)  
  **Теги**: `stage:mvp-2`, `building:construction`, `building:residential`, `building:commercial`, `building:industrial`, `population:demographics`, `population:social-groups`, `population:employment`, `population:migration`, `economy:budget`, `economy:taxes`, `economy:production`, `economy:consumption`, `economy:import-export`, `status:mvp`
- [Этап 3: Транспорт и дороги](./mvp/stage-3-transport.md)  
  **Теги**: `stage:mvp-3`, `transport:road-network`, `transport:personal`, `transport:routing`, `transport:traffic`, `transport:ownership`, `population:employment`, `status:mvp`
- [Этап 4: Инфраструктура и сервисы](./mvp/stage-4-infrastructure.md)  
  **Теги**: `stage:mvp-4`, `building:utility`, `building:unique`, `arch:module`, `gameplay:construction`, `status:mvp`
- [Этап 5: Отчётность и сохранения](./mvp/stage-5-reports-saves.md)  
  **Теги**: `stage:mvp-5`, `gameplay:statistics`, `gameplay:saves`, `gameplay:settings`, `arch:ui`, `map:heatmaps`, `status:mvp`

### Post-MVP

Расширения и дополнительные механики для полноценной игры.

- [Этап 6: Расширенная транспортная система](./post-mvp/stage-6-advanced-transport.md)  
  **Теги**: `stage:post-6`, `transport:public`, `transport:routes`, `transport:traffic-rules`, `transport:accidents`, `transport:violations`, `transport:cargo`, `transport:parking`, `map:regions`, `multiplayer:regions`, `status:post-mvp`
- [Этап 7: Социальная инфраструктура](./post-mvp/stage-7-social-infrastructure.md)  
  **Теги**: `stage:post-7`, `building:education`, `building:healthcare`, `building:safety`, `building:leisure`, `population:education`, `population:wellbeing`, `event:crime`, `event:fire`, `event:response`, `status:post-mvp`
- [Этап 8: Система политик и законов](./post-mvp/stage-8-policies.md)  
  **Теги**: `stage:post-8`, `policy:economic`, `policy:urban-planning`, `policy:transport`, `policy:environmental`, `policy:social`, `policy:permanent`, `policy:temporary`, `status:post-mvp`
- [Этап 9: Экология и окружающая среда](./post-mvp/stage-9-ecology.md)  
  **Теги**: `stage:post-9`, `ecology:pollution-air`, `ecology:pollution-water`, `ecology:pollution-soil`, `ecology:pollution-noise`, `ecology:cleanup`, `ecology:greening`, `ecology:monitoring`, `ecology:health-impact`, `map:terrain`, `map:terrain-editor`, `map:heatmaps`, `status:post-mvp`
- [Этап 10: События и кризисы](./post-mvp/stage-10-events.md)  
  **Теги**: `stage:post-10`, `event:fire`, `event:crime`, `event:disaster-natural`, `event:disaster-technological`, `event:epidemic`, `event:crisis-economic`, `event:response`, `event:prevention`, `transport:accidents`, `status:post-mvp`
- [Этап 11: Система регионов](./post-mvp/stage-11-regions.md)  
  **Теги**: `stage:post-11`, `map:regions`, `map:chunks`, `map:resources`, `economy:resources`, `economy:production`, `gameplay:construction`, `building:industrial`, `building:residential`, `building:commercial`, `status:post-mvp`
- [Этап 12: Мультиплеер и голосование](./post-mvp/stage-12-multiplayer.md)  
  **Теги**: `stage:post-12`, `multiplayer:server`, `multiplayer:regions`, `multiplayer:trade`, `multiplayer:infrastructure`, `multiplayer:competition`, `multiplayer:cooperation`, `policy:voting`, `policy:ai-players`, `policy:external-influence`, `status:post-mvp`
- [Этап 13: Моддинг и расширяемость](./post-mvp/stage-13-modding.md)  
  **Теги**: `stage:post-13`, `tech:modding`, `arch:extensibility`, `building:unique`, `transport:public`, `economy:goods`, `policy:permanent`, `event:fire`, `status:post-mvp`

---

## Зависимости между этапами

- **Этапы 0-5 (MVP)** должны быть выполнены последовательно, так как каждый зависит от предыдущего.
- **Этапы 6-10 (Post-MVP)** могут разрабатываться частично параллельно, но рекомендуется следовать порядку для логичного расширения функциональности.
- **Этапы 11-13** требуют завершения большей части предыдущих этапов, так как работают с полноценной игрой.

## Приоритизация

В рамках каждого этапа можно варьировать приоритеты в зависимости от целей:

- **Геймплей**: фокус на механиках, влияющих на игровой процесс (транспорт, экономика, население).
- **Визуализация**: фокус на рендере, эффектах, UI/UX.
- **Производительность**: оптимизация, чанкинг, LOD, Web Workers.

## Тестирование

Каждый этап должен включать:

- **Модульное тестирование** систем и компонентов
- **Интеграционное тестирование** взаимодействия модулей
- **Игровое тестирование** (playtesting) для проверки баланса и юзабилити

📖 **Документация**: 
- [Тестирование симуляции](../simulation/testing.md)

## Дополнительные фичи (будущее)

Возможные расширения, не входящие в основной план:

- Погода и сезоны
- Водный транспорт
- Воздушный транспорт
- Импорт реальных карт (OSM)
- Достижения и прогресс

---

## Связанные документы

- [Архитектура и расширяемость](../architecture/index.md)
- [Тики и симуляция](../simulation/index.md)
- [Технический стек](../tech-stack/index.md)
- [Игровые концепции](../../ideas/game-concepts/index.md)
- [Минимальное ядро MVP](../architecture/mvp.md)

---

© 2025 Script City. План разработки обновляется по мере развития проекта.

