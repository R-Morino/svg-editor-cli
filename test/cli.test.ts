import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TemporaryDirectory } from './TemporaryDirectory.js';
import { SvgFileStore } from '../src/infrastructure/SvgFileStore.js';

test('real CLI stdin supports comments, unicode, saved SVG and no TTY prompt noise', () => {
  const temporary = new TemporaryDirectory();
  try {
    const target = join(temporary.path, 'flow.svg');
    const input = readFileSync('examples/flowchart.commands', 'utf8').replace('save examples/flowchart.svg', `save "${target}"`);
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], { input, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr); assert.equal(result.stderr, '');
    assert.match(result.stdout, /svg-editor 0.1/); assert.match(result.stdout, /处理数据 v2/); assert.ok(!result.stdout.includes('svg>'));
    const document = new SvgFileStore().read(target).document;
    assert.equal(document.count, 8); assert.equal(document.find('process').attributes.y, '100'); assert.equal(document.find('process-label').text, '处理数据 v2');
  } finally { temporary.dispose(); }
});

test('task transcript recovers after two intentional errors, imports sample and exits 1', () => {
  const temporary = new TemporaryDirectory();
  try {
    const target = join(temporary.path, 'demo.svg');
    const input = readFileSync('examples/session.commands', 'utf8').replace('save examples/demo.svg', `save "${target}"`);
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], { input, encoding: 'utf8' });
    assert.equal(result.status, 1); assert.equal(result.stderr, '');
    assert.equal(result.stdout.split('\n').filter(line => line.startsWith('error:')).length, 2);
    assert.match(result.stdout, /warning: assigned id rect1 to unnamed <rect>/);
    assert.match(result.stdout, /svg \(400x300\)/);
    const document = new SvgFileStore().read(target).document;
    assert.equal(document.count, 5); assert.equal(document.find('c1').attributes.cx, '130'); assert.equal(document.find('title').text, 'My Diagram');
  } finally { temporary.dispose(); }
});

test('bad syntax produces one-line errors and subsequent commands still execute', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], { input: 'init\ncreate text t 0 0 "unfinished\ncreate g recovered\ntree\n', encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stdout, /error: unterminated double quote/); assert.match(result.stdout, /g#recovered/); assert.equal(result.stderr, '');
});
