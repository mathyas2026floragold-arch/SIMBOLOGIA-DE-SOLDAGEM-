const assert=require('node:assert/strict');
const {createGame}=require('./check-five-modes.cjs');
const {document,run,records}=createGame({xp:0,total:0,right:0,streak:0,master:{},seen:{personal:true}});
const $=selector=>{const el=document.querySelector(selector);assert.ok(el,'Missing control '+selector);return el;};
const fields=()=>document.querySelectorAll('[data-field],[data-special-field]');
const keyOf=el=>el.dataset.field||el.dataset.specialField;
function select(key){return fields().find(el=>keyOf(el)===key);}
function choose(key,value){const el=select(key);assert.ok(el,'Editable technical field '+key);const serialized=String(value);assert.ok(el.children.some(option=>option.getAttribute('value')===serialized),key+' offers '+serialized);el.value=serialized;el.onchange();}
function fieldValue(key,c,special){if(key==='tail')return c.tail||'Sem referência';if(key==='process')return c.process||'Sem processo indicado';if(['field','all','backing','melt','removable'].includes(key))return special?String(!!c[key]):c[key]?'Sim':'Não';if(key==='contour')return c.contour||'Sem contorno';if(key==='finish')return c.finish||'Sem método';return String(c[key]??0);}
function fill(c){const special=fields().some(el=>el.dataset.specialField);for(const el of fields())choose(keyOf(el),fieldValue(keyOf(el),c,special));}
function view(name){$(`[data-builder-view="${name}"]`).onclick();}
function texts(){return $('#live').querySelectorAll('text').map(el=>el.textContent);}
const savedBefore=records.get('moto-work-v1');
run('start(3);');
assert.equal(run('trainingStage(3).tier'),5,'construction begins with its technical stage');
assert.match(run('trainingStage(3).name'),/Construção técnica completa/);
assert.equal(run('state.xp'),0);assert.equal(run('state.master[3]||0'),0);assert.equal(records.get('moto-work-v1'),savedBefore,'opening the full controls never fabricates saved progress');
for(const mode of [1,2,4,5])assert.equal(run(`trainingStage(${mode}).tier`),0,'other games keep their introductory stage');
const c=JSON.parse(run('JSON.stringify(q.config)'));
for(const [key,value] of Object.entries({type:'V',joint:'Topo',size:8,effective:10,thickness:10,root:3,face:2,angle:60,length:0,contour:'Plano',finish:'G',field:true,backing:true,melt:false,removable:true,process:'GTAW',tail:'DET. A'}))assert.equal(c[key],value,'first technical OS includes '+key);
assert.ok(fields().length>=18,'the first construction exposes the complete parameter set including welding process');
for(const key of ['joint','type','side','size','effective','thickness','root','face','angle','length','contour','finish','field','backing','melt','removable','process','tail'])assert.ok(select(key),'first OS has editable '+key);
assert.equal($('.scene').querySelectorAll('svg').length,0,'the technical task still presents text rather than its answer drawing');
const description=$('.scene').textContent;
for(const value of ['8','10','3','2','60','DET. A'])assert.ok(description.includes(value),'description contains technical value '+value);
for(const expression of [/campo/i,/apoio|backing/i,/remov|retir/i,/raiz/i,/efetivo|\bE\b/i,/esmerilh|acabamento/i])assert.match(description,expression,'description provides each technical requirement');
fill(c);view('symbol');
assert.ok(texts().includes('8(10)'),'symbol displays preparation S and effective size E distinctly');
const effectiveOther=select('effective').children.map(el=>el.getAttribute('value')).find(value=>value!==''&&Number(value)>c.effective);
assert.ok(effectiveOther,'effective size has an alternative technical value');choose('effective',effectiveOther);
assert.ok(texts().includes(`8(${effectiveOther})`),'changing E changes the assembled S(E) symbol');choose('effective',c.effective);
assert.ok(texts().includes('R'),'removable backing is marked R');choose('removable','Não');assert.ok(!texts().includes('R'),'removing the selected removal requirement removes R');choose('removable','Sim');
const tailOther=select('tail').children.map(el=>el.getAttribute('value')).find(value=>value&&value!==c.tail&&value!=='Sem referência');assert.ok(tailOther);choose('tail',tailOther);assert.ok(texts().includes(tailOther),'tail follows the selected drawing reference');choose('tail',c.tail);
view('drawing');
const faceOther=select('face').children.map(el=>el.getAttribute('value')).find(value=>value&&Number(value)!==c.face&&Number(value)>0);assert.ok(faceOther);choose('face',faceOther);
assert.match($('#live').textContent,new RegExp('f\\s*=\\s*'+faceOther),'root-face detail follows the selected face value');choose('face',c.face);
$('#submit').onclick();assert.equal(run('state.right'),1);assert.equal(run('state.master[3]'),1);assert.equal(run('q.mine'),run('q.correctVisual'),'fully selected technical drawing equals its reference');
assert.ok($('#feedback').querySelectorAll('svg').length>=2,'technical drawing and symbol are compared after submission');

const scoreAfter=run('JSON.stringify({xp:state.xp,total:state.total,right:state.right,master:state.master})');
const seenTypes=new Set(),seenAdded=new Set();let filletIntermittent=false,filletAllAround=false,legacy=false;
for(let i=0;i<80;i++){
  run('start(3);');const target=run('q.config');seenTypes.add(target.type);
  if(run('isSpecialWeld(q.config)'))seenAdded.add(target.type);
  assert.ok(!(target.backing&&target.melt),'target never combines backing and melt-through');
  assert.ok(!(target.all&&target.length),'target never combines all-around with intermittent segments');
  if(target.pitch)assert.ok(target.pitch>target.length,'segment pitch exceeds segment length');
  if(target.type==='Filete'&&target.length>0&&target.side==='ambos')filletIntermittent=true;
  if(target.type==='Filete'&&target.all&&!target.length)filletAllAround=true;
  if(['Aresta flangeada','Canto flangeado'].includes(target.type)){legacy=true;assert.match($('.scene').textContent,/legad/i,'legacy symbols retain their drawing context');}
  assert.equal($('.scene').querySelectorAll('svg').length,0,'every technical task begins with its description');
  assert.equal(run('JSON.stringify({xp:state.xp,total:state.total,right:state.right,master:state.master})'),scoreAfter,'reading a new technical task never changes earned scores');
}
assert.deepEqual(seenAdded,new Set(run('specialWeldTypes()')),'technical rotation includes all nine added families');
for(const type of ['V','Filete','Bisel','U','J','X','K','Duplo U','Duplo J','Reto'])assert.ok(seenTypes.has(type),'technical rotation includes '+type);
assert.ok(filletIntermittent,'rotation includes intermittent fillets on both sides');assert.ok(filletAllAround,'rotation includes a separate continuous all-around case');assert.ok(legacy);
for(const mode of [1,2,4,5])assert.equal(run(`trainingStage(${mode}).tier`),0,'technical construction never unlocks another game');
assert.equal(JSON.parse(records.get('moto-work-v1')).seen.personal,true,'personal saved history remains intact');
console.log('PASS: game 3 starts with full technical V parameters; editable S(E), thickness, root face, removable backing and tail; exact reference match, complete rotation, valid combinations, unchanged XP and independent progression in other games.');
