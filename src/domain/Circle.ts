import { GeometryShape } from './GeometryShape.js';
export class Circle extends GeometryShape {
  constructor(id: string, cx: number, cy: number, r: number) { super(id, { cx, cy, r }, ['cx'], ['cy'], ['r']); }
  override get type(): string { return 'circle'; }
  override describe(): string { return `${this.label}  cx=${this.value('cx')} cy=${this.value('cy')} r=${this.value('r')}${this.appearanceSummary()}`; }
  protected override copyGeometry(): Circle { return new Circle(this.id, this.value('cx'), this.value('cy'), this.value('r')); }
}
