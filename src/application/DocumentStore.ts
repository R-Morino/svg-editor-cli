import type { SvgDocument } from '../domain/SvgDocument.js';
export interface DocumentStore {
  read(path: string): { document: SvgDocument; warnings: string[] };
  write(path: string, document: SvgDocument): void;
}
