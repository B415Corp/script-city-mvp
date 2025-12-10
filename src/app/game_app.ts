import Phaser from 'phaser';
import { createPhaserConfig } from '@/infrastructure/phaser/phaser_config';
import { GameCore } from '@/core/game_core/game_core';
import { SceneController, SceneInitData } from './scene_controller/scene_controller';
import { SceneConfig, SceneKey } from './scene_controller/types';
import { debugGroup, debugGroupEnd, debugLog } from '@/infrastructure/utils/logger';
import { GameScene } from '@/scenes/game_scene';
import { MenuScene } from '@/scenes/menu_scene';
import { UiScene } from '@/scenes/ui_scene';
import { DebugModule } from '@/modules/debug/debug_module';
import { ToolManagerModule } from '@/modules/tools/tool_manager_module';
import { GameAppOptions } from './types';

/**
 * Конфигурации сцен приложения.
 * Теги: arch:app, tech:phaser
 */
const SCENE_CONFIGS: SceneConfig[] = [
  {
    key: SceneKey.Game,
    scene: GameScene,
    modules: () => [new ToolManagerModule(), new DebugModule()],
  },
  { key: SceneKey.Menu, scene: MenuScene },
  { key: SceneKey.UI, scene: UiScene },
];

const SCENE_REGISTRY = SCENE_CONFIGS.map(({ key, scene }) => ({ key, scene }));

function getSceneConfig(key: SceneKey): SceneConfig | undefined {
  return SCENE_CONFIGS.find((cfg) => cfg.key === key);
}

/**
 * Точка входа для запуска Phaser + GameCore.
 * Теги: arch:app, arch:core, tech:phaser
 */
export async function bootstrapGame(
  options?: GameAppOptions,
): Promise<{ game: Phaser.Game; core: GameCore; sceneController: SceneController }> {
  // 1. Инициализация GameCore
  debugGroup('Инициализация GameCore');
  const core = new GameCore();
  await core.initialize({
    tickRate: options?.coreConfig?.tickRate ?? 20,
    maxCatchUpTicks: options?.coreConfig?.maxCatchUpTicks ?? 5,
    enableDebug: options?.coreConfig?.enableDebug ?? import.meta.env.VITE_DEBUG === 'true',
    playerName: options?.coreConfig?.playerName ?? 'default_player',
  });
  debugGroupEnd();

  // 2. Регистрация модулей для стартовой сцены по конфигу
  debugGroup('Регистрация модулей для стартовой сцены по конфигу');
  const initialScene = options?.initialScene ?? SceneKey.Game;
  const initialSceneConfig = getSceneConfig(initialScene);
  if (!initialSceneConfig) {
    throw new Error(`Конфигурация сцены не найдена для ключа: ${initialScene}`);
  }
  if (initialSceneConfig.modules) {
    const moduleManager = core.getModuleManager();
    initialSceneConfig.modules().forEach((module) => moduleManager.registerModule(module));
    debugLog('Модули стартовой сцены зарегистрированы', {
      scene: initialScene,
      modules: initialSceneConfig.modules().map((m) => m.id),
    });
  }
  debugGroupEnd();

  // 3. Запуск ядра (модули инициализируются автоматически)
  debugGroup('Запуск GameCore');
  await core.start();
  debugGroupEnd();
  debugLog('👾 GameCore запущен');

  // 4. Инициализация Phaser
  debugGroup('Инициализация Phaser');
  const phaserConfig = createPhaserConfig();
  const game = new Phaser.Game(phaserConfig);
  const sceneController = new SceneController(game);
  core.setSceneController(sceneController);
  debugGroupEnd();

  // 5. Регистрация сцен
  debugGroup('Регистрация сцен');
  sceneController.registerScenes(SCENE_REGISTRY);
  debugGroupEnd();

  const initData: SceneInitData = {
    core,
    sceneController,
  };
  debugGroup('Запуск начальной сцены');
  sceneController.startScene(initialScene, initData);
  debugGroupEnd();

  // 6. Обработка событий изменения размера окна
  window.addEventListener('resize', () => {
    sceneController.resize(window.innerWidth, window.innerHeight);
    debugLog('Resize handled', { width: window.innerWidth, height: window.innerHeight });
  });

  // 7. Возврат результатов
  return { game, core, sceneController };
}
