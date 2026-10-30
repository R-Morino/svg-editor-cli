import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, join, relative, isAbsolute } from 'node:path';
export class TemporaryDirectory {
  private readonly root = resolve('.tmp/tests');
  readonly path: string;
  constructor() {
    mkdirSync(this.root, { recursive: true });
    this.path = mkdtempSync(join(this.root, 'case-'));
  }
  dispose(): void {
    const child = relative(this.root, resolve(this.path));
    if (!child || child.startsWith('..') || isAbsolute(child) || !child.startsWith('case-'))
      throw new Error('refusing to remove a path outside test workspace');
    rmSync(this.path, { recursive: true, force: true });
  }
}
