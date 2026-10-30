import { SessionCommand } from '../SessionCommand.js';
export class ReadCommand extends SessionCommand {
  override execute(): string[] {
    this.arity(1);
    return this.session.read(this.args[0]!);
  }
}
