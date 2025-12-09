# Подробный пример: кнопка выбора инструмента (UI → SelectTool)

> Сверьтесь с `docs/core_schema.md` и `docs/dev_instructions/workflow.md`. Используйте только публичный API (`ToolManager`, `CommandProcessor`, `EventBus`), не обращайтесь к приватным полям.

**Теги**: `arch:ui`, `arch:commands`, `arch:events`, `arch:module`, `arch:tools`, `gameplay:editor`, `status:mvp`, `doc:detailed`

**Расположение файла**: `docs/dev_instructions/detailed_examples/ui_tool_button.md` (если папки `docs/dev_instructions/detailed_examples/` нет — создайте её перед добавлением файла).

## Цель
Сделать кнопку в `UiScene`, которая активирует инструмент через команду `SelectTool`, реагирует на `ToolActivated` и отображает состояние выбранного инструмента.

## Предпосылки
- В `SCENE_CONFIGS` подключены `ToolManagerModule` и любые модули, которые регистрируют инструменты.
- В `ToolManagerModule` (или другом модуле) зарегистрирован хэндлер команды `SelectTool`.
- `UiScene` получает `GameCore` из `SceneInitData` и может подписываться на `EventBus`.

## Шаги
1. **Где писать код кнопки**: откройте `src/scenes/ui_scene.ts` (файл UI-сцены в проекте) и добавьте логику кнопки в метод `create`. Если у вас другая сцена для UI, используйте её файл.
2. **Подтяните ToolManagerModule**: в конфиге сцены оставьте модуль активным, чтобы `ToolManager` был подписан на `TileClicked/TileHovered` и умел менять активный инструмент.
3. **Подготовьте UI-кнопку**: в `UiScene.create` создайте кнопку (Phaser или ваш UI-слой) и сохраните `toolId`, который она выбирает.
4. **Отправляйте команду**: на `pointerup/click` собирайте DTO и вызывайте `commandProcessor.enqueueCommand`. Не мутируйте ToolManager напрямую.
5. **Слушайте состояние**: подпишитесь на `Events.ToolActivated`, чтобы визуально выделять активную кнопку.
6. **Очистка**: при уничтожении UI снимите подписки с `EventBus`.

## Пример кода (UiScene)
```ts
// UiScene.ts
import { Events } from '../../src/core/events'; // публичный enum событий

export class UiScene extends Phaser.Scene {
  private core!: GameCore;
  private button!: Phaser.GameObjects.Rectangle;
  private toolId = 'build_house_small';
  private unsubscribe?: () => void;

  create(data: SceneInitData) {
    this.core = data.core;
    const commandProcessor = this.core.getCommandProcessor();
    const eventBus = this.core.getEventBus();

    this.button = this.add.rectangle(60, 60, 120, 36, 0x3a86ff).setInteractive();
    this.add.text(20, 50, 'Дом (инструмент)', { fontSize: '14px' });

    this.button.on('pointerup', () => {
      commandProcessor.enqueueCommand({
        type: 'SelectTool',
        toolId: this.toolId,
        timestamp: Date.now(),
      });
    });

    const onToolActivated = ({ toolId }: { toolId: string }) => {
      const isActive = toolId === this.toolId;
      this.button.setFillStyle(isActive ? 0x4caf50 : 0x3a86ff);
    };

    eventBus.on(Events.ToolActivated, onToolActivated);
    this.unsubscribe = () => eventBus.off(Events.ToolActivated, onToolActivated);
  }

  shutdown() {
    this.unsubscribe?.();
  }
}
```

## Что проверить
- Команда `SelectTool` проходит в `CommandProcessor` без ошибок (`CommandRejected` отсутствует).
- При активации инструмента приходит `Events.ToolActivated`, и UI меняет визуальное состояние.
- Другие кнопки для инструментов должны аналогично отправлять `SelectTool` с разными `toolId`.

