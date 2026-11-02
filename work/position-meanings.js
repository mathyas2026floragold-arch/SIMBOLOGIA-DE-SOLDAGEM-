const positionGlossary={
  '1F':{meaning:'Filete plano',iso:'PA',cue:'A face do filete está voltada para cima, com a junta em calha.'},
  '2F':{meaning:'Filete horizontal',iso:'PB',cue:'O eixo da solda está horizontal no encontro de uma chapa horizontal com outra vertical.'},
  '3F':{meaning:'Filete vertical',iso:null,cue:'O eixo da solda está vertical.'},
  '4F':{meaning:'Filete sobrecabeça',iso:'PD',cue:'A solda é executada pela face inferior da junta, com acesso da tocha por baixo.'},
  '1G':{meaning:'Topo/chanfro plano',iso:'PA',cue:'As chapas estão horizontais e a solda é executada pela face superior.'},
  '2G':{meaning:'Topo/chanfro horizontal',iso:'PC',cue:'As chapas estão verticais e o eixo da solda está horizontal.'},
  '3G':{meaning:'Topo/chanfro vertical',iso:null,cue:'As chapas e o eixo da solda estão na orientação vertical.'},
  '4G':{meaning:'Topo/chanfro sobrecabeça',iso:'PE',cue:'As chapas estão horizontais e a solda é executada pela face inferior.'}
};
const positionVariants=codes.flatMap(code=>code[0]==='3'?[{id:code+'-up',code,travel:'up'},{id:code+'-down',code,travel:'down'}]:[{id:code,code,travel:null}]);
function positionInfo(code,travel=null){
  const base=positionGlossary[code];
  const vertical=code[0]==='3';
  const direction=travel==='up'?'ascendente':travel==='down'?'descendente':'';
  return {...base,code,travel,meaning:base.meaning+(vertical&&direction?' '+direction:''),iso:vertical?(travel==='up'?'PF':travel==='down'?'PG':'PF ↑ / PG ↓'):base.iso};
}
function positionLabel(id,includeCode=true){
  const v=positionVariants.find(v=>v.id===id),d=positionInfo(v.code,v.travel);
  return `${includeCode?`<strong class="position-answer-code">${d.code}</strong>`:''}<span class="position-answer-meaning">${d.meaning}</span><small class="position-iso">ISO/EN · ${d.iso}</small>`;
}
function positionTrainingDrawing(code,yaw=0,travel=null){
  let drawing=position(code,yaw);
  if(code[0]!=='3'||!travel)return drawing;
  const up=travel==='up',end=up?88:183,start=up?183:88;
  const arrow=`<g class="travel-indicator"><path d="M392 ${start} V${end} M386 ${end+(up?10:-10)} L392 ${end} L398 ${end+(up?10:-10)}"/><text x="305" y="46">AVANÇO DA SOLDA</text><text x="305" y="64">${up?'Ascendente ↑':'Descendente ↓'}</text></g>`;
  return drawing.replace('</svg>',arrow+'</svg>').replace('gravidade para baixo','gravidade para baixo e avanço '+(up?'ascendente':'descendente'));
}
function positionReference(){
  return `<details class="position-reference"><summary>Consultar significados · ASME/AWS × ISO/EN</summary><p class="position-note">F = filete · G = solda em topo/chanfro. Compare a orientação com a gravidade; nas verticais, observe também o sentido de avanço.</p><table class="position-table"><caption>Posições básicas em chapas</caption><thead><tr><th scope="col">ASME/AWS</th><th scope="col">ISO/EN</th><th scope="col">Significado</th></tr></thead><tbody>${positionVariants.map(v=>{const d=positionInfo(v.code,v.travel);return `<tr><th scope="row">${d.code}</th><td>${d.iso}</td><td>${d.meaning}</td></tr>`;}).join('')}</tbody></table><p class="position-note">3F e 3G indicam a posição vertical; PF e PG distinguem, respectivamente, o avanço ascendente e descendente. A seta de avanço é diferente da indicação de gravidade e do acesso da tocha.</p></details>`;
}
function positions(){
  const mastery=state.master[mode]||0;
  const code=retry?.code||pick(codes.filter(c=>c!==lastId));lastId=code;
  const travel=code[0]==='3'?(retry?.travel||pick(['up','down'])):null;
  const answer=code+(travel?'-'+travel:'');
  const task=retry?.positionTask??(serial%3);
  const info=positionInfo(code,travel);
  const yaw=pick(difficultyFor()>=3?[-.4,-.25,0,.25,.4]:mastery>=4?[-.35,-.15,.15,.35]:[0,.1]);
  const directionSentence=code[0]==='3'?`${code} sozinho não define a progressão. Nesta figura, a seta de avanço indica soldagem ${travel==='up'?'ascendente':'descendente'}, correspondente a ${info.iso}.`:info.cue;
  q={code,travel,positionTask:task,image:true,explain:`${code} significa ${info.meaning.toLowerCase()}${code[0]==='3'?'.':` (ISO/EN ${info.iso}).`} ${directionSentence}`,correctVisual:`<div class="position-correction"><div class="position-target"><strong>${code}</strong><div><b>${info.meaning}</b><small>ISO/EN · ${info.iso}</small></div></div>${positionTrainingDrawing(code,yaw,travel)}</div>`};
  let pool=positionVariants.filter(v=>v.id!==answer&&(mastery<4||v.code[1]===code[1]));
  let distractors=shuffle(pool).slice(0,3);
  if(travel){const opposite=code+(travel==='up'?'-down':'-up');distractors=[positionVariants.find(v=>v.id===opposite),...shuffle(pool.filter(v=>v.id!==opposite)).slice(0,2)];}
  const choices=shuffle([answer,...distractors.map(v=>v.id)]);
  const key='<div class="position-key"><span><b>F</b> · filete</span><span><b>G</b> · topo/chanfro</span><span>Orientação em relação à gravidade</span></div>';
  if(task===0){
    shell(`Qual peça representa ${code} — ${info.meaning.toLowerCase()}?`,`${key}<div class="position-target"><strong>${code}</strong><div><b>${info.meaning}</b><small>ISO/EN · ${info.iso}</small></div></div>`);
    options(choices,answer,id=>{const v=positionVariants.find(v=>v.id===id);return positionTrainingDrawing(v.code,yaw+pick([-.05,0,.05]),v.travel);});
  }else{
    shell(task===1?'Qual posição e significado descrevem esta peça?':`O que significa ${code}${travel?' com avanço '+(travel==='up'?'ascendente':'descendente'):''}?`,`${key}${task===2?`<div class="position-target"><strong>${code}</strong><span>Interprete o número, a letra e a orientação da peça.</span></div>`:''}<div id="position-model">${positionTrainingDrawing(code,yaw,travel)}</div>`);
    options(choices,answer,id=>positionLabel(id,task===1));
    let cameraYaw=yaw;
    const controls=document.createElement('div');controls.className='pills';
    controls.innerHTML='<button type="button" id="rotateLeft" aria-label="Girar câmera à esquerda">↶ Girar vista</button><button type="button" id="rotateRight" aria-label="Girar câmera à direita">Girar vista ↷</button>';
    app.querySelector('.scene').after(controls);
    $('#rotateLeft').onclick=()=>{cameraYaw=Math.max(-.4,cameraYaw-.15);$('#position-model').innerHTML=positionTrainingDrawing(code,cameraYaw,travel);};
    $('#rotateRight').onclick=()=>{cameraYaw=Math.min(.4,cameraYaw+.15);$('#position-model').innerHTML=positionTrainingDrawing(code,cameraYaw,travel);};
  }
  $('#work').insertAdjacentHTML('afterend',positionReference());
}
