import { GeometryShape } from './GeometryShape.js';
export class Rect extends GeometryShape {
  constructor(id: string, x: number, y: number, width: number, height: number) { super(id, { x, y, width, height }, ['x'], ['y'], ['width', 'height']); }
  override get type(): string { return 'rect'; }
  override describe(): string { return `${this.label}  x=${this.value('x')} y=${this.value('y')} w=${this.value('width')} h=${this.value('height')}${this.appearanceSummary()}`; }
  protected override copyGeometry(): Rect { return new Rect(this.id, this.value('x'), this.value('y'), this.value('width'), this.value('height')); }
}
