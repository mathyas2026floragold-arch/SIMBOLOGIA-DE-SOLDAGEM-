'use strict';
const assert = require('node:assert/strict');
const Instrument = require('./caliper-instrument.js');
const Engine = require('./caliper-engine.js');

// These fixtures describe the intended physical models, independently of the
// renderer's metadata. In particular, imperial travel is not interpreted as mm.
const specs = {
  'mm-01': { unit: 'mm', denominator: 10, cap: 150, main: 1, divisions: 10, pitch: .9 },
  'mm-005': { unit: 'mm', denominator: 20, cap: 150, main: 1, divisions: 20, pitch: 1.95 },
  'mm-002': { unit: 'mm', denominator: 50, cap: 150, main: 1, divisions: 50, pitch: .98 },
  'mm-001': { unit: 'mm', denominator: 100, cap: 150, main: 1, period: 1 },
  'in-128': { unit: 'in', denominator: 128, cap: 6, main: 1 / 16, divisions: 8, pitch: 7 / 128 },
  'in-1000': { unit: 'in', denominator: 1000, cap: 6, main: .025, divisions: 25, pitch: .024, period: .1 }
};
const combinations = [
  ['analog', 'mm-01'], ['analog', 'mm-005'], ['analog', 'mm-002'], ['analog', 'in-128'], ['analog', 'in-1000'],
  ['digital', 'mm-001'], ['digital', 'in-1000'],
  ['dial', 'mm-001'], ['dial', 'in-1000'],
  ['depth', 'mm-005'], ['depth', 'mm-002'], ['depth', 'in-1000'],
  ['height', 'mm-002'], ['height', 'in-1000']
];
const close = (actual, expected, message, tolerance = 2e-6) => assert.ok(Math.abs(actual - expected) <= tolerance,
  `${message}: expected ${expected}, got ${actual}`);
const attrs = text => Object.fromEntries([...text.matchAll(/([\w:.-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const hasClass = (node, name) => (node.a.class || '').split(/\s+/).includes(name);

// A small SVG reader preserves group translations. Tests therefore inspect the
// coordinates that are actually shipped, rather than calling rendering helpers.
function parse(svg) {
  const root = { tag: '#root', a: {}, children: [], parent: null }, stack = [root], all = [];
  for (const match of svg.matchAll(/<(\/)?([\w-]+)\b([^>]*?)(\/)?>/g)) {
    const [, closing, tag, body, self] = match;
    if (closing) { assert.equal(stack.at(-1).tag, tag, 'SVG tags must be properly nested'); stack.pop(); continue; }
    const node = { tag, a: attrs(body), parent: stack.at(-1), children: [] };
    node.parent.children.push(node); all.push(node);
    if (!self) stack.push(node);
  }
  assert.equal(stack.length, 1, 'SVG must be closed');
  const descendants = parent => all.filter(n => { for (let p = n.parent; p; p = p.parent) if (p === parent) return true; return false; });
  const first = name => all.find(n => hasClass(n, name));
  return { root: all.find(n => n.tag === 'svg'), all, first, descendants };
}
function translation(node) {
  let x = 0, y = 0;
  for (let current = node; current; current = current.parent) {
    const value = current.a.transform;
    if (!value) continue;
    const match = value.match(/^translate\(([-+\d.e]+)(?:[ ,]+([-+\d.e]+))?\)$/i);
    assert.ok(match, 'Only the supported translation is expected in the physical instrument');
    x += Number(match[1]); y += Number(match[2] || 0);
  }
  return { x, y };
}
function point(node, xKey = 'x', yKey = 'y') {
  const t = translation(node); return { x: Number(node.a[xKey] || 0) + t.x, y: Number(node.a[yKey] || 0) + t.y };
}
function pathPoints(data) {
  const tokens = data.match(/[MLHVZ]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) || [];
  let command = '', x = 0, y = 0, first, result = [];
  for (let i = 0; i < tokens.length;) {
    if (/^[MLHVZ]$/i.test(tokens[i])) command = tokens[i++];
    if (command === 'Z') { if (first) result.push(first); command = ''; continue; }
    if (command === 'M' || command === 'L') { x = Number(tokens[i++]); y = Number(tokens[i++]); if (!first) first = { x, y }; }
    else if (command === 'H') x = Number(tokens[i++]);
    else if (command === 'V') y = Number(tokens[i++]);
    else assert.fail(`Unexpected path command ${command}`);
    assert.ok(Number.isFinite(x) && Number.isFinite(y), 'Path coordinates must be finite'); result.push({ x, y });
  }
  return result;
}
function assertHorizontalBounds(parsed, label) {
  const width = Number(parsed.root.a.viewBox.split(/\s+/)[2]); assert.equal(width, 1280);
  function inside(x) { assert.ok(x >= -.001 && x <= width + .001, `${label}: rendered x=${x} escaped viewBox`); }
  for (const node of parsed.all) {
    const t = translation(node), a = node.a;
    if (node.tag === 'rect') { inside(Number(a.x || 0) + t.x); inside(Number(a.x || 0) + Number(a.width) + t.x); }
    if (node.tag === 'line') { inside(Number(a.x1) + t.x); inside(Number(a.x2) + t.x); }
    if (node.tag === 'circle') { inside(Number(a.cx) - Number(a.r) + t.x); inside(Number(a.cx) + Number(a.r) + t.x); }
    if (node.tag === 'text') inside(Number(a.x) + t.x);
    if (node.tag === 'path') for (const p of pathPoints(a.d)) inside(p.x + t.x);
  }
}
function expectedGeometry(type, spec, ticks) {
  const value = ticks / spec.denominator;
  if (type === 'depth') return { axis: 'y', zero: 130, scale: 90 / spec.cap, position: 130 + value * 90 / spec.cap };
  if (type === 'height') return { axis: 'y', zero: 270, scale: -150 / spec.cap, position: 270 - value * 150 / spec.cap };
  return { axis: 'x', zero: 120, scale: 480 / spec.cap, position: 120 + value * 480 / spec.cap };
}
function assertWhole(type, key, ticks, objectTicks = ticks) {
  const spec = specs[key], options = { type, resolutionKey: key, ticks, objectTicks, contact: ticks === objectTicks };
  const rendered = Instrument.render({ ...options, section: 'instrument' }), parsed = parse(rendered), expected = expectedGeometry(type, spec, ticks);
  const geometry = Instrument.geometry(options), slider = parsed.all.find(n => Object.hasOwn(n.a, 'data-caliper-slider'));
  assert.ok(slider, 'The physical instrument itself must contain the draggable slider');
  assert.equal(slider.a['data-drag-axis'], expected.axis);
  close(Number(slider.a['data-drag-px-per-unit']), expected.scale, 'Drag sensitivity follows the selected measurement unit');
  assert.equal(geometry.axis, expected.axis); close(geometry.zeroPx, expected.zero, 'Fixed reference');
  close(geometry.pxPerUnit, expected.scale, 'Geometry sensitivity'); close(geometry.sliderPx, expected.position, 'Geometry position');
  const move = translation(slider), piece = parsed.first('ci-workpiece'); assert.ok(piece, 'The target must have physical geometry');
  const objectValue = objectTicks / spec.denominator;
  if (type === 'depth') {
    const probe = parsed.first('ci-depth-probe'); assert.ok(parsed.descendants(slider).includes(probe), 'Depth probe must move with the cursor');
    close(Number(probe.a.y) + Number(probe.a.height) + move.y, expected.position, 'Moving probe endpoint indicates depth');
    const points = pathPoints(piece.a.d); assert.ok(points.some(p => Math.abs(p.y - (130 + objectValue * expected.scale)) < 1e-6), 'Depth workpiece floor matches target dimension');
  } else if (type === 'height') {
    close(move.y, expected.position, 'Height cursor rises when reading increases');
    close(Number(piece.a.y), 270 + objectValue * expected.scale, 'Height workpiece top');
    close(Number(piece.a.height), -objectValue * expected.scale, 'Workpiece height');
    if (ticks === objectTicks) close(move.y, Number(piece.a.y), 'Height tip contacts the top of the workpiece');
  } else {
    close(move.x, expected.position, 'Moving jaw face');
    close(Number(piece.a.x), 120, 'Workpiece starts at fixed jaw'); close(Number(piece.a.width), objectValue * expected.scale, 'Target width');
    if (ticks === objectTicks) close(Number(piece.a.x) + Number(piece.a.width), move.x, 'Moving jaw touches the target face');
    const rod = parsed.first('ci-depth-rod'); assert.ok(parsed.descendants(slider).includes(rod), 'Depth rod must be a child of the moving cursor');
    close(Number(rod.a.x) + Number(rod.a.width) + move.x, 796 + ticks / spec.denominator * expected.scale, 'Rod protrusion equals jaw opening');
    const jaw = parsed.first('ci-moving-jaw'); assert.ok(parsed.descendants(slider).includes(jaw), 'External jaw moves with the slider');
    if (type === 'analog') {
      const principalZero = parsed.all.find(n => hasClass(n, 'ci-main-tick') && n.a['data-main-unit'] === '0');
      const vernierZero = parsed.first('ci-whole-vernier');
      close(Number(principalZero.a.x1), 150, 'Principal zero is offset from the fixed measuring face');
      close(point(vernierZero, 'x1', 'y1').x - Number(principalZero.a.x1), ticks / spec.denominator * expected.scale, 'Both printed scales share the same zero offset');
      const index = ticks % Math.round(spec.main * spec.denominator), value = ticks / spec.denominator + index * spec.pitch;
      const selected = parsed.all.find(n => hasClass(n, 'ci-whole-vernier') && Number(n.a['data-vernier-index']) === index);
      const aligned = parsed.all.find(n => hasClass(n, 'ci-main-tick') && Math.abs(Number(n.a['data-main-unit']) - value) < 1e-7);
      assert.ok(aligned, 'Whole instrument retains principal graduations for the vernier near maximum capacity');
      close(point(selected, 'x1', 'y1').x, Number(aligned.a.x1), 'Whole instrument and magnifier show the same coincidence');
    }
  }
  assertHorizontalBounds(parsed, `${type}/${key}/${ticks}/instrument`);
  if (type === 'depth' || type === 'height') {
    const index = ticks % Math.round(spec.main * spec.denominator), value = ticks / spec.denominator + index * spec.pitch;
    const selected = parsed.all.find(n => hasClass(n, 'ci-whole-vernier') && Number(n.a['data-vernier-index']) === index);
    const aligned = parsed.all.find(n => hasClass(n, 'ci-main-tick') && Math.abs(Number(n.a['data-main-unit']) - value) < 1e-7);
    assert.ok(aligned, 'Vertical principal scale retains the graduation needed for the full measuring range');
    close(point(selected, 'x1', 'y1').y, point(aligned, 'x1', 'y1').y, 'Vertical instrument and magnifier show the same coincidence');
  }
  return parsed;
}
function assertVernier(type, key, ticks) {
  const spec = specs[key], value = ticks / spec.denominator, mainTicks = Math.round(spec.main * spec.denominator);
  const index = ticks % mainTicks, complete = (ticks - index) / spec.denominator;
  const plain = Instrument.render({ type, resolutionKey: key, ticks, section: 'detail' });
  const reveal = Instrument.render({ type, resolutionKey: key, ticks, section: 'detail', reveal: true });
  const parsed = parse(reveal), windows = parsed.all.filter(n => hasClass(n, 'ci-detail-window'));
  assert.ok(windows.length, 'A vernier instrument needs readable principal and moving scales');
  const first = parsed.descendants(windows[0]);
  const main = first.find(n => hasClass(n, 'ci-detail-main') && Math.abs(Number(n.a['data-main-unit']) - complete) < 1e-7);
  const next = first.find(n => hasClass(n, 'ci-detail-main') && Math.abs(Number(n.a['data-main-unit']) - complete - spec.main) < 1e-7);
  const zero = first.find(n => hasClass(n, 'ci-detail-vernier') && n.a['data-vernier-index'] === '0');
  assert.ok(main && next && zero, `${type}/${key}: complete principal graduation must bracket the zero`);
  assert.ok(Number(main.a.x1) <= Number(zero.a.x1) + 1e-6 && Number(zero.a.x1) < Number(next.a.x1) + 1e-6);
  const expectedCoincidence = value + index * spec.pitch;
  close(expectedCoincidence / spec.main, Math.round(expectedCoincidence / spec.main), 'Vernier coincidence lies on a principal graduation');
  let matches = 0;
  for (const window of windows) {
    const nodes = parsed.descendants(window), scale = Number(window.a['data-px-per-unit']);
    const verniers = nodes.filter(n => hasClass(n, 'ci-detail-vernier'));
    for (let i = 1; i < verniers.length; i++) close(Number(verniers[i].a.x1) - Number(verniers[i - 1].a.x1), spec.pitch * scale, 'Actual SVG vernier pitch');
    const selected = verniers.find(n => Number(n.a['data-vernier-index']) === index);
    if (selected) {
      const aligned = nodes.find(n => hasClass(n, 'ci-detail-main') && Math.abs(Number(n.a['data-main-unit']) - expectedCoincidence) < 1e-6);
      assert.ok(aligned, 'Expected principal alignment remains inside the correct detail window');
      close(Number(selected.a.x1), Number(aligned.a.x1), 'Vernier and principal strokes actually coincide'); matches++;
    }
  }
  assert.ok(matches >= 1); assert.ok(!plain.includes('ci-coincidence'), 'No answer highlight before reveal');
  assert.ok(reveal.includes('ci-coincidence'), 'Reveal highlights the mathematical coincidence');
  assertHorizontalBounds(parsed, `${type}/${key}/${ticks}/detail`);
}
function assertDial(key, ticks) {
  const spec = specs[key], svg = Instrument.render({ type: 'dial', resolutionKey: key, ticks }), parsed = parse(svg);
  const needles = parsed.all.filter(n => hasClass(n, 'ci-dial-needle')); assert.equal(needles.length, 2, 'Whole dial and magnification are synchronized');
  const index = ticks % 100, angle = index / 100 * 2 * Math.PI - Math.PI / 2;
  needles.forEach((n, i) => { const length = i === 0 ? 25 : 81; close(Number(n.a.x2) - Number(n.a.x1), Math.cos(angle) * length, 'Needle horizontal component'); close(Number(n.a.y2) - Number(n.a.y1), Math.sin(angle) * length, 'Needle vertical component'); });
  assert.ok(svg.includes(spec.unit === 'mm' ? 'uma volta = 1 mm' : 'uma volta = 0,1 pol'));
  assertHorizontalBounds(parsed, `dial/${key}/${ticks}/full`);
}
function assertVisibility(type, key, ticks) {
  const hidden = Instrument.render({ type, resolutionKey: key, ticks, annotated: true });
  assert.ok(!hidden.includes('data-reading=')); assert.ok(!hidden.includes('data-vernier-unit='));
  assert.ok(!/aria-label="[^"]*Leitura:/.test(hidden));
  assert.ok(!hidden.includes('Leitura do visor:')); assert.ok(!hidden.includes('ci-coincidence'));
  if (type === 'digital') { assert.ok(hidden.includes('VISOR OCULTO')); assert.ok(!hidden.includes('Nônio')); }
  const revealed = Instrument.render({ type, resolutionKey: key, ticks, reveal: true });
  const parsed = parse(revealed); close(Number(parsed.root.a['data-reading']), ticks / specs[key].denominator, 'Revealed reading');
  assert.match(parsed.root.a['aria-label'], /\. Leitura: /);
  const expected = key === 'in-128' ? Engine.format(ticks, key) + ' pol' : (ticks / specs[key].denominator).toFixed(specs[key].unit === 'in' ? 3 : key === 'mm-01' ? 1 : 2).replace('.', ',') + (specs[key].unit === 'mm' ? ' mm' : ' pol');
  assert.ok(revealed.includes(expected), 'Reveal must show the same exact value as the answer model');
  assertHorizontalBounds(parsed, `${type}/${key}/${ticks}/full`);
}

assert.equal(combinations.length, 14);
let physicalCases = 0, vernierCases = 0, dialCases = 0;
for (const [type, key] of combinations) {
  assert.ok(Instrument.TYPES[type].resolutions.includes(key));
  const spec = specs[key], max = spec.cap * spec.denominator;
  const samples = [...new Set([0, 1, Math.round(spec.denominator * .5), Math.floor(max / 2), max - 1, max])];
  for (const ticks of samples) {
    assertWhole(type, key, ticks); assertVisibility(type, key, ticks); physicalCases++;
    for (const section of ['instrument', 'detail', 'full']) assert.equal(Instrument.render({ type, resolutionKey: key, ticks, section }).includes('<svg'), true);
  }
  // Moving the cursor cannot secretly resize the virtual target.
  const target = Math.floor(max / 3), open = Math.floor(max / 2);
  const before = assertWhole(type, key, target, target).first('ci-workpiece');
  const after = assertWhole(type, key, open, target).first('ci-workpiece');
  for (const name of ['x', 'y', 'width', 'height', 'd']) assert.equal(before.a[name], after.a[name], 'Workpiece dimension remains fixed during manipulation');
  assert.equal(before.a['stroke-width'], '3'); assert.equal(after.a['stroke-width'], '1.5');
  assert.throws(() => Instrument.render({ type, resolutionKey: key, ticks: -1 }), RangeError);
  assert.throws(() => Instrument.render({ type, resolutionKey: key, ticks: max + 1 }), RangeError);
  assert.throws(() => Instrument.render({ type, resolutionKey: key, ticks: .5 }), RangeError);
  for (const outside of [-99, max + 99]) assertWhole(type, key, Engine.clampTicks(outside, key));
  if (['analog', 'depth', 'height'].includes(type)) {
    const cycle = Math.round(spec.main * spec.denominator);
    for (const base of [0, 17]) for (let index = 0; index < cycle; index++) { assertVernier(type, key, base * cycle + index); vernierCases++; }
  }
  if (type === 'dial') for (let index = 0; index < 100; index++) { assertDial(key, 300 + index); dialCases++; }
}
const reading3315 = Instrument.render({ type: 'analog', resolutionKey: 'mm-005', ticks: 663, reveal: true });
assert.ok(reading3315.includes('33,15 mm')); assert.ok(reading3315.includes('3 × 0,05 mm'));
assertVernier('analog', 'mm-005', 663);
assert.throws(() => Instrument.render({ type: 'analog', resolutionKey: 'mm-001', ticks: 1 }), RangeError);
assert.throws(() => Instrument.render({ type: 'digital', resolutionKey: 'in-128', ticks: 1 }), RangeError);
assert.throws(() => Instrument.render({ type: 'analog', resolutionKey: 'mm-005', ticks: 1, section: 'unknown' }), RangeError);
console.log(`PASS: 14 type/resolution combinations; ${physicalCases} physical/visibility cases; ${vernierCases} vernier alignments; ${dialCases} exact dial phases; fixed target, signed travel, coupled depth rod and SVG bounds.`);
