import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class UngroupCommand extends EditCommand {
  protected override apply(document: SvgDocument): string { this.arity(1); document.ungroup(this.args[0]!); return `g#${this.args[0]} ungrouped`; }
}
