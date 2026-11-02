const assert=require('node:assert/strict');
const {createGame}=require('./check-five-modes.cjs');
const {document,run}=createGame();
const node=id=>document.querySelector(id);
const form={
  get:key=>node(`[data-special-field="${key}"]`),
  has:key=>!!node(`[data-special-field="${key}"]`),
  *[Symbol.iterator](){for(const select of document.querySelectorAll('[data-special-field]'))yield [select.dataset.specialField,select];}
};
run(`state.xp=14500;state.master={1:44,2:44,3:44,4:44,5:44};mode=3;
  var specialTestCuts=[];var specialTestCut=cut;
  cut=function(c){specialTestCuts.push({...c});return specialTestCut(c);};`);
const types=Array.from(run('specialWeldTypes()'));
assert.equal(types.length,9);
function fill(c){for(const [key,select] of form){select.value=key==='tail'?(c.tail||'Sem referência'):key==='process'?(c.process||'Sem processo indicado'):String(c[key]);select.onchange();}}
function submitCorrect(label){const before=run('state.right');node('#special-submit').onclick();assert.equal(run('state.right'),before+1,label);}
for(const type of types){
  const literal=JSON.stringify(type);
  run(`retry=null;detect=null;locked=false;var c=specialConfig(${literal});`);
  const c=run('c'),m=run(`specialWeldMetadata(${literal})`);
  assert.ok(c.special);
  assert.ok(m.sides.includes(c.side),'generated side follows family metadata');
  assert.equal(m.sideRule,type==='Reverso'?'oposto':['Ponto','Costura'].includes(type)?'neutro':['V flangeado','Bisel flangeado','Tampão'].includes(type)?'selectable':'seta');
  if(['Ponto','Costura'].includes(type)){assert.equal(c.side,'neutro');assert.equal(m.supportsField,false);}
  if(type==='Reverso')assert.equal(c.side,'oposto');
  if(m.sizes.length)assert.ok(m.sizes.includes(c.size));else assert.equal(c.size,undefined);
  run('specialBuilder(c);');fill(c);submitCorrect('correct montage '+type);
  run('locked=false;specialBuilder(c);');fill(c);form.get('type').value='Filete';
  const beforeWrong=run('state.xp');node('#special-submit').onclick();assert.equal(run('state.xp'),beforeWrong,'wrong montage earns no XP');
  assert.equal(document.querySelectorAll('[data-builder-review="wrong"]').length,1);
  run('specialDetective(c);');
  const d=run('detect');assert.ok(d.steps.length>=4&&d.steps.length<=7);
  assert.equal(d.steps[0][1],m.joint,'investigate geometry before the symbol');
  for(let i=0;i<d.steps.length;i++){
    run(`detect.index=${i};specialDetective();`);
    const {items,answer}=run('optionLog');
    assert.equal(items.filter(value=>value===answer).length,1,`unique correct answer ${type}/${i}`);
    assert.equal(new Set(items).size,items.length);
  }
  run("locked=false;retry={error:'Tipo de solda errado'};specialInspector(c);");
  assert.equal(run('q.error'),'Tipo de solda errado');node('#special-reject').onclick();
  assert.ok(node('#special-faults').children.some(button=>button.textContent==='Tipo de solda errado'));
  if(c.size!==undefined){run("retry={error:'Dimensão errada'};specialInspector(c);");assert.equal(run('q.error'),'Dimensão errada');}
  if(m.sideRule==='selectable')for(const side of ['seta','oposto']){
    run(`c.side=${JSON.stringify(side)};detect=null;specialDetective(c);`);
    assert.equal(run("detect.steps.find(step=>step[0].startsWith('Qual é o lado'))[1]"),side,'detective reads the actual side');
    run("locked=false;retry={error:'Lado errado'};specialInspector(c);");
    assert.equal(run('q.error'),'Lado errado');
    assert.equal(run('specialTestCuts.at(-1).side'),side==='seta'?'oposto':'seta','fiscal execution actually changes side');
    node('#special-reject').onclick();
    const button=node('#special-faults').children.find(button=>button.textContent==='Lado errado');assert.ok(button);
    const before=run('state.right');button.onclick();assert.equal(run('state.right'),before+1,'exact side divergence scores');
    run('locked=false;retry=null;specialBuilder(c);');assert.ok(form.has('side'),'mounting exposes supported sides');
    fill(run('c'));submitCorrect('side-specific montage');
  }
  if(m.supportsField)for(const field of [false,true]){
    run(`locked=false;c.field=${field};c.fieldControls=true;retry={error:'Local de execução errado'};specialInspector(c);`);
    assert.equal(run('q.error'),'Local de execução errado');
    assert.equal(run('specialTestCuts.at(-1).field'),!field,'fiscal execution actually changes location');
    run('locked=false;retry=null;specialBuilder(c);');assert.ok(form.has('field'),'mounting exposes execution location');
    fill(run('c'));submitCorrect('location-specific montage');
    run('locked=false;specialBuilder(c);');fill(run('c'));form.get('field').value=String(!field);
    const before=run('state.xp');node('#special-submit').onclick();assert.equal(run('state.xp'),before,'wrong location earns no XP');
    assert.equal(document.querySelectorAll('[data-builder-review="wrong"]').length,1,'only incorrect location is marked');
  }
  if(m.legacy)assert.match(run('specialOrder(c).task'),/legado/);
}
console.log('PASS: nine new families; side rules, neutral resistance examples and reverso; real builder controls, detective geometry and side/location fiscal divergences.');
