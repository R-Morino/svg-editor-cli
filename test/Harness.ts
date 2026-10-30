import { CommandDispatcher } from '../src/cli/CommandDispatcher.js';
import { EditorSession } from '../src/application/EditorSession.js';
import { MemoryStore } from './MemoryStore.js';

export class Harness {
  readonly session = new EditorSession(new MemoryStore());
  readonly cli = new CommandDispatcher(this.session);
  run(...lines: string[]): string[] {
    return lines.flatMap((line) => this.cli.execute(line));
  }
}
