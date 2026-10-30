import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class BackCommand extends EditCommand {
  protected override apply(document: SvgDocument): string { this.arity(1); document.reorder(this.args[0]!, false); return `${document.find(this.args[0]!).label} moved to back`; }
}
