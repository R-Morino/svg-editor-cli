import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class DeleteCommand extends EditCommand {
  protected override apply(document: SvgDocument): string {
    this.arity(1);
    return `${document.delete(this.args[0]!).label} deleted`;
  }
}
