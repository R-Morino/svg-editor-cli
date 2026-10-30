import { SvgDocument } from '../domain/SvgDocument.js';
import type { DocumentStore } from './DocumentStore.js';
import { History } from './History.js';
import type { UndoableCommand } from './UndoableCommand.js';

export class EditorSession {
  private current?: SvgDocument;
  private path?: string;
  private readonly history = new History();
  constructor(private readonly store: DocumentStore) {}
  get document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  init(width: number, height: number): string[] {
    const next = new SvgDocument(width, height);
    this.current = next;
    this.path = undefined;
    this.history.barrier();
    return [`canvas ${width}x${height} created`];
  }
  read(path: string): string[] {
    const result = this.store.read(path);
    this.current = result.document;
    this.path = path;
    this.history.barrier();
    return [...result.warnings, `read ${path} (${this.document.count} elements)`];
  }
  save(path?: string): string[] {
    const document = this.document;
    const target = path ?? this.path;
    if (!target) throw new Error('no file path. use save <file.svg>');
    this.store.write(target, document);
    this.path = target;
    this.history.barrier();
    return [`saved to ${target} (${document.count} elements)`];
  }
  resize(width: number, height: number): string[] {
    const draft = this.document.clone();
    draft.resize(width, height);
    this.current = draft;
    this.history.barrier();
    return [`canvas resized to ${width}x${height}`];
  }
  commit(command: UndoableCommand, document: SvgDocument): void {
    this.current = document;
    this.history.record(command);
  }
  restore(document: SvgDocument): void {
    this.current = document.clone();
  }
  undo(): string[] {
    void this.document;
    return this.history.undo();
  }
  redo(): string[] {
    void this.document;
    return this.history.redo();
  }
}
