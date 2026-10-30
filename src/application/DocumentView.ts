import type { SvgDocument } from '../domain/SvgDocument.js';
import type { Shape } from '../domain/Shape.js';
export class DocumentView {
  tree(document: SvgDocument, id?: string): string[] {
    const lines: string[] = [];
    const walk = (shape: Shape, prefix: string, last: boolean): void => {
      lines.push(`${prefix}${last ? '└── ' : '├── '}${shape.describe()}`);
      shape.children.forEach((child, index, all) => walk(child, `${prefix}${last ? '    ' : '│   '}`, index === all.length - 1));
    };
    if (id !== undefined) {
      const root = document.find(id); lines.push(root.describe());
      root.children.forEach((child, i, all) => walk(child, '', i === all.length - 1));
    } else {
      lines.push(`svg (${document.width}x${document.height})`);
      document.children.forEach((child, i, all) => walk(child, '', i === all.length - 1));
    }
    return lines;
  }
  show(document: SvgDocument, id: string): string[] {
    const shape = document.find(id);
    return [`${shape.label}  parent=${document.parentLabel(shape)}`, ...Object.entries(shape.attributes).map(([name, value]) => `  ${name}=${value}`), ...(shape.text !== undefined ? [`  text=${JSON.stringify(shape.text)}`] : [])];
  }
}
