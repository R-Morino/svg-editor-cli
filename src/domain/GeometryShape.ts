import { Shape } from './Shape.js';
import { Numeric } from './Numeric.js';

export abstract class GeometryShape extends Shape {
  private values: Record<string, number>;
  private readonly horizontal: readonly string[];
  private readonly vertical: readonly string[];
  private readonly dimensions: readonly string[];

  protected constructor(id: string, values: Record<string, number>, horizontal: readonly string[], vertical: readonly string[], dimensions: readonly string[]) {
    super(id);
    this.horizontal = horizontal;
    this.vertical = vertical;
    this.dimensions = dimensions;
    this.values = this.validate(values);
  }

  get geometry(): Readonly<Record<string, number>> { return { ...this.values }; }
  override get attributes(): Readonly<Record<string, string>> {
    return { ...super.attributes, ...Object.fromEntries(Object.entries(this.values).map(([k, v]) => [k, String(v)])) };
  }

  override move(dx: number, dy: number): void {
    Numeric.parse(dx, 'dx'); Numeric.parse(dy, 'dy');
    const next = { ...this.values };
    for (const name of this.horizontal) next[name] = this.value(name) + dx;
    for (const name of this.vertical) next[name] = this.value(name) + dy;
    this.values = this.validate(next);
  }

  override scale(factor: number): void {
    Numeric.positive(factor, 'scale factor');
    this.values = this.validate(Object.fromEntries(Object.entries(this.values).map(([k, v]) => [k, v * factor])));
  }

  override set(attr: string, value: string): void {
    if (Object.hasOwn(this.values, attr)) {
      this.values = this.validate({ ...this.values, [attr]: Numeric.parse(value, attr) });
    } else super.set(attr, value);
  }

  override clone(): GeometryShape {
    const result = this.copyGeometry();
    this.copyAppearance(result);
    return result;
  }

  protected value(name: string): number { return this.values[name]!; }
  protected abstract copyGeometry(): GeometryShape;

  private validate(values: Record<string, number>): Record<string, number> {
    for (const [key, value] of Object.entries(values)) {
      if (this.dimensions.includes(key)) Numeric.nonNegative(value, key);
      else Numeric.parse(value, key);
    }
    return values;
  }
}
