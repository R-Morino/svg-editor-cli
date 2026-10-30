import { GeometryShape } from './GeometryShape.js';
export class Text extends GeometryShape {
  private content: string;
  constructor(id: string, x: number, y: number, text: string) { super(id, { x, y }, ['x'], ['y'], []); this.content = text; }
  override get type(): string { return 'text'; }
  override get text(): string { return this.content; }
  override set(attr: string, value: string): void { if (attr === 'text') this.content = value; else super.set(attr, value); }
  override describe(): string { return `${this.label}  (${this.value('x')},${this.value('y')}) ${JSON.stringify(this.content)}${this.appearanceSummary()}`; }
  protected override copyGeometry(): Text { return new Text(this.id, this.value('x'), this.value('y'), this.content); }
}
