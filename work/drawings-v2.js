function symbol(c={}) {
  const type=c.type||'Filete',side=c.side||'seta',doubled=['X','K','Duplo U','Duplo J'].includes(type);
  let s=line('M42 192 L104 130 H375 M42 192 l5 -18 M42 192 l18 -5');
  if(['Bisel','J','K','Duplo J'].includes(type))s=line('M42 192 L72 162 H85 L104 130 H375 M42 192 l5 -18 M42 192 l18 -5');
  let signs=side==='ambos'?[1,-1]:[side==='oposto'?-1:1];
  if(doubled){s+=`<g transform="translate(217 130)">${glyph(type)}</g>`;signs=[1,-1];}
  for(const sign of signs){
    if(!doubled)s+=`<g transform="translate(217 130) scale(1 ${sign})">${glyph(type)}</g>`;
    if(c.size)s+=txt(154,sign>0?156:115,c.size);
    if(c.length)s+=txt(274,sign>0?156:115,`${c.length}${c.pitch?'–'+c.pitch:''}`);
    if(c.contour){let cy=130+sign*55;
      s+=line(c.contour==='Plano'?`M215 ${cy} h38`:c.contour==='Convexo'?`M215 ${cy} Q234 ${cy+sign*15} 253 ${cy}`:`M215 ${cy+sign*8} Q234 ${cy-sign*8} 253 ${cy+sign*8}`);
      if(c.finish)s+=txt(226,cy+sign*25,c.finish);
    }
  }
  if(c.all)s+='<circle cx="104" cy="130" r="9" class="wire"/>';
  if(c.field)s+=line('M104 130 V63 L132 75 L104 86');
  let suppSign=side==='oposto'?1:-1;
  if(c.backing)s+=`<g transform="translate(217 130) scale(1 ${suppSign})"><rect width="34" height="15" class="wire"/>${c.removable?txt(11,12,'R'):''}</g>`;
  if(c.melt)s+=`<g transform="translate(217 130) scale(1 ${suppSign})"><path d="M0 0 A17 17 0 0 0 34 0 Z" fill="currentColor"/></g>`;
  if(c.backWeld)s+=`<g transform="translate(217 130) scale(1 ${suppSign})">${line('M0 0 A17 17 0 0 0 34 0')}</g>`;
  const sign=side==='oposto'?-1:1;
  if(c.root!==undefined&&c.root!=='')s+=txt(229,sign>0?153:115,c.root);
  if(c.angle)s+=txt(220,sign>0?225:43,c.angle+'°');
  if(c.tail)s+=line('M375 130 l30 -18 M375 130 l30 18')+txt(335,87,c.tail);
  return svg(s,'Símbolo de soldagem','0 0 440 260');
}
function cut(c={}) {
  const type=c.type||'Filete',j=c.joint||(type==='Filete'?'T':'Topo');
  let s='',metal='',weld='',opposite='';
  const contour=(x,y,size,dir=1)=>{
    const a=[x,y-size*dir],b=[x+size,y];
    const face=c.contour==='Convexo'?`Q${x+size*.95} ${y-size*.95*dir} ${b.join(' ')}`:c.contour==='Côncavo'?`Q${x+size*.1} ${y-size*.1*dir} ${b.join(' ')}`:`L${b.join(' ')}`;
    return `<path class="weld" d="M${a.join(' ')} ${face} H${x} Z"/>`;
  };
  if(type==='Filete'){
    let x=214,y=160;
    if(j==='Sobreposta'){x=260;metal='<path class="metal" d="M95 160 H385 V184 H95 Z M35 136 H260 V160 H35 Z"/>';opposite='<path class="weld" d="M95 160 H71 L95 184 Z"/>';}
    else if(j==='Canto'){x=184;metal='<path class="metal" d="M160 160 H385 V184 H160 Z M160 35 H184 V160 H160 Z"/>';}
    else{metal='<path class="metal" d="M35 160 H385 V184 H35 Z M190 35 H214 V160 H190 Z"/>';}
    weld=contour(x,y,38);
    if(!opposite)opposite=`<g transform="translate(${x+190} 0) scale(-1 1)">${weld}</g>`;
    s+=metal;
    if(c.side==='opposto'||c.side==='oposto')s+=opposite;else{s+=weld;if(c.side==='ambos')s+=opposite;}
    s+=line(`M345 75 L${x+18} 144 M${x+18} 144 l18 -6 M${x+18} 144 l5 -18`,'dim')+txt(321,61,'seta','note');
    if(c.size)s+=txt(260,207,'perna '+c.size+' mm');
  }else{
    let left='M35 65 H165 L203 140 V165 H35 Z',right='M385 65 H255 L217 140 V165 H385 Z',w='M165 65 H255 L217 140 V165 H203 V140 Z';
    if(type==='Reto'){left='M35 65 H203 V165 H35 Z';right='M217 65 H385 V165 H217 Z';w='M203 65 H217 V165 H203 Z';}
    if(['Bisel','J','K','Duplo J'].includes(type)){left='M35 65 H203 V165 H35 Z';w='M203 65 H255 L217 140 V165 H203 Z';}
    if(['U','J'].includes(type)){right='M385 65 H255 V102 Q255 140 217 140 V165 H385 Z';if(type==='J')w='M203 65 H255 V102 Q255 140 217 140 V165 H203 Z';else{left='M35 65 H165 V102 Q165 140 203 140 V165 H35 Z';w='M165 65 H255 V102 Q255 140 217 140 V165 H203 V140 Q165 140 165 102 Z';}}
    if(type==='X'||type==='K'){left=type==='K'?'M35 65 H203 V165 H35 Z':'M35 65 H165 L203 115 L165 165 H35 Z';right='M385 65 H255 L217 115 L255 165 H385 Z';w=type==='K'?'M203 65 H255 L217 115 L255 165 H203 Z':'M165 65 H255 L217 115 L255 165 H165 L203 115 Z';}
    if(type==='Duplo U'||type==='Duplo J'){left=type==='Duplo J'?'M35 65 H203 V165 H35 Z':'M35 65 H165 Q165 115 203 115 Q165 115 165 165 H35 Z';right='M385 65 H255 Q255 115 217 115 Q255 115 255 165 H385 Z';w=type==='Duplo J'?'M203 65 H255 Q255 115 217 115 Q255 115 255 165 H203 Z':'M165 65 H255 Q255 115 217 115 Q255 115 255 165 H165 Q165 115 203 115 Q165 115 165 65 Z';}
    let content=`<path class="metal" d="${left}"/><path class="metal" d="${right}"/><path class="weld" d="${w}"/>`;
    if(c.backing)content+='<rect x="170" y="167" width="80" height="14" class="metal"/>';
    if(c.melt)content+='<path class="weld" d="M203 165 Q210 188 217 165 Z"/>';
    if(c.side==='oposto')s+=`<g transform="translate(0 230) scale(1 -1)">${content}</g>`;else s+=content;
    s+=line('M345 22 L240 55 M240 55 l18 -2 M240 55 l8 -16','dim')+txt(326,17,'seta','note');
    if(c.size)s+=txt(35,204,'S = '+c.size+' mm');
    if(c.root!==undefined&&c.root!=='')s+=txt(170,204,'r = '+c.root+' mm');
    if(c.angle)s+=txt(300,204,c.angle+'°');
  }
  if(j==='Borda')s='<path class="metal" d="M160 80 H185 V185 H160 Z M190 80 H215 V185 H190 Z"/><path class="weld" d="M160 80 Q187 50 215 80 Z"/>';
  let height=235;
  if(c.length||c.pitch||c.continuous){
    s+=txt(35,243,'VISTA LONGITUDINAL','note');
    const length=+c.length||40,pitch=+c.pitch||0,scale=pitch?Math.min(2.5,300/(pitch*3.6)):1;
    if(pitch){for(let x=55;x+length*scale<=390;x+=pitch*scale)s+=`<rect class="weld" x="${x}" y="255" width="${length*scale}" height="9"/>`;}
    else s+='<rect class="weld" x="55" y="255" width="320" height="9"/>';
    s+=txt(55,287,pitch?`L = ${length} mm · passo = ${pitch} mm`:'Solda contínua');height=305;
  }
  return svg(s,'Corte da junta e solda executada',`0 0 440 ${height}`);
}
function rootDetail(c={}){
  const r=c.root??3,f=c.face??2,angle=c.angle??60;
  return svg('<path class="metal" d="M30 45 H140 L201 135 V165 H30 Z M410 45 H300 L239 135 V165 H410 Z"/>'+line('M201 176 H239 M201 128 V184 M239 128 V184','dim')+txt(194,205,'r = '+r+' mm')+line('M255 135 H275 M255 165 H275 M270 135 V165','dim')+txt(280,155,'f = '+f+' mm')+line('M150 48 Q220 105 290 48','dim')+txt(202,40,angle+'°')+txt(28,235,'Preparação da junta · cotas em mm · sem escala','note'),'Detalhe cotado da preparação de raiz','0 0 440 250');
}
function filletDetail(c={}){
  const size=c.size||6;
  return svg('<path class="metal" d="M45 160 H370 V185 H45 Z M160 30 H185 V160 H160 Z"/><path class="weld" d="M185 80 L265 160 H185 Z"/>'+line('M185 160 L225 120 M185 80 H280 M265 160 V65 M278 80 V160','dim')+txt(285,128,'z = '+size)+txt(192,135,'a')+txt(45,215,'Filete de pernas iguais · encontro a 90°','note'),'Corte cotado de um filete');
}
