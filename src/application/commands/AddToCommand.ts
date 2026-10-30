import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class AddToCommand extends EditCommand {
  protected override apply(document: SvgDocument): string { this.arity(2); document.addTo(this.args[0]!, this.args[1]!); return `${document.find(this.args[1]!).label} added to g#${this.args[0]}`; }
}
