function jointWeldCut(c={}){
  const type=c.type||'Filete',joint=c.joint,side=c.side||'seta';
  const fillet=type==='Filete'&&['T','Canto','Sobreposta'].includes(joint);
  const edge=type==='Aresta'&&joint==='Borda';
  if(!fillet&&!edge)return null;
  if((joint==='Canto'||edge)&&side!=='seta')return null;
  if(!['seta','oposto','ambos'].includes(side))return null;
  const metal=d=>`<path class="metal" d="${d}"/>`;
  const weld=d=>`<path class="weld" d="${d}"/>`;
  function filletAt(x,y,size,xDirection=1,yDirection=1){
    const face=c.contour==='Convexo'?`Q${size*.95} ${-size*.95} ${size} 0`:c.contour==='Côncavo'?`Q${size*.1} ${-size*.1} ${size} 0`:`L${size} 0`;
    return `<g transform="translate(${x} ${y}) scale(${xDirection} ${yDirection})">${weld(`M0 ${-size} ${face} H0 Z`)}</g>`;
  }
  function referenceArrow(x,y,fromX=354,fromY=50){
    return line(`M${fromX} ${fromY} L${x} ${y} M${x} ${y} l18 -5 M${x} ${y} l6 -18`,'dim')+txt(fromX-25,fromY-12,'seta','note');
  }
  let s=txt(28,24,'CORTE TRANSVERSAL','note'),height=235;
  if(joint==='T'){
    s+=metal('M40 160 H395 V184 H40 Z M199 40 H221 V160 H199 Z');
    if(side==='seta'||side==='ambos')s+=filletAt(221,160,35);
    if(side==='oposto'||side==='ambos')s+=filletAt(199,160,35,-1,1);
    s+=referenceArrow(221,160);
  }else if(joint==='Sobreposta'){
    s+=metal('M95 160 H395 V184 H95 Z M40 136 H260 V160 H40 Z');
    if(side==='seta'||side==='ambos')s+=filletAt(260,160,23);
    if(side==='oposto'||side==='ambos')s+=filletAt(95,160,23,-1,-1);
    s+=referenceArrow(260,160);
  }else if(joint==='Canto'){
    s+=metal('M40 160 H264 V184 H40 Z M240 40 H264 V160 H240 Z');
    s+=filletAt(240,160,35,-1,1)+referenceArrow(230,148,350,78);
  }else if(edge){
    s+=metal('M110 90 H390 V114 H110 Z M110 119 H390 V143 H110 Z');
    const face=c.contour==='Plano'?'M101 90 V143 H117 V90 Z':c.contour==='Côncavo'?'M101 90 Q119 116.5 101 143 H117 V90 Z':'M110 90 Q84 116.5 110 143 H117 V90 Z';
    s+=weld(face)+line('M43 55 L106 116 M106 116 l-3 -18 M106 116 l-18 -7','dim')+txt(28,44,'seta','note');
  }
  if(c.size!==undefined&&c.size!=='')s+=txt(28,210,(edge?'dimensão = ':'perna = ')+c.size+' mm');
  if(c.length||c.pitch||c.continuous||c.length===0){
    s+=txt(28,242,'VISTA LONGITUDINAL','note');
    const length=+c.length||40,pitch=+c.pitch||0;
    if(pitch){
      const scale=Math.min(2.5,300/(pitch*3.6));
      for(let x=55;x+length*scale<=390;x+=pitch*scale)s+=`<rect class="weld" x="${x}" y="255" width="${length*scale}" height="9"/>`;
      s+=txt(55,287,`L = ${length} mm · passo = ${pitch} mm`);
    }else{s+='<rect class="weld" x="55" y="255" width="320" height="9"/>';s+=txt(55,287,'Solda contínua');}
    height=305;
  }
  const descriptions={
    T:'Chapas em T, com indicação fixa da seta no encontro do lado direito e metal de adição no lado solicitado',
    Sobreposta:'Chapas sobrepostas com referência fixa da seta na borda superior direita; o lado oposto corresponde à borda inferior esquerda',
    Canto:'Chapas formando canto em L na extremidade, com filete no ângulo interno indicado pela seta; a chapa vertical não nasce no meio da base',
    Borda:'Duas chapas paralelas com extremidades alinhadas, unidas por metal de adição sobre a aresta comum'
  };
  return svg(s,descriptions[joint],`0 0 440 ${height}`)+(c.execution?`<div class="drawing-note">${c.field?'Em campo':'Em oficina'} · ${c.all?'Todo contorno executado':'Extensão da junta indicada'} · ${c.finish?'Método '+c.finish:'Sem método indicado'}</div>`:'');
}
