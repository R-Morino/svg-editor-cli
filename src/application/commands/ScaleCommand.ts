import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class ScaleCommand extends EditCommand {
  protected override apply(document: SvgDocument): string {
    this.arity(2);
    const shape = document.find(this.args[0]!);
    const factor = this.number(1, 'scale factor');
    shape.scale(factor);
    return `${shape.label} scaled by ${factor}`;
  }
}
