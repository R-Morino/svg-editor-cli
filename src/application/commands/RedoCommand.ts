import { SessionCommand } from '../SessionCommand.js';
export class RedoCommand extends SessionCommand {
  override execute(): string[] {
    this.arity(0);
    return this.session.redo();
  }
}
