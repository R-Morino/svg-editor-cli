import { SessionCommand } from './SessionCommand.js';
import type { UndoableCommand } from './UndoableCommand.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export abstract class EditCommand extends SessionCommand implements UndoableCommand {
  private before?: SvgDocument;
  private after?: SvgDocument;
  private summary = '';
  override execute(): string[] {
    const before = this.session.document.clone();
    const draft = before.clone();
    const summary = this.apply(draft); // All validation/mutations occur off the active document.
    this.before = before; this.after = draft.clone(); this.summary = summary;
    this.session.commit(this, draft);
    return [summary];
  }
  undo(): string[] { if (!this.before) throw new Error('command has not executed'); this.session.restore(this.before); return [`undone: ${this.summary}`]; }
  redo(): string[] { if (!this.after) throw new Error('command has not executed'); this.session.restore(this.after); return [`redone: ${this.summary}`]; }
  protected abstract apply(document: SvgDocument): string;
}
