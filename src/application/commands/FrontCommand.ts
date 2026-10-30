import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class FrontCommand extends EditCommand {
  protected override apply(document: SvgDocument): string { this.arity(1); document.reorder(this.args[0]!, true); return `${document.find(this.args[0]!).label} moved to front`; }
}
