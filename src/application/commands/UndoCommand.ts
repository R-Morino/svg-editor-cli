import { SessionCommand } from '../SessionCommand.js';
export class UndoCommand extends SessionCommand { override execute(): string[] { this.arity(0); return this.session.undo(); } }
