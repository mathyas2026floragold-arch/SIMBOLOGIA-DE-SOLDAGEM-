const fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8').replace(/\r\n/g,'\n');
let html=read('before-five-modes.backup.html');
function replace(from,to){if(!html.includes(from))throw new Error('Missing source: '+from.slice(0,90));html=html.replace(from,to);}
function section(start,end,content){const a=html.indexOf(start),b=html.indexOf(end,a);if(a<0||b<0)throw new Error('Missing section '+start);html=html.slice(0,a)+content+'\n\n'+html.slice(b);}
section('const addedWeldTypes=','function specialWeldCut(',read('added-weld-symbols.js'));
section('function specialWeldCut(','const specialWeldDefaults=',read('special-weld-drawings.js'));
section('const specialWeldDefaults=','function glyph(',read('special-weld-gameplay.js'));
section('function chooseBank(){','function match(){','');
replace('let newSymbolFocus=null;','');
section('function trainAddedSymbols(','function addedSymbolLibrary(){','');
section('function addedSymbolLibrary(){','function installAddedWeldCases(){','');
replace('  attachAddedSymbolLibrary();','');
section('function installAddedWeldCases(){','function specialWeldCut(',read('training-progression.js')+'\n'+read('mixed-training.js')+'\n'+read('joint-drawings-v4.js'));
replace('function chooseSpecialWeld(){return !retry&&Math.random()<.34;}','');
replace('function specialConfig(type=pick(specialWeldTypes()))','function specialConfig(type=nextSpecialType())');
replace('function start(m){newSymbolFocus=null;mode=m;detect=null;retry=null;next();}','function start(m){mode=m;detect=null;retry=null;next();}');
replace("const b=retry?.bank||chooseBank(),inverse=serial%2===0;","const b=retry?.bank||chooseBank(),inverse=Math.floor((mixFor(1).turn-1)/2)%2===1;");
const focusStart=html.indexOf('  if(newSymbolFocus){');
if(focusStart>=0){const end=html.indexOf('\n}',focusStart);html=html.slice(0,focusStart)+html.slice(end);}
replace("  const extra=specialWeldCut(c);if(extra)return extra;","  const jointCut=jointWeldCut({...c,joint:c.joint||(c.type==='Filete'?'T':undefined)});if(jointCut)return jointCut;\n  const extra=specialWeldCut(c);if(extra)return extra;");
replace("function jointDrawing(j){if(j==='Topo')return cut({type:'V'});return cut({type:'Filete',joint:j});}","function jointDrawing(j){if(j==='Topo')return cut({type:'V'});if(j==='Borda')return jointWeldCut({type:'Aresta',joint:'Borda',side:'seta'});return cut({type:'Filete',joint:j});}");
replace('function options(items,answer,render=x=>x)',"function answerLabel(x){return ({T:'T / ângulo',Borda:'Aresta / borda'})[x]||x;}\nfunction options(items,answer,render=answerLabel)");
replace("const joint = fillet ? pick(['T', 'T', 'Canto', 'Sobreposta']) : 'Topo';","const joint = fillet ? nextJoint() : 'Topo';");
replace("joint === 'Canto' || joint === 'Sobreposta' ? 'seta'","joint === 'Canto' ? 'seta'");
// A cycle within the existing positions mode adds families while retaining the original F/G challenges.
replace('function positions(){',`function positions(){
  if(isSpecialWeld(retry?.config))return specialPositions({...retry.config});
  if(!retry&&chooseSpecialWeld(5))return specialPositions(specialConfig(nextSpecialType(5)));`);
replace('const task=retry?.positionTask??(serial%3);','const task=retry?.positionTask??(nextPositionTask()%3);');
replace('function position(code,yaw=0){',read('position-joints.js')+"\nfunction position(code,yaw=0,joint='T'){if(code[1]==='F')return positionJointGeometry(code,yaw,joint);");
replace('function positionTrainingDrawing(code,yaw=0,travel=null){',"function positionTrainingDrawing(code,yaw=0,travel=null,joint='T'){");
replace('let drawing=position(code,yaw);','let drawing=position(code,yaw,joint);');
replace("const travel=code[0]==='3'?(retry?.travel||pick(['up','down'])):null;","const positionJoint=code[1]==='F'&&code[0]!=='1'?(retry?.positionJoint||nextJoint(5)):'T';\n  const travel=code[0]==='3'?(retry?.travel||pick(['up','down'])):null;");
replace('q={code,travel,positionTask:task,',"q={code,travel,positionJoint,positionTask:task,");
html=html.replaceAll('positionTrainingDrawing(code,yaw,travel)','positionTrainingDrawing(code,yaw,travel,positionJoint)').replaceAll('positionTrainingDrawing(code,cameraYaw,travel)','positionTrainingDrawing(code,cameraYaw,travel,positionJoint)').replaceAll("positionTrainingDrawing(v.code,yaw+pick([-.05,0,.05]),v.travel)","positionTrainingDrawing(v.code,yaw+pick([-.05,0,.05]),v.travel,positionJoint)");
replace('code:q.code,travel:q.travel,positionTask:q.positionTask','code:q.code,travel:q.travel,positionJoint:q.positionJoint,positionTask:q.positionTask');
replace('function grade(answer,button,items,override)',read('integrated-positions.js')+'\n\nfunction grade(answer,button,items,override)');
const extraCss=fs.existsSync(path.join(__dirname,'integrated-positions.css'))?read('integrated-positions.css'):'';
replace('</style>',extraCss+`\n.symbol-palette svg{overflow:visible}.symbol-palette button{width:120px;flex-shrink:0}.symbol-palette svg{height:74px;width:100%}.integrated-content{color:var(--blue-deep);font-weight:650;font-size:13px}.drawing-context{font-size:14px;color:var(--blue-deep);margin-bottom:10px}.added-symbol-callout p{max-width:920px}.joint-reference-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.joint-reference-grid article{border:1px solid var(--line);border-radius:12px;padding:16px;background:#fff;min-width:0}.joint-reference-grid svg{width:100%;height:180px}.joint-reference-grid h3{font-size:15px;color:var(--blue-deep)}.joint-reference-grid p{font-size:13px;margin-bottom:0}.position-table{width:100%}@media(max-width:720px){.joint-reference-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:450px){.joint-reference-grid{grid-template-columns:1fr}}\n</style>`);
replace("shell(inverse?'Qual símbolo corresponde a esta execução?':'Qual execução corresponde ao símbolo?',inverse?executionDrawing(b.config):symbol(b.config));","shell(inverse?'Qual símbolo corresponde a esta execução?':'Qual execução corresponde ao símbolo?',(b.promptContext?`<p class=\"drawing-context\">${b.promptContext}</p>`:'')+(inverse?executionDrawing(b.config):symbol(b.config)));");
// Keep expanded examples legible in the fixed-width symbol palette.
html=html.replaceAll("translate(4 48)","translate(24 48)").replaceAll("'0 0 54 100'","'0 0 110 100'").replaceAll("'0 0 70 100'","'0 0 110 100'");
section('function builder() {','function inspector() {',read('welding-processes.js')+'\n'+read('anatomy-training.js')+'\n'+read('drawing-description.js')+'\n'+read('construction-workspace.js')+'\n'+read('technical-builder.js')+'\n'+read('builder-workspace.js')+'\n'+read('builder-standard.js'));
replace('</style>',read('builder-workspace.css')+'\n'+read('drawing-description.css')+'\n</style>');
replace('<p>${q.explain}</p>','<p>${q.explain}</p>${q.builderReview||\'\'}');
replace("q.builder?'Símbolo correto'","q.builder?'Desenho de referência'");
replace('Leia os requisitos da OS e monte a indicação de soldagem correspondente.','Leia a descrição e construa a peça, a solda e sua indicação.');
section('function difficultyFor(m=mode) {', '// Returns a new configuration.', '');
section('function config() {','const fields =','function config(){return progressiveConfig();}\n');
replace('<small>Uma questão por vez</small>','<small>${trainingProgressText()}</small>');
replace("shuffle(['Filete', ...grooveNames].filter(x => x !== c.type))","shuffle(availableWeldTypes().filter(x => x !== c.type))");
replace("c.joint, ['Topo', 'T', 'Canto', 'Sobreposta']","c.joint, availableJointTypes()");
replace("['Em qual lado a solda foi indicada?', c.side, ['seta', 'oposto', 'ambos'], 'Abaixo: lado da seta; acima: lado oposto; indicações dos dois lados: ambos.']","...(difficultyFor()>0?[['Em qual lado a solda foi indicada?', c.side, ['seta', 'oposto', 'ambos'], 'Abaixo: lado da seta; acima: lado oposto; indicações dos dois lados: ambos.']]:[])");
replace("if ((fillet && c.joint === 'T') || (!fillet && ['V', 'Bisel', 'U', 'J'].includes(c.type))) eligible.push('Lado errado');","if (difficultyFor()>=1&&((fillet && c.joint === 'T') || (!fillet && ['V', 'Bisel', 'U', 'J'].includes(c.type)))) eligible.push('Lado errado');");
replace("if (fillet && c.side === 'seta') eligible.push('Tipo de junta errado');","if (difficultyFor()>=1&&fillet && c.side === 'seta') eligible.push('Tipo de junta errado');");
replace("if (!fillet) eligible.push('Chanfro errado');","if (difficultyFor()>=1&&!fillet) eligible.push('Chanfro errado');");
replace("pick(codes.filter(c=>c!==lastId))","pick(availablePositionCodes(5).filter(c=>c!==lastId))");
replace("v.id!==answer&&(mastery<4||v.code[1]===code[1])","v.id!==answer&&availablePositionCodes(5).includes(v.code)&&(availablePositionCodes(5).filter(code=>code[1]===v.code[1]).length<4||mastery<4||v.code[1]===code[1])");
replace("positionVariants.map(v=>{const d=positionInfo(v.code,v.travel)","positionVariants.filter(v=>availablePositionCodes(5).includes(v.code)).map(v=>{const d=positionInfo(v.code,v.travel)");
replace('const previousLevel=levelIndex();locked=true;','const previousLevel=levelIndex(),previousTraining=trainingStage().tier;locked=true;');
replace("<h3>${correct?'✓ Acertou!':'✕ Vamos ajustar a leitura.'}</h3>","${trainingStage().tier>previousTraining?`<div class=\"promotion\" role=\"status\">Novo conteúdo liberado: ${trainingStage().name}!</div>`:''}<h3>${correct?'✓ Acertou!':'✕ Vamos ajustar a leitura.'}</h3>");
replace('function symbol(c={}) {',"function symbol(c={}) {\n  if(c.effective!==undefined&&c.effective!==''&&grooveNames.includes(c.type))c={...c,size:c.size+'('+c.effective+')'};");
replace("if(c.angle)s+=txt(300,204,c.angle+'°');","if(c.angle)s+=txt(300,204,c.angle+'°');\n    if(c.effective)s+=txt(35,225,'E = '+c.effective+' mm');\n    if(c.face)s+=txt(170,225,'f = '+c.face+' mm');\n    if(c.thickness)s+=txt(300,225,'t = '+c.thickness+' mm');");
replace("'Preparação da junta · cotas em mm · sem escala'","'Preparação da junta · '+(c.thickness?'t = '+c.thickness+' mm · ':'')+'sem escala'");
replace('Leia a descrição e construa a peça, a solda e sua indicação.','Treino técnico completo: interprete a descrição e construa a peça e sua indicação.');
replace("if(c.tail)s+=line('M375 130 l30 -18 M375 130 l30 18')+txt(335,87,c.tail);","s+=weldingTail(c);");
replace("return svg(s,'Símbolo de soldagem','0 0 440 260');","return svg(s,'Símbolo de soldagem',c.process||c.tail?'0 0 555 260':'0 0 440 260');");
replace('function detective() {',`function detective() {
  if(detect?.anatomy)return anatomyDetective();
  if(!detect&&!retry&&shouldAnatomyDetective())return anatomyDetective();`);
replace("!correct||q.builder||(mode===4", "!correct||q.builder||q.anatomy||(mode===4");
replace('</style>',read('anatomy-training.css')+'\n.tail-process{font-weight:750}.tail-reference{font-size:13px}\n</style>');
html=html.trimEnd()+'\n';
fs.writeFileSync(path.join(__dirname,'../SIMBOLOGIA DE SOLDAGEM.html'),html,'utf8');
fs.writeFileSync(path.join(__dirname,'../index.html'),html,'utf8');
console.log('Built single-file HTML and index.html with integrated content in all five modes.');
