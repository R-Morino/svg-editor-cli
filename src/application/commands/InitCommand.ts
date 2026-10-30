import { SessionCommand } from '../SessionCommand.js';
export class InitCommand extends SessionCommand {
  override execute(): string[] {
    this.arity(0, 2);
    return this.session.init(
      this.args[0] === undefined ? 800 : this.number(0, 'width'),
      this.args[1] === undefined ? 600 : this.number(1, 'height'),
    );
  }
}
