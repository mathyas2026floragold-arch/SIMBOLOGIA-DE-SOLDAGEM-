const fs=require('fs'),assert=require('node:assert/strict');
const {createGame}=require('./check-five-modes.cjs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../SIMBOLOGIA DE SOLDAGEM.html'),'utf8');
const {document,records,run}=createGame({xp:375,total:17,right:13,streak:5,master:{1:4,2:5,3:2},seen:{test:true}});
const node=selector=>document.querySelector(selector);
assert.equal(run('levels.length'),12);
assert.equal(run('state.xp'),375,'existing XP must survive initialization');
assert.equal(run('levelIndex()'),1,'existing rank thresholds must be preserved');
assert.equal(run('state.seen.test'),true,'existing history must survive initialization');
for(let i=0;i<12;i++){
  const threshold=run(`thresholds[${i}]`);
  assert.equal(run(`levelIndex(${threshold})`),i);
  if(i)assert.equal(run(`levelIndex(${threshold-1})`),i-1);
}
assert.equal(run('levelIndex(999999)'),11);
run('state.xp=14500;stats();');
assert.match(node('#stats').innerHTML,/Maior nível alcançado/);
assert.doesNotMatch(node('#stats').innerHTML,/NaN|Infinity|undefined/);
run("shell('Verificação de pontuação','');state.xp=185;state.streak=0;mode=1;locked=false;q={answer:'A',explain:'Leitura correta.'};grade('A',null,[]);");
assert.equal(run('state.xp'),205);
assert.equal(run('levelIndex()'),1);
assert.match(node('#feedback').innerHTML,/Novo nível alcançado: Operador/);
run("locked=false;q={answer:'A',explain:'Reforce a leitura.'};grade('B',null,[]);");
assert.equal(run('state.xp'),205,'wrong answer must not grant XP');
assert.equal(run('state.streak'),0);
assert.doesNotMatch(node('#feedback').innerHTML,/Novo nível alcançado/);
assert.equal(JSON.parse(records.get('moto-work-v1')).xp,205);
run('state.xp=14500;state.master={1:44,2:0};');
assert.equal(run('difficultyFor(1)'),5);
assert.equal(run('difficultyFor(2)'),0,'a new mode must still start at the basics');
run('mode=3;state.master[3]=44;');
for(let i=0;i<1500;i++){
  const c=run('config()');
  assert.ok(!(c.backing&&c.melt));
  if(c.length)assert.ok(c.pitch>c.length);
  for(const key of ['type','side','size','length','pitch'])assert.ok(run(`fields.${key}.includes(${JSON.stringify(key==='type'||key==='side'?c[key]:String(c[key]))})`),`missing ${key} choice`);
}
run('state.xp=395;state.total=19;state.right=14;state.streak=1;save();');
const personalSave=records.get('moto-work-v1');
run('enterMaxPreview();');
assert.equal(run('previewActive'),true);
assert.equal(run('state.xp'),14500);
assert.equal(run('levelIndex()'),11);
assert.equal(run('difficultyFor(3)'),5);
assert.equal(run('q.config.type'),'V');
assert.equal(run('q.config.root'),3);
assert.equal(records.get('moto-work-v1'),personalSave);
run("locked=false;q={answer:'A',explain:'Prévia.'};grade('A',null,[]);");
assert.ok(run('state.xp')>14500);
assert.equal(records.get('moto-work-v1'),personalSave,'preview answers must not change saved progress');
run('exitMaxPreview();');
assert.equal(run('previewActive'),false);
assert.equal(run('state.xp'),395);
assert.equal(run('state.total'),19);
assert.equal(records.get('moto-work-v1'),personalSave);
const expected={ '1F':'PA','2F':'PB','4F':'PD','1G':'PA','2G':'PC','4G':'PE' };
for(const [code,iso] of Object.entries(expected))assert.equal(run(`positionInfo('${code}').iso`),iso);
for(const code of ['3F','3G']){
  assert.equal(run(`positionInfo('${code}','up').iso`),'PF');
  assert.equal(run(`positionInfo('${code}','down').iso`),'PG');
  assert.equal(run(`positionInfo('${code}').iso`),'PF ↑ / PG ↓');
  assert.match(run(`positionTrainingDrawing('${code}',0,'up')`),/Ascendente ↑/);
  assert.match(run(`positionTrainingDrawing('${code}',0,'down')`),/Descendente ↓/);
}
run('state.xp=14500;state.master={1:44,2:44,3:44,4:44,5:44};var optionLog;var originalOptions=options;options=function(items,answer,render){optionLog={items,answer};return originalOptions(items,answer,render);};mode=5;');
for(const code of ['1F','2F','3F','4F','1G','2G','3G','4G'])for(const task of [0,1,2])for(const travel of code[0]==='3'?['up','down']:[null]){
  run(`retry={code:${JSON.stringify(code)},travel:${JSON.stringify(travel)},positionTask:${task}};positions();`);
  const result=run('optionLog');
  assert.equal(result.items.length,4);
  assert.equal(new Set(result.items).size,4);
  assert.equal(result.items.filter(x=>x===result.answer).length,1);
  assert.equal((node('#work').innerHTML.match(/data-index=/g)||[]).length,4);
  assert.ok(run('q.explain').length<450);
}
assert.equal(run('addedWeldTypes.length'),9);
assert.equal(run('allWeldFamilies.length'),19);
assert.ok(run('bank.length')>=158,'expanded visual bank remains available');
assert.ok(run('bank.filter(b=>b.added).length')>=38,'new families include dimension and supported side variations');
assert.equal(run('new Set(bank.map(b=>b.id)).size'),run('bank.length'),'case IDs must remain unique');
assert.deepEqual(new Set(run('bank.filter(b=>b.jointCase).map(b=>b.targetJoint)')),new Set(['T','Canto','Sobreposta']));
for(const b of run('bank.filter(b=>b.added||b.jointCase)')){
  assert.equal(b.views.length,4,'each visual case has four alternatives');
  assert.equal(new Set(b.views.map(c=>JSON.stringify(c))).size,4,'visual alternatives cannot duplicate configurations');
}
const newFamilies=run('[...addedWeldTypes]');
const newGlyphs=new Set();
for(const type of newFamilies){
  const literal=JSON.stringify(type);
  newGlyphs.add(run(`glyph(${literal})`));
  const c=run(`specialConfig(${literal})`);
  const drawing=run(`cut(${JSON.stringify(c)})`),weldSymbol=run(`symbol(${JSON.stringify(c)})`);
  assert.match(drawing,/<svg/);assert.match(weldSymbol,/<svg/);
  assert.doesNotMatch(drawing+weldSymbol,/undefined|NaN/);
  assert.ok(run(`bank.some(b=>b.added&&b.targetType===${literal})`),type+' is in the normal visual bank');
  run(`detect=null;specialDetective(specialConfig(${literal}));`);
  assert.equal(run('detect.special'),true);
  assert.equal(run('q.detect'),true);
  assert.equal(run('q.special'),true);
}
assert.equal(newGlyphs.size,9);
for(let m=1;m<=5;m++){
  run(`mode=${m};retry=null;delete modeMix[${m}];`);
  const firstCycle=run(`Array.from({length:9},()=>nextSpecialType(${m}))`);
  assert.deepEqual(new Set(firstCycle),new Set(newFamilies),'each mode rotates through all nine new families');
  const last=firstCycle.at(-1),next=run(`nextSpecialType(${m})`);
  assert.notEqual(next,last,'cycle boundary must not repeat the same family');
  run(`delete modeMix[${m}];`);
  const turns=run(`Array.from({length:18},()=>chooseSpecialWeld(${m}))`);
  assert.equal(turns.filter(Boolean).length,m===5?6:9,'new and established questions are mixed predictably');
  const beforeTurn=run(`mixFor(${m}).turn`);
  run('retry={};');assert.equal(run(`chooseSpecialWeld(${m})`),false);
  assert.equal(run(`mixFor(${m}).turn`),beforeTurn,'reinforcement must not advance rotation');
}
run('mode=1;retry=null;delete modeMix[1];');
const rotated=run('Array.from({length:18},()=>chooseBank())');
assert.deepEqual(new Set(rotated.filter(b=>b.added).map(b=>b.targetType)),new Set(newFamilies));
assert.equal(rotated.filter(b=>!b.added).length,9,'established content remains in Match Visual');
assert.match(run("symbol({type:'Reverso'})"),/após a solda principal/);
assert.match(run("specialOrder(specialConfig('Aresta flangeada')).task"),/legado/);
assert.doesNotMatch(html,/<script\b[^>]*src=|<link\b[^>]*stylesheet/i);
console.log(`PASS: saved progress/preview, advanced configurations, position meanings, ${run('allWeldFamilies.length')} weld families and ${run('bank.length')} visual cases; five-mode family rotation.`);
