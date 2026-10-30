import { DOMImplementation, DOMParser, XMLSerializer, onWarningStopParsing } from '@xmldom/xmldom';
import type { Element, Document } from '@xmldom/xmldom';
import { SvgDocument } from '../domain/SvgDocument.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import type { Shape } from '../domain/Shape.js';
import { Group } from '../domain/Group.js';

export class SvgCodec {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  private readonly factory = new ShapeFactory();

  decode(source: string): { document: SvgDocument; warnings: string[] } {
    try {
      const xml = new DOMParser({ onError: onWarningStopParsing }).parseFromString(source, 'image/svg+xml');
      if (xml.doctype) throw new Error('DOCTYPE is not supported');
      const root = xml.documentElement;
      if (!root || root.localName !== 'svg') throw new Error('root element must be svg');
      this.checkNamespace(root);
      const rootAttributes = this.attributes(root);
      const document = new SvgDocument(this.length(rootAttributes.width, '800'), this.length(rootAttributes.height, '600'), rootAttributes);
      const reserved = new Set<string>();
      const elements = xml.getElementsByTagName('*');
      for (let index = 0; index < elements.length; index++) {
        const id = elements.item(index)!.getAttribute('id');
        if (id) { if (reserved.has(id)) throw new Error(`id already exists: ${id}`); reserved.add(id); }
      }
      const warnings: string[] = [];
      for (const child of this.elements(root)) document.add(this.readShape(child, reserved, warnings));
      return { document, warnings };
    } catch (error) {
      throw new Error(`invalid SVG: ${error instanceof Error ? error.message.replace(/[\r\n]+/gu, ' ') : String(error)}`);
    }
  }

  encode(document: SvgDocument): string {
    const xml = new DOMImplementation().createDocument(this.namespace, 'svg', null);
    const root = xml.documentElement!;
    for (const [name, value] of Object.entries(document.attributes)) root.setAttribute(name, value);
    for (const shape of document.children) root.appendChild(this.writeShape(xml, shape));
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(xml)}\n`;
  }

  private readShape(element: Element, reserved: Set<string>, warnings: string[]): Shape {
    this.checkNamespace(element);
    const attributes = this.attributes(element);
    const type = element.localName ?? element.tagName;
    let id = attributes.id;
    if (!id) {
      let number = 1; while (reserved.has(`${type}${number}`)) number++;
      id = `${type}${number}`; reserved.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
    }
    const shape = this.factory.fromAttributes(type, id, attributes, element.textContent ?? '');
    const children = this.elements(element);
    if (shape instanceof Group) children.forEach(child => shape.insert(this.readShape(child, reserved, warnings)));
    else if (children.length) throw new Error(`nested elements are not supported in <${type}>`);
    return shape;
  }

  private writeShape(xml: Document, shape: Shape): Element {
    const element = xml.createElementNS(this.namespace, shape.type);
    element.setAttribute('id', shape.id);
    for (const [name, value] of Object.entries(shape.attributes)) element.setAttribute(name, value);
    if (shape.text !== undefined) element.appendChild(xml.createTextNode(shape.text));
    for (const child of shape.children) element.appendChild(this.writeShape(xml, child));
    return element;
  }

  private elements(parent: Element): Element[] {
    const result: Element[] = [];
    for (let index = 0; index < parent.childNodes.length; index++) {
      const node = parent.childNodes.item(index)!;
      if (node.nodeType === node.ELEMENT_NODE) result.push(node as Element);
    }
    return result;
  }
  private attributes(element: Element): Record<string, string> {
    const result: Record<string, string> = {};
    for (let index = 0; index < element.attributes.length; index++) {
      const attribute = element.attributes.item(index)!;
      if (/^on/iu.test(attribute.name)) throw new Error(`event attribute is not supported: ${attribute.name}`);
      result[attribute.name] = attribute.value;
    }
    return result;
  }
  private checkNamespace(element: Element): void {
    if (element.namespaceURI && element.namespaceURI !== this.namespace) throw new Error(`unsupported namespace: ${element.namespaceURI}`);
  }
  private length(value: string | undefined, fallback: string): number {
    const raw = value ?? fallback;
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:px)?$/iu.test(raw)) throw new Error(`unsupported canvas length: ${raw}`);
    return Number(raw.replace(/px$/iu, ''));
  }
}
