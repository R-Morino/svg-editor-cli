import { Numeric } from './Numeric.js';

export abstract class Shape {
  private readonly identifier: string;
  private styles: Record<string, string> = {};
  private extras: Record<string, string> = {};

  protected constructor(id: string) {
    if (!id || /[\s\u0000-\u001f]/u.test(id)) throw new Error(`invalid id: ${id}`);
    this.identifier = id;
  }

  get id(): string { return this.identifier; }
  abstract get type(): string;
  get label(): string { return `${this.type}#${this.id}`; }
  get children(): readonly Shape[] { return []; }
  get text(): string | undefined { return undefined; }
  get attributes(): Readonly<Record<string, string>> { return { ...this.extras, ...this.styles }; }
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  abstract describe(): string;

  set(attr: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(attr)) throw new Error(`unknown attribute: ${attr}`);
    if (attr === 'stroke-width') Numeric.nonNegative(value, attr);
    this.styles = { ...this.styles, [attr]: value };
  }

  preserveAttributes(attributes: Readonly<Record<string, string>>): void {
    this.extras = { ...attributes };
  }

  protected copyAppearance(target: Shape): void {
    target.styles = { ...this.styles };
    target.extras = { ...this.extras };
  }

  protected appearanceSummary(): string {
    return Object.entries(this.attributes)
      .filter(([name]) => ['fill', 'stroke', 'stroke-width'].includes(name))
      .map(([name, value]) => ` ${name}=${value}`).join('');
  }
}
