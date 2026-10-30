import test from 'node:test';
import assert from 'node:assert/strict';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { Group } from '../src/domain/Group.js';

test('all six built-ins preserve omitted appearance and use polymorphic geometry', () => {
  const factory = new ShapeFactory();
  const shapes = [factory.create('rect', 'r', ['1', '2', '3', '4']), factory.create('circle', 'c', ['1', '2', '3']), factory.create('ellipse', 'e', ['1', '2', '3', '4']), factory.create('line', 'l', ['1', '2', '3', '4']), factory.create('text', 't', ['1', '2', 'Hello world']), factory.create('g', 'g', [])];
  for (const shape of shapes) { assert.equal(shape.attributes.fill, undefined); shape.move(2, 3); shape.scale(2); assert.equal(shape.clone().describe(), shape.describe()); }
  assert.equal(shapes[0]!.attributes.x, '6'); assert.equal(shapes[3]!.attributes.x2, '10');
  assert.throws(() => factory.create('box', 'box', []), /unknown shape type/);
});

test('nested groups move/scale descendants, inherit paint and clone independently', () => {
  const factory = new ShapeFactory(); const doc = new SvgDocument();
  doc.add(new Group('outer')); doc.add(new Group('inner'), 'outer');
  doc.add(factory.create('text', 't', ['10', '20', '开始']), 'inner');
  const copy = doc.clone(); doc.find('outer').move(2, 3); doc.find('outer').scale(2); doc.find('outer').set('fill', 'red');
  assert.equal(doc.find('t').attributes.x, '24'); assert.equal(doc.find('t').attributes.y, '46');
  assert.equal(copy.find('t').attributes.x, '10'); assert.equal(doc.find('t').attributes.fill, undefined);
});

test('group preserves document order across parents and rejects ancestor overlap', () => {
  const doc = new SvgDocument(); doc.add(new Group('a')); doc.add(new Group('b'));
  doc.add(new Group('x'), 'a'); doc.add(new Group('y'), 'b');
  const grouped = doc.group('cluster', ['y', 'x']);
  assert.deepEqual(grouped.children.map(shape => shape.id), ['x', 'y']);
  assert.deepEqual(doc.children.map(shape => shape.id), ['cluster', 'a', 'b']);
  assert.throws(() => doc.group('bad', ['cluster', 'x']), /cannot group a container into its own descendant: cluster/);
  assert.throws(() => doc.addTo('x', 'cluster'), /own descendant/);
});

test('ungroup promotes children in place, top-level ungroup is forbidden, z-order is local', () => {
  const doc = new SvgDocument(); doc.add(new Group('scene'));
  for (const id of ['before', 'inner', 'after']) doc.add(new Group(id), 'scene');
  doc.add(new Group('a'), 'inner'); doc.add(new Group('b'), 'inner'); doc.ungroup('inner');
  assert.deepEqual(doc.container('scene').children.map(shape => shape.id), ['before', 'a', 'b', 'after']);
  doc.reorder('a', true); doc.reorder('after', false);
  assert.deepEqual(doc.container('scene').children.map(shape => shape.id), ['after', 'before', 'b', 'a']);
  assert.throws(() => doc.ungroup('scene'), /cannot ungroup top-level container: scene/);
});

test('ids are case-sensitive and unique; invalid fields and dimensions are rejected', () => {
  const factory = new ShapeFactory(); const doc = new SvgDocument(); doc.add(new Group('g')); doc.add(new Group('G'));
  assert.throws(() => doc.add(new Group('g')), /id already exists: g/);
  const rect = factory.create('rect', 'r', ['0', '0', '2', '3']);
  assert.throws(() => rect.set('width', '-1'), /non-negative/); assert.equal(rect.attributes.width, '2');
  assert.throws(() => rect.set('id', 'new'), /unknown attribute: id/);
  assert.throws(() => rect.scale(0), /scale factor must be positive/);
  assert.throws(() => rect.move(Infinity, 0), /invalid number/);
});
