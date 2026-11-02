const positionFamilyAnswers={
  F:'Filete · família F',
  G:'Chanfro · família G',
  other:'Outra família · não atribuir automaticamente F ou G',
  reverse:'Passe no reverso · o semicírculo não define a posição'
};
let lastPositionFamilyType='';
function weldPositionFamily(type){
  if(type==='Filete')return 'F';
  if(type==='Reverso')return 'reverse';
  if(grooveNames.includes(type)||['V flangeado','Bisel flangeado'].includes(type))return 'G';
  return 'other';
}
function positionFamilyTypes(){return [...new Set([...addedWeldTypes,'Filete','V','U'])];}
function positionFamilyConfig(type){
  const meta=typeof addedWeldInfo!=='undefined'?addedWeldInfo[type]:null;
  return {type,joint:type==='Filete'?'T':['Tampão','Ponto','Costura'].includes(type)?'Sobreposta':['Aresta','Aresta flangeada'].includes(type)?'Borda':type==='Canto flangeado'?'Canto':type==='Revestimento'?'Superfície':'Topo',side:meta?.sideRule==='neutro'?'neutro':'seta',field:false,all:false,finish:'',contour:''};
}
function positionFamilyChallenge(input){
  let c=input||retry?.positionFamilyConfig;
  if(!c){
    let pool=positionFamilyTypes().filter(type=>type!==lastPositionFamilyType);
    const unseen=pool.filter(type=>!state.seen['5-pos-family-'+type]);
    c=positionFamilyConfig(pick(unseen.length?unseen:pool));
  }
  lastPositionFamilyType=c.type;
  const answer=weldPositionFamily(c.type),meta=typeof addedWeldInfo!=='undefined'?addedWeldInfo[c.type]:null;
  const name=meta?.name||c.type;
  const explain=answer==='F'?'O símbolo indica solda de filete, da família F. O número da posição depende da orientação da junta em relação à gravidade.':answer==='G'?`${name} é uma solda em chanfro, da família G. Reconhecer o tipo de chanfro não determina sozinho se a posição é 1G, 2G, 3G ou 4G.`:answer==='reverse'?'O semicírculo aberto identifica o passe no reverso após a solda principal, conforme a sequência deste desenho. Ele não determina a posição de soldagem da junta.':`${name} pertence a outra família de solda. Não se deve transformar essa indicação automaticamente em 1F–4F ou 1G–4G.`;
  q={positionFamily:true,positionFamilyConfig:c,bank:{id:'pos-family-'+c.type},image:false,explain,correctVisual:`<div class="position-target"><strong>${answer==='F'||answer==='G'?answer:'Tipo'}</strong><div><b>${name}</b><small>${positionFamilyAnswers[answer]}</small></div></div><div class="split"><div>${symbol(c)}</div><div>${cut(c)}</div></div>`};
  const prompt=answer==='reverse'?'O que o semicírculo aberto acrescenta à indicação?':'Antes de escolher a posição, qual é a família da solda?';
  shell(prompt,`<div class="position-key"><span>1 · Reconheça o tipo de solda</span><span>2 · Observe a orientação da junta</span></div><div class="split"><div><h3>Indicação do desenho</h3>${symbol(c)}</div><div><h3>Geometria representada</h3>${cut(c)}</div></div>`);
  options(shuffle(Object.keys(positionFamilyAnswers)),answer,key=>positionFamilyAnswers[key]);
}
