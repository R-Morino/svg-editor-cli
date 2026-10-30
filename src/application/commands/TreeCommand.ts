import { SessionCommand } from '../SessionCommand.js';
import { DocumentView } from '../DocumentView.js';
export class TreeCommand extends SessionCommand {
  override execute(): string[] {
    this.arity(0, 1);
    return new DocumentView().tree(this.session.document, this.args[0]);
  }
}
