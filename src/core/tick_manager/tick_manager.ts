export class TickManager {
  constructor() {
    console.warn('TickManager initialized');
  }

  update(delta: number): void {
    console.warn('TickManager updated', delta);
  }

  start(): void {
    console.warn('TickManager started');
  }

  stop(): void {
    console.warn('TickManager stopped');
  }

  lockSpeedChange(lockId: string, reason?: string): void {
    console.warn('TickManager locked speed change', lockId, reason);
  }

  unlockSpeedChange(lockId: string): void {
    console.warn('TickManager unlocked speed change', lockId);
  }

  isSpeedChangeLocked(): boolean {
    console.warn('TickManager is speed change locked');
    return true;
  }
}
