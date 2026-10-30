import { SessionCommand } from '../SessionCommand.js';
import { DocumentView } from '../DocumentView.js';
export class ShowCommand extends SessionCommand { override execute(): string[] { this.arity(1); return new DocumentView().show(this.session.document, this.args[0]!); } }
