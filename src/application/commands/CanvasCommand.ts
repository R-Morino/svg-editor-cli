import { SessionCommand } from '../SessionCommand.js';
export class CanvasCommand extends SessionCommand {
  override execute(): string[] { this.arity(0, 2); const document = this.session.document; if (!this.args.length) return [`canvas ${document.width}x${document.height}`]; return this.session.resize(this.number(0, 'width'), this.args[1] === undefined ? document.height : this.number(1, 'height')); }
}
