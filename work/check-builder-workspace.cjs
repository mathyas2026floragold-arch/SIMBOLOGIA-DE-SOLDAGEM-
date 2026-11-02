const assert = require('node:assert/strict');
const { createGame } = require('./check-five-modes.cjs');
const { document, run, records } = createGame();
run('state.xp=14500;state.master={1:44,2:44,3:44,4:44,5:44};');

run('var builderPreviewConfigs=[];var builderOriginalPreview=constructionPreview;constructionPreview=function(c,view){builderPreviewConfigs.push({...c});return builderOriginalPreview(c,view);};');
const $ = selector => { const node = document.querySelector(selector); assert.ok(node, 'Missing control: '+selector); return node; };
const selects = special => document.querySelectorAll(special ? '[data-special-field]' : '[data-field]');
const keyOf = (select, special) => select.dataset[special ? 'specialField' : 'field'];
const previewOf = special => $(special ? '#special-live' : '#live');
const submitOf = special => $(special ? '#special-submit' : '#submit');
function expectedValue(key,c,special) {
  if (key === 'tail') return c.tail || 'Sem referência';
  if (key === 'process') return c.process || 'Sem processo indicado';
  if (special) return String(c[key]);
  if (['field','all','backing','melt','removable'].includes(key)) return c[key] ? 'Sim' : 'Não';
  if (key === 'contour') return c.contour || 'Sem contorno';
  if (key === 'finish') return c.finish || 'Sem método';
  return String(c[key] || 0);
}
function choose(select,value) { select.value=String(value); assert.equal(typeof select.onchange,'function'); select.onchange(); }
function progressIs(count,total,label) {
  assert.match($('#builder-count').textContent, new RegExp(`${count}\\s*/\\s*${total}`), label);
  assert.equal(Number($('#builder-fill').value),count,label+' progress bar');
  assert.match($('#builder-count-bottom').textContent,new RegExp(`${count}\\s*/\\s*${total}`),label+' mobile progress');
}
function fill(special,c,except=null) {
  for (const select of selects(special)) {
    const key=keyOf(select,special);
    if (key!==except) choose(select,expectedValue(key,c,special));
  }
}
function mountStandard(type) {
  run(`mode=3;locked=false;retry={config:{type:${JSON.stringify(type)},joint:${JSON.stringify(type==='Filete'?'T':'Topo')},side:${JSON.stringify(['X','K','Duplo U','Duplo J'].includes(type)?'ambos':'seta')},size:6,length:${type==='Filete'?40:0},pitch:${type==='Filete'?100:0},contour:'Plano',finish:'G',field:true,all:false,backing:${type==='V'},melt:false,...${type==='V'?'{root:3,angle:60}':'{}'}}};builder();`);
}
function mountSpecial(type) {
  run(`mode=3;locked=false;retry=null;specialBuilder({...specialConfig(${JSON.stringify(type)}),field:specialWeldMetadata(${JSON.stringify(type)}).supportsField,fieldControls:true});`);
}
const cases=[...Array.from(run("['Filete',...grooveNames]")).map(type=>({type,special:false})),...Array.from(run('specialWeldTypes()')).map(type=>({type,special:true}))];
for(const c of [{joint:'Topo',type:'Filete',side:'seta',size:6},{joint:'T',type:'Tampão',side:'seta',size:8}]){
  const incompatible=run(`constructionDrawing(${JSON.stringify(c)})`);
  assert.match(incompatible,/data-construction-state="incompatible"/,'incompatible choices are explicitly represented');
  assert.doesNotMatch(incompatible,/class="weld"/,'incompatible choices never fall back to a target weld');
}
for(const {type,special} of cases) {
  const mount=()=>special?mountSpecial(type):mountStandard(type);
  mount();
  const c=JSON.parse(run('JSON.stringify(q.config)')),total=selects(special).length;
  assert.ok(total>=1,type+' has editable choices');
  progressIs(0,total,type+' starts empty');
  assert.equal(selects(special).filter(select=>select.value!=='').length,0,type+' no preselected answer');
  assert.doesNotMatch(previewOf(special).innerHTML,/<svg\b/,type+' empty preview does not reveal symbol');
  assert.equal($('.scene').querySelectorAll('svg').length,0,type+' the initial problem presents a description without the target drawing');
  assert.ok($('.scene').textContent.trim().length>60,type+' description gives the construction requirements');
  const jointSelect=selects(special).find(select=>keyOf(select,special)==='joint');
  assert.ok(jointSelect,type+' joint is an editable part of the construction');

  const jointCard=document.querySelectorAll('[data-builder-joint]').find(card=>card.dataset.builderJoint===c.joint);
  assert.ok(jointCard,type+' editable joint has a visual construction card');jointCard.onclick();
  assert.equal(jointSelect.value,c.joint,type+' joint card synchronizes with its selector');
  assert.ok(previewOf(special).querySelectorAll('svg').length,type+' choosing a joint constructs neutral pieces');
  assert.equal(previewOf(special).querySelectorAll('.weld').length,0,type+' neutral pieces do not reveal the target weld');
  const firstJointView=previewOf(special).innerHTML;
  const alternateJoint=c.joint==='T'?'Sobreposta':'T';
  choose(jointSelect,alternateJoint);
  assert.notEqual(previewOf(special).innerHTML,firstJointView,type+' changing the selected joint changes the construction');
  choose(jointSelect,'');
  assert.equal(previewOf(special).querySelectorAll('svg').length,0,type+' clearing the joint removes the pieces');
  progressIs(0,total,type+' clearing the only choice resets completion');

  const beforeIncomplete=run('JSON.stringify({xp:state.xp,total:state.total,right:state.right})');
  $('#builder-submit-bottom').onclick();
  assert.equal(run('locked'),false,type+' incomplete submit does not lock');
  assert.equal(run('JSON.stringify({xp:state.xp,total:state.total,right:state.right})'),beforeIncomplete,type+' incomplete submit does not score');
  assert.ok(selects(special).every(select=>select.getAttribute('aria-invalid')==='true'),type+' missing fields are marked');

  // Palette selection and selects share state and completion progress.
  const paletteSelector=special?'[data-special-basic]':'[data-basic]';
  const palette=document.querySelectorAll(paletteSelector);
  const typeCard=palette.find(card=>(special?card.dataset.specialBasic:card.dataset.basic)===type);
  assert.ok(typeCard,type+' appears in shared palette');
  run('builderPreviewConfigs=[];');typeCard.onclick();
  assert.equal(selects(special).find(select=>keyOf(select,special)==='type').value,type);
  assert.equal(typeCard.getAttribute('aria-pressed'),'true',type+' palette reflects selection');
  progressIs(1,total,type+' palette updates progress');
  assert.equal(previewOf(special).querySelectorAll('svg').length,0,type+' choosing a symbol without a joint does not reveal a drawing');
  $('[data-builder-view="symbol"]').onclick();
  assert.equal(previewOf(special).querySelectorAll('svg').length,0,type+' symbol view also waits for the chosen joint');
  $('[data-builder-view="drawing"]').onclick();
  choose(jointSelect,c.joint);
  progressIs(2,total,type+' geometry and symbol both update completion');
  const partial=run('builderPreviewConfigs.at(-1)');
  assert.ok(partial&&partial.type===type,type+' type renders partial preview');
  if(selects(special).some(select=>keyOf(select,special)==='size')) assert.ok(partial.size===undefined||partial.size==='',type+' preview does not inherit the expected dimension');
  if(selects(special).some(select=>keyOf(select,special)==='field')) assert.notEqual(partial.field,true,type+' preview does not inherit expected field flag');
  $('[data-builder-view="symbol"]').onclick();
  assert.equal($('[data-builder-view="symbol"]').getAttribute('aria-pressed'),'true',type+' preview view selection is exposed');
  choose(jointSelect,'');
  assert.equal(previewOf(special).querySelectorAll('svg').length,0,type+' clearing joint also removes a partly built symbol');
  choose(jointSelect,c.joint);
  $('[data-builder-view="drawing"]').onclick();

  const configBeforeFilter=run('JSON.stringify(q.config)'),xpBeforeFilter=run('state.xp');
  for(const group of ['basic','specific','all']) {
    const filter=$(`[data-builder-filter="${group}"]`);filter.onclick();
    assert.equal(filter.getAttribute('aria-pressed'),'true',type+' filter selection is exposed');
    const visible=document.querySelectorAll(paletteSelector).filter(card=>card.getAttribute('aria-hidden')!=='true');
    assert.ok(visible.length>0,type+' filter keeps matching symbols');
    if(group!=='all')assert.ok(visible.every(card=>card.dataset.builderFamily===group),type+' filter shows only requested family group');
    assert.equal(selects(special).find(select=>keyOf(select,special)==='type').value,type,type+' filtering keeps the chosen symbol');
    assert.equal(run('JSON.stringify(q.config)'),configBeforeFilter,type+' filters do not switch question');
    assert.equal(run('state.xp'),xpBeforeFilter,type+' filters do not score');
  }
  const missingKey=selects(special).some(select=>keyOf(select,special)==='size')?'size':keyOf(selects(special).at(-1),special);
  fill(special,c,missingKey);
  const beforePartialSubmit=run('JSON.stringify({xp:state.xp,total:state.total})');
  submitOf(special).onclick();
  assert.equal(run('JSON.stringify({xp:state.xp,total:state.total})'),beforePartialSubmit,type+' partial submission does not score');
  assert.equal(run('locked'),false,type+' partial submission stays editable');
  assert.equal(selects(special).filter(select=>select.getAttribute('aria-invalid')==='true').length,1,type+' only missing choice is marked');
  progressIs(total-1,total,type+' partial completion');
  fill(special,c);
  progressIs(total,total,type+' all choices filled');
  assert.equal(previewOf(special).querySelector('[data-construction-state]').getAttribute('data-construction-state'),'weld',type+' a compatible completed selection constructs its weld');
  assert.ok(selects(special).every(select=>select.getAttribute('aria-invalid')!=='true'),type+' completed choices clear missing markers');

  const beforeReset=run('JSON.stringify({config:q.config,xp:state.xp,total:state.total})');
  $('#builder-reset').onclick();
  assert.equal(run('JSON.stringify({config:q.config,xp:state.xp,total:state.total})'),beforeReset,type+' reset keeps question and progress');
  assert.ok(selects(special).every(select=>select.value===''),type+' reset clears all choices');
  progressIs(0,total,type+' reset clears completion');
  assert.doesNotMatch(previewOf(special).innerHTML,/<svg\b/,type+' reset clears preview');

  fill(special,c);
  const scoreBefore=run('state.right');$('#builder-submit-bottom').onclick();
  assert.equal(run('locked'),true,type+' correct submission locks once');
  assert.equal(run('state.right'),scoreBefore+1,type+' correct submission scores');
  assert.equal(run('q.mine'),run('q.correctVisual'),type+' a fully correct construction matches every part of the reference drawing');
  const correctRows=document.querySelectorAll('[data-builder-review="correct"]');
  assert.equal(correctRows.length,total,type+' correct review covers each field');
  assert.equal(document.querySelectorAll('[data-builder-review="wrong"]').length,0,type+' correct review has no wrong fields');
  const xpAfter=run('state.xp');submitOf(special).onclick();$('#builder-submit-bottom').onclick();assert.equal(run('state.xp'),xpAfter,type+' duplicate submit does not score twice');

  mount();
  const wrongConfig=JSON.parse(run('JSON.stringify(q.config)'));
  fill(special,wrongConfig);
  const typeSelect=selects(special).find(select=>keyOf(select,special)==='type');
  const wrongType=type==='Filete'?'V':'Filete';choose(typeSelect,wrongType);
  choose(selects(special).find(select=>keyOf(select,special)==='joint'),wrongConfig.joint==='T'?'Sobreposta':'T');
  const wrongXp=run('state.xp');submitOf(special).onclick();
  assert.equal(run('state.xp'),wrongXp,type+' wrong montage does not earn XP');
  assert.equal(run('locked'),true,type+' complete wrong submission locks');
  const wrongRows=document.querySelectorAll('[data-builder-review="wrong"]');
  assert.equal(wrongRows.length,2,type+' review identifies both wrong geometry and symbol');
  assert.ok(wrongRows.some(row=>row.textContent.includes(type)&&row.textContent.includes(wrongType)),type+' review compares selected and expected family');
  const expectedJointLabel=run(`builderJointLabel(${JSON.stringify(wrongConfig.joint)})`);
  assert.ok(wrongRows.some(row=>row.textContent.includes(expectedJointLabel)),type+' review compares selected and expected joint');
  assert.ok($('#feedback').querySelectorAll('svg').length>=2,type+' drawings are compared only after submitting');
  $('#next').onclick();
  assert.equal(run('q.config.type'),type,type+' reinforcement retains family');
  assert.equal(run('mode'),3,type+' reinforcement stays in game 3');
  assert.equal(run('locked'),false,type+' reinforcement unlocks a new attempt');
}
assert.equal(JSON.parse(records.get('moto-work-v1')).seen.saved,true,'existing progress remains saved');
console.log('PASS: description to construction for all 19 families; editable joint, no target drawing before submission, neutral pieces, drawing/symbol views, partial preview, completion, filters, reset, joint/type review, scoring and reinforcement.');
