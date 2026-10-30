import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { SvgFileStore } from '../src/infrastructure/SvgFileStore.js';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.js';
import { EditorSession } from '../src/application/EditorSession.js';
import { DocumentView } from '../src/application/DocumentView.js';
import { TemporaryDirectory } from './TemporaryDirectory.js';

test('external sample imports all seven elements and warns about its missing id', () => {
  const result = new SvgFileStore().read('examples/other.svg');
  assert.equal(result.document.count, 7);
  assert.deepEqual(result.warnings, ['warning: assigned id rect1 to unnamed <rect>']);
  assert.equal(result.document.parentLabel(result.document.find('r2')), 'g#g1');
});

test('auto ids reserve later explicit ids and previously assigned names globally', () => {
  const result = new SvgCodec().decode('<svg><rect/><g><rect id="rect1"/><rect/></g><circle/><g/></svg>');
  assert.deepEqual(result.document.all().map(s => s.id), ['rect2', 'g1', 'rect1', 'rect3', 'circle1', 'g2']);
  assert.equal(result.warnings.length, 5);
});

test('SVG round trip preserves order, XML escaping, unicode, transforms and inherited appearance', () => {
  const codec = new SvgCodec();
  const source = '<svg xmlns="http://www.w3.org/2000/svg" width="400px" height="200" viewBox="0 0 400 200"><g id="g" transform="translate(60,40) scale(0.8)" fill="red"><rect id="r" x="1.5" y="2" width="100" height="50"/><text id="t" x="60" y="38" font-size="16" text-anchor="middle">开始 &amp; &lt;end&gt; "quoted"</text><ellipse id="e" rx="3" ry="4"/><line id="l" x2="10" stroke="black"/><circle id="c" r="2"/></g></svg>';
  const before = codec.decode(source).document; const encoded = codec.encode(before); const after = codec.decode(encoded).document;
  assert.deepEqual(new DocumentView().tree(after), new DocumentView().tree(before));
  assert.equal(after.find('g').attributes.transform, 'translate(60,40) scale(0.8)');
  assert.equal(after.find('t').text, '开始 & <end> "quoted"'); assert.equal(after.find('t').attributes['font-size'], '16');
  assert.equal(after.find('r').attributes.fill, undefined); assert.match(encoded, /&amp;/); assert.match(encoded, /&lt;end/);
});

test('malformed XML, duplicate ids and unsupported content are rejected explicitly', () => {
  const codec = new SvgCodec();
  for (const source of ['<svg><rect></svg>', '<svg><rect id="x"/><circle id="x"/></svg>', '<svg id="x"><rect id="x"/></svg>', '<html/>', '<svg><path id="p"/></svg>', '<svg><text id="t"><tspan>hello</tspan></text></svg>', '<svg><g xmlns="urn:other"/></svg>', '<!DOCTYPE svg><svg/>', '<svg><rect onclick="alert(1)"/></svg>', '<svg width="100%"/>', '<svg><circle r="-2"/></svg>']) assert.throws(() => codec.decode(source), /invalid SVG:/, source);
});

test('actual file save overwrites atomically, defaults to last path and keeps IO barrier', () => {
  const temporary = new TemporaryDirectory(); const directory = temporary.path;
  try {
    const session = new EditorSession(new SvgFileStore()); const cli = new CommandDispatcher(session);
    cli.execute('init'); cli.execute('create rect r 1 2 3 4');
    const path = join(directory, 'with spaces.svg');
    assert.match(cli.execute(`save "${path}"`)[0]!, /^saved to/);
    cli.execute('set r fill red'); assert.match(cli.execute('save')[0]!, /^saved to/);
    assert.match(readFileSync(path, 'utf8'), /fill="red"/); assert.deepEqual(readdirSync(directory), ['with spaces.svg']);
    assert.deepEqual(cli.execute('undo'), ['error: undo not allowed after io command']);
    cli.execute(`read "${path}"`); assert.equal(session.document.find('r').attributes.fill, 'red');
  } finally { temporary.dispose(); }
});

test('failed read/save preserves document, redo and the default file path', () => {
  const temporary = new TemporaryDirectory(); const directory = temporary.path;
  try {
    const path = join(directory, 'good.svg'); const bad = join(directory, 'bad.svg');
    writeFileSync(bad, '<svg><rect></svg>');
    const session = new EditorSession(new SvgFileStore()); const cli = new CommandDispatcher(session);
    cli.execute('init'); cli.execute('create g g'); cli.execute(`save "${path}"`);
    cli.execute('create g x'); cli.execute('undo'); const before = cli.execute('tree');
    for (const line of [`read "${bad}"`, `read "${join(directory, 'missing.svg')}"`, `save "${join(directory, 'absent', 'out.svg')}"`, 'init -1 2', 'canvas 1 -2']) assert.match(cli.execute(line)[0]!, /^error:/);
    assert.deepEqual(cli.execute('tree'), before); cli.execute('redo'); assert.equal(session.document.find('x').id, 'x');
    cli.execute('save'); assert.match(readFileSync(path, 'utf8'), /id="x"/); assert.equal(readFileSync(bad, 'utf8'), '<svg><rect></svg>');
  } finally { temporary.dispose(); }
});
