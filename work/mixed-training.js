// Each mode has its own rotation; reinforcement never advances it.
const modeMix={};
function mixFor(m=mode){return modeMix[m]||(modeMix[m]={turn:0,types:[],last:''});}
function chooseSpecialWeld(m=mode){
  if(retry)return false;
  const mix=mixFor(m);
  const turn=mix.turn++;
  return unlockedSpecialTypes(m).length>0&&turn%(m===5?3:2)===0;
}
function nextSpecialType(m=mode){
  const mix=mixFor(m);
  const allowed=unlockedSpecialTypes(m),signature=allowed.join('|');
  if(!allowed.length)return null;
  if(!mix.types.length||mix.typeSignature!==signature){
    mix.typeSignature=signature;mix.types=shuffle(allowed);
    if(mix.types.length>1&&mix.types[0]===mix.last)[mix.types[0],mix.types[1]]=[mix.types[1],mix.types[0]];
  }
  mix.specialCount=(mix.specialCount||0)+1;
  return mix.last=mix.types.shift();
}
function nextPositionTask(){const mix=mixFor(5);return (mix.positionTurn=(mix.positionTurn||0)+1)-1;}
function nextSpecialPositionTask(type){const mix=mixFor(5),tasks=mix.tasks||(mix.tasks={});return ((tasks[type]=(tasks[type]||0)+1)-1)%3;}
function nextJoint(m=mode){
  const mix=mixFor(m);
  const allowed=availableJointTypes(m).filter(j=>['T','Canto','Sobreposta'].includes(j)),signature=allowed.join('|');
  if(!mix.joints?.length||mix.jointSignature!==signature){mix.joints=shuffle(allowed);mix.jointSignature=signature;}
  return mix.joints.shift();
}
function installAddedWeldCases(){
  for(const type of ['Filete','Reto'])for(const size of [4,6]){
    const c={type,joint:type==='Filete'?'T':'Topo',side:'seta',size,length:0,pitch:0};
    const other=type==='Filete'?'Reto':'Filete';
    pairCase('primeiros-'+type+'-'+size,0,c,[{...c,size:size+2},{...c,size:size+4},{...c,type:other,joint:other==='Filete'?'T':'Topo'}],`Comece pelo tipo de solda e pela dimensão: ${type==='Filete'?'filete na junta em T':'chanfro reto na junta de topo'}, com ${size} mm, no lado da seta.`);
    Object.assign(bank[bank.length-1],{beginner:true,targetType:type});
  }
  for(const type of addedWeldTypes){
    const m=specialWeldMetadata(type);
    const sizes=m.sizes.length?m.sizes:[undefined];
    for(const size of sizes)for(const side of m.sides){
      const c={type,joint:m.joint,side,...(size===undefined?{}:{size})};
      const otherTypes=specialTypeDistractors(type,false);
      const alternatives=[];
      if(size!==undefined)alternatives.push({...c,size:m.sizes.find(x=>x!==size)});
      if(m.sides.length>1)alternatives.push({...c,side:m.sides.find(x=>x!==side)});
      for(const other of otherTypes){
        if(alternatives.length===3)break;
        const otherMeta=specialWeldMetadata(other);
        alternatives.push(otherMeta?{type:other,joint:otherMeta.joint,side:otherMeta.sides[0],...(otherMeta.sizes.length?{size:otherMeta.sizes[0]}:{})}:{type:other,joint:other==='Filete'?'T':'Topo',side:'seta',size:6});
      }
      const sideNote=m.sideRule==='selectable'?` ${side==='seta'?'Abaixo da linha: lado da seta.':'Acima da linha: lado oposto.'}`:m.sideRule==='neutro'?' O símbolo fica centralizado na linha, sem distinção de lado neste exemplo.':'';
      pairCase('integrado-'+type+'-'+side+'-'+(size??'sequencia'),0,c,alternatives,`${m.definition}${sideNote}${size===undefined?'':` ${m.dimensionLabel}: ${size} mm.`}`);
      Object.assign(bank[bank.length-1],{added:true,targetType:type});
    }
  }
  // A basic symbol alone does not select a joint. A joint-specific prompt supplies the missing drawing context.
  for(const joint of ['T','Canto','Sobreposta'])for(const side of joint==='Canto'?['seta']:['seta','oposto','ambos'])for(const size of [4,6,8]){
    const c={type:'Filete',joint,side,size};
    const alternatives=[{...c,size:size+2},{...c,contour:'Convexo'},{type:'V',joint:'Topo',side:'seta',size}];
    // A contour unspecified by the project cannot serve as a wrong alternative.
    alternatives[1]=joint==='Canto'?{...c,size:size+4}:{...c,side:side==='seta'?'oposto':'seta'};
    pairCase('junta-'+joint+'-'+side+'-'+size,0,c,alternatives,`O detalhe solicita junta ${joint==='T'?'em T':joint==='Canto'?'de canto':'sobreposta'}. Compare a disposição das peças, a dimensão de ${size} mm e o lado indicado pela linha de referência.`);
    Object.assign(bank[bank.length-1],{jointCase:true,targetJoint:joint,promptContext:`Detalhe de montagem · junta ${joint==='T'?'em T':joint==='Canto'?'de canto':'sobreposta'}`});
  }
}
function chooseBank(){
  const stage=difficultyFor(),difficulty=Math.min(2,stage);
  const isNew=chooseSpecialWeld(1);
  const type=isNew?nextSpecialType(1):null;
  const visualTurn=serial%4!==0;
  let pool=bank.filter(b=>bankAllowed(b,1)&&(isNew?b.added&&b.targetType===type:!b.added&&b.tier<=difficulty&&(!visualTurn||b.kind==='pair'||b.kind==='cut')));
  if(!pool.length)pool=bank.filter(b=>bankAllowed(b,1)&&!b.added);
  const withoutLast=pool.filter(b=>b.id!==lastId);if(withoutLast.length)pool=withoutLast;
  const unused=pool.filter(b=>!state.seen['1-'+b.id]);
  const original=pick(unused.length?unused:pool),b={...original};
  if(b.kind==='cut')b.options=[b.answer,...shuffle(availableWeldTypes(1).filter(t=>t!==b.answer)).slice(0,3)];
  if(b.id.startsWith('junta-'))b.options=b.options.filter(j=>availableJointTypes(1).includes(j));
  lastId=b.id;return b;
}
