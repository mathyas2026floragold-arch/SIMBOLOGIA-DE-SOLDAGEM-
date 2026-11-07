'use strict';
const assert = require('node:assert/strict');
const E = require('./caliper-engine.js');
const I = require('./caliper-instrument.js');

// Independent measurement fixtures. The .05 mm model uses an expanded
// 39 mm / 20 division vernier; it must not silently revert to 19 mm.
const SPEC = {
  'mm-01': { den: 10, cap: 150, digits: 1, mainTicks: 10, pitchTicks: 9, divisions: 10, unit: 'mm' },
  'mm-005': { den: 20, cap: 150, digits: 2, mainTicks: 20, pitchTicks: 39, divisions: 20, unit: 'mm' },
  'mm-002': { den: 50, cap: 150, digits: 2, mainTicks: 50, pitchTicks: 49, divisions: 50, unit: 'mm' },
  'mm-001': { den: 100, cap: 150, digits: 2, unit: 'mm' },
  'in-128': { den: 128, cap: 6, mainTicks: 8, pitchTicks: 7, divisions: 8, unit: 'in' },
  'in-1000': { den: 1000, cap: 6, digits: 3, mainTicks: 25, pitchTicks: 24, divisions: 25, unit: 'in' }
};
const COMBINATIONS = [
  ['analog', 'mm-01'], ['analog', 'mm-005'], ['analog', 'mm-002'], ['analog', 'in-128'], ['analog', 'in-1000'],
  ['digital', 'mm-001'], ['digital', 'in-1000'], ['dial', 'mm-001'], ['dial', 'in-1000'],
  ['depth', 'mm-005'], ['depth', 'mm-002'], ['depth', 'in-1000'], ['height', 'mm-002'], ['height', 'in-1000']
];
const near = (actual, expected, label, epsilon = 2e-6) => assert.ok(Math.abs(actual - expected) <= epsilon,
  `${label}: expected ${expected}, got ${actual}`);
const gcd = (a, b) => b ? gcd(b, a % b) : a;
function expectedText(ticks, key) {
  const s = SPEC[key];
  if (key === 'in-128') {
    const whole = Math.floor(ticks / 128), rest = ticks % 128;
    if (!rest) return String(whole);
    const d = gcd(rest, 128); return (whole ? whole + ' ' : '') + rest / d + '/' + 128 / d;
  }
  const factor = 10 ** s.digits, integer = ticks * factor / s.den;
  assert.equal(Number.isInteger(integer), true);
  return Math.floor(integer / factor) + ',' + String(integer % factor).padStart(s.digits, '0');
}
function expectedGeometry(type, s, ticks) {
  const travel = type === 'depth' ? 90 : type === 'height' ? -150 : 480;
  const origin = type === 'depth' ? 130 : type === 'height' ? 270 : 120;
  return { axis: type === 'depth' || type === 'height' ? 'y' : 'x', origin, scale: travel / s.cap, position: origin + ticks * travel / (s.den * s.cap) };
}
function parseSVG(svg) {
  const root = { a: {}, children: [], parent: null }, stack = [root], nodes = [];
  for (const m of svg.matchAll(/<(\/)?([\w-]+)\b([^>]*?)(\/)?>/g)) {
    if (m[1]) { assert.equal(stack.at(-1).tag, m[2], 'Balanced SVG markup'); stack.pop(); continue; }
    const a = Object.fromEntries([...m[3].matchAll(/([\w:.-]+)="([^"]*)"/g)].map(v => [v[1], v[2]]));
    const n = { tag: m[2], a, parent: stack.at(-1), children: [] };
    if (n.tag === 'text') n.text = svg.slice(m.index + m[0].length, svg.indexOf('</text>', m.index)).replace(/<[^>]*>/g, '');
    n.parent.children.push(n); nodes.push(n);
    if (!m[4]) stack.push(n);
  }
  assert.equal(stack.length, 1);
  const has = (n, name) => (n.a.class || '').split(/\s+/).includes(name);
  return { nodes, root: nodes[0], all: name => nodes.filter(n => has(n, name)), one: name => nodes.find(n => has(n, name)) };
}
function offset(node) {
  let x = 0, y = 0;
  for (let n = node; n; n = n.parent) if (n.a.transform) {
    const m = n.a.transform.match(/^translate\(([-+\d.e]+)(?:[ ,]+([-+\d.e]+))?\)$/i);
    assert.ok(m, 'Expected a measurable SVG translation'); x += Number(m[1]); y += Number(m[2] || 0);
  }
  return { x, y };
}
function coordinate(node, axis, end = 1) {
  const delta = offset(node); return Number(node.a[axis + end] ?? node.a[axis] ?? 0) + delta[axis];
}
function sourceBounds(parsed, label) {
  const width = Number(parsed.root.a.viewBox.split(/\s+/)[2]); assert.equal(width, 1280);
  const check = x => assert.ok(x >= -.001 && x <= width + .001, `${label}: x ${x} outside viewBox`);
  for (const n of parsed.nodes) {
    const d = offset(n), a = n.a;
    if (n.tag === 'rect') { check(Number(a.x || 0) + d.x); check(Number(a.x || 0) + Number(a.width) + d.x); }
    if (n.tag === 'line') { check(Number(a.x1) + d.x); check(Number(a.x2) + d.x); }
    if (n.tag === 'circle') { check(Number(a.cx) - Number(a.r) + d.x); check(Number(a.cx) + Number(a.r) + d.x); }
    if (n.tag === 'text') check(Number(a.x) + d.x);
  }
}

// Exhaustive half-step checks expose binary floating-point failures such as
// 1.005 * 100 becoming 100.49999999999999. Nearby non-ties remain distinct.
let quantizationChecks = 0;
for (const [key, s] of Object.entries(SPEC)) {
  const maximum = s.cap * s.den, delta = 1 / s.den / 1000000;
  for (let lower = 0; lower < maximum; lower++) {
    const middle = (lower + .5) / s.den;
    assert.equal(E.quantize(middle, key), lower + 1, `${key}: exact half step at ${middle}`);
    assert.equal(E.quantize(middle - delta, key), lower, `${key}: just below midpoint`);
    assert.equal(E.quantize(middle + delta, key), lower + 1, `${key}: just above midpoint`);
    quantizationChecks += 3;
  }
  assert.equal(E.quantize(-1, key), 0); assert.equal(E.quantize(s.cap + 1, key), maximum);
}
assert.equal(E.quantize(.29, 'mm-002'), 15);
assert.equal(E.quantize(1.005, 'mm-001'), 101);
assert.equal(E.quantize(.5005, 'in-1000'), 501);
assert.equal(E.format(15, 'mm-002'), '0,30');
assert.equal(E.format(101, 'mm-001'), '1,01');
assert.equal(E.format(501, 'in-1000'), '0,501');

let tickChecks = 0;
for (const [type, key] of COMBINATIONS) {
  const s = SPEC[key], maximum = s.cap * s.den, method = type === 'digital' ? 'digital' : type === 'dial' ? 'dial' : 'vernier';
  assert.ok(E.getType(type).resolutions.includes(key));
  for (let ticks = 0; ticks <= maximum; ticks++) {
    const value = ticks / s.den, text = expectedText(ticks, key), explanation = E.explain(ticks, key, type), g = I.geometry({ type, resolutionKey: key, ticks }), expected = expectedGeometry(type, s, ticks);
    near(E.valueOf(ticks, key), value, 'Canonical measurement', 1e-12);
    assert.equal(E.format(ticks, key), text, `${type}/${key}/${ticks}: rendered decimal or fraction`);
    const parsed = E.parseAnswer(text, key); assert.equal(parsed.valid, true); assert.equal(parsed.onGrid, true); assert.equal(parsed.ticks, ticks);
    const grade = E.grade(ticks, key, text, type); assert.equal(grade.valid, true); assert.equal(grade.correct, true);
    assert.equal(explanation.method, method); near(explanation.total, value, 'Explanation total', 1e-12);
    if (method !== 'digital') {
      const cycle = method === 'dial' ? 100 : s.mainTicks, index = ticks % cycle;
      near(explanation.main, (ticks - index) / s.den, 'Principal reading', 1e-12);
      near(explanation.contribution, index / s.den, 'Secondary reading', 1e-12);
      assert.equal(method === 'dial' ? explanation.dialIndex : explanation.vernierIndex, index);
      assert.match(grade.explanation, method === 'dial' ? /Ponteiro do relógio/ : /Nônio/);
    } else { assert.equal(explanation.vernierIndex, null); assert.match(grade.explanation, /visor digital/); assert.doesNotMatch(grade.explanation, /Nônio:|Ponteiro/); }
    assert.equal(g.axis, expected.axis); near(g.zeroPx, expected.origin, 'Instrument reference'); near(g.pxPerUnit, expected.scale, 'Travel per measurement unit'); near(g.sliderPx, expected.position, 'Cursor position');
    assert.equal(E.quantize(value, key), ticks, 'No tick can disappear in quantization');
    const wrong = ticks === maximum ? ticks - 1 : ticks + 1; assert.equal(E.grade(ticks, key, expectedText(wrong, key), type).correct, false, 'Neighbouring tick must not be accepted');
    tickChecks++;
  }
}
assert.match(E.grade(673, 'in-1000', '0.673', 'dial').explanation, /Escala principal: 0,600 pol/);
assert.match(E.grade(673, 'in-1000', '0.673', 'dial').explanation, /divisão 73/);
assert.match(E.grade(673, 'in-1000', '0.673', 'analog').explanation, /Escala principal: 0,650 pol/);
assert.match(E.grade(673, 'in-1000', '0.673', 'analog').explanation, /traço 23/);

let svgChecks = 0;
for (const [type, key] of COMBINATIONS) {
  const s = SPEC[key], maximum = s.cap * s.den, samples = new Set([0, 1, maximum - 1, maximum, Math.floor(maximum / 2)]);
  const cycle = type === 'dial' ? 100 : s.mainTicks || 1;
  if (type !== 'digital') for (const base of [0, Math.floor(maximum / 2 / cycle) * cycle]) for (let phase = 0; phase < cycle; phase++) samples.add(base + phase);
  const transitions = s.unit === 'mm' ? [1, 2, 3, 9, 10, 33, 49, 99, 149] : [1, 2, 3, 5];
  for (const v of transitions) for (const delta of [-1, 0, 1]) { const tick = v * s.den + delta; if (tick >= 0 && tick <= maximum) samples.add(tick); }
  for (const ticks of samples) {
    const value = ticks / s.den, expected = expectedGeometry(type, s, ticks), options = { type, resolutionKey: key, ticks, objectTicks: ticks, contact: true };
    const whole = parseSVG(I.render({ ...options, section: 'instrument' })), detail = parseSVG(I.render({ ...options, section: 'detail', reveal: true }));
    const slider = whole.nodes.find(n => Object.hasOwn(n.a, 'data-caliper-slider')); assert.ok(slider);
    const mainZero = whole.all('ci-main-tick').find(n => Number(n.a['data-main-unit']) === 0); assert.ok(mainZero);
    if (['analog', 'digital', 'dial'].includes(type)) {
      near(coordinate(mainZero, 'x'), 150, 'Fixed scale zero includes the 30 px offset');
      const fixed = whole.one('ci-internal-fixed-contact'), moving = whole.one('ci-internal-moving-contact'); assert.ok(fixed && moving, 'Internal measuring faces need explicit calibrated references');
      near(coordinate(fixed, 'x'), 120, 'Fixed internal measuring face'); near(coordinate(moving, 'x'), expected.position, 'Moving internal measuring face');
      near(coordinate(moving, 'x') - coordinate(fixed, 'x'), value * expected.scale, 'Internal jaw opening equals external jaw opening');
      near(coordinate(fixed, 'y'), coordinate(moving, 'y'), 'Internal measuring faces share the same height');
      const rod = whole.one('ci-depth-rod'); assert.ok(rod); const d = offset(rod);
      near(Number(rod.a.x) + d.x, 796, 'Exposed rod begins at the fixed beam outlet');
      near(Number(rod.a.width), value * expected.scale, 'Exposed depth rod equals jaw opening');
      near(Number(rod.a.x) + Number(rod.a.width) + d.x, 796 + value * expected.scale, 'Depth rod endpoint');
      const piece = whole.one('ci-workpiece'); near(Number(piece.a.x) + Number(piece.a.width), expected.position, 'External jaw contacts target face');
      if (type === 'dial') {
        const index = whole.one('ci-dial-main-index'); assert.ok(index, 'Dial model needs a visible principal index');
        near(coordinate(index, 'x'), 150 + value * expected.scale, 'Dial principal index shares scale-zero offset');
      }
    }
    if (!['digital', 'dial'].includes(type)) {
      const phase = ticks % s.mainTicks, coincidence = (ticks + phase * s.pitchTicks) / s.den;
      const principal = whole.all('ci-main-tick').find(n => Math.abs(Number(n.a['data-main-unit']) - coincidence) < 1e-7);
      const vernier = whole.all('ci-whole-vernier').find(n => Number(n.a['data-vernier-index']) === phase);
      assert.ok(principal && vernier, `${type}/${key}/${ticks}: physical scale contains the correct coincidence`);
      near(coordinate(principal, expected.axis), coordinate(vernier, expected.axis), 'Physical principal and vernier strokes coincide');
      const complete = (ticks - phase) / s.den, main = detail.all('ci-detail-main').find(n => Math.abs(Number(n.a['data-main-unit']) - complete) < 1e-7), zero = detail.all('ci-detail-vernier').find(n => n.a['data-vernier-index'] === '0');
      assert.ok(main && zero, 'Magnification retains the last complete principal graduation');
      assert.ok(coordinate(main, 'x') <= coordinate(zero, 'x') + 1e-7);
      const preciseMain = detail.all('ci-detail-main').find(n => Math.abs(Number(n.a['data-main-unit']) - coincidence) < 1e-7), preciseVernier = detail.all('ci-detail-vernier').find(n => Number(n.a['data-vernier-index']) === phase);
      assert.ok(preciseMain && preciseVernier); near(coordinate(preciseMain, 'x'), coordinate(preciseVernier, 'x'), 'Continuous magnifier coincidence');
      assert.equal(detail.all('ci-detail-window').length, 1, 'The full vernier stays continuous');
    }
    if (type === 'dial') {
      const phase = ticks % 100, a = phase * Math.PI / 50 - Math.PI / 2;
      const needles = whole.all('ci-dial-needle').concat(detail.all('ci-dial-needle')); assert.equal(needles.length, 2);
      needles.forEach((needle, i) => { const length = i === 0 ? 25 : 81; near(Number(needle.a.x2) - Number(needle.a.x1), Math.cos(a) * length, 'Dial pointer x'); near(Number(needle.a.y2) - Number(needle.a.y1), Math.sin(a) * length, 'Dial pointer y'); });
    }
    const hiddenSVG = I.render(options), revealedSVG = I.render({ ...options, reveal: true });
    assert.ok(!hiddenSVG.includes('data-reading=') && !hiddenSVG.includes('data-vernier-unit=')); assert.ok(!hiddenSVG.includes('ci-coincidence'));
    const revealed = parseSVG(revealedSVG); near(Number(revealed.root.a['data-reading']), value, 'Revealed exact reading');
    sourceBounds(whole, `${type}/${key}/${ticks}/body`); sourceBounds(detail, `${type}/${key}/${ticks}/magnifier`);
    svgChecks++;
  }
}

// Assessment face: independently recover the shared scale transform from the
// rendered strokes. A pan may change the origin, but cannot change the reading,
// relative pitch, visible last complete graduation or attainable coincidence.
let gameChecks = 0, gamePanChecks = 0;
for (const [type, key] of COMBINATIONS) {
  const s = SPEC[key], maximum = s.cap * s.den, options = { type, resolutionKey: key, section: 'game' };
  if (type === 'digital' || type === 'dial') {
    for (const ticks of [0, 1, Math.floor(maximum / 2), maximum - 1, maximum]) {
      const hiddenText = I.render({ ...options, ticks }), hidden = parseSVG(hiddenText), shown = parseSVG(I.render({ ...options, ticks, reveal: true }));
      assert.equal(hidden.all('ci-game-window').length, 0, 'A digital display or dial must not acquire an invented vernier');
      assert.equal(hidden.all('ci-game-vernier').length, 0);
      assert.ok(!hiddenText.includes('data-reading=') && !hiddenText.includes('Leitura:') && !hiddenText.includes('ci-coincidence'));
      near(Number(shown.root.a['data-reading']), ticks / s.den, 'Assessment reveal preserves the digital or dial measurement');
      if (type === 'dial') {
        const needle = hidden.one('ci-dial-needle'), angle = (ticks % 100) * Math.PI / 50 - Math.PI / 2; assert.ok(needle);
        near(Number(needle.a.x2) - Number(needle.a.x1), Math.cos(angle) * 81, 'Assessment dial phase x');
        near(Number(needle.a.y2) - Number(needle.a.y1), Math.sin(angle) * 81, 'Assessment dial phase y');
      }
      sourceBounds(hidden, `${type}/${key}/${ticks}/assessment`); gameChecks++;
    }
    continue;
  }
  const samples = new Set([0, 1, maximum - 1, maximum]);
  for (const base of [0, Math.floor(maximum / 2 / s.mainTicks) * s.mainTicks, maximum - s.mainTicks]) {
    for (let phase = 0; phase < s.mainTicks; phase++) samples.add(base + phase);
  }
  const at = ticks => {
    const svg = I.render({ ...options, ticks }), parsed = parseSVG(svg), window = parsed.one('ci-game-window');
    assert.ok(window, `${type}/${key}: an assessment face contains one continuous scale`);
    const zero = parsed.all('ci-game-vernier').find(n => Number(n.a['data-vernier-index']) === 0); assert.ok(zero);
    const scale = Number(window.a['data-px-per-unit']), zeroX = coordinate(zero, 'x');
    assert.ok(Number.isFinite(scale) && scale > 0);
    return { svg, parsed, zeroX, scale, intercept: zeroX - ticks * scale / s.den };
  };
  // Locate pan transitions by observing the renderer, without prescribing its
  // bucket size or reproducing its origin-selection formula. Probing every
  // principal interval also covers all integer-main boundaries across capacity.
  const transitions = [];
  let previousTick = 0, previous = at(0);
  for (let probe = s.mainTicks; probe <= maximum; probe += s.mainTicks) {
    const current = at(probe);
    if (Math.abs(current.intercept - previous.intercept) > 1e-5) {
      let lo = previousTick, hi = probe;
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (Math.abs(at(mid).intercept - previous.intercept) < 1e-5) lo = mid; else hi = mid;
      }
      transitions.push(hi);
      for (let delta = -2; delta <= 2; delta++) if (hi + delta >= 0 && hi + delta <= maximum) samples.add(hi + delta);
    }
    previousTick = probe; previous = current;
  }
  assert.ok(transitions.length > 0, `${type}/${key}: high readings pan into the assessment window`);
  const milestones = s.unit === 'mm' ? [1, 2, 3, 9, 10, 33, 49, 99, 149] : [1, 2, 3, 5];
  for (const value of milestones) for (const delta of [-1, 0, 1]) {
    const ticks = value * s.den + delta; if (ticks >= 0 && ticks <= maximum) samples.add(ticks);
  }
  for (const ticks of samples) {
    const label = `${type}/${key}/${ticks}/assessment`, f = at(ticks), hidden = f.parsed;
    const shown = parseSVG(I.render({ ...options, ticks, reveal: true }));
    const main = hidden.all('ci-game-main'), vernier = hidden.all('ci-game-vernier'), value = ticks / s.den;
    const phase = ticks % s.mainTicks, completeTicks = ticks - phase, coincidenceTicks = ticks + phase * s.pitchTicks;
    assert.equal(hidden.all('ci-game-window').length, 1); assert.equal(vernier.length, s.divisions + 1);
    assert.ok(main.length >= 2); near(Number(hidden.root.a.viewBox.split(/\s+/)[3]), 410, 'Assessment drawing height');
    for (let k = 0; k < vernier.length; k++) {
      const stroke = vernier[k]; assert.equal(Number(stroke.a['data-vernier-index']), k, 'No vernier graduation can disappear');
      near(coordinate(stroke, 'x'), f.zeroX + k * s.pitchTicks * f.scale / s.den, 'Assessment physical vernier pitch');
      near(coordinate(stroke, 'y'), 250, 'Vernier shares the principal baseline');
      assert.ok(coordinate(stroke, 'x') >= 0 && coordinate(stroke, 'x') <= 1280, `${label}: the complete vernier is in view`);
    }
    const vernierLabels = hidden.nodes.filter(n => n.tag === 'text' && Number(n.a.y) === 369);
    const numberedEvery = key === 'mm-005' ? 2 : key === 'mm-002' ? 5 : 1;
    assert.equal(vernierLabels.length, s.divisions / numberedEvery + 1, 'Every numbered vernier graduation is readable');
    for (let k = 0; k <= s.divisions; k += numberedEvery) {
      const number = vernierLabels.find(n => Math.abs(coordinate(n, 'x') - coordinate(vernier[k], 'x')) < 1e-6);
      assert.ok(number, `${label}: numbered division ${k} remains attached to its stroke`);
      assert.equal(number.text, String(key === 'mm-005' ? k / 2 : k), 'A printed vernier number does not change its ordinal division');
    }
    for (let k = 0; k < main.length; k++) {
      const stroke = main[k], unit = Number(stroke.a['data-main-unit']);
      near(coordinate(stroke, 'x') - f.zeroX, (unit - value) * f.scale, 'A pan applies the same origin to both scales');
      near(coordinate(stroke, 'y', 2), 250, 'Main scale shares the vernier baseline');
      if (k) near(unit - Number(main[k - 1].a['data-main-unit']), s.mainTicks / s.den, 'Every principal interval retains its physical value', 1e-7);
    }
    const findMain = n => main.find(stroke => Math.abs(Number(stroke.a['data-main-unit']) - n / s.den) < 1e-7);
    const previousMain = findMain(completeTicks), coincidenceMain = findMain(coincidenceTicks);
    assert.ok(previousMain, `${label}: the last complete principal mark must remain visible`);
    near(f.zeroX - coordinate(previousMain, 'x'), phase * f.scale / s.den, 'Distance after the last complete principal graduation');
    assert.ok(coincidenceMain, `${label}: the correct principal coincidence is visible before checking`);
    near(coordinate(coincidenceMain, 'x'), coordinate(vernier[phase], 'x'), 'Unrevealed correct coincidence');

    const labels = hidden.nodes.filter(n => n.tag === 'text' && Number(n.a.y) === 132);
    const majors = main.filter(n => {
      const t = Math.round(Number(n.a['data-main-unit']) * s.den);
      return t % (s.unit === 'mm' ? 10 * s.den : key === 'in-128' ? s.den / 4 : s.den / 10) === 0;
    });
    assert.ok(labels.length >= 2, `${label}: the assessment has readable major numbers`);
    for (const stroke of majors) if (coordinate(stroke, 'x') >= 80 && coordinate(stroke, 'x') <= 1200) {
      assert.ok(labels.some(v => Math.abs(coordinate(v, 'x') - coordinate(stroke, 'x')) < 1e-6), `${label}: an interior major graduation needs its number`);
    }
    // Edge numbers may be omitted to keep their glyphs inside the viewport.
    for (const n of labels) {
      const stroke = majors.find(v => Math.abs(coordinate(v, 'x') - coordinate(n, 'x')) < 1e-6);
      assert.ok(stroke, `${label}: a printed number must identify a major physical graduation`);
      const unit = Number(stroke.a['data-main-unit']);
      const expected = s.unit === 'mm' ? String(unit / 10) : key === 'in-128' ? expectedText(Math.round(unit * s.den), key) : unit.toFixed(1).replace(/\.0$/, '').replace('.', ',');
      assert.equal(n.text, expected, `${label}: major number represents the physical unit`);
    }
    assert.ok(hidden.nodes.some(n => n.tag === 'text' && n.text === (s.unit === 'mm' ? 'cm' : 'pol')));
    assert.ok(!f.svg.includes('data-reading=') && !f.svg.includes('data-vernier-unit=') && !f.svg.includes('Leitura:'));
    assert.equal(hidden.all('ci-coincidence').length, 0, 'Assessment gives no coincidence highlight before confirmation');
    assert.equal(new Set(vernier.map(n => n.a.stroke + '/' + n.a['stroke-width'])).size, 1, 'Hidden vernier has no answer-specific stroke');
    assert.equal(new Set(main.map(n => n.a.stroke + '/' + n.a['stroke-width'])).size, 1, 'Hidden principal scale has no answer-specific stroke');
    const highlighted = shown.all('ci-coincidence'); assert.equal(highlighted.length, 1);
    near(coordinate(highlighted[0], 'x'), coordinate(vernier[phase], 'x'), 'Reveal highlights the correct division, not its printed label');
    const shownVernier = shown.all('ci-game-vernier'), selected = shownVernier.filter((n, k) => n.a.stroke !== vernier[k].a.stroke || n.a['stroke-width'] !== vernier[k].a['stroke-width']);
    assert.equal(selected.length, 1); assert.equal(Number(selected[0].a['data-vernier-index']), phase);
    shownVernier.forEach((n, k) => near(coordinate(n, 'x'), coordinate(vernier[k], 'x'), 'Revealing cannot move a vernier graduation'));
    const shownMain = shown.all('ci-game-main'), selectedMain = shownMain.filter((n, k) => n.a.stroke !== main[k].a.stroke || n.a['stroke-width'] !== main[k].a['stroke-width']);
    assert.equal(selectedMain.length, 1);
    near(Number(selectedMain[0].a['data-main-unit']), coincidenceTicks / s.den, 'Reveal highlights the correct principal graduation');
    near(Number(shown.root.a['data-reading']), value, 'Assessment reveal preserves the exact answer');
    assert.ok(!shown.nodes.some(n => n.tag === 'text' && /×| = /.test(n.text)), 'Assessment face stays a single instrument rather than a worked formula');
    sourceBounds(hidden, label); sourceBounds(shown, label + '/revealed'); gameChecks++;
  }
  for (const ticks of transitions) {
    const before = at(ticks - 1), after = at(ticks), a = before.parsed.all('ci-game-main'), b = after.parsed.all('ci-game-main');
    const common = a.find(n => b.some(m => m.a['data-main-unit'] === n.a['data-main-unit'])); assert.ok(common);
    const moved = b.find(n => n.a['data-main-unit'] === common.a['data-main-unit']);
    const pan = coordinate(moved, 'x') - coordinate(common, 'x');
    near(after.zeroX - before.zeroX, pan + after.scale / s.den, 'At a pan boundary the cursor keeps its exact one-tick motion relative to the ruler');
    assert.ok(pan < 0, 'A higher measurement pans the fixed ruler left'); gamePanChecks++;
  }
  for (const ticks of [-1, maximum + 1, .5]) assert.throws(() => I.render({ ...options, ticks }), RangeError, 'Assessment cannot render a position beyond capacity or off its resolution');
}
console.log(`PASS: ${tickChecks} exhaustive model/geometry ticks; ${quantizationChecks} midpoint/neighbour checks; ${svgChecks} SVG boundary/phase/transition cases; ${gameChecks} assessment faces and ${gamePanChecks} pan boundaries; internal faces, dial index, offset zeros, unrevealed coincidences and correct model-specific explanations.`);
