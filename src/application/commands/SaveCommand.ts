import { SessionCommand } from '../SessionCommand.js';
export class SaveCommand extends SessionCommand {
  override execute(): string[] {
    this.arity(0, 1);
    return this.session.save(this.args[0]);
  }
}
