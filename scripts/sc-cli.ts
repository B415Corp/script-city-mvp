#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import prompts from 'prompts';
import {
  ArrowFunction,
  ArrayLiteralExpression,
  Node,
  Project,
  PropertyAssignment,
  SyntaxKind,
} from 'ts-morph';

type CLICommand = 'generate';
type GenerateTarget = 'module' | 'scene' | 'system' | 'tool';

type BaseOptions = {
  yes: boolean;
  dryRun: boolean;
};

type ModuleAnswers = {
  moduleId: string;
  moduleClass: string;
  scenes: string[];
  withCommandHandler: boolean;
  commandName?: string;
  withUiScaffold: boolean;
  dependencies: string[];
};

type SceneAnswers = {
  sceneKey: string;
  sceneClass: string;
  modules: string[];
};

type SystemAnswers = {
  systemId: string;
  systemClass: string;
  priority: number;
  updateInterval: number;
  moduleIds: string[];
};

type ToolAnswers = {
  toolId: string;
  toolName: string;
  toolType: string;
  categoryId: string;
  categoryName: string;
  icon: string;
  order: number;
  scenes: string[];
  moduleId: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const project = new Project({
  tsConfigFilePath: path.join(ROOT, 'tsconfig.json'),
  skipAddingFilesFromTsConfig: false,
});

function parseArgs(): { command: CLICommand | null; target: GenerateTarget | null; options: BaseOptions } {
  const args = process.argv.slice(2);
  const options: BaseOptions = {
    yes: args.includes('--yes'),
    dryRun: args.includes('--dry-run'),
  };

  const filtered = args.filter((a) => !a.startsWith('--'));
  const command = (filtered[0] as CLICommand) ?? null;
  const target = (filtered[1] as GenerateTarget) ?? null;
  return { command, target, options };
}

function toPascalCase(input: string): string {
  return input
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toSnakeCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

function toKebabCase(input: string): string {
  return toSnakeCase(input).replace(/_/g, '-');
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeFileSafe(filePath: string, content: string, dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log(`[dry-run] write ${filePath}`);
    return;
  }
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
  console.log(`✔ wrote ${path.relative(ROOT, filePath)}`);
}

function getSceneKeys(): string[] {
  const sceneTypes = project.getSourceFileOrThrow(path.join('src', 'app', 'scene_controller', 'types.ts'));
  const enumDecl = sceneTypes.getEnumOrThrow('SceneKey');
  return enumDecl.getMembers().map((m) => m.getName());
}

function addSceneKey(keyName: string, value: string): void {
  const sceneTypes = project.getSourceFileOrThrow(path.join('src', 'app', 'scene_controller', 'types.ts'));
  const enumDecl = sceneTypes.getEnumOrThrow('SceneKey');
  if (enumDecl.getMember(keyName)) {
    return;
  }
  enumDecl.addMember({ name: keyName, initializer: `'${value}'` });
}

function ensureImport(sourcePath: string, namedImport: string, moduleSpecifier: string): void {
  const source = project.getSourceFile(sourcePath) ?? project.addSourceFileAtPath(path.join(ROOT, sourcePath));
  const existing = source
    .getImportDeclarations()
    .find((decl) => decl.getModuleSpecifierValue() === moduleSpecifier);
  if (existing) {
    if (!existing.getNamedImports().some((i) => i.getName() === namedImport)) {
      existing.addNamedImport(namedImport);
    }
    return;
  }
  source.addImportDeclaration({
    moduleSpecifier,
    namedImports: [namedImport],
  });
}

function getSceneConfigsArray() {
  const source = project.getSourceFileOrThrow(path.join('src', 'app', 'game_app.ts'));
  const sceneConfigVar = source.getVariableDeclarationOrThrow('SCENE_CONFIGS');
  const initializer = sceneConfigVar.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);
  return { source, array: initializer };
}

function findSceneConfig(array: ArrayLiteralExpression, sceneKey: string) {
  return array.getElements().find((el) => {
    if (!Node.isObjectLiteralExpression(el)) return false;
    const keyProp = el.getProperty('key');
    if (!keyProp || !Node.isPropertyAssignment(keyProp)) return false;
    const keyInit = keyProp.getInitializer();
    return keyInit?.getText() === `SceneKey.${sceneKey}`;
  });
}

function ensureModulesProperty(sceneObj: Node, moduleClass: string): void {
  if (!Node.isObjectLiteralExpression(sceneObj)) return;
  const modulesProp = sceneObj.getProperty('modules');
  if (!modulesProp) {
    sceneObj.addPropertyAssignment({
      name: 'modules',
      initializer: `() => [new ${moduleClass}()]`,
    });
    return;
  }

  if (!Node.isPropertyAssignment(modulesProp)) return;
  const init = modulesProp.getInitializer();
  if (!init || !Node.isArrowFunction(init)) return;
  const body = init.getBody();

  if (Node.isArrayLiteralExpression(body)) {
    const exists = body
      .getElements()
      .some((el) => el.getText().replace(/\s+/g, '') === `new${moduleClass}()`.replace(/\s+/g, ''));
    if (!exists) {
      body.addElement(`new ${moduleClass}()`);
    }
    return;
  }

  if (Node.isBlock(body)) {
    const returnStmt = body.getStatements().find((s) => s.getKind() === SyntaxKind.ReturnStatement);
    if (!returnStmt) return;
    const expr = returnStmt.getFirstDescendantByKind(SyntaxKind.ArrayLiteralExpression);
    if (!expr) return;
    const exists = expr
      .getElements()
      .some((el) => el.getText().replace(/\s+/g, '') === `new${moduleClass}()`.replace(/\s+/g, ''));
    if (!exists) {
      expr.addElement(`new ${moduleClass}()`);
    }
  }
}

function addModuleToScenes(moduleClass: string, moduleImport: string, scenes: string[]): void {
  if (!scenes.length) return;
  const { array } = getSceneConfigsArray();
  ensureImport(path.join('src', 'app', 'game_app.ts'), moduleClass, moduleImport);
  scenes.forEach((sceneKey) => {
    const sceneObj = findSceneConfig(array, sceneKey);
    if (!sceneObj) return;
    ensureModulesProperty(sceneObj, moduleClass);
  });
}

function addSceneConfigEntry(sceneKey: string, sceneClass: string, sceneImport: string, moduleIds: string[]): void {
  const { array } = getSceneConfigsArray();
  ensureImport(path.join('src', 'app', 'game_app.ts'), sceneClass, sceneImport);
  const moduleClasses = moduleIds
    .filter(Boolean)
    .map((moduleId) => ({
      className: `${toPascalCase(moduleId)}Module`,
      importPath: `@/modules/${moduleId}/${moduleId}_module`,
    }));
  moduleClasses.forEach((mc) => ensureImport(path.join('src', 'app', 'game_app.ts'), mc.className, mc.importPath));
  const existing = findSceneConfig(array, sceneKey);
  if (existing) {
    return;
  }

  const modulesInitializer =
    moduleClasses.length > 0 ? `modules: () => [${moduleClasses.map((m) => `new ${m.className}()`).join(', ')}],` : '';

  array.addElement(
    `{
  key: SceneKey.${sceneKey},
  scene: ${sceneClass},
  ${modulesInitializer}
}`,
  );
}

function formatCommentTags(tags: string[]): string {
  if (!tags.length) return '';
  return ` * **Теги**: ${tags.map((t) => `\`${t}\``).join(', ')}\n`;
}

async function listModuleIds(): Promise<string[]> {
  try {
    const modulesDir = path.join(SRC, 'modules');
    const entries = await fs.readdir(modulesDir, { withFileTypes: true });
    const ids: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('_')) continue;

      const moduleFile = path.join(modulesDir, entry.name, `${entry.name}_module.ts`);
      try {
        const stat = await fs.stat(moduleFile);
        if (stat.isFile()) {
          ids.push(entry.name);
        }
      } catch {
        // пропускаем директории без основного файла модуля
      }
    }

    return ids;
  } catch {
    return [];
  }
}

async function generateModule(options: BaseOptions): Promise<void> {
  const sceneKeys = getSceneKeys();
  if (options.yes) {
    prompts.override({
      moduleId: 'new_module',
      moduleClass: 'NewModule',
      scenes: [],
      withCommandHandler: false,
      withUiScaffold: false,
      dependencies: [],
    });
  }

  const answers = (await prompts(
    [
      {
        type: 'text',
        name: 'moduleId',
        message: 'ID модуля (значение module.id, латиница/слэш/нижнее подчёркивание)',
        initial: 'new_module',
      },
      {
        type: 'text',
        name: 'moduleClass',
        message: 'Название класса модуля (PascalCase)',
        initial: (prev: string) => `${toPascalCase(prev || 'New')}Module`,
      },
      {
        type: 'multiselect',
        name: 'scenes',
        message: 'Какие сцены подключить автоматически?',
        choices: sceneKeys.map((key) => ({ title: key, value: key })),
      },
      {
        type: 'confirm',
        name: 'withCommandHandler',
        message: 'Нужен ли новый хэндлер команды для CommandProcessor?',
        initial: false,
      },
      {
        type: (prev: boolean) => (prev ? 'text' : null),
        name: 'commandName',
        message: 'Как будет называться тип команды (Command.type)? Пример: SelectTool',
        initial: 'CustomCommand',
      },
      {
        type: 'confirm',
        name: 'withUiScaffold',
        message: 'Создать простой UI-контейнер с названием модуля на сцене?',
        initial: false,
      },
      {
        type: 'list',
        name: 'dependencies',
        message: 'Какие модули должны грузиться раньше? (id через запятую, можно пусто)',
        initial: '',
        separator: ',',
      },
    ],
    { onCancel: () => process.exit(1) },
  )) as ModuleAnswers;

  const moduleFileName = `${answers.moduleId}_module.ts`;
  const moduleDir = path.join(SRC, 'modules', answers.moduleId);
  const modulePath = path.join(moduleDir, moduleFileName);
  const moduleImport = `@/modules/${answers.moduleId}/${answers.moduleId}_module`;
  const deps = (answers.dependencies || []).map((d) => d.trim()).filter(Boolean);
  const depsLiteral = deps.length ? `[${deps.map((d) => `'${d}'`).join(', ')}]` : '[]';
  const uiImports = answers.withUiScaffold ? "import Phaser from 'phaser';\n" : '';
  const uiAttach = answers.withUiScaffold
    ? `
  attachToScene(scene: Phaser.Scene): void {
    const container = scene.add.container(0, 0);
    const label = scene.add.text(16, 16, '${answers.moduleClass}', { color: '#ffffff' });
    container.add(label);
    debugLog('${answers.moduleClass}: UI scaffold attached', { moduleId: this.id });
  }
`
    : '';

  const moduleContent = `${uiImports}import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { debugLog } from '@/infrastructure/utils/logger';

/**
 * Модуль ${answers.moduleId}.
${formatCommentTags(['arch:module', 'status:mvp'])} */
export class ${answers.moduleClass} implements IModule {
  id = '${answers.moduleId}';
  dependencies?: string[] = ${depsLiteral};

  async initialize(core: GameCore): Promise<void> {
    debugLog('${answers.moduleClass} initialized', { moduleId: this.id });
  }

  destroy(): void {
    debugLog('${answers.moduleClass} destroyed', { moduleId: this.id });
  }
${uiAttach}}
`;

  await writeFileSafe(modulePath, moduleContent, options.dryRun);

  if (answers.withCommandHandler && answers.commandName) {
    const handlerClass = `${toPascalCase(answers.commandName)}CommandHandler`;
    const handlerPath = path.join(moduleDir, `${toSnakeCase(answers.commandName)}_command_handler.ts`);
    const handlerContent = `import { BaseCommandHandler } from '@/core/command_processor/handlers';
import { ICommand, ValidationResult } from '@/core/command_processor/types';
import { EventBus } from '@/core/event_bus/event_bus';

/**
 * Хэндлер команды ${answers.commandName}.
${formatCommentTags(['arch:commands', 'arch:module'])} */
export class ${handlerClass} extends BaseCommandHandler {
  commandType = '${answers.commandName}';

  constructor(eventBus: EventBus) {
    super(eventBus);
  }

  validate(command: ICommand): ValidationResult {
    // TODO: добавить конкретную валидацию
    return { valid: true };
  }

  apply(command: ICommand): void {
    // TODO: реализовать применение команды
    this.eventBus.emit('${answers.commandName}:applied', { command });
  }
}
`;
    await writeFileSafe(handlerPath, handlerContent, options.dryRun);
  }

  const indexPath = path.join(moduleDir, 'index.ts');
  if (options.dryRun) {
    console.log(`[dry-run] ensure export in ${indexPath}`);
  } else {
    const exportLine = `export * from './${answers.moduleId}_module';\n`;
    await ensureDir(moduleDir);
    try {
      const existing = await fs.readFile(indexPath, 'utf8');
      if (!existing.includes(exportLine)) {
        await fs.appendFile(indexPath, exportLine, 'utf8');
      }
    } catch {
      await fs.writeFile(indexPath, exportLine, 'utf8');
    }
  }

  addModuleToScenes(answers.moduleClass, moduleImport, answers.scenes);
  if (!options.dryRun) {
    await project.save();
  } else {
    console.log('[dry-run] skip saving project changes (imports, scene configs)');
  }
}

async function generateScene(options: BaseOptions): Promise<void> {
  const existingSceneKeys = getSceneKeys();
  if (options.yes) {
    prompts.override({
      sceneKey: 'Sandbox',
      sceneClass: 'SandboxScene',
      modules: [],
    });
  }

  const answers = (await prompts(
    [
      {
        type: 'text',
        name: 'sceneKey',
        message: 'Новый ключ SceneKey (без суффикса Scene)',
        initial: 'Sandbox',
      },
      {
        type: 'text',
        name: 'sceneClass',
        message: 'Имя класса сцены (PascalCase)',
        initial: (prev: string) => `${toPascalCase(prev || 'Sandbox')}Scene`,
      },
      {
        type: 'list',
        name: 'modules',
        message: 'Какие модули подключать при старте? (id через запятую, можно пусто)',
        initial: '',
        separator: ',',
      },
    ],
    { onCancel: () => process.exit(1) },
  )) as SceneAnswers;

  if (existingSceneKeys.includes(answers.sceneKey)) {
    console.warn(`⚠ SceneKey ${answers.sceneKey} уже существует, новая запись не будет добавлена`);
  }

  const sceneFileName = `${toSnakeCase(answers.sceneClass)}.ts`;
  const scenePath = path.join(SRC, 'scenes', sceneFileName);
  const sceneImport = `@/scenes/${sceneFileName.replace('.ts', '')}`;

  const sceneContent = `import Phaser from 'phaser';
import { SceneInitData } from '@/app/scene_controller/scene_controller';
import { SceneKey } from '@/app/scene_controller/types';
import { GameCore } from '@/core/game_core/game_core';
import { debugLog } from '@/infrastructure/utils/logger';

/**
 * Сцена ${answers.sceneClass}.
${formatCommentTags(['arch:renderer', 'tech:phaser', 'status:mvp'])} */
export class ${answers.sceneClass} extends Phaser.Scene {
  private core!: GameCore;

  constructor() {
    super({ key: '${answers.sceneClass}' });
  }

  init(data: SceneInitData): void {
    this.core = data.core;
  }

  create(): void {
    debugLog('${answers.sceneClass} created', { scene: SceneKey.${answers.sceneKey} });
  }
}
`;

  await writeFileSafe(scenePath, sceneContent, options.dryRun);

  addSceneKey(answers.sceneKey, `${answers.sceneClass}`);
  addSceneConfigEntry(answers.sceneKey, answers.sceneClass, sceneImport, answers.modules);

  if (!options.dryRun) {
    await project.save();
  } else {
    console.log('[dry-run] skip saving project changes (enum + configs)');
  }
}

async function generateSystem(options: BaseOptions): Promise<void> {
  const moduleChoices = await listModuleIds();
  if (options.yes) {
    prompts.override({
      systemId: 'custom_system',
      systemClass: 'CustomSystem',
      priority: 50,
      updateInterval: 1,
      moduleIds: [],
    });
  }

  const answers = (await prompts(
    [
      {
        type: 'text',
        name: 'systemId',
        message: 'ID системы (system.id, строка)',
        initial: 'custom_system',
      },
      {
        type: 'text',
        name: 'systemClass',
        message: 'Имя класса системы (PascalCase)',
        initial: (prev: string) => `${toPascalCase(prev || 'custom_system')}System`,
      },
      {
        type: 'number',
        name: 'priority',
        message: 'Приоритет выполнения (меньше = раньше)',
        initial: 50,
      },
      {
        type: 'number',
        name: 'updateInterval',
        message: 'Интервал обновления в тиках (1 = каждый тик)',
        initial: 1,
      },
      {
        type: 'multiselect',
        name: 'moduleIds',
        message: 'В каких модулях зарегистрировать систему? (можно пропустить)',
        choices: moduleChoices.map((m) => ({ title: m, value: m })),
      },
    ],
    { onCancel: () => process.exit(1) },
  )) as SystemAnswers;

  const systemFileName = `${toSnakeCase(answers.systemId)}_system.ts`;
  const systemPath = path.join(SRC, 'ecs', 'systems', systemFileName);
  const systemContent = `import { EventBus } from '@/core/event_bus/event_bus';
import { ECSManager } from '@/core/ecs_manager/ecs_manager';
import { ISystem } from '@/core/ecs_manager/types';

/**
 * Система ${answers.systemId}.
${formatCommentTags(['arch:ecs', 'status:mvp'])} */
export class ${answers.systemClass} implements ISystem {
  id = '${answers.systemId}';
  priority = ${answers.priority};
  updateInterval = ${answers.updateInterval};

  update(deltaTime: number, ecs: ECSManager, eventBus: EventBus): void {
    // TODO: реализовать логику системы
  }
}
`;

  await writeFileSafe(systemPath, systemContent, options.dryRun);

  // экспорт в index.ts
  const systemsIndex = path.join(SRC, 'ecs', 'systems', 'index.ts');
  const exportLine = `export * from './${systemFileName.replace('.ts', '')}';\n`;
  if (options.dryRun) {
    console.log(`[dry-run] ensure export in ${systemsIndex}`);
  } else {
    try {
      const existing = await fs.readFile(systemsIndex, 'utf8');
      if (!existing.includes(exportLine)) {
        await fs.appendFile(systemsIndex, exportLine, 'utf8');
      }
    } catch {
      await fs.writeFile(systemsIndex, exportLine, 'utf8');
    }
  }

  // Регистрация системы в выбранных модулях
  for (const moduleId of answers.moduleIds) {
    const modulePath = path.join('src', 'modules', moduleId, `${moduleId}_module.ts`);
    const source = project.getSourceFile(modulePath);
    if (!source) {
      console.warn(`⚠ Не найден модуль для автоподключения: ${modulePath}`);
      continue;
    }
    ensureImport(modulePath, answers.systemClass, `@/ecs/systems/${systemFileName.replace('.ts', '')}`);
    ensureImport(modulePath, 'ECSManager', '@/core/ecs_manager/ecs_manager');
    const classDecl = source.getClass(() => true);
    const initializeMethod = classDecl?.getMethod('initialize');
    if (initializeMethod) {
      const body = initializeMethod.getBody();
      body?.addStatements(`core.getECSManager().registerSystem(new ${answers.systemClass}());`);
    }
  }

  if (!options.dryRun) {
    await project.save();
  } else {
    console.log('[dry-run] skip saving project changes (system registration)');
  }
}

async function generateTool(options: BaseOptions): Promise<void> {
  const sceneKeys = getSceneKeys();
  const moduleChoices = await listModuleIds();
  if (options.yes) {
    prompts.override({
      toolId: 'zoning:rectangle',
      toolName: 'Zoning Rectangle',
      toolType: 'select',
      categoryId: 'zoning',
      categoryName: 'Зонирование',
      icon: '🧰',
      order: 10,
      scenes: ['Game'],
      moduleId: 'tools',
    });
  }

  const moduleIdQuestion =
    moduleChoices.length > 0
      ? {
          type: 'select',
          name: 'moduleId',
          message: 'ID модуля, где регистрировать этот инструмент (например tools)',
          choices: moduleChoices.map((m) => ({ title: m, value: m })),
          initial: Math.max(0, moduleChoices.indexOf('tools')),
        }
      : {
          type: 'text',
          name: 'moduleId',
          message: 'ID модуля, где регистрировать этот инструмент (например tools)',
          initial: 'tools',
        };

  const answers = (await prompts(
    [
      moduleIdQuestion,
      {
        type: 'text',
        name: 'toolId',
        message: 'ID инструмента (уникальный, например zoning:rectangle)',
        initial: 'zoning:rectangle',
      },
      {
        type: 'text',
        name: 'toolName',
        message: 'Отображаемое имя инструмента',
        initial: 'Zoning Rectangle',
      },
      {
        type: 'text',
        name: 'toolType',
        message: 'Тип инструмента (значение ToolType или строка)',
        initial: 'select',
      },
      {
        type: 'text',
        name: 'categoryId',
        message: 'ID категории (например zoning)',
        initial: 'zoning',
      },
      {
        type: 'text',
        name: 'categoryName',
        message: 'Название категории (как увидит пользователь)',
        initial: 'Зонирование',
      },
      {
        type: 'text',
        name: 'icon',
        message: 'Иконка (emoji или короткий текст)',
        initial: '🧰',
      },
      {
        type: 'number',
        name: 'order',
        message: 'Порядок в категории (меньше = выше)',
        initial: 10,
      },
      {
        type: 'multiselect',
        name: 'scenes',
        message: 'В каких сценах подключить модуль инструментов?',
        choices: sceneKeys.map((key) => ({ title: key, value: key })),
        initial: ['Game'],
      },
    ],
    { onCancel: () => process.exit(1) },
  )) as ToolAnswers;

  const toolSlug = toKebabCase(answers.toolId.replace(':', '-'));
  const toolDir = path.join(SRC, 'core', 'tool_manager', 'tools');
  const toolPath = path.join(toolDir, `${toolSlug}_tool.ts`);
  const toolClass = `${toPascalCase(toolSlug)}Tool`;
  const toolImport = `@/core/tool_manager/tools/${toolSlug}_tool`;

  const toolContent = `import { ToolRegistration } from '@/core/tool_manager/types';

/**
 * Инструмент ${answers.toolId}.
${formatCommentTags(['arch:tools', 'gameplay:editor', 'status:mvp'])} */
export function create${toolClass}(): ToolRegistration {
  return {
    category: {
      id: '${answers.categoryId}',
      name: '${answers.categoryName}',
      icon: '${answers.icon}',
      order: ${answers.order},
    },
    tool: {
      id: '${answers.toolId}',
      name: '${answers.toolName}',
      type: '${answers.toolType}',
      icon: '${answers.icon}',
      categoryId: '${answers.categoryId}',
      order: ${answers.order},
      behavior: {
        onUse: (context) => {
          // TODO: реализовать логику onUse
          context.enqueueCommand({
            type: 'SelectTool',
            timestamp: Date.now(),
            toolId: '${answers.toolId}',
          } as any);
        },
      },
    },
  };
}
`;

  await writeFileSafe(toolPath, toolContent, options.dryRun);

  // Автоподключение в модуль
  const moduleFile = path.join(SRC, 'modules', answers.moduleId, `${answers.moduleId}_module.ts`);
  const modulePathRel = path.relative(ROOT, moduleFile);
  const moduleSource = project.getSourceFile(modulePathRel);
  if (moduleSource) {
    ensureImport(modulePathRel, 'ToolRegistration', '@/core/tool_manager/types');
    ensureImport(modulePathRel, 'ToolManager', '@/core/tool_manager/tool_manager');
    ensureImport(modulePathRel, 'GameCore', '@/core/game_core/game_core');
    ensureImport(modulePathRel, 'create' + toolClass, toolImport);

    const classDecl = moduleSource.getClass(() => true);
    const initialize = classDecl?.getMethod('initialize');
    if (initialize) {
      const body = initialize.getBody();
      const registerStatement = `let toolManager: ToolManager | undefined;
    try {
      toolManager = core.getToolManager();
    } catch (error) {
      // ToolManager может быть не инициализирован к этому моменту
    }

    if (toolManager) {
      toolManager.registerTool(create${toolClass}());
    }`;
      body?.addStatements(registerStatement);
    }
  } else {
    console.warn(`⚠ Не найден модуль ${answers.moduleId} для автоподключения инструмента`);
  }

  // Добавим модуль в сцены (если его там нет)
  const moduleClass = `${toPascalCase(answers.moduleId)}Module`;
  const moduleImport = `@/modules/${answers.moduleId}/${answers.moduleId}_module`;
  addModuleToScenes(moduleClass, moduleImport, answers.scenes);

  if (!options.dryRun) {
    await project.save();
  } else {
    console.log('[dry-run] skip saving project changes (tool wiring)');
  }
}

async function main() {
  const { command, target, options } = parseArgs();
  if (command !== 'generate' || !target) {
    console.log('Usage: sc-cli generate <module|scene|system|tool> [--yes] [--dry-run]');
    process.exit(0);
  }

  switch (target) {
    case 'module':
      await generateModule(options);
      break;
    case 'scene':
      await generateScene(options);
      break;
    case 'system':
      await generateSystem(options);
      break;
    case 'tool':
      await generateTool(options);
      break;
    default:
      console.error(`Unknown generate target: ${target}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

