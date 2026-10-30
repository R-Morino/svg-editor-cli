import test from 'node:test';
import assert from 'node:assert/strict';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.js';
import { EditorSession } from '../src/application/EditorSession.js';
import type { DocumentStore } from '../src/application/DocumentStore.js';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { Tokenizer } from '../src/cli/Tokenizer.js';

class MemoryStore implements DocumentStore {
  private files = new Map<string, SvgDocument>();
  read(path: string) { const document = this.files.get(path); if (!document) throw new Error(`cannot read file: ${path}`); return { document: document.clone(), warnings: [] }; }
  write(path: string, document: SvgDocument): void { if (path === 'unwritable') throw new Error(`cannot write file: ${path}`); this.files.set(path, document.clone()); }
}
class Harness {
  readonly session = new EditorSession(new MemoryStore());
  readonly cli = new CommandDispatcher(this.session);
  run(...lines: string[]): string[] { return lines.flatMap(line => this.cli.execute(line)); }
}

test('tokenizer preserves colors, Windows paths, quoted spaces and empty text', () => {
  const tokenizer = new Tokenizer();
  assert.deepEqual(tokenizer.tokenize(' # comment'), []);
  assert.deepEqual(tokenizer.tokenize('set t text ""'), ['set', 't', 'text', '']);
  assert.deepEqual(tokenizer.tokenize('create text t 0 0 "a \\"b\\" c"'.replaceAll('\\\\"', '\\"')), ['create', 'text', 't', '0', '0', 'a "b" c']);
  assert.deepEqual(tokenizer.tokenize('read "C:\\my files\\a.svg"'), ['read', 'C:\\my files\\a.svg']);
  assert.deepEqual(tokenizer.tokenize('set r fill #ff0000'), ['set', 'r', 'fill', '#ff0000']);
  assert.throws(() => tokenizer.tokenize('set t text "unfinished'), /unterminated/);
  assert.throws(() => tokenizer.tokenize('set t text "a"b'), /expected space/);
});

test('help works without document; stateful commands report missing document', () => {
  const h = new Harness(); assert.ok(h.run('help').includes('undo'));
  assert.deepEqual(h.run('tree'), ["error: no document. use 'init' or 'read' first"]);
  assert.deepEqual(h.run('init', 'canvas'), ['canvas 800x600 created', 'canvas 800x600']);
  assert.deepEqual(h.run('undo'), ['error: undo not allowed after io command']);
});

test('one group command is one undo unit; redo restores exact tree', () => {
  const h = new Harness(); h.run('init', 'create rect a 0 0 10 10', 'create circle b 20 20 5 red');
  const before = h.run('tree'); h.run('group markers b a'); const grouped = h.run('tree');
  assert.deepEqual(h.session.document.container('markers').children.map(s => s.id), ['a', 'b']);
  h.run('undo'); assert.deepEqual(h.run('tree'), before); h.run('redo'); assert.deepEqual(h.run('tree'), grouped);
});

test('failed edits and malformed input preserve redo; successful new edit clears it', () => {
  const h = new Harness(); h.run('init', 'create rect r 1 2 3 4', 'move r 5 6', 'undo');
  const before = h.run('tree');
  for (const line of ['set r width -2', 'create rect r 0 0 1 1', 'scale r 0', 'group bad r missing', 'create text t 0 0 "oops', 'move r NaN 1']) assert.match(h.run(line)[0]!, /^error:/);
  assert.deepEqual(h.run('tree'), before); h.run('redo'); assert.equal(h.session.document.find('r').attributes.x, '6');
  h.run('undo', 'set r fill blue'); assert.deepEqual(h.run('redo'), ['error: nothing to redo']);
});

test('nested group edits, subtree delete, addto, ungroup and z-order all undo exactly', () => {
  const h = new Harness(); h.run('init', 'create g scene', 'create g inner in scene', 'create text t 2 3 "开始" in inner', 'create rect r 1 2 3 4 in scene');
  for (const line of ['move inner 10 20', 'scale scene 2', 'set inner fill red', 'delete inner', 'addto inner r', 'ungroup inner', 'front inner', 'back r']) {
    const before = h.run('tree'); const result = h.run(line); assert.ok(!result[0]?.startsWith('error:'), `${line}: ${result}`);
    const after = h.run('tree'); h.run('undo'); assert.deepEqual(h.run('tree'), before, line); h.run('redo'); assert.deepEqual(h.run('tree'), after); h.run('undo');
  }
  const before = h.run('tree');
  assert.deepEqual(h.run('ungroup scene'), ['error: cannot ungroup top-level container: scene']);
  assert.match(h.run('group bad inner t')[0]!, /cannot group a container into its own descendant: inner/);
  assert.match(h.run('addto inner scene')[0]!, /own descendant/); assert.deepEqual(h.run('tree'), before);
});

test('recursive overflow rolls back every descendant and keeps previous undo record', () => {
  const h = new Harness(); h.run('init', 'create g g', 'create circle a 1 2 3 in g', 'create circle b 1e308 0 1 in g');
  const before = h.run('tree'); assert.match(h.run('scale g 2')[0]!, /^error:/); assert.deepEqual(h.run('tree'), before);
  h.run('undo'); assert.throws(() => h.session.document.find('b'), /no such shape/);
});

test('IO and canvas writes are barriers; queries and failed IO are not', () => {
  const h = new Harness(); h.run('init', 'create g g', 'save a.svg');
  assert.deepEqual(h.run('undo'), ['error: undo not allowed after io command']);
  h.run('create g x', 'undo'); const before = h.run('tree');
  assert.match(h.run('save unwritable')[0]!, /cannot write file/); assert.match(h.run('read missing.svg')[0]!, /cannot read file/);
  h.run('canvas', 'tree', 'show g', 'help', 'redo'); assert.equal(h.session.document.find('x').id, 'x');
  h.run('canvas 100 200'); assert.deepEqual(h.run('redo'), ['error: undo not allowed after io command']);
  h.run('read a.svg'); assert.deepEqual(h.run('tree'), before); h.run('save');
  assert.deepEqual(h.run('undo'), ['error: undo not allowed after io command']);
});

test('create in clause, error strings and attribute white lists', () => {
  const h = new Harness(); h.run('init', 'create g g', 'create rect r 1.5 2 3 4 #eee in g', 'create text t 0 0 "in" in g');
  assert.equal(h.session.document.find('r').attributes.fill, '#eee'); assert.equal(h.session.document.find('t').text, 'in');
  assert.deepEqual(h.run('create g x in missing'), ['error: no such container: missing']);
  assert.deepEqual(h.run('create g x in r'), ['error: not a container: r']);
  assert.deepEqual(h.run('create box x'), ['error: unknown shape type: box (is the plugin loaded?)']);
  assert.deepEqual(h.run('set g x 5'), ['error: unknown attribute: x']);
  assert.deepEqual(h.run('set r text hi'), ['error: unknown attribute: text']);
});
