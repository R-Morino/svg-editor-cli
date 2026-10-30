import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { Text } from './Text.js';
import { Group } from './Group.js';
import { Numeric } from './Numeric.js';

export class ShapeFactory {
  // Name dispatch point 1/2. TODO: replace built-in registrations with providers in the plugin phase.
  private readonly definitions = new Map<string, {
    geometry: readonly string[]; text?: boolean; paint?: string;
    build: (id: string, values: readonly number[], text: string) => Shape;
  }>([
    ['rect', { geometry: ['x', 'y', 'width', 'height'], paint: 'fill', build: (id, v) => new Rect(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['circle', { geometry: ['cx', 'cy', 'r'], paint: 'fill', build: (id, v) => new Circle(id, v[0]!, v[1]!, v[2]!) }],
    ['ellipse', { geometry: ['cx', 'cy', 'rx', 'ry'], paint: 'fill', build: (id, v) => new Ellipse(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['line', { geometry: ['x1', 'y1', 'x2', 'y2'], paint: 'stroke', build: (id, v) => new Line(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['text', { geometry: ['x', 'y'], text: true, build: (id, v, text) => new Text(id, v[0]!, v[1]!, text) }],
    ['g', { geometry: [], build: id => new Group(id) }],
  ]);

  create(type: string, id: string, params: readonly string[]): Shape {
    const definition = this.definition(type);
    const count = definition.geometry.length + (definition.text ? 1 : 0);
    if (params.length < count || params.length > count + (definition.paint ? 1 : 0)) throw new Error(`invalid parameters for ${type}`);
    const values = definition.geometry.map((name, i) => Numeric.parse(params[i]!, name));
    const result = definition.build(id, values, definition.text ? params[count - 1]! : '');
    if (definition.paint && params.length > count) result.set(definition.paint, params[count]!);
    return result;
  }

  fromAttributes(type: string, id: string, attributes: Readonly<Record<string, string>>, text: string): Shape {
    const definition = this.definition(type);
    const values = definition.geometry.map(name => Numeric.parse(attributes[name] ?? '0', name));
    const result = definition.build(id, values, text);
    const extras: Record<string, string> = {};
    for (const [name, value] of Object.entries(attributes)) {
      if (name === 'id' || definition.geometry.includes(name)) continue;
      if (['fill', 'stroke', 'stroke-width'].includes(name)) result.set(name, value);
      else extras[name] = value;
    }
    result.preserveAttributes(extras);
    return result;
  }

  private definition(type: string) {
    const result = this.definitions.get(type);
    if (!result) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return result;
  }
}
