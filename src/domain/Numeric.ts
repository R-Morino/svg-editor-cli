export class Numeric {
  static parse(value: string | number, name: string): number {
    if (typeof value === 'string' && !value.trim()) throw new Error(`invalid number: ${name}`);
    const result = Number(value);
    if (!Number.isFinite(result)) throw new Error(`invalid number: ${name}`);
    return result;
  }

  static nonNegative(value: string | number, name: string): number {
    const result = this.parse(value, name);
    if (result < 0) throw new Error(`${name} must be non-negative`);
    return result;
  }

  static positive(value: string | number, name: string): number {
    const result = this.parse(value, name);
    if (result <= 0) throw new Error(`${name} must be positive`);
    return result;
  }
}
