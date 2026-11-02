// Learning stages depend on correct answers in this mode, independently of XP.
const trainingStages=[
  {name:'Primeiras juntas',min:0,types:['Filete','Reto'],joints:['T','Topo'],sides:['seta'],codes:['1F','1G']},
  {name:'Juntas e lados',min:4,types:['Filete','Reto','V','Bisel'],joints:['T','Topo','Canto','Sobreposta'],sides:['seta','oposto','ambos'],codes:['1F','1G','2F','2G']},
  {name:'Medidas e distribuição',min:8,types:['Filete','Reto','V','Bisel'],joints:['T','Topo','Canto','Sobreposta'],sides:['seta','oposto','ambos'],codes:['1F','1G','2F','2G']},
  {name:'Novas famílias',min:16,types:['Filete','Reto','V','Bisel','X','K','U','J','Tampão','Ponto','Costura'],joints:['T','Topo','Canto','Sobreposta'],sides:['seta','oposto','ambos'],codes:['1F','1G','2F','2G','3F','3G']},
  {name:'Leitura avançada',min:28,types:['Filete','Reto','V','Bisel','X','K','U','J','Duplo U','Duplo J','Tampão','Ponto','Costura','V flangeado','Bisel flangeado','Reverso','Revestimento'],joints:['T','Topo','Canto','Sobreposta','Superfícies curvas','Curva/plano','Superfície'],sides:['seta','oposto','ambos'],codes:['1F','1G','2F','2G','3F','3G','4F','4G']},
  {name:'Leitura completa',min:44,types:allWeldFamilies,joints:['T','Topo','Canto','Sobreposta','Superfícies curvas','Curva/plano','Superfície','Borda'],sides:['seta','oposto','ambos'],codes:['1F','1G','2F','2G','3F','3G','4F','4G']}
];
function trainingStage(m=mode){
  const correct=Math.max(0,Number(state.master[m])||0);
  if(Number(m)===3)return {...trainingStages[5],name:'Construção técnica completa',tier:5,correct,next:null,technical:true};
  let tier=0;while(tier+1<trainingStages.length&&correct>=trainingStages[tier+1].min)tier++;
  const stage=trainingStages[tier];
  return {...stage,tier,correct,next:trainingStages[tier+1]?.min??null};
}
function difficultyFor(m=mode){return trainingStage(m).tier;}
function availableWeldTypes(m=mode){return [...trainingStage(m).types];}
function availableJointTypes(m=mode){return [...trainingStage(m).joints];}
function availablePositionCodes(m=mode){return [...trainingStage(m).codes];}
function unlockedSpecialTypes(m=mode){return specialWeldTypes().filter(t=>availableWeldTypes(m).includes(t));}
function trainingProgressText(m=mode){const s=trainingStage(m);if(s.technical)return 'Treino técnico · parâmetros completos desde o início';const left=s.next===null?null:s.next-s.correct;return `Etapa ${s.tier+1}/6 · ${s.name}${left===null?'':` · ${left} ${left===1?'acerto':'acertos'} para avançar`}`;}
function configAllowed(c,m=mode){
  const s=trainingStage(m),type=c.type||'Filete',joint=c.joint||(type==='Filete'?'T':'Topo');
  if(!s.types.includes(type)||!s.joints.includes(joint))return false;
  if(s.tier===0&&(c.side&&c.side!=='seta'))return false;
  if(s.tier<2&&(c.length||c.pitch||c.contour||c.field||c.root||c.angle))return false;
  if(s.tier<3&&(c.finish||c.all))return false;
  if(s.tier<4&&(c.backing||c.melt||c.backWeld||c.removable))return false;
  return true;
}
function bankAllowed(b,m=mode){
  const s=trainingStage(m);
  if(s.tier===0)return !!b.beginner;
  if(b.config)return configAllowed(b.config,m)&&b.views.every(c=>configAllowed(c,m));
  if(b.kind==='cut')return s.types.includes(b.answer);
  if(b.id.startsWith('junta-'))return s.joints.includes(b.answer);
  const required=b.id.startsWith('lado-')?1:/^(contorno-|campo$|length$|pitch$|gap$|continuous$|size$|root$|face$|angle$|bevel$|throat)/.test(b.id)?2:/^(all$|acab-|garganta-)/.test(b.id)?3:4;
  return s.tier>=required;
}
function progressiveConfig(){
  if(previewActive&&maxPreviewFirst){maxPreviewFirst=false;return {type:'V',joint:'Topo',side:'seta',size:8,length:0,pitch:0,contour:'Plano',finish:'G',field:true,all:false,backing:true,melt:false,root:3,face:2,angle:60};}
  const stage=trainingStage(),tier=stage.tier,mix=mixFor();
  const pool=stage.types.filter(t=>!isSpecialWeld({type:t}));
  const turn=mix.configTurn||0;mix.configTurn=turn+1;
  const type=tier===0?pool[turn%pool.length]:(Math.random()<.45?'Filete':pick(pool));
  const fillet=type==='Filete',doubled=['X','K','Duplo U','Duplo J'].includes(type);
  const joint=fillet?nextJoint():'Topo';
  const c={type,joint,side:tier===0?'seta':doubled?'ambos':joint==='Canto'?'seta':pick(['seta','oposto',...(fillet?['ambos']:[])]),size:pick(tier===0?[4,6]:[4,5,6,8,10]),length:0,pitch:0,contour:'',finish:'',field:false,all:false,backing:false,melt:false};
  if(tier>=2){
    if(fillet&&Math.random()<.6){c.length=pick([30,40,50,60]);c.pitch=pick([80,100,120,150]);}
    c.contour=pick(fillet?['Plano','Convexo','Côncavo']:['','Plano','Convexo']);
    c.field=Math.random()<.3;
    if(!fillet&&type!=='Reto'){c.root=pick([2,3,4]);if(['V','Bisel','X','K'].includes(type))c.angle=pick([45,60,70]);}
  }
  if(tier>=3){if(c.contour)c.finish=pick(['','G','M']);if(fillet&&joint==='T'&&!c.length)c.all=Math.random()<.3;}
  if(tier>=4&&!fillet&&!doubled&&type!=='Reto'){c.backing=Math.random()<.5;c.melt=!c.backing;}
  return c;
}
