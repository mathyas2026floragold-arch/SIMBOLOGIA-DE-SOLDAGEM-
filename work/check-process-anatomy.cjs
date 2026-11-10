const assert=require('node:assert/strict');
const {createGame}=require('./check-five-modes.cjs');
const {document,run,records}=createGame({xp:0,total:0,right:0,streak:0,master:{},seen:{personal:true}});
const $=selector=>{const el=document.querySelector(selector);assert.ok(el,'Missing '+selector);return el;};
const controls=()=>document.querySelectorAll('[data-field],[data-special-field]');
const keyOf=el=>el.dataset.field||el.dataset.specialField;
function value(key,c,special){if(key==='process')return c.process||'Sem processo indicado';if(key==='tail')return c.tail||'Sem referência';if(['field','all','backing','melt','removable'].includes(key))return special?String(!!c[key]):c[key]?'Sim':'Não';if(key==='contour')return c.contour||'Sem contorno';if(key==='finish')return c.finish||'Sem método';return String(c[key]??0);}
function choose(key,selection){const control=controls().find(el=>keyOf(el)===key);assert.ok(control,'Editable '+key);assert.ok(control.children.some(option=>option.getAttribute('value')===String(selection)),key+' offers '+selection);control.value=String(selection);control.onchange();}
function fill(c){const special=controls().some(el=>el.dataset.specialField);for(const control of controls())choose(keyOf(control),value(keyOf(control),c,special));}
assert.deepEqual(new Set(run('weldingProcesses.map(p=>p.code)')),new Set(['GTAW','GMAW','SMAW','FCAW','SAW','PAW','RSW','RSEW']));
for(const process of run('weldingProcesses'))assert.ok(run(`processName(${JSON.stringify(process.code)})`).length>process.code.length,'process abbreviations have descriptive names');
assert.deepEqual(Array.from(run("supportedProcesses('Ponto')")),['RSW']);
assert.deepEqual(Array.from(run("supportedProcesses('Costura')")),['RSEW']);
for(const type of ['Tampão','Aresta flangeada','Canto flangeado'])assert.deepEqual(new Set(run(`supportedProcesses(${JSON.stringify(type)})`)),new Set(['GTAW','GMAW','SMAW','FCAW']));

run('start(3);');const first=run('q.config');assert.equal(first.process,'GTAW');fill(first);
$('[data-builder-view="symbol"]').onclick();
assert.ok($('#live').textContent.includes('GTAW'),'the selected process appears in the assembled symbol');
const initialText=$('#live').querySelectorAll('text');
const processText=initialText.find(el=>el.textContent==='GTAW'),referenceText=initialText.find(el=>el.textContent===first.tail);
assert.ok(processText&&referenceText,'process and drawing reference are separate symbol labels');
assert.notEqual(processText.getAttribute('y'),referenceText.getAttribute('y'),'process and reference occupy separate tail lines');
choose('process','GMAW');assert.ok($('#live').textContent.includes('GMAW'),'changing process changes the tail immediately');
const xp=run('state.xp');$('#submit').onclick();assert.equal(run('state.xp'),xp,'incorrect process earns no XP');
const wrong=document.querySelectorAll('[data-builder-review="wrong"]');assert.equal(wrong.length,1,'only the process choice is marked wrong');
assert.ok(wrong[0].textContent.includes('GTAW')&&wrong[0].textContent.includes('GMAW'),'review compares required and selected processes');
$('#next').onclick();fill(run('q.config'));$('#submit').onclick();
const earned=run('state.xp');assert.ok(earned>xp);$('#submit').onclick();$('#builder-submit-bottom').onclick();assert.equal(run('state.xp'),earned,'repeated process submissions cannot double-score');
const observedArc=new Set(),observedResistance=new Set();
for(let i=0;i<96;i++){
  run('start(3);');const c=run('q.config');
  assert.ok(run(`supportedProcesses(${JSON.stringify(c.type)}).includes(${JSON.stringify(c.process)})`),'technical target uses a compatible process');
  if(['Ponto','Costura'].includes(c.type))observedResistance.add(c.process);else observedArc.add(c.process);
}
assert.deepEqual(observedArc,new Set(['GTAW','GMAW','SMAW','FCAW','SAW','PAW']),'technical rotation covers all six arc-process abbreviations');
assert.deepEqual(observedResistance,new Set(['RSW','RSEW']),'resistance examples retain their applicable processes');

// Every anatomical focus is a read-only diagram, with its answer withheld
// until feedback. An incorrect answer reinforces exactly the same focus.
run('state.master[2]=44;mode=2;');
for(const kind of ['symbol','fillet'])for(const part of run(`anatomyParts.${kind}`)){
  const literal=JSON.stringify(part.id);
  run(`retry=null;detect=null;locked=false;anatomyDetective(${JSON.stringify(kind)});var testedPart=anatomyParts.${kind}.find(p=>p.id===${literal});detect.focusIds=[testedPart.id];detect.steps=[[testedPart.prompt,testedPart.term,testedPart.choices,testedPart.explain]];detect.index=0;anatomyDetective();`);
  assert.equal(run('detect.anatomy'),true);assert.equal(run('q.detect'),true);
  const log=run('optionLog');assert.equal(new Set(log.items).size,log.items.length,'anatomy alternatives are unique');assert.equal(log.items.filter(answer=>answer===log.answer).length,1,'one anatomy answer is correct');
  const focus=$(`[data-anatomy-focus="${part.id}"]`);assert.ok(focus,'requested region is highlighted');
  assert.ok(!$('.scene').querySelector('svg').textContent.includes(part.term),'the diagram withholds the focused term before answering');
  assert.equal($('.scene').querySelectorAll('button,input,select').length,0,'the anatomical drawing is read-only');
  const beforeWrong=run('state.xp');run("grade('__incorrect__',null,[]);");assert.equal(run('state.xp'),beforeWrong);
  assert.ok($('#feedback').querySelectorAll('svg').some(svg=>svg.textContent.includes(part.term)),'feedback labels the requested anatomical feature');
  $('#next').onclick();assert.equal(run('detect.anatomy'),true);assert.equal(run('detect.focusIds[detect.index]'),part.id,'reinforcement retains the same diagram focus');
  const beforeRight=run('state.right');run('grade(q.answer,null,[]);');assert.equal(run('state.right'),beforeRight+1,'correct anatomical identification scores once');
}

run('state.master[2]=0;retry=null;detect=null;delete modeMix[2];');
for(let i=0;i<12;i++){run('start(2);');assert.ok(!run('detect.anatomy'),'introductory detective does not show advanced anatomy');}
run('state.master[2]=8;retry=null;detect=null;delete modeMix[2];');
const kinds=new Set();let anatomyCount=0;
for(let i=0;i<16;i++){run('start(2);');if(run('!!detect.anatomy')){anatomyCount++;kinds.add(run('detect.kind'));}}
assert.equal(anatomyCount,4,'one in four investigations teaches symbol or fillet anatomy');assert.deepEqual(kinds,new Set(['symbol','fillet']),'normal detective entry alternates both anatomical diagrams');
run('menu();');assert.equal(document.querySelectorAll('[data-mode]').length,7,'anatomy stays inside the detective game, alongside caliper and metrology');
assert.equal(JSON.parse(records.get('moto-work-v1')).seen.personal,true,'process and anatomy training preserve personal history');
console.log('PASS: eight process abbreviations, compatible family choices, editable process/reference tail, exact review and scoring; symbol/fillet anatomy, unique choices, hidden labels, reinforcement and integrated scheduling.');
