export class CommandProcessor {
  constructor() {
    console.warn('CommandProcessor initialized');
  }

  processCommand(command: unknown): void {
    console.warn('CommandProcessor processed command', command);
  }
}
