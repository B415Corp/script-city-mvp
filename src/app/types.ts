import { CoreConfig } from '@/core/game_core/types';
import { SceneKey } from './scene_controller/types';

/**
 * Опции для запуска игры.
 * Теги: arch:app, tech:phaser
 */
export type GameAppOptions = {
  initialScene?: SceneKey;
  coreConfig?: Partial<CoreConfig>;
};
