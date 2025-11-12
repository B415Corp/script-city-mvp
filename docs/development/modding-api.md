# API для модов

Последнее обновление: 2025-11-12

## Введение

Script City предоставляет расширяемый API для создания пользовательских модификаций. Моддинг API позволяет добавлять новые здания, транспорт, политики, правила симуляции и многое другое без изменения исходного кода игры.

## Архитектура моддинга

### Структура мода

```
my-mod/
├── mod.json           # Манифест мода
├── assets/            # Графические ресурсы
│   ├── buildings/
│   ├── vehicles/
│   └── icons/
├── scripts/           # Логика мода
│   ├── index.ts
│   ├── buildings.ts
│   ├── policies.ts
│   └── events.ts
├── configs/           # Конфигурационные файлы
│   ├── balance.json
│   └── translations.json
└── README.md          # Описание мода
```

### Манифест мода (mod.json)

```json
{
  "id": "my-awesome-mod",
  "name": "My Awesome Mod",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Description of what this mod does",
  "gameVersion": "^1.0.0",
  "dependencies": {
    "another-mod": "^2.1.0"
  },
  "entryPoint": "scripts/index.ts",
  "apiVersion": "1.0",
  "tags": ["buildings", "economy", "transport"],
  "compatibility": {
    "conflicts": ["conflicting-mod"],
    "loadAfter": ["base-expansion"]
  }
}
```

## Core API

### Регистрация мода

```typescript
import { ModAPI, ModContext } from '@script-city/mod-api';

export default class MyMod {
  public readonly id = 'my-awesome-mod';
  public readonly version = '1.0.0';

  async onLoad(api: ModAPI, context: ModContext): Promise<void> {
    // Инициализация мода
    console.log('Mod loaded!');
    
    // Регистрация компонентов
    this.registerBuildings(api);
    this.registerPolicies(api);
    this.registerEvents(api);
  }

  async onEnable(api: ModAPI): Promise<void> {
    // Мод активирован
  }

  async onDisable(api: ModAPI): Promise<void> {
    // Мод деактивирован (очистка ресурсов)
  }

  async onUnload(api: ModAPI): Promise<void> {
    // Мод выгружен
  }
}
```

## Buildings API

### Регистрация новых зданий

```typescript
import { BuildingDefinition, BuildingCategory } from '@script-city/mod-api';

function registerBuildings(api: ModAPI) {
  const solarPowerPlant: BuildingDefinition = {
    id: 'solar-power-plant',
    name: 'Solar Power Plant',
    category: BuildingCategory.Power,
    
    // Визуализация
    sprite: 'assets/buildings/solar-plant.png',
    size: { width: 4, height: 4 }, // клетки
    height: 2, // уровни
    
    // Строительство
    buildCost: 150000,
    buildTime: 30, // дней
    maintenanceCost: 2000, // в месяц
    
    // Производство
    production: {
      electricity: 100, // МВт
    },
    
    // Требования
    requirements: {
      roadAccess: true,
      waterAccess: false,
      terrain: ['flat', 'hills'],
      minTech: 3,
    },
    
    // Влияние
    effects: {
      pollution: -10, // снижает загрязнение
      landValue: 5,
      noise: 2,
      jobs: 20,
    },
    
    // Зоны действия
    radius: {
      power: 50, // клетки
      pollution: 30,
    },
    
    // Настройки
    upgradable: true,
    demolishable: true,
    movable: false,
  };

  api.buildings.register(solarPowerPlant);
}
```

### Кастомная логика зданий

```typescript
import { Building, GameState } from '@script-city/mod-api';

class SolarPlantController {
  onTick(building: Building, gameState: GameState) {
    // Производство зависит от времени суток и погоды
    const hour = gameState.time.hour;
    const weather = gameState.weather.current;
    
    let efficiency = 1.0;
    
    // Ночью не работает
    if (hour < 6 || hour > 18) {
      efficiency = 0;
    }
    
    // Облачность снижает эффективность
    if (weather === 'cloudy') {
      efficiency *= 0.6;
    } else if (weather === 'rainy') {
      efficiency *= 0.3;
    }
    
    building.production.electricity *= efficiency;
  }
  
  onUpgrade(building: Building, level: number) {
    // Увеличение мощности при апгрейде
    building.production.electricity *= 1.5;
  }
}

api.buildings.registerController('solar-power-plant', new SolarPlantController());
```

## Transport API

### Новые типы транспорта

```typescript
import { VehicleDefinition, TransportType } from '@script-city/mod-api';

const electricBus: VehicleDefinition = {
  id: 'electric-bus',
  name: 'Electric Bus',
  type: TransportType.PublicTransport,
  
  // Характеристики
  capacity: 80, // пассажиров
  maxSpeed: 70, // км/ч
  acceleration: 1.5, // м/с²
  
  // Стоимость
  purchaseCost: 300000,
  maintenanceCost: 500, // в месяц
  fuelCostPerKm: 0.5, // электричество
  
  // Особенности
  fuelType: 'electricity',
  emissionLevel: 0,
  noiseLevel: 1,
  
  // Требования к инфраструктуре
  requiresCharging: true,
  chargingTime: 120, // минут
  chargingInterval: 300, // км
  
  // Визуализация
  sprite: 'assets/vehicles/electric-bus.png',
  length: 12, // метров
  width: 2.5,
};

api.transport.registerVehicle(electricBus);
```

### Кастомные правила движения

```typescript
import { IntersectionRule, Vehicle, Intersection } from '@script-city/mod-api';

class PriorityBusRule implements IntersectionRule {
  canPass(vehicle: Vehicle, intersection: Intersection): boolean {
    // Автобусы имеют приоритет на специальных перекрестках
    if (vehicle.type === TransportType.PublicTransport) {
      return true;
    }
    
    // Стандартная логика для остальных
    return intersection.hasGreenLight(vehicle.lane);
  }
}

api.transport.addIntersectionRule('priority-bus-intersection', new PriorityBusRule());
```

## Economy API

### Новые товары и ресурсы

```typescript
import { ResourceDefinition, ResourceCategory } from '@script-city/mod-api';

const solarPanel: ResourceDefinition = {
  id: 'solar-panel',
  name: 'Solar Panel',
  category: ResourceCategory.Technology,
  
  // Производство
  productionChain: {
    inputs: {
      silicon: 10,
      glass: 5,
      metal: 3,
    },
    outputAmount: 1,
    productionTime: 2, // дня
    producedBy: ['tech-factory', 'solar-factory'],
  },
  
  // Экономика
  basePrice: 500,
  priceVolatility: 0.2, // 20% колебаний
  storageSpace: 2, // единиц склада
  transportType: 'specialized',
  
  // Импорт/экспорт
  importable: true,
  exportable: true,
  importTax: 0.1,
  exportTax: 0.05,
};

api.economy.registerResource(solarPanel);
```

### Кастомные экономические модели

```typescript
import { Market, Resource } from '@script-city/mod-api';

class SeasonalPriceModel {
  calculatePrice(market: Market, resource: Resource, season: Season): number {
    let basePrice = resource.basePrice;
    
    // Сезонные модификаторы
    if (resource.id === 'heating-fuel' && season === 'winter') {
      basePrice *= 1.5;
    }
    
    // Спрос и предложение
    const supplyDemandRatio = market.supply / market.demand;
    basePrice *= Math.max(0.5, Math.min(2.0, 2 - supplyDemandRatio));
    
    return basePrice;
  }
}

api.economy.registerPricingModel('seasonal', new SeasonalPriceModel());
```

## Policy API

### Создание новых политик

```typescript
import { PolicyDefinition, PolicyCategory, PolicyEffect } from '@script-city/mod-api';

const greenEnergySubsidy: PolicyDefinition = {
  id: 'green-energy-subsidy',
  name: 'Green Energy Subsidy',
  description: 'Subsidize renewable energy production',
  category: PolicyCategory.Environment,
  
  // Стоимость внедрения
  implementationCost: 50000,
  monthlyCost: 10000,
  
  // Эффекты
  effects: [
    {
      type: PolicyEffect.BuildingCost,
      target: ['solar-power-plant', 'wind-turbine'],
      modifier: -0.3, // -30% к стоимости
    },
    {
      type: PolicyEffect.Production,
      target: 'renewable-energy',
      modifier: 0.1, // +10% производства
    },
    {
      type: PolicyEffect.Pollution,
      target: 'air',
      modifier: -0.15, // -15% загрязнения
    },
  ],
  
  // Требования
  requirements: {
    minPopulation: 10000,
    minBudget: 100000,
    requiredBuildings: ['city-hall'],
  },
  
  // Несовместимости
  conflicts: ['fossil-fuel-subsidy'],
  
  // Применение
  applicableRegions: ['all'], // или конкретные регионы
  canBeRepealed: true,
};

api.policies.register(greenEnergySubsidy);
```

### Динамические эффекты политик

```typescript
import { Policy, GameState } from '@script-city/mod-api';

class GreenEnergyPolicyController {
  onApply(policy: Policy, regions: string[], gameState: GameState) {
    // Логика при применении политики
    console.log(`Applied to regions: ${regions.join(', ')}`);
  }
  
  onTick(policy: Policy, gameState: GameState) {
    // Периодическое обновление эффектов
    const renewableProduction = gameState.economy.getProduction('renewable-energy');
    
    if (renewableProduction > 1000) {
      // Дополнительный бонус при высоком производстве
      policy.effects.find(e => e.type === PolicyEffect.Pollution).modifier *= 1.1;
    }
  }
  
  onRepeal(policy: Policy, gameState: GameState) {
    // Очистка при отмене политики
  }
}

api.policies.registerController('green-energy-subsidy', new GreenEnergyPolicyController());
```

## Events API

### Регистрация событий

```typescript
import { GameEvent, EventTrigger, EventOutcome } from '@script-city/mod-api';

const solarStorm: GameEvent = {
  id: 'solar-storm',
  name: 'Solar Storm',
  description: 'A massive solar storm disrupts power grids',
  
  // Условия срабатывания
  trigger: {
    type: EventTrigger.Random,
    probability: 0.01, // 1% в месяц
    conditions: {
      minPopulation: 5000,
      requiredBuildings: ['power-plant'],
    },
  },
  
  // Эффекты
  effects: {
    immediate: {
      powerOutage: 0.5, // 50% отключение
      duration: 3, // дня
    },
    lasting: {
      buildingDamage: {
        'power-plant': 0.1, // 10% урон
        'solar-power-plant': 0.3, // 30% урон
      },
    },
  },
  
  // Варианты реакции
  choices: [
    {
      id: 'emergency-protocol',
      name: 'Activate Emergency Protocol',
      cost: 50000,
      effects: {
        powerOutage: 0.3, // снижение до 30%
        duration: 1, // сокращение до 1 дня
      },
    },
    {
      id: 'do-nothing',
      name: 'Weather the Storm',
      cost: 0,
      effects: {
        // стандартные эффекты
      },
    },
  ],
  
  // Уведомление
  notification: {
    title: 'Solar Storm Warning!',
    message: 'A solar storm is approaching. Power grids may be affected.',
    priority: 'high',
  },
};

api.events.register(solarStorm);
```

## Population API

### Новые социальные группы

```typescript
import { SocialGroup, Needs } from '@script-city/mod-api';

const techWorkers: SocialGroup = {
  id: 'tech-workers',
  name: 'Tech Workers',
  
  // Демография
  ageRange: [25, 45],
  educationLevel: 'high',
  incomeLevel: 'high',
  
  // Потребности
  needs: {
    housing: {
      preferred: ['apartment', 'condo'],
      minQuality: 7,
      budgetShare: 0.3,
    },
    transport: {
      preferred: ['car', 'metro', 'bike'],
      minAccessibility: 8,
    },
    services: {
      required: ['internet', 'coworking', 'gym', 'cafe'],
      preferred: ['entertainment', 'culture'],
    },
    leisure: {
      importance: 'high',
      types: ['tech-events', 'bars', 'sports'],
    },
  },
  
  // Экономическое поведение
  economy: {
    avgIncome: 80000, // в год
    savingsRate: 0.2,
    consumerSpending: 0.6,
  },
  
  // Миграция
  migration: {
    attractedBy: ['tech-hub', 'startup-district'],
    deterredBy: ['high-pollution', 'poor-internet'],
  },
};

api.population.registerSocialGroup(techWorkers);
```

## UI API

### Добавление UI элементов

```typescript
import { UIPanel, UIButton } from '@script-city/mod-api';

function registerUI(api: ModAPI) {
  // Новая панель в интерфейсе
  const renewablePanel: UIPanel = {
    id: 'renewable-energy-panel',
    title: 'Renewable Energy',
    position: 'right',
    icon: 'assets/icons/solar.png',
    
    content: (gameState) => ({
      type: 'panel',
      children: [
        {
          type: 'stat',
          label: 'Solar Production',
          value: gameState.economy.getProduction('solar-energy'),
          unit: 'MW',
        },
        {
          type: 'stat',
          label: 'Wind Production',
          value: gameState.economy.getProduction('wind-energy'),
          unit: 'MW',
        },
        {
          type: 'chart',
          dataSource: 'renewable-energy-history',
          chartType: 'line',
        },
      ],
    }),
  };
  
  api.ui.registerPanel(renewablePanel);
  
  // Кнопка в toolbar
  const renewableButton: UIButton = {
    id: 'toggle-renewable-overlay',
    icon: 'solar',
    tooltip: 'Show renewable energy coverage',
    onClick: () => {
      api.map.toggleOverlay('renewable-coverage');
    },
  };
  
  api.ui.addToolbarButton(renewableButton);
}
```

## Data API

### Доступ к данным игры

```typescript
import { GameState, Building, Citizen } from '@script-city/mod-api';

function analyzeCity(api: ModAPI) {
  const state = api.data.getGameState();
  
  // Статистика зданий
  const buildings = api.data.getBuildings();
  const solarPlants = buildings.filter(b => b.type === 'solar-power-plant');
  console.log(`Solar plants: ${solarPlants.length}`);
  
  // Население
  const citizens = api.data.getCitizens();
  const techWorkers = citizens.filter(c => c.socialGroup === 'tech-workers');
  console.log(`Tech workers: ${techWorkers.length}`);
  
  // Экономика
  const economy = api.data.getEconomy();
  const renewableRevenue = economy.getRevenue('renewable-energy');
  
  // Транспорт
  const traffic = api.data.getTraffic();
  const congestion = traffic.getAverageCongestion();
  
  // Карта
  const map = api.data.getMap();
  const region = map.getRegion('downtown');
}
```

### Сохранение данных мода

```typescript
interface ModSaveData {
  solarPlantUpgrades: Map<string, number>;
  researchProgress: number;
  statistics: {
    totalEnergyProduced: number;
    co2Avoided: number;
  };
}

class MyMod {
  onSave(api: ModAPI): ModSaveData {
    return {
      solarPlantUpgrades: this.upgrades,
      researchProgress: this.research,
      statistics: this.stats,
    };
  }
  
  onLoad(api: ModAPI, savedData: ModSaveData) {
    this.upgrades = savedData.solarPlantUpgrades;
    this.research = savedData.researchProgress;
    this.stats = savedData.statistics;
  }
}
```

## Hooks API

### Жизненный цикл игры

```typescript
api.hooks.on('game:start', (gameState) => {
  console.log('Game started!');
});

api.hooks.on('game:tick', (gameState, deltaTime) => {
  // Каждый тик симуляции
});

api.hooks.on('game:pause', (gameState) => {
  console.log('Game paused');
});

api.hooks.on('game:save', (gameState) => {
  console.log('Saving game...');
});

api.hooks.on('building:built', (building) => {
  console.log(`Built: ${building.name}`);
});

api.hooks.on('citizen:born', (citizen) => {
  console.log(`New citizen: ${citizen.id}`);
});

api.hooks.on('policy:applied', (policy, regions) => {
  console.log(`Policy ${policy.name} applied`);
});
```

## Utilities API

### Вспомогательные функции

```typescript
// Математика
api.utils.math.lerp(0, 100, 0.5); // 50
api.utils.math.clamp(150, 0, 100); // 100
api.utils.math.random(10, 20);

// Геометрия
api.utils.geometry.distance(point1, point2);
api.utils.geometry.isInRadius(point, center, radius);
api.utils.geometry.getNeighbors(cell, radius);

// Время
api.utils.time.daysToTicks(7);
api.utils.time.formatTime(gameState.time);

// Локализация
api.utils.i18n.t('my-mod.solar-plant.name');
api.utils.i18n.addTranslations('en', translations);

// Логирование
api.utils.logger.info('Mod initialized');
api.utils.logger.warn('Low efficiency detected');
api.utils.logger.error('Failed to build');
```

## Конфигурация и баланс

### Файлы конфигурации

```json
// configs/balance.json
{
  "buildings": {
    "solar-power-plant": {
      "production": {
        "base": 100,
        "perLevel": 20
      },
      "costs": {
        "build": 150000,
        "maintenance": 2000
      }
    }
  },
  "economy": {
    "solar-panel": {
      "basePrice": 500,
      "volatility": 0.2
    }
  }
}
```

### Загрузка конфигурации

```typescript
import balance from './configs/balance.json';

api.config.register('my-mod-balance', balance);

// Использование
const solarConfig = api.config.get('my-mod-balance.buildings.solar-power-plant');
```

## Тестирование модов

### Unit тесты

```typescript
import { MockAPI, createTestGameState } from '@script-city/mod-api/testing';

describe('Solar Plant', () => {
  let api: MockAPI;
  let gameState: GameState;
  
  beforeEach(() => {
    api = new MockAPI();
    gameState = createTestGameState();
  });
  
  test('produces electricity during daytime', () => {
    gameState.time.hour = 12;
    const building = api.buildings.create('solar-power-plant');
    
    controller.onTick(building, gameState);
    
    expect(building.production.electricity).toBeGreaterThan(0);
  });
  
  test('no production at night', () => {
    gameState.time.hour = 22;
    const building = api.buildings.create('solar-power-plant');
    
    controller.onTick(building, gameState);
    
    expect(building.production.electricity).toBe(0);
  });
});
```

## Публикация модов

### Упаковка мода

```bash
# Сборка мода
npm run build

# Создание архива
npm run pack

# Результат: my-awesome-mod-1.0.0.zip
```

### Метаданные для каталога

```json
{
  "screenshots": [
    "screenshots/1.png",
    "screenshots/2.png"
  ],
  "video": "https://youtube.com/watch?v=...",
  "website": "https://my-mod-site.com",
  "source": "https://github.com/user/my-mod",
  "license": "MIT",
  "changelog": "CHANGELOG.md"
}
```

## Лучшие практики

1. **Производительность**: избегайте тяжелых вычислений в `onTick`
2. **Совместимость**: тестируйте с популярными модами
3. **Документация**: подробное README и комментарии
4. **Баланс**: не делайте мод слишком OP (overpowered)
5. **Локализация**: поддержка нескольких языков
6. **Версионирование**: семантическое версионирование
7. **Тестирование**: покрытие тестами критичной логики

## Примеры модов

- **Green City Pack**: возобновляемая энергетика
- **Mega Infrastructure**: мосты, тоннели, эстакады
- **Advanced Traffic**: новые типы развязок и ПДД
- **Economic Overhaul**: расширенная экономическая модель
- **Disaster Scenarios**: природные катастрофы

## Поддержка и сообщество

- Discord: [ссылка]
- Форум: [ссылка]
- GitHub: [ссылка]
- Wiki: [ссылка]

---

*API находится в разработке и может изменяться. Следите за обновлениями!*

