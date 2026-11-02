const assert=require('node:assert/strict');
const {createGame}=require('./check-five-modes.cjs');
const {document,run,records}=createGame({xp:0,total:0,right:0,streak:0,master:{},seen:{retained:true}});
const thresholds=[0,4,8,16,28,44];
const typesByTier=[
  ['Filete','Reto'],
  ['Filete','Reto','V','Bisel'],
  ['Filete','Reto','V','Bisel'],
  ['Filete','Reto','V','Bisel','X','K','U','J','Tampão','Ponto','Costura'],
  ['Filete','Reto','V','Bisel','X','K','U','J','Tampão','Ponto','Costura','Duplo U','Duplo J','V flangeado','Bisel flangeado','Reverso','Revestimento'],
  ['Filete','Reto','V','Bisel','X','K','U','J','Tampão','Ponto','Costura','Duplo U','Duplo J','V flangeado','Bisel flangeado','Reverso','Revestimento','Aresta flangeada','Canto flangeado']
];
const jointsByTier=[
  ['T','Topo'],['T','Topo','Canto','Sobreposta'],['T','Topo','Canto','Sobreposta'],['T','Topo','Canto','Sobreposta'],
  ['T','Topo','Canto','Sobreposta','Superfícies curvas','Curva/plano','Superfície'],
  ['T','Topo','Canto','Sobreposta','Superfícies curvas','Curva/plano','Superfície','Borda']
];
const codesByTier=[['1F','1G'],['1F','1G','2F','2G'],['1F','1G','2F','2G'],['1F','1G','2F','2G','3F','3G'],['1F','1G','2F','2G','3F','3G','4F','4G'],['1F','1G','2F','2G','3F','3G','4F','4G']];

for(const mode of [1,2,4,5])for(let tier=0;tier<6;tier++){
  const count=thresholds[tier];run(`state.master[${mode}]=${count};state.xp=0;`);
  const stage=run(`trainingStage(${mode})`);
  assert.equal(stage.tier,tier,`mode ${mode}: boundary ${count}`);
  assert.equal(stage.min,count);
  assert.equal(stage.next,thresholds[tier+1]??null);
  assert.ok(stage.name&&typeof stage.name==='string');
  assert.equal(run(`difficultyFor(${mode})`),tier,'difficulty is driven by correct answers');
  assert.deepEqual(new Set(run(`availableWeldTypes(${mode})`)),new Set(typesByTier[tier]));
  assert.deepEqual(new Set(run(`availableJointTypes(${mode})`)),new Set(jointsByTier[tier]));
  assert.deepEqual(new Set(run(`availablePositionCodes(${mode})`)),new Set(codesByTier[tier]));
  assert.deepEqual(new Set(stage.sides),new Set(tier?['seta','oposto','ambos']:['seta']));
  if(tier){run(`state.master[${mode}]=${count-1};`);assert.equal(run(`trainingStage(${mode}).tier`),tier-1,'no early unlock');}
}
for(const mastery of [0,3,4,8,16,28,44]){
  run(`state.master[3]=${mastery};state.xp=0;`);
  assert.equal(run('trainingStage(3).tier'),5,'construction game opens its complete technical stage immediately');
  assert.equal(run('difficultyFor(3)'),5);
  assert.equal(run('availableWeldTypes(3).length'),19);
  assert.equal(run('state.master[3]'),mastery,'technical construction never changes earned mastery to unlock its controls');
  assert.equal(run('state.xp'),0,'technical construction does not fabricate XP');
}

// Global XP never skips the introductory questions in a newly selected game.
run('state.xp=999999;state.master={1:44};');
for(const mode of [2,4,5])assert.equal(run(`trainingStage(${mode}).tier`),0,'a new progressive mode starts simple despite high XP');
assert.equal(run('trainingStage(3).tier'),5,'construction remains the technical-stage exception');
run('state.xp=0;state.master={};');
function basicConfig(c,label){
  assert.ok(c,label+' has a target configuration');
  assert.ok(['Filete','Reto'].includes(c.type),label+' only introductory weld families');
  assert.ok(['T','Topo'].includes(c.joint||(c.type==='Filete'?'T':'Topo')),label+' only introductory joint geometry');
  assert.ok(c.side===undefined||c.side==='seta',label+' arrow side is fixed');
  for(const key of ['length','pitch','field','all','backing','melt','root','angle','contour','finish'])assert.ok(!c[key],label+' no advanced feature '+key);
}
run('var progressionCuts=[];var progressionOriginalCut=cut;cut=function(c){progressionCuts.push({...c});return progressionOriginalCut(c);};');
for(const mode of [1,2,4,5]){
  run(`state.master={};state.xp=0;delete modeMix[${mode}];`);
  assert.equal(run(`chooseSpecialWeld(${mode})`),false,'new symbol families stay locked at the beginning');
  for(let i=0;i<24;i++){
    run(`progressionCuts=[];start(${mode});`);
    assert.equal(run('trainingStage().tier'),0);
    assert.equal(run('!!(q.special||q.positionSpecial||q.bank?.added||detect?.special)'),false,'no added family at the introductory stage');
    if(mode===1){
      assert.ok(run('bankAllowed(q.bank,1)'),'introductory bank case is permitted');
      const b=run('q.bank');
      if(b.config)basicConfig(b.config,'basic bank target');
      if(b.views)for(const c of b.views)basicConfig(c,'basic bank alternative');
      if(b.kind==='cut')assert.ok(b.options.every(type=>typesByTier[0].includes(type)),'hidden cut answers are also introductory');
    }else if(mode===2){
      basicConfig(run('detect.c'),'basic detective');
      for(const step of run('detect.steps')){
        if(typesByTier[0].includes(step[1]))assert.ok(step[2].every(value=>typesByTier[0].includes(value)),'detective type alternatives are unlocked');
        if(jointsByTier[0].includes(step[1]))assert.ok(step[2].every(value=>jointsByTier[0].includes(value)),'detective joint alternatives are unlocked');
      }
    }else if(mode===4){
      basicConfig(run('q.config'),'basic fabrication audit');
      for(const c of run('progressionCuts'))basicConfig(c,'basic audit reference and execution');
    }else{
      assert.ok(codesByTier[0].includes(run('q.code')),'initial positions are 1F and 1G');
      assert.ok(run('optionLog.items').every(id=>codesByTier[0].includes(id)),'position alternatives do not reveal locked codes');
    }
  }
}

// Wrong answers reinforce the current subject without increasing mastery.
run('state.master={};state.xp=0;state.total=0;state.right=0;start(1);');
for(let i=0;i<6;i++){
  run("grade('__incorrect__',null,[]);");
  assert.equal(run('state.master[1]||0'),0);assert.equal(run('trainingStage(1).tier'),0);assert.equal(run('state.xp'),0);
  document.querySelector('#next').onclick();
}
for(let i=0;i<4;i++){
  run('grade(q.answer,null,[]);');
  assert.equal(run('state.master[1]'),i+1);
  assert.equal(run('trainingStage(1).tier'),i===3?1:0);
  if(i===3)assert.match(document.querySelector('#feedback').textContent,/Novo conteúdo liberado:/,'the fourth correct answer announces its unlocked content');
  else assert.doesNotMatch(document.querySelector('#feedback').textContent,/Novo conteúdo liberado:/,'unlock announcement appears only at the boundary');
  document.querySelector('#next').onclick();
}
assert.ok(run("availableWeldTypes(1).includes('V')"),'four correct answers unlock V');

// The mixed content rotates through exactly the new families released so far.
const allAdded=Array.from(run('specialWeldTypes()'));
for(let tier=0;tier<6;tier++){
  run(`state.master[1]=${thresholds[tier]};delete modeMix[1];`);
  const observed=new Set();
  for(let i=0;i<42;i++){
    run('start(1);');
    assert.ok(run('bankAllowed(q.bank,1)'),'bank respects the current stage including distractors');
    if(run('q.bank.added'))observed.add(run('q.bank.targetType'));
  }
  assert.deepEqual(observed,new Set(allAdded.filter(type=>typesByTier[tier].includes(type))),`stage ${tier}: only released new families appear`);
}

// Intermediate games must not introduce locked families through distractors,
// explanatory definitions or the drawing used as an incorrect execution.
const allTypes=Array.from(run('allWeldFamilies'));
const allJoints=Array.from(run('builderJointChoices'));
const definitionTypes=new Map(allAdded.map(type=>[run(`specialWeldMetadata(${JSON.stringify(type)}).definition`),type]));
function allowedMetadata(value,tier,label){
  if(allTypes.includes(value))assert.ok(typesByTier[tier].includes(value),label+': family '+value+' is unlocked');
  if(allJoints.includes(value))assert.ok(jointsByTier[tier].includes(value),label+': joint '+value+' is unlocked');
  if(definitionTypes.has(value))assert.ok(typesByTier[tier].includes(definitionTypes.get(value)),label+': definition describes an unlocked family');
}
for(const tier of [2,3,4])for(const mode of [2,4,5]){
  run(`state.master={${mode}:${thresholds[tier]}};state.xp=0;delete modeMix[${mode}];`);
  const observed=new Set();
  for(let i=0;i<36;i++){
    run(`progressionCuts=[];start(${mode});`);
    const target=run('mode===2?detect.c:q.config');
    if(target){
      assert.ok(typesByTier[tier].includes(target.type),'intermediate target is unlocked');
      if(target.special)observed.add(target.type);
    }
    if(mode===2)for(const step of run('detect.steps'))for(const value of step[2])allowedMetadata(value,tier,`stage ${tier} detective choice`);
    if(mode===5){
      for(const value of run('optionLog.items')){
        allowedMetadata(value,tier,`stage ${tier} position choice`);
        if(/^\d[FG](?:-|$)/.test(value))assert.ok(codesByTier[tier].includes(value.split('-')[0]),'position alternative is unlocked');
      }
    }
    for(const c of run('progressionCuts')){
      if(c.type)assert.ok(typesByTier[tier].includes(c.type),`stage ${tier} mode ${mode}: rendered family ${c.type} is unlocked`);
      if(c.joint)assert.ok(jointsByTier[tier].includes(c.joint),`stage ${tier} mode ${mode}: rendered joint ${c.joint} is unlocked`);
    }
  }
  assert.deepEqual(observed,new Set(allAdded.filter(type=>typesByTier[tier].includes(type))),`stage ${tier} mode ${mode}: all released special targets occur through normal entry`);
}

const saved={xp:700,total:100,right:65,streak:2,master:{1:16,2:4,3:8,4:28,5:44},seen:{old:true}};
const legacy=createGame(saved);
for(const [mode,tier] of [[1,3],[2,1],[3,5],[4,4],[5,5]])assert.equal(legacy.run(`trainingStage(${mode}).tier`),tier,'saved correct-answer counts retain their unlocked stage, with technical construction fully open');
const personal=legacy.records.get('moto-work-v1');
legacy.run('enterMaxPreview();');
for(let mode=1;mode<=5;mode++)assert.equal(legacy.run(`trainingStage(${mode}).tier`),5,'maximum preview exposes stage five');
assert.equal(legacy.run('availableWeldTypes(3).length'),19);
assert.equal(legacy.records.get('moto-work-v1'),personal,'preview never replaces saved progress');
legacy.run('exitMaxPreview();');
assert.equal(legacy.records.get('moto-work-v1'),personal);
assert.equal(legacy.run('state.master[3]'),8);
assert.equal(JSON.parse(records.get('moto-work-v1')).seen.retained,true,'ordinary answers preserve existing saved history');
console.log('PASS: staged progression in games 1, 2, 4 and 5; technical construction fully open in game 3; boundaries, basic targets and alternatives, position codes, correct-answer unlocks, errors, saved progress and maximum preview.');
