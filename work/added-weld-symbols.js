const addedWeldTypes=['V flangeado','Bisel flangeado','Aresta flangeada','Canto flangeado','Tampão','Ponto','Costura','Reverso','Revestimento'];
const addedWeldInfo={
  'V flangeado':{name:'V flangeado',aliases:['Flare-V'],definition:'Solda no encontro de duas superfícies convexas. As curvas do símbolo representam a geometria das peças, não uma preparação em U.',dimensionLabel:'Tamanho efetivo E',sideRule:'seta'},
  'Bisel flangeado':{name:'½ V flangeado',aliases:['Bisel flangeado','Flare-bevel'],definition:'Solda entre uma superfície convexa e outra plana. O símbolo tem uma linha reta e uma curva; não deve ser confundido com a preparação em J.',dimensionLabel:'Tamanho efetivo E',sideRule:'seta'},
  'Aresta flangeada':{name:'Aresta flangeada',aliases:['Flange-edge'],definition:'Indicação de união de duas bordas flangeadas, presente em referências e desenhos legados. Compare o detalhe das chapas dobradas antes de interpretar a solda.',dimensionLabel:'Dimensão da solda de aresta',sideRule:'seta',legacy:true},
  'Canto flangeado':{name:'Canto flangeado',aliases:['Flange-corner'],definition:'Indicação de união entre uma borda flangeada e outra reta, encontrada em desenhos legados. Não é o símbolo de chanfro de meio V flangeado.',dimensionLabel:'Dimensão da solda de aresta',sideRule:'seta',legacy:true},
  'Tampão':{name:'Solda tampão',aliases:['Plug weld'],definition:'O metal preenche um furo em uma das chapas para ligá-la à peça sobreposta. O retângulo também pode representar rasgo; o detalhe circular deste exercício define tampão.',dimensionLabel:'Diâmetro do furo',sideRule:'seta'},
  'Ponto':{name:'Solda a ponto',aliases:['Spot weld'],definition:'Regiões discretas de fusão unem as chapas na interface, sem um furo preenchido. Neste exemplo de resistência, o círculo fica centrado na linha e não distingue lado.',dimensionLabel:'Diâmetro da região fundida',sideRule:'neutro'},
  'Costura':{name:'Solda por costura',aliases:['Seam weld'],definition:'Uma faixa contínua de fusão une as chapas. O círculo com duas linhas paralelas distingue costura de ponto; a linha de referência passa pelo centro neste exemplo.',dimensionLabel:'Largura da solda',sideRule:'neutro'},
  'Reverso':{name:'Solda no reverso',aliases:['Back weld'],definition:'Um passe é executado no lado oposto após a solda principal. O semicírculo aberto também pode indicar solda de apoio; a sequência informada distingue o reverso de outras aplicações.',dimensionLabel:'Sem dimensão neste exemplo',sideRule:'seta'},
  'Revestimento':{name:'Solda de revestimento',aliases:['Surfacing'],definition:'O metal de adição forma uma camada sobre uma superfície. A indicação não solicita a união de duas peças e usa o símbolo abaixo da linha de referência.',dimensionLabel:'Espessura adicionada',sideRule:'seta'}
};
const allWeldFamilies=['Filete',...grooveNames,...addedWeldTypes];
let newSymbolFocus=null;
function addedGlyph(type){
  const paths={
    'V flangeado':'M18 0 Q18 30 -12 30 M24 0 Q24 30 54 30',
    'Bisel flangeado':'M0 0 V34 M8 0 Q8 30 40 30',
    'Aresta flangeada':'M12 0 V16 Q12 32 0 38 M24 0 V16 Q24 32 36 38',
    'Canto flangeado':'M0 0 V38 M12 0 V16 Q12 32 36 38',
    'Tampão':'M0 0 H36 V26 H0 Z',
    'Ponto':'M36 0 A18 18 0 1 1 0 0 A18 18 0 1 1 36 0',
    'Costura':'M36 0 A18 18 0 1 1 0 0 A18 18 0 1 1 36 0 M-7 -9 H43 M-7 9 H43',
    'Reverso':'M0 0 A18 18 0 0 0 36 0',
    'Revestimento':'M0 0 A15 15 0 0 0 30 0 A15 15 0 0 0 60 0'
  };
  return paths[type]?line(paths[type]):null;
}
function addedSymbol(c){
  const type=c.type;if(!addedWeldTypes.includes(type))return null;
  const meta=addedWeldInfo[type],center=meta.sideRule==='neutro';
  const sign=c.side==='oposto'?-1:1;
  let s=line('M42 192 L104 130 H375 M42 192 l5 -18 M42 192 l18 -5');
  if(type==='Reverso'){
    s+=`<g transform="translate(217 130)">${line('M0 30 L18 0 L36 30')}</g><g transform="translate(217 130) scale(1 -1)">${addedGlyph(type)}</g>`;
    s+=txt(24,241,'Semicírculo: executar após a solda principal','note');
    s+=txt(300,91,'2 APÓS 1','note');
  }else{
    s+=`<g transform="translate(217 130) scale(1 ${center?1:sign})">${addedGlyph(type)}</g>`;
    if(c.size!==undefined&&c.size!=='')s+=txt(151,center?162:sign>0?155:114,['V flangeado','Bisel flangeado'].includes(type)?'('+c.size+')':c.size);
  }
  if(c.field)s+=line('M104 130 V63 L132 75 L104 86');
  if(c.all)s+='<circle cx="104" cy="130" r="9" class="wire"/>';
  if(c.count)s+=txt(223,center?185:sign>0?183:78,'('+c.count+')');
  if(type==='Costura'&&c.length)s+=txt(280,162,c.length+(c.pitch?'–'+c.pitch:''));
  if(c.contour){const cy=130+sign*57;s+=line(c.contour==='Plano'?`M217 ${cy} h38`:c.contour==='Convexo'?`M217 ${cy} Q236 ${cy+sign*14} 255 ${cy}`:`M217 ${cy+sign*8} Q236 ${cy-sign*8} 255 ${cy+sign*8}`);if(c.finish)s+=txt(228,cy+sign*23,c.finish);}
  s+=weldingTail(c);
  if(meta.legacy)s+=txt(24,241,'Símbolo de desenho legado · bordas flangeadas','note');
  if(type==='Tampão')s+=txt(24,241,'Detalhe: furo circular na chapa '+(c.side==='oposto'?'oposta à seta':'do lado da seta'),'note');
  return svg(s,'Indicação de soldagem com símbolo básico e linha de referência',c.process||c.tail?'0 0 555 260':'0 0 440 260');
}
function trainAddedSymbols(type=null){newSymbolFocus=type||'all-new';mode=1;detect=null;retry=null;next();}
function addedSymbolLibrary(){
  return `<section class="added-symbol-section"><div class="added-symbol-callout"><div><span class="eyebrow">Conteúdo integrado aos 5 jogos</span><h3>Mais símbolos, mais tipos de juntas</h3><p>V flangeado, meio V flangeado, tampão, ponto, costura, reverso, revestimento e bordas flangeadas de desenhos legados já aparecem nos desafios dos cinco modos, junto aos filetes e chanfros.</p></div></div><details class="added-symbol-library"><summary>Biblioteca de consulta · símbolos, significados e soldas executadas</summary><div class="added-symbol-grid">${addedWeldTypes.map(type=>`<button type="button" data-symbol-study="${type}" aria-pressed="${type==='Tampão'}">${svg(`<g transform="translate(25 48)">${addedGlyph(type)}</g>`,addedWeldInfo[type].name,'0 0 110 104')}<b>${addedWeldInfo[type].name}</b><small>${addedWeldInfo[type].legacy?'Desenho legado':addedWeldInfo[type].aliases[0]}</small></button>`).join('')}</div><div id="symbol-study-panel"></div></details></section>`;
}
function jointReference(){
  const items=[['Topo','Topo','Duas chapas alinhadas pelas extremidades.'],['T','T / ângulo','Uma chapa encontra a região intermediária da outra.'],['Canto','Canto','As chapas se encontram pelas extremidades.'],['Borda','Aresta / borda','Chapas paralelas unidas junto às bordas alinhadas.'],['Sobreposta','Sobreposta','Uma chapa recobre parte da outra.']];
  return `<details class="joint-reference"><summary>Reconhecer as 5 juntas · topo, T/ângulo, canto, aresta e sobreposta</summary><div class="joint-reference-grid">${items.map(([id,name,definition])=>`<article><h3>${name}</h3>${jointDrawing(id)}<p>${definition}</p></article>`).join('')}</div><p class="position-note">A junta descreve a disposição das peças. O símbolo básico descreve a solda: uma junta sobreposta, por exemplo, pode receber filete, tampão, ponto ou costura conforme o projeto.</p></details>`;
}
function showAddedSymbolStudy(type){
  const d=addedWeldInfo[type],m=specialWeldMetadata(type),c={type,joint:m.joint,side:m.sides[0],...(m.sizes.length?{size:m.sizes[0]}:{})};
  $('#symbol-study-panel').innerHTML=`<div class="symbol-study"><h3>${d.name}${d.legacy?' · referência de desenho legado':''}</h3><p>${d.definition}</p><div class="split"><div><h4>Indicação de soldagem</h4>${symbol(c)}</div><div><h4>Representação da execução</h4>${cut(c)}</div></div><p class="integrated-content">Esta família aparece nos cinco modos. Escolha qualquer jogo acima para praticar com todas as simbologias misturadas.</p></div>`;
  app.querySelectorAll('[data-symbol-study]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.symbolStudy===type)));
}
function attachAddedSymbolLibrary(){
  app.insertAdjacentHTML('beforeend',jointReference()+addedSymbolLibrary());
  app.querySelectorAll('[data-symbol-study]').forEach(b=>b.onclick=()=>showAddedSymbolStudy(b.dataset.symbolStudy));
  showAddedSymbolStudy('Tampão');
}
function installAddedWeldCases(){
  for(const type of addedWeldTypes){
    const others=shuffle(addedWeldTypes.filter(t=>t!==type)).slice(0,3);
    add('adicionado-tipo-'+type,0,'Qual execução corresponde ao símbolo?',()=>symbol({type}),type,[type,...others],addedWeldInfo[type].definition,'cut');
    Object.assign(bank[bank.length-1],{added:true,targetType:type});
    if(type==='Reverso')continue;
    for(const size of [4,6,8]){
      const c={type,size,side:addedWeldInfo[type].sideRule==='neutro'?'neutro':'seta'};
      pairCase('adicionado-'+type+'-'+size,0,c,[{...c,size:size+2},{type:others[0],size,side:'seta'},{type:others[1],size,side:'seta'}],`${addedWeldInfo[type].definition} A dimensão solicitada neste exemplo é ${size} mm.`);
      Object.assign(bank[bank.length-1],{added:true,targetType:type});
    }
  }
  pairCase('reverso-apoiometal-melt',0,{type:'Reverso'},[{type:'V',backing:true},{type:'V',melt:true},{type:'V'}],'O semicírculo aberto, com execução após a solda principal, indica solda no reverso. O retângulo é apoio em barra; o semicírculo preenchido é melt-through.');
  Object.assign(bank[bank.length-1],{added:true,targetType:'Reverso'});
}
