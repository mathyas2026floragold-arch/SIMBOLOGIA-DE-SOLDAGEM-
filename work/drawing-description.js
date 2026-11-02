function drawingDescription(c={}){
  const present=value=>value!==undefined&&value!==null&&value!=='';
  const number=value=>String(value).replace('.',',');
  const geometries={
    Topo:'Duas chapas estão no mesmo plano, com as bordas frente a frente, formando uma junta de topo.',
    T:'Uma chapa perpendicular encontra a região central de outra, formando uma junta em T.',
    Canto:'Duas chapas perpendiculares se encontram pelas extremidades, formando um canto em L.',
    Sobreposta:'Duas chapas paralelas se sobrepõem parcialmente, formando uma junta sobreposta.',
    Borda:'Duas chapas são dispostas com as bordas adjacentes e alinhadas, formando uma junta de borda.',
    'Superfícies curvas':'Duas peças de seção arredondada ficam lado a lado, com suas superfícies convexas encostadas.',
    'Curva/plano':'Uma peça de seção arredondada encosta na face plana de uma chapa.',
    'Superfície':'Uma única chapa apresenta uma face destinada à deposição de metal, sem união com outra peça.'
  };
  const families={
    Filete:'Execute uma solda de filete no encontro das peças.',
    Reto:'A união deve receber solda em chanfro reto, sem bisel nas bordas.',
    V:'A união deve receber solda em chanfro em V.',
    X:'A união deve receber solda em chanfro em X.',
    Bisel:'A união deve receber solda em chanfro em bisel, com apenas uma das bordas preparada.',
    K:'A união deve receber solda em chanfro em K.',
    U:'A união deve receber solda em chanfro em U.',
    'Duplo U':'A união deve receber solda em chanfro em duplo U.',
    J:'A união deve receber solda em chanfro em J.',
    'Duplo J':'A união deve receber solda em chanfro em duplo J.',
    'V flangeado':'Preencha o encontro das duas superfícies convexas com uma solda em V flangeado.',
    'Bisel flangeado':'Preencha o encontro da superfície convexa com a superfície plana usando solda em bisel flangeado, também chamada de meio V flangeado.',
    'Aresta flangeada':'As duas bordas são dobradas na mesma direção e unidas em suas extremidades por solda de aresta flangeada. Preserve a indicação de aresta flangeada do desenho legado.',
    'Canto flangeado':'Uma borda dobrada encontra a borda reta da outra peça e recebe solda de canto flangeado. Preserve a indicação de canto flangeado do desenho legado.',
    Tampão:'Execute solda tampão: preencha um furo circular em uma das chapas para ligá-la à chapa sobreposta.',
    Ponto:'Una as chapas por regiões discretas de fusão na interface, formando solda a ponto, sem furo de tampão.',
    Costura:'Una as chapas por uma faixa contínua de fusão na interface, formando solda por costura.',
    Reverso:'Execute primeiro a solda principal em V. Depois, deposite uma solda de reverso no lado oposto à solda principal; o segundo passe não representa material de apoio em barra.',
    Revestimento:'Deposite uma camada de solda de revestimento sobre a face indicada da chapa.'
  };
  const paragraphs=[],opening=[];
  if(geometries[c.joint])opening.push(geometries[c.joint]);
  if(families[c.type])opening.push(families[c.type]);
  if(opening.length)paragraphs.push(opening.join(' '));
  const measures=[];
  if(present(c.size)&&c.type!=='Reverso'){
    const dimensions={
      Filete:'A perna do filete',
      'V flangeado':'O tamanho efetivo E da solda',
      'Bisel flangeado':'O tamanho efetivo E da solda',
      'Aresta flangeada':'A dimensão da solda de aresta',
      'Canto flangeado':'A dimensão da solda de aresta',
      Tampão:'O diâmetro do furo',Ponto:'O diâmetro da região fundida',Costura:'A largura da costura',Revestimento:'A espessura da camada adicionada'
    };
    measures.push(`${dimensions[c.type]||'A profundidade de preparação S'} é de ${number(c.size)} mm.`);
  }
  if(present(c.root))measures.push(`A abertura da raiz é de ${number(c.root)} mm.`);
  if(present(c.thickness))measures.push(`A espessura da chapa t é de ${number(c.thickness)} mm.`);
  if(present(c.face))measures.push(`A face da raiz f é de ${number(c.face)} mm; cote-a no detalhe da junta.`);
  if(present(c.effective))measures.push(`O tamanho efetivo E é de ${number(c.effective)} mm; use a notação S(E) = ${number(c.size)}(${number(c.effective)}) à esquerda do símbolo.`);
  if(present(c.angle))measures.push(`O ângulo incluído do chanfro é de ${number(c.angle)}°.`);
  if(c.type==='Ponto'||c.type==='Costura')measures.push('O símbolo fica centralizado na linha de referência, sem distinguir lado da seta e lado oposto neste exemplo.');
  else if(c.side==='ambos')measures.push('Execute a solda em ambos os lados da junta, em relação à seta de referência.');
  else if(c.side==='oposto')measures.push('A indicação da solda corresponde ao lado oposto ao apontado pela seta de referência.');
  else if(c.side==='seta')measures.push('A indicação da solda corresponde ao lado apontado pela seta de referência.');
  if(present(c.length)&&Number(c.length)>0){
    measures.push(present(c.pitch)&&Number(c.pitch)>0?`Distribua trechos de ${number(c.length)} mm de comprimento, com passo de ${number(c.pitch)} mm medido entre os centros.`:`Cada trecho de solda tem ${number(c.length)} mm de comprimento.`);
  }else if(c.length===0||c.length==='0'||c.continuous===true)measures.push('A solda é contínua na extensão indicada da junta.');
  if(present(c.count)&&Number(c.count)>0)measures.push(`A indicação solicita ${number(c.count)} ${c.type==='Ponto'?'pontos de solda':c.type==='Tampão'?'furos preenchidos':'elementos de solda'}.`);
  if(measures.length)paragraphs.push(measures.join(' '));
  if(typeof trainingStage==='function'&&trainingStage().tier<2&&configAllowed(c))return paragraphs.join('\n\n');
  const execution=[];
  if(c.contour)execution.push(`A face da solda deve ter contorno ${String(c.contour).toLowerCase()}.`);
  else if(c.contour==='')execution.push('Não há contorno de face especificado.');
  const finishes={G:'esmerilhamento',M:'usinagem',C:'cinzelamento',H:'martelamento',R:'laminação',U:'método não especificado'};
  if(c.finish)execution.push(finishes[c.finish]?`O acabamento deve ser obtido por ${finishes[c.finish]}.`:`O método de acabamento é identificado pela letra ${c.finish}.`);
  else if(c.finish==='')execution.push('Não há método de acabamento especificado.');
  if(typeof c.field==='boolean'&&!['Ponto','Costura'].includes(c.type))execution.push(c.field?'Execute a soldagem em campo, incluindo a bandeira na indicação.':'Execute a soldagem em oficina, sem bandeira de campo.');
  if(c.all===true)execution.push('A soldagem deve percorrer todo o contorno da junta.');
  else if(c.all===false&&c.type==='Filete')execution.push('Não há exigência de solda em todo o contorno.');
  if(c.backing)execution.push('Utilize material de apoio em barra na raiz, indicado pelo retângulo de backing.');
  if(c.backing)execution.push(c.removable?'O material de apoio deve ser retirado após soldar: inclua R dentro do retângulo de backing.':'O material de apoio é permanente; não indique R de remoção.');
  if(c.backing&&c.melt===false)execution.push('Não há indicação de melt-through neste detalhe.');
  if(c.melt)execution.push('A penetração deve produzir reforço de raiz visível no reverso, indicado por melt-through.');
  if(c.melt&&c.backing===false)execution.push('Não utilize material de apoio em barra neste detalhe.');
  if(c.process)execution.push(`O processo solicitado é ${processName(c.process)}; indique a sigla ${c.process} na cauda do símbolo.`);
  if(c.tail)execution.push(`Na cauda, faça referência a ${c.tail}, onde os detalhes da junta devem ser consultados.`);
  if(execution.length)paragraphs.push(execution.join(' '));
  return paragraphs.join('\n\n');
}

function drawingBrief(c){
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  return `<article class="drawing-brief" aria-label="Descrição do desenho"><span class="eyebrow">Leia e construa</span><h3>Descrição do desenho</h3><div class="drawing-description">${drawingDescription(c).split('\n\n').filter(Boolean).map(paragraph=>`<p>${escape(paragraph)}</p>`).join('')}</div><p class="drawing-brief-instruction">Use o texto para construir a peça e sua indicação. A referência aparece após conferir.</p></article>`;
}

function assemblyJointDrawing(joint){
  const metal=d=>`<path class="metal" d="${d}"/>`;
  const geometries={
    Topo:metal('M35 65 H203 V165 H35 Z M217 65 H385 V165 H217 Z'),
    T:metal('M40 160 H395 V184 H40 Z M199 40 H221 V160 H199 Z'),
    Canto:metal('M40 160 H264 V184 H40 Z M240 40 H264 V160 H240 Z'),
    Sobreposta:metal('M95 160 H395 V184 H95 Z M40 136 H260 V160 H40 Z'),
    Borda:metal('M150 60 H174 V179 H150 Z M180 60 H204 V179 H180 Z'),
    'Superfícies curvas':'<circle class="metal" cx="145" cy="115" r="70"/><circle class="metal" cx="285" cy="115" r="70"/>',
    'Curva/plano':'<circle class="metal" cx="160" cy="115" r="65"/>'+metal('M225 35 H252 V195 H225 Z'),
    'Superfície':metal('M45 120 H395 V157 H45 Z')
  };
  if(!Object.prototype.hasOwnProperty.call(geometries,joint))return '';
  const arrows={
    Topo:[240,65,345,22],T:[221,160,354,50],Canto:[230,148,350,78],Sobreposta:[260,160,354,50],Borda:[177,60,340,25],
    'Superfícies curvas':[217,77,355,34],'Curva/plano':[221,78,355,34],'Superfície':[260,120,355,34]
  };
  const [x,y,fromX,fromY]=arrows[joint];
  const arrow=`<g class="construction-reference">${line(`M${fromX} ${fromY} L${x} ${y} M${x} ${y} l17 -4 M${x} ${y} l5 -16`,'dim')}${txt(fromX-27,Math.max(14,fromY-10),'seta','note')}</g>`;
  return svg(`<g class="construction-pieces">${geometries[joint]}</g>${arrow}`,'Peças sem solda · junta '+joint,'0 0 440 235');
}

function constructionDrawing(c={}){
  const placeholder=message=>`<div class="construction-drawing" data-construction-state="empty"><div class="construction-placeholder"><strong>${message}</strong><p>A vista será construída com as suas escolhas.</p></div></div>`;
  if(!c.joint)return placeholder('Escolha a disposição das peças.');
  const neutral=assemblyJointDrawing(c.joint);
  if(!neutral)return placeholder('Escolha uma disposição de peças disponível.');
  const pieces=(message='',state='pieces')=>`<div class="construction-drawing" data-construction-state="${state}">${neutral}${message?`<p class="construction-message">${message}</p>`:''}</div>`;
  if(!c.type)return pieces('Escolha o tipo de solda para continuar.');
  const metadata=typeof specialWeldMetadata==='function'?specialWeldMetadata(c.type):null;
  const grooves=typeof grooveNames!=='undefined'?grooveNames:['Reto','V','X','Bisel','K','U','Duplo U','J','Duplo J'];
  const compatible=c.type==='Filete'?['T','Canto','Sobreposta'].includes(c.joint):grooves.includes(c.type)?c.joint==='Topo':!!metadata&&metadata.joint===c.joint;
  if(!compatible)return pieces('A combinação selecionada será conferida ao enviar.','incompatible');
  const selected={...c};
  if(!selected.side&&metadata&&metadata.sides.length===1)selected.side=metadata.sides[0];
  if(!selected.side)return pieces('Escolha o lado da solda em relação à seta de referência.','incomplete');
  if(c.type==='Filete'&&c.joint==='Canto'&&selected.side!=='seta')return pieces('A combinação selecionada será conferida ao enviar.','incompatible');
  if(metadata&&!metadata.sides.includes(selected.side))return pieces('A combinação selecionada será conferida ao enviar.','incompatible');
  let message='';
  ['size','root','angle','length','pitch','count'].forEach(key=>{if(selected[key]===undefined||selected[key]===null||selected[key]==='')delete selected[key];});
  if(selected.length===undefined){delete selected.pitch;delete selected.continuous;}
  else if(Number(selected.length)>0&&selected.pitch===undefined){
    delete selected.length;
    message='Complete o passo para representar a distribuição dos trechos.';
  }
  // Execution captions must not invent an unselected location or finish.
  delete selected.execution;
  const drawing=cut(selected);
  const detail=selected.type==='V'&&selected.face&&selected.root&&selected.angle?`<details class="construction-root-detail"><summary>Detalhe da raiz · face e espessura</summary>${rootDetail(selected)}</details>`:'';
  return `<div class="construction-drawing" data-construction-state="weld">${drawing}${detail}${message?`<p class="construction-message">${message}</p>`:''}</div>`;
}
