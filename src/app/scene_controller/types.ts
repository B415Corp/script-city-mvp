import { IModule } from '@/core/module_manager/types';
import Phaser from 'phaser';

/**
 * Типы реестра сцен.
 * Теги: arch:app, tech:phaser
 */
export enum SceneKey {
  Menu = 'MenuScene',
  Game = 'GameScene',
  UI = 'UIScene',
}

export type SceneRegistration = {
  key: SceneKey;
  scene: Phaser.Types.Scenes.SceneType;
};

/**
 * Конфигурация сцены.
 * Теги: arch:app, tech:phaser
 */
export type SceneConfig = {
  key: SceneKey;
  scene: Phaser.Types.Scenes.SceneType;
  modules?: () => IModule[];
};
