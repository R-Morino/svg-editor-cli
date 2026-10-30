import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class MoveCommand extends EditCommand {
  protected override apply(document: SvgDocument): string {
    this.arity(3);
    const shape = document.find(this.args[0]!);
    const dx = this.number(1, 'dx');
    const dy = this.number(2, 'dy');
    shape.move(dx, dy);
    return `${shape.label} moved by (${dx},${dy})`;
  }
}
