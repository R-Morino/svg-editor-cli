import type { Command } from './Command.js';
import type { EditorSession } from './EditorSession.js';
import { Numeric } from '../domain/Numeric.js';
export abstract class SessionCommand implements Command {
  constructor(
    protected readonly session: EditorSession,
    protected readonly args: readonly string[],
  ) {}
  abstract execute(): string[];
  protected arity(min: number, max = min): void {
    if (this.args.length < min || this.args.length > max)
      throw new Error('invalid arguments. use help for syntax');
  }
  protected number(index: number, name: string): number {
    return Numeric.parse(this.args[index]!, name);
  }
}
