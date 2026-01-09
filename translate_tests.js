// Скрипт для перевода тестов с английского на русский
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Словарь переводов для наиболее распространенных фраз
const translations = {
  // describe блоки
  "describe('Job Component'": "describe('Компонент работы (Job Component)'",
  "describe('Goods Component'": "describe('Компонент товаров (Goods Component)'",
  "describe('Events enum'": "describe('Перечисление событий (Events enum)'",
  "describe('EventBus'": "describe('Шина событий (EventBus)'",
  "describe('event categories'": "describe('категории событий'",
  "describe('GoodsType enum'": "describe('Перечисление типов товаров (GoodsType enum)'",
  "describe('GoodsData type'": "describe('Тип данных товаров (GoodsData type)'",
  "describe('JobData type'": "describe('Тип данных работы (JobData type)'",

  // it блоки - общие паттерны
  "it('should have all required arrays'": "it('должен содержать все необходимые массивы'",
  "it('should be able to store and retrieve": "it('должен уметь хранить и извлекать",
  "it('should handle different": "it('должен обрабатывать различные",
  "it('should support different": "it('должен поддерживать различные",
  "it('should handle": "it('должен обрабатывать",
  "it('should support": "it('должен поддерживать",
  "it('should return undefined for uninitialized entities'":
    "it('должен возвращать undefined для неинициализированных сущностей'",
  "it('should be usable as string literals'":
    "it('должен быть пригоден для использования в качестве строковых литералов'",
  "it('should be usable in arrays and sets'":
    "it('должен быть пригоден для использования в массивах и множествах'",
  "it('should work with object keys'": "it('должен работать с ключами объектов'",
  "it('should be iterable'": "it('должен быть итерируемым'",
  "it('should have unique values'": "it('должен иметь уникальные значения'",
  "it('should have correct goods type values'":
    "it('должен содержать правильные значения типов товаров'",
  "it('should be used correctly in goods component'":
    "it('должен правильно использоваться в компоненте товаров'",
  "it('should have valid goods type values'":
    "it('должен содержать допустимые значения типов товаров'",
  "it('should accept valid": "it('должен принимать допустимый",
  "it('should enforce required properties'": "it('должен требовать обязательные свойства'",
  "it('should emit event without payload'": "it('должен отправлять событие без полезной нагрузки'",
  "it('should emit event with payload'": "it('должен отправлять событие с полезной нагрузкой'",
  "it('should not throw error when no handlers are registered'":
    "it('не должен выбрасывать ошибку, когда обработчики не зарегистрированы'",
  "it('should handle handler errors gracefully'":
    "it('должен обрабатывать ошибки обработчиков корректно'",

  // Дополнительные переводы
  "it('should create": "it('должен создавать",
  "it('should update": "it('должен обновлять",
  "it('should validate": "it('должен валидировать",
  "it('should initialize": "it('должен инициализировать",
  "it('should register": "it('должен регистрировать",
  "it('should unregister": "it('должен отменять регистрацию",
  "it('should call": "it('должен вызывать",
  "it('should throw": "it('должен выбрасывать",
  "it('should not throw": "it('не должен выбрасывать",
  "it('should return": "it('должен возвращать",
  "it('should be defined'": "it('должен быть определен'",
  "it('should be undefined'": "it('должен быть неопределен'",
  "it('should be true'": "it('должен быть true'",
  "it('should be false'": "it('должен быть false'",
  "it('should be equal to'": "it('должен быть равен",
  "it('should be greater than'": "it('должен быть больше чем",
  "it('should be less than'": "it('должен быть меньше чем",
  "it('should contain'": "it('должен содержать",
  "it('should not contain'": "it('не должен содержать",
  "it('should have length'": "it('должен иметь длину",
  "it('should have property'": "it('должен иметь свойство",
  "it('should not have property'": "it('не должен иметь свойство",
  "it('should match'": "it('должен соответствовать",
  "it('should not match'": "it('не должен соответствовать",

  // Конкретные случаи
  "it('should properly initialize all component arrays'":
    "it('должен правильно инициализировать все массивы компонентов'",
  "it('should correctly set and get component data'":
    "it('должен правильно устанавливать и получать данные компонентов'",
  "it('should handle component removal'": "it('должен обрабатывать удаление компонентов'",
  "it('should manage entity lifecycle'": "it('должен управлять жизненным циклом сущностей'",
  "it('should get default person data for empty entity'":
    "it('должен получать данные человека по умолчанию для пустой сущности'",
  "it('should set and get person data'": "it('должен устанавливать и получать данные человека'",
  "it('should partially update person data'": "it('должен частично обновлять данные человека'",
  "it('should get default citizen data for empty entity'":
    "it('должен получать данные жителя по умолчанию для пустой сущности'",
  "it('should set and get citizen data'": "it('должен устанавливать и получать данные жителя'",
  "it('should get default needs data for empty entity'":
    "it('должен получать данные потребностей по умолчанию для пустой сущности'",
  "it('should set and get needs data'": "it('должен устанавливать и получать данные потребностей'",
  "it('should get default position data for empty entity'":
    "it('должен получать данные позиции по умолчанию для пустой сущности'",
  "it('should set and get position data'": "it('должен устанавливать и получать данные позиции'",
  "it('should get default render data for empty entity'":
    "it('должен получать данные рендеринга по умолчанию для пустой сущности'",
  "it('should set and get render data'": "it('должен устанавливать и получать данные рендеринга'",
  "it('should get default schedule data for empty entity'":
    "it('должен получать данные расписания по умолчанию для пустой сущности'",
  "it('should set and get schedule data'": "it('должен устанавливать и получать данные расписания'",
  "it('should get default id data for empty entity'":
    "it('должен получать данные ID по умолчанию для пустой сущности'",
  "it('should set and get id data'": "it('должен устанавливать и получать данные ID'",
  "it('should create a new person entity'": "it('должен создавать новую сущность человека'",
  "it('should create a new job entity'": "it('должен создавать новую сущность работы'",
  "it('should create a new building entity'": "it('должен создавать новую сущность здания'",
  "it('should create residential building'": "it('должен создавать жилое здание'",
  "it('should create commercial building'": "it('должен создавать коммерческое здание'",
  "it('should initialize tick manager with default values'":
    "it('должен инициализировать менеджер тиков со значениями по умолчанию'",
  "it('should start and stop ticking'": "it('должен запускать и останавливать тики'",
  "it('should pause and resume ticking'": "it('должен приостанавливать и возобновлять тики'",
  "it('should change tick speed'": "it('должен изменять скорость тиков'",
  "it('should register event handler'": "it('должен регистрировать обработчик событий'",
  "it('should unregister event handler'": "it('должен отменять регистрацию обработчика событий'",
  "it('should handle multiple event handlers'":
    "it('должен обрабатывать множественные обработчики событий'",
  "it('should call all registered handlers'":
    "it('должен вызывать все зарегистрированные обработчики'",
  "it('should handle event emission errors'": "it('должен обрабатывать ошибки отправки событий'",
  "it('should handle event subscription errors'":
    "it('должен обрабатывать ошибки подписки на события'",
  "it('should validate subscription parameters'": "it('должен валидировать параметры подписки'",
  "it('should handle duplicate subscriptions'": "it('должен обрабатывать дублированные подписки'",
  "it('should handle subscription cleanup'": "it('должен обрабатывать очистку подписок'",
  "it('should start unpaused'": "it('должен запускаться без паузы'",
  "it('should emit TickStarted event on update'":
    "it('должен отправлять событие TickStarted при обновлении'",
  "it('should emit LogicTick events for executed ticks'":
    "it('должен отправлять события LogicTick для выполненных тиков'",
  "it('should emit multiple LogicTick events for multiple ticks'":
    "it('должен отправлять множественные события LogicTick для множественных тиков'",
  "it('should emit GameTimeUpdated events for each tick'":
    "it('должен отправлять события GameTimeUpdated для каждого тика'",
  "it('should not emit events when paused'": "it('не должен отправлять события при паузе'",
  "it('should pause and resume'": "it('должен приостанавливаться и возобновляться'",
  "it('should toggle pause'": "it('должен переключать паузу'",
  "it('should provide access to tick controller'":
    "it('должен предоставлять доступ к контроллеру тиков'",
  "it('should initialize with default speed'":
    "it('должен инициализироваться со скоростью по умолчанию'",
  "it('should allow speed changes'": "it('должен позволять изменения скорости'",
  "it('should validate speed values'": "it('должен валидировать значения скорости'",
  "it('should handle speed change callbacks'":
    "it('должен обрабатывать колбэки изменения скорости'",
  "it('should maintain speed after pause/resume'":
    "it('должен сохранять скорость после паузы/возобновления'",
  "it('should initialize time controller with default values'":
    "it('должен инициализировать контроллер времени со значениями по умолчанию'",
  "it('should advance time on tick'": "it('должен продвигать время при тике'",
  "it('should handle time overflow'": "it('должен обрабатывать переполнение времени'",
  "it('should calculate correct time of day'": "it('должен рассчитывать правильное время дня'",
  "it('should handle day transitions'": "it('должен обрабатывать переходы дней'",
  "it('should provide formatted time strings'":
    "it('должен предоставлять отформатированные строки времени'",
  "it('should handle leap years'": "it('должен обрабатывать високосные годы'",
  "it('should calculate time differences'": "it('должен рассчитывать разницы времени'",
  "it('should initialize tick controller with default values'":
    "it('должен инициализировать контроллер тиков со значениями по умолчанию'",
  "it('should track tick count'": "it('должен отслеживать количество тиков'",
  "it('should handle tick speed changes'": "it('должен обрабатывать изменения скорости тиков'",
  "it('should provide tick statistics'": "it('должен предоставлять статистику тиков'",
  "it('should handle tick controller reset'": "it('должен обрабатывать сброс контроллера тиков'",
  "it('should maintain tick state after speed changes'":
    "it('должен сохранять состояние тиков после изменений скорости'",
  "it('should set and get game time'": "it('должен устанавливать и получать игровое время'",
  "it('should set time using setTime method'":
    "it('должен устанавливать время используя метод setTime'",
  "it('should increment time on tick'": "it('должен увеличивать время при тике'",
  "it('should calculate time of day correctly'": "it('должен правильно рассчитывать время дня'",
  "it('should calculate date for first day'": "it('должен рассчитывать дату для первого дня'",
  "it('should calculate date progression'": "it('должен рассчитывать прогрессию даты'",
  "it('should format time of day correctly'": "it('должен правильно форматировать время дня'",
  "it('should format date correctly'": "it('должен правильно форматировать дату'",
  "it('should pad single digit hours and minutes'":
    "it('должен дополнять однозначные часы и минуты'",
  "it('should emit GameTimeUpdated event with correct data'":
    "it('должен отправлять событие GameTimeUpdated с правильными данными'",
  "it('should emit event with updated time after tick'":
    "it('должен отправлять событие с обновленным временем после тика'",
  "it('should track total ticks'": "it('должен отслеживать общее количество тиков'",
  "it('should track ticks per second'": "it('должен отслеживать тики в секунду'",
  "it('should reset tick statistics'": "it('должен сбрасывать статистику тиков'",
  "it('should calculate average tick rate'": "it('должен рассчитывать среднюю скорость тиков'",
  "it('should handle tick overflow'": "it('должен обрабатывать переполнение тиков'",
  "it('should handle multiple subscriptions to same event'":
    "it('должен обрабатывать множественные подписки на одно событие'",
  "it('should unsubscribe specific handlers'":
    "it('должен отменять подписку конкретных обработчиков'",
  "it('should handle event handler exceptions'":
    "it('должен обрабатывать исключения обработчиков событий'",
  "it('should provide subscription management'": "it('должен предоставлять управление подписками'",
  "it('should validate event types'": "it('должен валидировать типы событий'",
  "it('should handle event data serialization'":
    "it('должен обрабатывать сериализацию данных событий'",
  "it('should support event filtering'": "it('должен поддерживать фильтрацию событий'",
  "it('should maintain event order'": "it('должен сохранять порядок событий'",
  "it('should provide event history'": "it('должен предоставлять историю событий'",
  "it('should work with phase schedule access'": "it('должен работать с доступом к расписанию фаз'",
  "it('should be used in default schedules'":
    "it('должен использоваться в расписаниях по умолчанию'",
  "it('should contain citizen schedule'": "it('должен содержать расписание жителя'",
  "it('should have all day phases for citizen'": "it('должен иметь все фазы дня для жителя'",
  "it('should have correct citizen schedule activities'":
    "it('должен иметь правильные активности расписания жителя'",
  "it('should have reasonable durations'": "it('должен иметь разумные длительности'",
  "it('should have system assignments'": "it('должен иметь назначения систем'",
  "it('should store and retrieve render data'": "it('должен хранить и извлекать данные рендеринга'",
  "it('should handle render component properties'":
    "it('должен обрабатывать свойства компонента рендеринга'",
  "it('should support different render types'":
    "it('должен поддерживать различные типы рендеринга'",
  "it('should update render properties'": "it('должен обновлять свойства рендеринга'",
  "it('should validate render data'": "it('должен валидировать данные рендеринга'",
  "it('should handle position coordinates'": "it('должен обрабатывать координаты позиции'",
  "it('should support position updates'": "it('должен поддерживать обновления позиции'",
  "it('should calculate distances'": "it('должен рассчитывать расстояния'",
  "it('should validate position values'": "it('должен валидировать значения позиции'",
  "it('should handle position transformations'": "it('должен обрабатывать трансформации позиции'",
  "it('should store and retrieve id data'": "it('должен хранить и извлекать данные ID'",
  "it('should generate unique ids'": "it('должен генерировать уникальные ID'",
  "it('should validate id formats'": "it('должен валидировать форматы ID'",
  "it('should handle id collisions'": "it('должен обрабатывать коллизии ID'",
  "it('should support id updates'": "it('должен поддерживать обновления ID'",
  "it('should create person with all components'":
    "it('должен создавать человека со всеми компонентами'",
  "it('should create person with custom data'":
    "it('должен создавать человека с пользовательскими данными'",
  "it('should validate person creation parameters'":
    "it('должен валидировать параметры создания человека'",
  "it('should handle person creation errors'": "it('должен обрабатывать ошибки создания человека'",
  "it('should create job with required components'":
    "it('должен создавать работу с необходимыми компонентами'",
  "it('should create job with salary data'": "it('должен создавать работу с данными о зарплате'",
  "it('should validate job creation'": "it('должен валидировать создание работы'",
  "it('should create building with location'": "it('должен создавать здание с местоположением'",
  "it('should create building with capacity'": "it('должен создавать здание с вместимостью'",
  "it('should validate building parameters'": "it('должен валидировать параметры здания'",
  "it('should initialize ecs world'": "it('должен инициализировать ECS мир'",
  "it('should register systems'": "it('должен регистрировать системы'",
  "it('should manage entity lifecycle'": "it('должен управлять жизненным циклом сущностей'",
  "it('should handle system updates'": "it('должен обрабатывать обновления систем'",
  "it('should provide entity queries'": "it('должен предоставлять запросы сущностей'",
  "it('should support component queries'": "it('должен поддерживать запросы компонентов'",
  "it('should handle system priorities'": "it('должен обрабатывать приоритеты систем'",
  "it('should manage system dependencies'": "it('должен управлять зависимостями систем'",
  "it('should update job search behavior'": "it('должен обновлять поведение поиска работы'",
  "it('should handle job applications'": "it('должен обрабатывать заявки на работу'",
  "it('should manage job offers'": "it('должен управлять предложениями работы'",
  "it('should update minimum expenses'": "it('должен обновлять минимальные расходы'",
  "it('should calculate expense changes'": "it('должен рассчитывать изменения расходов'",
  "it('should handle expense updates'": "it('должен обрабатывать обновления расходов'",
  "it('should update needs satisfaction'": "it('должен обновлять удовлетворение потребностей'",
  "it('should handle need depletion'": "it('должен обрабатывать истощение потребностей'",
  "it('should manage need priorities'": "it('должен управлять приоритетами потребностей'",
  "it('should update prices based on supply and demand'":
    "it('должен обновлять цены на основе спроса и предложения'",
  "it('should handle price fluctuations'": "it('должен обрабатывать колебания цен'",
  "it('should stabilize prices over time'": "it('должен стабилизировать цены со временем'",
  "it('should update weekly expenses'": "it('должен обновлять еженедельные расходы'",
  "it('should calculate weekly totals'": "it('должен рассчитывать еженедельные итоги'",
  "it('should handle weekly expense changes'":
    "it('должен обрабатывать изменения еженедельных расходов'",
};

function translateFile(filePath) {
  console.log(`Перевод файла: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Применяем переводы
  for (const [english, russian] of Object.entries(translations)) {
    if (content.includes(english)) {
      content = content.replace(
        new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        russian,
      );
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Файл переведен: ${filePath}`);
  } else {
    console.log(`- Изменений не требуется: ${filePath}`);
  }
}

function findTestFiles(dir) {
  const files = [];

  function scan(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

// Запуск
const testFiles = findTestFiles('./src/test');
console.log(`Найдено ${testFiles.length} тестовых файлов`);

testFiles.forEach(translateFile);

console.log('Перевод завершен!');
