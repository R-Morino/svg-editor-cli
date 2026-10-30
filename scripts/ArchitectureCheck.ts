import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join, dirname, relative, sep } from 'node:path';
import ts from 'typescript';

export class ArchitectureCheck {
  private readonly source = resolve('src');
  private readonly violations: string[] = [];
  private files = 0;
  private edges = 0;

  run(): void {
    this.walk(this.source);
    if (this.violations.length) throw new Error(this.violations.join('\n'));
    console.log(
      `Architecture OK: ${this.files} TypeScript files, ${this.edges} imports; dependency rules, one class per file, no top-level functions and switch placement checked.`,
    );
  }
  private walk(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) this.walk(path);
      else if (entry.name.endsWith('.ts')) this.check(path);
    }
  }
  private check(path: string): void {
    this.files++;
    const name = relative(this.source, path).split(sep).join('/');
    const layer = name.includes('/') ? name.split('/')[0]! : 'main';
    const ast = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    let classes = 0;
    for (const statement of ast.statements) {
      if (ts.isClassDeclaration(statement)) {
        classes++;
        if (statement.name?.text !== name.split('/').at(-1)!.replace(/\.ts$/u, ''))
          this.violations.push(`${name}: class name does not match file`);
      }
      if (ts.isFunctionDeclaration(statement))
        this.violations.push(`${name}: top-level procedural function`);
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        this.edges++;
        const specifier = statement.moduleSpecifier.text;
        const target = specifier.startsWith('.')
          ? relative(this.source, resolve(dirname(path), specifier))
              .split(sep)
              .join('/')
          : specifier;
        if (!this.allowed(layer, target))
          this.violations.push(`${name}: forbidden dependency ${specifier}`);
      }
    }
    if (classes > 1) this.violations.push(`${name}: more than one class`);
    const visit = (node: ts.Node): void => {
      if (
        ts.isSwitchStatement(node) &&
        !['cli/CommandDispatcher.ts', 'domain/ShapeFactory.ts'].includes(name)
      )
        this.violations.push(`${name}: switch outside the two allowed dispatch points`);
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  private allowed(layer: string, target: string): boolean {
    if (layer === 'main') return !target.startsWith('..');
    if (target.startsWith(`${layer}/`)) return true;
    if (layer === 'domain') return false;
    if (layer === 'application') return target.startsWith('domain/');
    if (layer === 'cli')
      return target.startsWith('application/') || ['node:readline', 'node:stream'].includes(target);
    if (layer === 'infrastructure')
      return (
        target.startsWith('domain/') ||
        target === 'application/DocumentStore.js' ||
        target.startsWith('node:') ||
        target === '@xmldom/xmldom'
      );
    return false;
  }
}

if (process.argv[1]?.replace(/\\/gu, '/').endsWith('/ArchitectureCheck.ts'))
  new ArchitectureCheck().run();
