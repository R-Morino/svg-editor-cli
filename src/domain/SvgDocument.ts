import { Group } from './Group.js';
import { Shape } from './Shape.js';
import { Numeric } from './Numeric.js';

export class SvgDocument {
  private canvasWidth: number;
  private canvasHeight: number;
  private readonly root = new Group('__document_root__');
  private rootAttributes: Record<string, string>;

  constructor(width = 800, height = 600, attributes: Record<string, string> = {}) {
    this.canvasWidth = Numeric.positive(width, 'canvas width');
    this.canvasHeight = Numeric.positive(height, 'canvas height');
    this.rootAttributes = { ...attributes };
  }
  get width(): number {
    return this.canvasWidth;
  }
  get height(): number {
    return this.canvasHeight;
  }
  get children(): readonly Shape[] {
    return this.root.children;
  }
  get count(): number {
    return this.all().length;
  }
  get attributes(): Readonly<Record<string, string>> {
    return {
      ...this.rootAttributes,
      xmlns: 'http://www.w3.org/2000/svg',
      width: String(this.width),
      height: String(this.height),
      viewBox: this.rootAttributes.viewBox ?? `0 0 ${this.width} ${this.height}`,
    };
  }

  resize(width: number, height: number): void {
    Numeric.positive(width, 'canvas width');
    Numeric.positive(height, 'canvas height');
    this.canvasWidth = width;
    this.canvasHeight = height;
    delete this.rootAttributes.viewBox;
  }

  all(): readonly Shape[] {
    const result: Shape[] = [];
    const visit = (shape: Shape): void => {
      result.push(shape);
      shape.children.forEach(visit);
    };
    this.children.forEach(visit);
    return result;
  }
  find(id: string): Shape {
    const shape = this.all().find((shape) => shape.id === id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  container(id: string): Group {
    const shape = this.all().find((shape) => shape.id === id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  parent(shape: Shape): Group {
    const result = [
      this.root,
      ...this.all().filter((item): item is Group => item instanceof Group),
    ].find((group) => group.children.includes(shape));
    if (!result) throw new Error(`no such shape: ${shape.id}`);
    return result;
  }
  parentLabel(shape: Shape): string {
    const parent = this.parent(shape);
    return parent === this.root ? 'svg' : parent.label;
  }

  add(shape: Shape, parentId?: string): void {
    const incoming: Shape[] = [];
    const collect = (node: Shape): void => {
      incoming.push(node);
      node.children.forEach(collect);
    };
    collect(shape);
    const ids = new Set(this.all().map((item) => item.id));
    if (this.rootAttributes.id) ids.add(this.rootAttributes.id);
    for (const node of incoming) {
      if (ids.has(node.id)) throw new Error(`id already exists: ${node.id}`);
      ids.add(node.id);
    }
    (parentId ? this.container(parentId) : this.root).insert(shape);
  }
  delete(id: string): Shape {
    const shape = this.find(id);
    this.parent(shape).remove(shape);
    return shape;
  }

  group(id: string, ids: readonly string[]): Group {
    if (this.all().some((shape) => shape.id === id)) throw new Error(`id already exists: ${id}`);
    if (!ids.length) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const selected = ids.map((id) => this.find(id));
    for (const shape of selected)
      if (
        shape instanceof Group &&
        selected.some((other) => other !== shape && shape.contains(other))
      )
        throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
    const ordered = this.all().filter((shape) => selected.includes(shape));
    const parents = ordered.map((shape) => this.parent(shape));
    const target = parents.every((parent) => parent === parents[0]) ? parents[0]! : this.root;
    const index = target.children.findIndex((child) =>
      ordered.some((shape) => child === shape || (child instanceof Group && child.contains(shape))),
    );
    const group = new Group(id);
    ordered.forEach((shape) => this.parent(shape).remove(shape));
    target.insert(group, index);
    ordered.forEach((shape) => group.insert(shape));
    return group;
  }

  ungroup(id: string): void {
    const group = this.container(id);
    const parent = this.parent(group);
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.indexOf(group);
    const children = group.children;
    parent.remove(group);
    children.forEach((child, offset) => {
      group.remove(child);
      parent.insert(child, index + offset);
    });
  }

  addTo(groupId: string, id: string): void {
    const target = this.container(groupId);
    const shape = this.find(id);
    if (shape === target || (shape instanceof Group && shape.contains(target)))
      throw new Error(`cannot add a container into its own descendant: ${id}`);
    this.parent(shape).remove(shape);
    target.insert(shape);
  }
  reorder(id: string, front: boolean): void {
    const shape = this.find(id);
    const parent = this.parent(shape);
    parent.remove(shape);
    parent.insert(shape, front ? parent.children.length : 0);
  }
  clone(): SvgDocument {
    const result = new SvgDocument(this.width, this.height, this.rootAttributes);
    this.children.forEach((child) => result.add(child.clone()));
    return result;
  }
}
