import { debugLog } from '@/infrastructure/utils/logger';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { ICommandHandler } from './command_handler';
import {
  ICommand,
  ValidationResult,
  BuildBuildingCommand,
  BulldozeAreaCommand,
  ChangeTaxRateCommand,
  SetPolicyCommand,
  SetSimulationSpeedCommand,
  ZoneTileCommand,
  RemoveZoneCommand,
} from './types';

/**
 * Базовый класс для хэндлеров команд.
 * Предоставляет доступ к EventBus для генерации событий.
 *
 * Теги: `arch:commands`, `arch:core`
 */
export abstract class BaseCommandHandler implements ICommandHandler {
  abstract commandType: string;

  constructor(protected eventBus: EventBus) {}

  abstract validate(command: ICommand): ValidationResult;
  abstract apply(command: ICommand): void;
}

export class BuildBuildingCommandHandler extends BaseCommandHandler {
  commandType = 'BuildBuilding';

  validate(command: ICommand): ValidationResult {
    const cmd = command as BuildBuildingCommand;
    if (!cmd.position || typeof cmd.position.x !== 'number' || typeof cmd.position.y !== 'number') {
      return {
        valid: false,
        error: 'BuildBuilding command requires valid position {x, y}',
      };
    }
    if (!cmd.buildingType || typeof cmd.buildingType !== 'string') {
      return {
        valid: false,
        error: 'BuildBuilding command requires buildingType',
      };
    }
    return { valid: true };
  }

  apply(command: ICommand): void {
    const cmd = command as BuildBuildingCommand;
    this.eventBus.emit(Events.BuildCommandRequested, {
      position: cmd.position,
      buildingType: cmd.buildingType,
    });
  }
}

export class BulldozeAreaCommandHandler extends BaseCommandHandler {
  commandType = 'BulldozeArea';

  validate(command: ICommand): ValidationResult {
    const cmd = command as BulldozeAreaCommand;
    if (
      !cmd.area ||
      typeof cmd.area.x !== 'number' ||
      typeof cmd.area.y !== 'number' ||
      typeof cmd.area.width !== 'number' ||
      typeof cmd.area.height !== 'number'
    ) {
      return {
        valid: false,
        error: 'BulldozeArea command requires valid area {x, y, width, height}',
      };
    }
    return { valid: true };
  }

  apply(command: ICommand): void {
    const cmd = command as BulldozeAreaCommand;
    this.eventBus.emit(Events.DemolishCommandRequested, {
      area: cmd.area,
    });
  }
}

export class ChangeTaxRateCommandHandler extends BaseCommandHandler {
  commandType = 'ChangeTaxRate';

  validate(command: ICommand): ValidationResult {
    const cmd = command as ChangeTaxRateCommand;
    if (!cmd.taxType || typeof cmd.taxType !== 'string') {
      return {
        valid: false,
        error: 'ChangeTaxRate command requires taxType',
      };
    }
    if (typeof cmd.newRate !== 'number' || cmd.newRate < 0 || cmd.newRate > 1) {
      return {
        valid: false,
        error: 'ChangeTaxRate command requires newRate between 0 and 1',
      };
    }
    return { valid: true };
  }

  apply(command: ICommand): void {
    const cmd = command as ChangeTaxRateCommand;
    this.eventBus.emit(Events.ChangeTaxRequested, {
      taxType: cmd.taxType,
      newRate: cmd.newRate,
    });
  }
}

export class SetPolicyCommandHandler extends BaseCommandHandler {
  commandType = 'SetPolicy';

  validate(command: ICommand): ValidationResult {
    const cmd = command as SetPolicyCommand;
    if (!cmd.policyId || typeof cmd.policyId !== 'string') {
      return {
        valid: false,
        error: 'SetPolicy command requires policyId',
      };
    }
    if (typeof cmd.enabled !== 'boolean') {
      return {
        valid: false,
        error: 'SetPolicy command requires enabled boolean',
      };
    }
    return { valid: true };
  }

  apply(command: ICommand): void {
    const cmd = command as SetPolicyCommand;
    this.eventBus.emit(Events.PolicyChangeRequested, {
      policyId: cmd.policyId,
      enabled: cmd.enabled,
    });
  }
}

export class SetSimulationSpeedCommandHandler extends BaseCommandHandler {
  commandType = 'SetSimulationSpeed';

  validate(command: ICommand): ValidationResult {
    const cmd = command as SetSimulationSpeedCommand;
    if (typeof cmd.speedLevel !== 'number' || cmd.speedLevel < 0) {
      return {
        valid: false,
        error: 'SetSimulationSpeed command requires speedLevel >= 0',
      };
    }
    return { valid: true };
  }

  apply(command: ICommand): void {
    const cmd = command as SetSimulationSpeedCommand;
    this.eventBus.emit(Events.SetSimulationSpeedRequested, {
      speedLevel: cmd.speedLevel,
    });
  }
}

export class ZoneTileCommandHandler extends BaseCommandHandler {
  commandType = 'ZoneTile';

  validate(command: ICommand): ValidationResult {
    const cmd = command as ZoneTileCommand;
    if (!cmd.position || typeof cmd.position.x !== 'number' || typeof cmd.position.y !== 'number') {
      return {
        valid: false,
        error: 'ZoneTile command requires valid position {x, y}',
      };
    }
    const validZoneTypes = ['residential_low', 'commercial_low', 'industrial_low'];
    if (!cmd.zoneType || !validZoneTypes.includes(cmd.zoneType)) {
      return {
        valid: false,
        error: `ZoneTile command requires zoneType one of: ${validZoneTypes.join(', ')}`,
      };
    }
    return { valid: true };
  }

  apply(command: ICommand): void {
    const cmd = command as ZoneTileCommand;
    this.eventBus.emit(Events.ZoneTileRequested, {
      position: cmd.position,
      zoneType: cmd.zoneType,
    });
  }
}

export class RemoveZoneCommandHandler extends BaseCommandHandler {
  commandType = 'RemoveZone';

  validate(command: ICommand): ValidationResult {
    const cmd = command as RemoveZoneCommand;
    if (!cmd.position || typeof cmd.position.x !== 'number' || typeof cmd.position.y !== 'number') {
      return {
        valid: false,
        error: 'RemoveZone command requires valid position {x, y}',
      };
    }
    return { valid: true };
  }

  apply(command: ICommand): void {
    const cmd = command as RemoveZoneCommand;
    this.eventBus.emit(Events.RemoveZoneRequested, {
      position: cmd.position,
    });
  }
}
