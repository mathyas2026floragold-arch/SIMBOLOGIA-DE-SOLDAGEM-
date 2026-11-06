// Integration checks against the shipped, offline HTML, including real handlers.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '../SIMBOLOGIA DE SOLDAGEM.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// A small DOM model: controls are parsed from rendered markup, so missing
// selectors and stale controls fail instead of silently becoming fake nodes.
const voidTags = new Set(['meta', 'link', 'br', 'hr', 'img', 'input']);
class Element {
  constructor(tag = 'div', attrs = {}) {
    this.tagName = tag.toLowerCase(); this.attrs = attrs; this.nodes = []; this.parent = null;
    this.dataset = Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith('data-')).map(([k,v]) => [k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v]));
    this.disabled = false; this.value = attrs.value || '';
    this.classList = {
      add: (...names) => this.setAttribute('class', [...new Set((this.className + ' ' + names.join(' ')).trim().split(/\s+/))].join(' ')),
      remove: (...names) => this.setAttribute('class', this.className.split(/\s+/).filter(name=>!names.includes(name)).join(' ')),
      contains: name => this.className.split(/\s+/).includes(name),
      toggle: (name,force) => { const enabled=force??!this.classList.contains(name); if(enabled)this.classList.add(name);else this.classList.remove(name);return enabled; }
    };
  }
  get children() { return this.nodes.filter(n => n instanceof Element); }
  get className() { return this.attrs.class || ''; }
  set className(value) { this.attrs.class = value; }
  get innerHTML() { return this.nodes.map(n => typeof n === 'string' ? n : n.outerHTML).join(''); }
  set innerHTML(value) { this.nodes = parse(String(value)); this.nodes.forEach(n => { if (n instanceof Element) n.parent = this; }); }
  get outerHTML() { return `<${this.tagName}${Object.entries(this.attrs).map(([k,v]) => ` ${k}="${v}"`).join('')}>${this.innerHTML}</${this.tagName}>`; }
  get textContent() { return this.nodes.map(n => typeof n === 'string' ? n : n.textContent).join(''); }
  set textContent(value) { this.nodes = [String(value)]; }
  setAttribute(name, value) { this.attrs[name] = String(value); if(name==='value'&&this.tagName==='progress')this.value=String(value); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  removeAttribute(name) { delete this.attrs[name]; }
  closest(selector) { for(let el=this;el;el=el.parent)if(simpleMatch(el,selector))return el;return null; }
  focus() { this.focused=true; }
  append(...items) { items.forEach(item => { item.parent = this; this.nodes.push(item); }); }
  after(item) { assert.ok(this.parent, 'after() requires an attached node'); item.parent = this.parent; this.parent.nodes.splice(this.parent.nodes.indexOf(this) + 1, 0, item); }
  insertAdjacentHTML(where, markup) {
    const items = parse(markup);
    if (where === 'beforeend') { this.append(...items); return; }
    assert.equal(where, 'afterend');
    assert.ok(this.parent); items.forEach(item => { if (item instanceof Element) item.parent = this.parent; });
    this.parent.nodes.splice(this.parent.nodes.indexOf(this) + 1, 0, ...items);
  }
  querySelectorAll(selector) {
    const alternatives = selector.split(',').map(s => s.trim().split(/\s+/));
    const matches = [];
    const visit = node => { for (const child of node.children) {
      if (alternatives.some(parts => {
        if (!simpleMatch(child, parts.at(-1))) return false;
        let ancestor = child.parent;
        for (let i = parts.length - 2; i >= 0; i--) { while (ancestor && !simpleMatch(ancestor, parts[i])) ancestor = ancestor.parent; if (!ancestor) return false; ancestor = ancestor.parent; }
        return true;
      })) matches.push(child);
      visit(child);
    }};
    visit(this); return matches;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  scrollIntoView() {}
}
function simpleMatch(node, selector) {
  if (selector.startsWith('#')) return node.attrs.id === selector.slice(1);
  if (selector.startsWith('.')) return node.className.split(/\s+/).includes(selector.slice(1));
  if (selector.startsWith('[')) { const [, key, value] = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/) || []; return key in node.attrs && (value === undefined || node.attrs[key] === value); }
  return node.tagName === selector.toLowerCase();
}
function parse(markup) {
  const root = new Element('fragment'), stack = [root];
  for (const token of markup.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || []) {
    if (token.startsWith('<!--') || token.startsWith('<!')) continue;
    if (token.startsWith('</')) { const tag = token.slice(2,-1).trim().toLowerCase(); const i = stack.findLastIndex(el => el.tagName === tag); if (i > 0) stack.length = i; continue; }
    if (token.startsWith('<')) {
      const [, tag, attrText] = token.match(/^<([\w:-]+)([\s\S]*?)\/?\s*>$/) || [];
      if (!tag) continue;
      const attrs = {};
      for (const match of attrText.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
      const el = new Element(tag, attrs); stack.at(-1).append(el);
      if (!voidTags.has(tag.toLowerCase()) && !token.endsWith('/>')) stack.push(el);
    } else stack.at(-1).nodes.push(token);
  }
  return root.nodes;
}
function createGame(initialState={ xp: 375, total: 17, right: 13, streak: 5, master: {}, seen: { saved: true } }) {
  const document = new Element('document');
  document.innerHTML = html.match(/<body>([\s\S]*?)<script>/)[1];
  document.createElement = tag => new Element(tag);
  const records = new Map([['moto-work-v1', JSON.stringify(initialState)]]);
  const context = vm.createContext({ console, document, window: { scrollTo() {} }, history: {}, localStorage: { getItem: key => records.get(key) || null, setItem: (key,value) => records.set(key,value) }, matchMedia: () => ({ matches: true }), confirm: () => false });
  vm.runInContext(source, context);
  const run = code => vm.runInContext(code, context);
  run('var optionLog=null;var integrationOptions=options;options=function(items,answer,render){optionLog={items:[...items],answer};return integrationOptions(items,answer,render);};');
  return { document, records, run };
}
module.exports = { createGame, Element };
if (require.main !== module) return;
const game = createGame(), { run, document, records } = game;
const familyTypes = Array.from(run('specialWeldTypes()'));
assert.equal(familyTypes.length, 9);
assert.equal(run('state.xp'), 375);
assert.equal(run('state.seen.saved'), true);
assert.equal(document.querySelectorAll('[data-mode]').length, 6, 'five welding modes and the added caliper game');
assert.deepEqual(document.querySelectorAll('[data-mode]').map(n => n.dataset.mode), ['1','2','3','4','5','6']);
for(const selector of ['.joint-reference-grid','.added-symbol-section','.added-symbol-callout','[data-symbol-study]'])assert.equal(document.querySelectorAll(selector).length,0,'removed menu extras stay absent: '+selector);
assert.doesNotMatch(html, /<script\b[^>]*src=|<link\b[^>]*stylesheet/i, 'offline bundle must remain self contained');
run('state.xp=14500;state.master={1:44,2:44,3:44,4:44,5:44};');

function cleanRender(label) {
  assert.doesNotMatch(document.querySelector('#app').innerHTML, /undefined|NaN|Infinity/, label);
}
function uniqueOptions(label) {
  const result = run('optionLog');
  assert.ok(result, label + ': options rendered');
  assert.equal(new Set(result.items).size, result.items.length, label + ': unique answer values');
  assert.equal(result.items.filter(value => value === result.answer).length, 1, label + ': exactly one correct answer');
}

// Each new family can be investigated, mounted and audited through actual
// controls from the same HTML that opens in the browser.
for (const type of familyTypes) {
  const literal = JSON.stringify(type);
  run(`retry=null;detect=null;mode=2;specialDetective(specialConfig(${literal}));`);
  const count = run('detect.steps.length');
  for (let i = 0; i < count; i++) {
    run(`detect.index=${i};specialDetective();`);
    uniqueOptions(type + ' detective step ' + i); cleanRender(type + ' detective');
  }
  run(`retry=null;detect=null;mode=3;locked=false;specialBuilder(specialConfig(${literal}));`);
  const expected = run('q.config');
  for (const select of document.querySelectorAll('[data-special-field]')) {const key=select.dataset.specialField;select.value=key==='tail'?(expected.tail||'Sem referência'):key==='process'?(expected.process||'Sem processo indicado'):String(expected[key]);}
  const before = run('state.right');
  document.querySelector('#special-submit').onclick();
  assert.equal(run('state.right'), before + 1, type + ': correct montage earns an answer');
  cleanRender(type + ' correct montage');
  run('locked=false;');
  document.querySelector('[data-special-field="type"]').value = 'Filete';
  const xp = run('state.xp');
  document.querySelector('#special-submit').onclick();
  assert.equal(run('state.xp'), xp, type + ': wrong montage earns no XP');
  assert.match(document.querySelector('#feedback').textContent, /Revise|ajustar/);
  // A wrong montage must reinforce the same family, rather than jump games.
  document.querySelector('#next').onclick();
  assert.equal(run('mode'), 3);
  assert.equal(run('q.config.type'), type, type + ': reinforcement keeps the family');
  cleanRender(type + ' reinforcement');

  run(`retry={error:'Tipo de solda errado'};mode=4;locked=false;specialInspector(specialConfig(${literal}));`);
  assert.equal(run('q.error'), 'Tipo de solda errado');
  document.querySelector('#special-reject').onclick();
  const fault = document.querySelector('#special-faults').children.find(n => n.textContent === 'Tipo de solda errado');
  assert.ok(fault, type + ': exact fault is available');
  const rightBefore = run('state.right'); fault.onclick();
  assert.equal(run('state.right'), rightBefore + 1, type + ': exact audit answer scores');
  cleanRender(type + ' audit');

  for (const task of [0,1,2]) for (const orientation of [0,1,2,3]) {
    run(`retry=null;mode=5;locked=false;specialPositions({...specialConfig(${literal}),positionSpecialTask:${task},positionOrientation:${orientation}});`);
    assert.equal(run('q.config.type'), type);
    assert.equal(run('q.positionSpecial'), true);
    uniqueOptions(`${type} positions ${task}/${orientation}`); cleanRender(type + ' positions');
    if (task === 1) {
      const alternatives = document.querySelectorAll('[data-index]').map(n => n.innerHTML.replace(/<span class="letter">[A-D]<\/span>/, ''));
      assert.equal(new Set(alternatives).size, alternatives.length, `${type}: distinct visual alternatives`);
    }
  }
  run("grade('__incorrect__',null,[]);");
  document.querySelector('#next').onclick();
  assert.equal(run('mode'), 5);
  assert.equal(run('q.config.type'), type, type + ': position reinforcement keeps family');
}

// New filete joint views keep their identity when corrected and reinforced.
for (const code of ['2F','3F','4F']) for (const joint of ['T','Canto','Sobreposta']) {
  run(`mode=5;locked=false;retry={code:${JSON.stringify(code)},positionJoint:${JSON.stringify(joint)},positionTask:1,travel:'up'};positions();`);
  assert.equal(run('q.positionJoint'), joint);
  assert.ok(run('q.correctVisual').includes('Junta '+joint+' orientada'), `${code}: ${joint} geometry is used`);
  uniqueOptions(code + ' ' + joint); cleanRender(code + ' ' + joint);
  run("grade('__incorrect__',null,[]);");
  document.querySelector('#next').onclick();
  assert.equal(run('q.code'), code);
  assert.equal(run('q.positionJoint'), joint, 'reinforcement preserves the filete joint');
}
run("mode=5;retry={code:'1F',positionJoint:'Canto',positionTask:1};positions();");
assert.equal(run('q.positionJoint'), 'T', '1F retains the unambiguous T geometry');

// Exercise the normal entry point, so coverage cannot depend on a library
// shortcut. Every mode should mix established and added families.
for (let mode = 1; mode <= 5; mode++) {
  const observed = [], normal = [];
  const taskCoverage = { special: new Set(), regular: new Set() };
  const tasksByFamily = new Map(familyTypes.map(type => [type, new Set()]));
  const matchDirections = { special: new Set(), regular: new Set() };
  for (let i = 0; i < (mode === 5 ? 90 : 42); i++) {
    run(`start(${mode});`);
    const type = run('q.config?.special?q.config.type:detect?.special?detect.c.type:q.bank?.added?q.bank.targetType:null');
    if (type) observed.push(type); else normal.push(i);
    const group = type ? 'special' : 'regular';
    if (mode === 5) {
      const task = run('q.positionSpecial?q.config.positionSpecialTask:q.positionTask');
      taskCoverage[group].add(task);
      if (type) tasksByFamily.get(type).add(task);
    }
    if (mode === 1 && ['pair','cut'].includes(run('q.bank.kind'))) {
      const prompt = document.querySelector('#app').querySelector('h2').textContent;
      matchDirections[group].add(prompt.startsWith('Qual símbolo corresponde') ? 'execution-to-symbol' : 'symbol-to-execution');
    }
    cleanRender(`mode ${mode} entry ${i}`);
    if (mode === 1 || mode === 2 || mode === 5) uniqueOptions(`mode ${mode} entry ${i}`);
  }
  assert.ok(normal.length, `mode ${mode}: established content remains in rotation`);
  assert.ok(observed.length >= 9, `mode ${mode}: new content occurs reliably`);
  assert.equal(new Set(observed.slice(0,9)).size, 9, `mode ${mode}: nine new families before repeating`);
  assert.deepEqual(new Set(observed), new Set(familyTypes), `mode ${mode}: all nine families are reachable`);
  if (mode === 5) for (const group of ['special','regular']) {
    assert.deepEqual(taskCoverage[group], new Set([0,1,2]), `positions ${group}: normal dispatch must reach all three task variants`);
  }
  if (mode === 5) for (const [family, tasks] of tasksByFamily) {
    assert.deepEqual(tasks, new Set([0,1,2]), `${family}: each family must receive all three spatial tasks through normal dispatch`);
  }
  if (mode === 1) for (const group of ['special','regular']) {
    assert.deepEqual(matchDirections[group], new Set(['symbol-to-execution','execution-to-symbol']), `Match ${group}: both directions must occur through normal dispatch`);
  }
}

assert.equal(JSON.parse(records.get('moto-work-v1')).seen.saved, true, 'existing saved history survives answers');
assert.equal(run('levels.length'), 12);
assert.equal(run('positionInfo("3G","up").iso'), 'PF');
assert.equal(run('positionInfo("3G","down").iso'), 'PG');
console.log('PASS: nine added families integrated in five existing modes; normal dispatch, unique answers, correct/wrong montage, audit, reinforcement and saved progress.');
