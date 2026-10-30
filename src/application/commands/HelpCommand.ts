import { SessionCommand } from '../SessionCommand.js';
import type { EditorSession } from '../EditorSession.js';
export class HelpCommand extends SessionCommand {
  constructor(
    session: EditorSession,
    args: readonly string[],
    private readonly usage: () => string[],
  ) {
    super(session, args);
  }
  override execute(): string[] {
    this.arity(0);
    return this.usage();
  }
}
