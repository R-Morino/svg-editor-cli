import { Shape } from './Shape.js';
import { Numeric } from './Numeric.js';
export class Group extends Shape {
  private members: Shape[] = [];
  constructor(id: string) {
    super(id);
  }
  override get type(): string {
    return 'g';
  }
  override get children(): readonly Shape[] {
    return [...this.members];
  }
  override describe(): string {
    return `${this.label}${this.appearanceSummary()}`;
  }
  override move(dx: number, dy: number): void {
    Numeric.parse(dx, 'dx');
    Numeric.parse(dy, 'dy');
    for (const child of this.members) child.move(dx, dy);
  }
  override scale(factor: number): void {
    Numeric.positive(factor, 'scale factor');
    for (const child of this.members) child.scale(factor);
  }
  override clone(): Group {
    const result = new Group(this.id);
    this.copyAppearance(result);
    for (const child of this.members) result.insert(child.clone());
    return result;
  }
  contains(shape: Shape): boolean {
    return (
      this === shape ||
      this.members.some(
        (child) => child === shape || (child instanceof Group && child.contains(shape)),
      )
    );
  }
  insert(shape: Shape, index = this.members.length): void {
    if (shape === this || (shape instanceof Group && shape.contains(this)))
      throw new Error(`cannot add a container into its own descendant: ${shape.id}`);
    if (this.contains(shape)) throw new Error(`shape already belongs to container: ${shape.id}`);
    this.members.splice(index, 0, shape);
  }
  remove(shape: Shape): void {
    const index = this.members.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.id}`);
    this.members.splice(index, 1);
  }
  indexOf(shape: Shape): number {
    return this.members.indexOf(shape);
  }
}
