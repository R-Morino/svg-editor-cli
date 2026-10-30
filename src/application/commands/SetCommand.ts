import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class SetCommand extends EditCommand {
  protected override apply(document: SvgDocument): string {
    this.arity(3);
    const shape = document.find(this.args[0]!);
    shape.set(this.args[1]!, this.args[2]!);
    return `${shape.label} updated: ${this.args[1]}=${JSON.stringify(this.args[2])}`;
  }
}
