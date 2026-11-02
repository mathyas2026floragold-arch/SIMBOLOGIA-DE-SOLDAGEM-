// New families participate in the existing positions game through spatial reading.
// These exercises describe geometry and access without assigning an F/G code
// to a family for which the eight plate-position examples do not apply.
const specialPositionLessons={
  'V flangeado':{
    directions:['Seções lado a lado; depósito por cima','Seções empilhadas; depósito pela direita','Seções lado a lado; depósito por baixo','Seções empilhadas; depósito pela esquerda'],
    question:'Qual encontro recebe o metal de adição nesta peça?',
    answer:'O encontro entre duas superfícies convexas',
    wrong:['O encontro entre uma superfície convexa e outra plana','Um furo atravessando uma chapa sobreposta','A superfície de uma chapa isolada'],
    explanation:'O chanfro V flangeado é formado pelo encontro de duas superfícies convexas. A orientação da peça muda o acesso, mas não muda a família do símbolo.'
  },
  'Bisel flangeado':{
    directions:['Peças lado a lado; depósito por cima','Peças empilhadas; depósito pela direita','Peças lado a lado; depósito por baixo','Peças empilhadas; depósito pela esquerda'],
    question:'Qual geometria precisa ser reconhecida antes de avaliar a orientação?',
    answer:'Uma superfície convexa junto a uma superfície plana',
    wrong:['Duas superfícies convexas adjacentes','Duas bordas retas preparadas em V','Duas chapas sobrepostas unidas por um furo preenchido'],
    explanation:'Uma face curva e uma face plana formam o bisel flangeado. Ele não é um chanfro em J: a curvatura já pertence à peça.'
  },
  'Aresta flangeada':{
    directions:['Duas bordas dobradas voltadas para cima','Duas bordas dobradas voltadas para a direita','Duas bordas dobradas voltadas para baixo','Duas bordas dobradas voltadas para a esquerda'],
    question:'Quais extremidades são unidas no corte deste desenho legado?',
    answer:'As extremidades das duas bordas dobradas',
    wrong:['Uma borda dobrada e outra reta','As faces internas de duas chapas sem dobra','Apenas a face de uma chapa, por revestimento'],
    explanation:'A ligação ocorre nas extremidades de duas bordas dobradas. O desenho legado deve ser interpretado junto com a geometria; girar a vista não o transforma em filete.'
  },
  'Canto flangeado':{
    directions:['Bordas unidas pela extremidade superior','Bordas unidas pela extremidade direita','Bordas unidas pela extremidade inferior','Bordas unidas pela extremidade esquerda'],
    question:'Qual combinação de bordas aparece nesta ligação legada?',
    answer:'Uma borda dobrada junto a uma borda reta',
    wrong:['Duas bordas dobradas simétricas','Duas seções circulares lado a lado','Uma única chapa com camada de revestimento'],
    explanation:'A geometria combina uma borda flangeada e outra reta. O acesso acompanha a extremidade unida, independentemente da rotação do conjunto.'
  },
  'Tampão':{
    directions:['Chapas horizontais; furo preenchido por cima','Chapas verticais; furo preenchido pela direita','Chapas horizontais; furo preenchido por baixo','Chapas verticais; furo preenchido pela esquerda'],
    question:'Por onde o metal alcança a chapa que está atrás?',
    answer:'Pelo furo preenchido na chapa sobreposta',
    wrong:['Por uma região de fusão interna sem furo','Pela borda externa, formando um filete','Por uma camada que reveste somente uma peça'],
    explanation:'No tampão há um furo na peça sobreposta. O metal preenche esse furo e estabelece a ligação com a outra peça; pontos de resistência não exigem esse furo.'
  },
  'Ponto':{
    directions:['Chapas sobrepostas na horizontal','Chapas sobrepostas na vertical','Chapas sobrepostas na horizontal','Chapas sobrepostas na vertical'],
    question:'Em que região o ponto une estas chapas?',
    answer:'Na interface entre as chapas, em regiões discretas de fusão',
    wrong:['No interior de um furo previamente aberto','Somente na borda externa das chapas','Sobre uma única face, sem unir as chapas'],
    explanation:'Os pontos mostrados são regiões discretas de fusão na interface. Neste exemplo de resistência, o símbolo centralizado não distingue lado da seta e lado oposto.'
  },
  'Costura':{
    directions:['Chapas sobrepostas na horizontal','Chapas sobrepostas na vertical','Chapas sobrepostas na horizontal','Chapas sobrepostas na vertical'],
    question:'Como a união se distribui entre as chapas?',
    answer:'Como uma faixa contínua de fusão na interface',
    wrong:['Como pontos isolados separados','Como furos preenchidos na chapa externa','Como revestimento de uma peça sem ligação com outra'],
    explanation:'A costura forma uma faixa na interface das chapas. Observe também a vista de detalhe: o corte transversal, sozinho, pode parecer o de um ponto.'
  },
  'Reverso':{
    directions:['Passe 2 acessado por baixo','Passe 2 acessado pela esquerda','Passe 2 acessado por cima','Passe 2 acessado pela direita'],
    question:'Qual operação precisa de acesso ao lado oposto à solda principal?',
    answer:'O passe 2, executado no reverso após o passe principal',
    wrong:['Uma barra de apoio instalada antes do passe principal','Apenas o reforço produzido por melt-through','Uma camada de revestimento sobre a face principal'],
    explanation:'O passe 1 é a solda principal. O passe 2 é executado depois, no reverso; por isso o conjunto precisa oferecer acesso à outra face. Não é backing nem melt-through.'
  },
  'Revestimento':{
    directions:['Face revestida voltada para cima','Face revestida voltada para a direita','Face revestida voltada para baixo','Face revestida voltada para a esquerda'],
    question:'Qual região da peça recebe a deposição?',
    answer:'A superfície de uma única peça, formando uma camada',
    wrong:['O furo que liga duas chapas sobrepostas','A interface entre duas chapas, por pontos internos','A raiz de uma junta de topo, em um segundo passe'],
    explanation:'O revestimento adiciona uma camada à superfície. A vista permite avaliar o acesso a essa face; não se deve chamar essa deposição de filete apenas por estar por cima ou por baixo.'
  }
};

function specialPositionDrawing(c,orientation=0,withPlan=false){
  // Keep only the geometry of the first section. Dimension labels and the
  // drawing's reference arrow are not physical objects and must not rotate.
  const canonical={...c,side:'seta',execution:false};
  const original=cut(canonical);
  const match=original.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/);
  let geometry=match?match[1]:'';
  geometry=geometry.replace(/<text\b[\s\S]*?<\/text>/g,'').replace(/<path\b[^>]*class="dim"[^>]*\/?>/g,'');
  const angle=orientation*90;
  const sequence=c.type==='Reverso'?'<text x="210" y="102" class="sp-pass">1</text><text x="245" y="190" class="sp-pass">2</text>':'';
  const gravity='<g class="sp-gravity"><path d="M397 77 V147 M389 136 L397 147 L405 136"/><text x="397" y="56" text-anchor="middle">g</text></g>';
  let result=`<svg viewBox="0 0 440 300" role="img" aria-label="Vista da peça; gravidade para baixo"><g transform="translate(183 145) scale(.68) rotate(${angle}) translate(-220 -115)"><svg x="20" y="28" width="390" height="177" viewBox="20 28 390 177" style="overflow:hidden">${geometry}</svg>${sequence}</g>${gravity}<text x="25" y="278" class="note">CORTE · gravidade indicada por g</text></svg>`;
  if(withPlan&&['Tampão','Ponto','Costura'].includes(c.type)){
    // A section cannot distinguish a spot from a seam. Retain the plan detail
    // as a separate, explicitly identified view rather than guessing the type.
    const plan=match?match[1].replace(/<text\b[\s\S]*?<\/text>/g,''):'';
    result+=`<svg class="sp-plan" viewBox="40 210 360 95" role="img" aria-label="Vista de detalhe da distribuição da solda" style="overflow:hidden">${plan}</svg><p class="sp-plan-note">Detalhe da face · distribuição da união</p>`;
  }
  return result;
}

function specialPositions(input){
  const source=input||(isSpecialWeld(retry?.config)?retry.config:specialConfig());
  // The spatial view has a fixed reference face; rotation supplies the orientation.
  // Keep the matching reference symbol on that face (back weld remains opposite).
  const c={...source,side:specialWeldMetadata(source.type).sides[0]};
  const lesson=specialPositionLessons[c.type];
  const task=c.positionSpecialTask??nextSpecialPositionTask(c.type);
  const orientation=c.positionOrientation??pick([0,1,2,3]);
  c.positionSpecialTask=task;c.positionOrientation=orientation;
  const key='<div class="position-key"><span>Leitura espacial da junta</span><span>Família da solda + orientação + acesso</span></div>';
  const drawing=specialPositionDrawing(c,orientation,true);
  q={config:c,positionSpecial:true,image:false,explain:'',correctVisual:drawing};
  if(task===0){
    const answer=lesson.directions[orientation];
    let choices=[...new Set(lesson.directions)];
    if(choices.length<4)choices.push('Chapas em T, unidas por filete','Chapas de topo, alinhadas sem sobreposição');
    q.explain=`${answer}. A gravidade permanece para baixo enquanto o conjunto gira. ${lesson.explanation}`;
    shell(c.type==='Reverso'?'Qual acesso é necessário para executar o passe 2?':'Como a região de união está orientada nesta vista?',`${key}<div class="special-position-view">${drawing}</div>`);
    options(shuffle(choices),answer);
  }else if(task===1){
    const alternatives=[c.type,...specialTypeDistractors(c.type)];
    q.image=true;q.correctVisual=symbol(c)+drawing;
    q.explain=`A indicação corresponde a ${c.type.toLowerCase()}. ${lesson.explanation} A família permanece a mesma quando a peça é girada.`;
    shell('Qual geometria orientada corresponde a esta indicação?',`${key}${symbol(c)}<p class="position-note">Compare o formato da união e a distribuição da solda. Todas as alternativas usam a mesma orientação da vista.</p>`);
    options(shuffle(alternatives),c.type,type=>specialPositionDrawing({...c,type},orientation,true));
  }else{
    q.explain=lesson.explanation;
    shell(lesson.question,`${key}<div class="split"><div><h3>Vista orientada</h3>${drawing}</div><div><h3>Indicação de referência</h3>${symbol(c)}</div></div>`);
    options(shuffle([lesson.answer,...lesson.wrong]),lesson.answer);
  }
  $('#work').insertAdjacentHTML('afterend',positionReference());
}
