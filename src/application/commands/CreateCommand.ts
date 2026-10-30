import { EditCommand } from '../EditCommand.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
import { ShapeFactory } from '../../domain/ShapeFactory.js';
export class CreateCommand extends EditCommand {
  protected override apply(document: SvgDocument): string {
    this.arity(2, Number.MAX_SAFE_INTEGER);
    const params = this.args.slice(2);
    let parent: string | undefined;
    if (params.at(-2) === 'in') {
      parent = params.at(-1)!;
      params.splice(-2);
    }
    const shape = new ShapeFactory().create(this.args[0]!, this.args[1]!, params);
    document.add(shape, parent);
    return `${shape.label} created${parent ? ` in g#${parent}` : ''}`;
  }
}
