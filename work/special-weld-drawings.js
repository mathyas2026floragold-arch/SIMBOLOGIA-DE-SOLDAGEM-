function specialWeldCut(c={}){
  const supported=['V flangeado','Bisel flangeado','Aresta flangeada','Canto flangeado','Tampão','Ponto','Costura','Reverso','Revestimento'];
  if(!supported.includes(c.type))return null;
  const shape=(d,cls='metal')=>`<path class="${cls}" d="${d}"/>`;
  const arrow=(x,y,fromX=355,fromY=34)=>line(`M${fromX} ${fromY} L${x} ${y} M${x} ${y} l17 -4 M${x} ${y} l5 -16`,'dim')+txt(fromX-24,fromY-10,'seta','note');
  const mirror=content=>`<g transform="translate(0 230) scale(1 -1)">${content}</g>`;
  const dimensionNames={'V flangeado':'E','Bisel flangeado':'E','Aresta flangeada':'dimensão','Canto flangeado':'dimensão',Tampão:'Ø do furo',Ponto:'Ø da região fundida',Costura:'largura',Reverso:'dimensão',Revestimento:'espessura adicionada'};
  let s='',height=270,label='Corte esquemático da união e do metal de adição';
  if(c.type==='V flangeado'){
    const base='<circle class="metal" cx="145" cy="115" r="70"/><circle class="metal" cx="285" cy="115" r="70"/>';
    const weld=shape('M194 65 H236 Q215 80 215 115 Q215 80 194 65 Z','weld');
    s+=txt(28,22,'CORTE TRANSVERSAL','note')+base+(c.side==='oposto'?mirror(weld):weld)+(c.side==='ambos'?mirror(weld):'')+arrow(217,77);
    label='Duas seções arredondadas adjacentes, com metal de adição preenchendo o encontro das superfícies convexas';
  }else if(c.type==='Bisel flangeado'){
    const base='<circle class="metal" cx="160" cy="115" r="65"/>'+shape('M225 35 H252 V195 H225 Z');
    const weld=shape('M202 65 H225 V115 Q225 85 202 65 Z','weld');
    s+=txt(28,22,'CORTE TRANSVERSAL','note')+base+(c.side==='oposto'?mirror(weld):weld)+(c.side==='ambos'?mirror(weld):'')+arrow(221,78);
    label='Uma seção arredondada junto à face plana de uma chapa, com metal de adição no encontro';
  }else if(c.type==='Aresta flangeada'||c.type==='Canto flangeado'){
    const left=shape('M40 162 H159 Q193 162 193 128 V60 H205 V128 Q205 174 159 174 H40 Z');
    const right=c.type==='Aresta flangeada'?shape('M390 162 H271 Q237 162 237 128 V60 H225 V128 Q225 174 271 174 H390 Z'):shape('M225 60 H237 V184 H225 Z');
    const weld=shape('M193 60 Q215 39 237 60 L225 69 H205 Z','weld');
    const content=left+right+weld;
    s+=txt(28,22,'CORTE TRANSVERSAL','note')+(c.side==='oposto'?mirror(content):content)+arrow(216,63);
    label=c.type==='Aresta flangeada'?'Duas bordas de chapas dobradas para a mesma direção e unidas nas extremidades':'Uma borda dobrada e uma borda reta de chapas adjacentes, unidas nas extremidades';
  }else if(c.type==='Tampão'){
    let section=shape('M45 116 H395 V148 H45 Z')+shape('M45 84 H198 L207 116 H45 Z M242 84 H395 V116 H233 Z')+shape('M198 84 H242 L233 116 Q220 127 207 116 Z','weld');
    s+=txt(28,22,'CORTE PELO CENTRO','note')+(c.side==='oposto'?mirror(section):section)+arrow(221,88);
    s+=txt(28,208,'VISTA DA CHAPA COM FUROS','note')+shape('M60 220 H380 V294 H60 Z');
    const count=Math.max(1,Math.min(5,Math.round(+c.count||3)));
    for(let i=0;i<count;i++)s+=`<circle class="weld" cx="${count===1?220:95+i*250/(count-1)}" cy="257" r="16"/>`;
    height=340;label='Chapas sobrepostas com furo na chapa '+(c.side==='oposto'?'oposta à seta':'do lado da seta')+', preenchido por metal de adição; detalhe e vista da chapa com furos';
  }else if(c.type==='Ponto'){
    let section=shape('M45 85 H395 V115 H45 Z M45 115 H395 V145 H45 Z')+'<ellipse class="weld" cx="220" cy="115" rx="24" ry="14"/>';
    s+=txt(28,22,'CORTE PELO CENTRO','note')+section+arrow(220,108);
    s+=txt(28,208,'VISTA SUPERIOR · FUSÃO INTERNA','note')+shape('M60 220 H380 V294 H60 Z');
    const count=Math.max(1,Math.min(5,Math.round(+c.count||3)));
    for(let i=0;i<count;i++)s+=`<circle cx="${count===1?220:95+i*250/(count-1)}" cy="257" r="13" fill="var(--weld)" fill-opacity=".58" stroke="var(--blue)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    height=340;label='Duas chapas sobrepostas, sem furo, unidas por regiões circulares discretas de fusão na interface';
  }else if(c.type==='Costura'){
    let section=shape('M45 85 H395 V115 H45 Z M45 115 H395 V145 H45 Z')+'<ellipse class="weld" cx="220" cy="115" rx="24" ry="14"/>';
    s+=txt(28,22,'CORTE TRANSVERSAL','note')+section+arrow(220,108);
    s+=txt(28,208,'VISTA SUPERIOR · FUSÃO INTERNA','note')+shape('M60 220 H380 V294 H60 Z');
    s+=`<path d="M85 247 H355 V267 H85 Z" fill="var(--weld)" fill-opacity=".65" stroke="var(--blue)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    if(c.length)s+=txt(260,315,'L = '+c.length+' mm');
    height=340;label='Duas chapas sobrepostas unidas por uma faixa contínua de fusão ao longo da junta, com vista superior';
  }else if(c.type==='Reverso'){
    const plates=shape('M40 65 H169 L205 146 V165 H40 Z M390 65 H261 L225 146 V165 H390 Z');
    const main=shape('M169 65 H261 L225 146 V165 H205 V146 Z','weld');
    const back=shape('M193 165 Q215 191 237 165 Q215 156 193 165 Z','weld');
    const content=plates+main+back;
    s+=txt(28,22,'CORTE · PASSES INDICADOS POR 1 E 2','note')+content+txt(206,98,'1')+txt(245,190,'2')+arrow(218,77,355,40)+txt(28,239,'2 · reverso após a solda principal (1)','note');
    label='Junta em chanfro com solda principal e um passe adicional no lado oposto da raiz, sem barra de apoio';
  }else if(c.type==='Revestimento'){
    s+=txt(28,22,'CORTE TRANSVERSAL','note')+shape('M45 120 H395 V157 H45 Z');
    s+=shape('M45 120 V105 Q65 91 85 105 Q105 91 125 105 Q145 91 165 105 Q185 91 205 105 Q225 91 245 105 Q265 91 285 105 Q305 91 325 105 Q345 91 365 105 Q380 95 395 105 V120 Z','weld')+arrow(260,106);
    s+=txt(28,208,'VISTA SUPERIOR','note')+shape('M60 220 H380 V294 H60 Z');
    for(let y=230;y<290;y+=15)s+=shape(`M70 ${y} Q85 ${y-3} 100 ${y} H370 V${y+11} H70 Z`,'weld');
    height=340;label='Uma única chapa com camada de metal adicionado sobre sua superfície, sem ligação entre duas peças';
  }
  if(c.type!=='Reverso'&&c.size!==undefined&&c.size!=='')s+=txt(28,height-13,(c.designation||dimensionNames[c.type])+' = '+c.size+' mm');
  if(c.type!=='Reverso'&&c.size!==undefined&&c.size!=='')label+='; '+(c.designation||dimensionNames[c.type])+' '+c.size+' milímetros';
  const result=svg(s,label,`0 0 440 ${height}`);
  return result+(c.execution?`<div class="drawing-note">${c.field?'Em campo':'Em oficina'} · ${c.finish?'Método '+c.finish:'Sem método indicado'}</div>`:'');
}
