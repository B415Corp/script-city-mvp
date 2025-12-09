import { EventBus } from './event_bus';
import { Events } from './events';
import { debugLog } from '@/infrastructure/utils/logger';

/**
 * Интерфейс записи истории событий для отладки.
 *
 * Теги: `arch:debug`, `feature:telemetry`
 */
export interface EventHistoryEntry {
  eventType: string;
  timestamp: number;
  payload?: unknown;
}

/**
 * Декоратор EventBus с телеметрией для разработки.
 * Добавляет историю событий, метрики производительности и отладочный вывод.
 *
 * Используется только в dev-режиме для анализа производительности и отладки.
 *
 * Теги: `arch:debug`, `feature:telemetry`, `dev:tool`
 */
export class DevEventBus extends EventBus {
  /**
   * История последних событий (для отладки).
   */
  private eventHistory: EventHistoryEntry[] = [];
  private readonly MAX_HISTORY_SIZE = 100;

  /**
   * События, которые не нужно сохранять в историю.
   */
  private readonly EXCLUDED_FROM_HISTORY = new Set<string>([
    Events.TickStarted,
    Events.TickEnded,
    Events.BuildingLevelUp,
  ]);

  /**
   * Метрики производительности.
   */
  private eventMetrics = new Map<string, {
    count: number;
    totalTime: number;
    maxTime: number;
    lastTime: number;
  }>();

  emit<T = unknown>(eventType: Events | string, payload?: T): void {
    const startTime = performance.now();

    // Добавляем событие в историю
    this.addToHistory(eventType, payload);

    // Вызываем родительский метод
    super.emit(eventType, payload);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Обновляем метрики
    this.updateMetrics(eventType, duration);

    // Логируем медленные события
    if (duration > 5) { // > 5ms считается медленным
      debugLog(`🐌 Медленное событие: ${eventType}`, {
        duration: `${duration.toFixed(2)}ms`,
        payload: typeof payload === 'object' ? Object.keys(payload as object) : payload
      });
    }
  }

  /**
   * Добавляет событие в историю.
   */
  private addToHistory(eventType: string, payload?: unknown): void {
    // Не добавляем исключенные события в историю
    if (this.EXCLUDED_FROM_HISTORY.has(eventType)) {
      return;
    }

    this.eventHistory.push({
      eventType,
      timestamp: Date.now(),
      payload,
    });

    // Ограничиваем размер истории
    if (this.eventHistory.length > this.MAX_HISTORY_SIZE) {
      this.eventHistory.shift();
    }
  }

  /**
   * Обновляет метрики производительности для события.
   */
  private updateMetrics(eventType: string, duration: number): void {
    const existing = this.eventMetrics.get(eventType) || {
      count: 0,
      totalTime: 0,
      maxTime: 0,
      lastTime: 0,
    };

    existing.count++;
    existing.totalTime += duration;
    existing.maxTime = Math.max(existing.maxTime, duration);
    existing.lastTime = duration;

    this.eventMetrics.set(eventType, existing);
  }

  /**
   * Получение истории последних событий (для отладки).
   */
  getEventHistory(): EventHistoryEntry[] {
    return [...this.eventHistory];
  }

  /**
   * Получение метрик производительности.
   */
  getEventMetrics(): Map<string, {
    count: number;
    totalTime: number;
    maxTime: number;
    lastTime: number;
    averageTime: number;
  }> {
    const result = new Map<string, {
      count: number;
      totalTime: number;
      maxTime: number;
      lastTime: number;
      averageTime: number;
    }>();

    for (const [eventType, metrics] of this.eventMetrics) {
      result.set(eventType, {
        ...metrics,
        averageTime: metrics.totalTime / metrics.count,
      });
    }

    return result;
  }

  /**
   * Очистка истории и метрик.
   */
  clearTelemetry(): void {
    this.eventHistory = [];
    this.eventMetrics.clear();
    debugLog('🧹 DevEventBus: телеметрия очищена');
  }

  /**
   * Логирование сводки по событиям.
   */
  logEventSummary(): void {
    const metrics = this.getEventMetrics();
    const history = this.getEventHistory();

    debugLog('📊 EventBus Summary:', {
      totalEventsInHistory: history.length,
      uniqueEventTypes: metrics.size,
      topEventsByCount: Array.from(metrics.entries())
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5)
        .map(([type, m]) => `${type}: ${m.count} (${m.averageTime.toFixed(2)}ms avg)`),
    });
  }
}
