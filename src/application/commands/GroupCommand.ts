import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class GroupCommand extends EditCommand {
  protected override apply(document: SvgDocument): string { this.arity(2, Number.MAX_SAFE_INTEGER); const group = document.group(this.args[0]!, this.args.slice(1)); return `${group.label} created with ${group.children.length} children`; }
}
