import { EventBus } from './core/event_bus/event_bus';

async function startGame(): Promise<void> {
  const eventBus = new EventBus();
  await eventBus.init();
  eventBus.getScene('main_scene');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  void startGame();
}
