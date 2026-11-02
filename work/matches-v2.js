function executionDrawing(c){
  let content=cut(c);
  if(c.showMeta){const extras=[c.field?'Soldagem em campo':'Soldagem em oficina',c.all?'Todo o contorno':'Junta indicada',c.finish?'Acabamento: '+c.finish:'Sem método de acabamento indicado'];
    if(c.removable)extras.push('Apoio removido após soldar');
    content+=`<div class="drawing-note">${extras.join(' · ')}</div>`;
  }
  return content;
}
function pairCase(id,tier,c,alternatives,explain){
  const views=[c,...alternatives];
  bank.push({id:'visual-'+id,tier,kind:'pair',config:c,views,answer:'0',options:['0','1','2','3'],explain});
}
for(const size of [3,4,5,6,8,10]){
  pairCase('perna-'+size,0,{type:'Filete',side:'seta',size},[{type:'Filete',side:'seta',size:size+2},{type:'Filete',side:'oposto',size},{type:'V',size}],`O triângulo abaixo da linha indica filete no lado da seta. A dimensão ${size} à esquerda é a perna em milímetros.`);
}
for(const side of ['seta','oposto','ambos'])for(const size of [4,6,8]){
  const c={type:'Filete',joint:'T',side,size};
  pairCase('lado-'+side+'-'+size,0,c,[{...c,side:side==='seta'?'oposto':'seta'},{...c,side:side==='ambos'?'oposto':'ambos'},{type:'V',side:'seta',size}],`Observe a posição do triângulo: abaixo = seta; acima = oposto; nos dois lados = ambos. Neste caso, a perna é ${size} mm.`);
}
for(const contour of ['Plano','Convexo','Côncavo'])for(const length of [30,40,60]){
  const c={type:'Filete',size:6,side:'seta',contour,length,pitch:100};
  pairCase('contorno-'+contour+'-'+length,1,c,[{...c,contour:contour==='Plano'?'Convexo':'Plano'},{...c,length:length+20},{...c,pitch:0}],`O traço suplementar pede contorno ${contour.toLowerCase()}. À direita, ${length}–100 indica trechos de ${length} mm com passo de 100 mm, medido entre centros.`);
}
for(const length of [20,30,40,50,60]){
  const c={type:'Filete',side:'ambos',size:6,length,pitch:length+60};
  pairCase('intermitente-'+length,1,c,[{...c,pitch:0},{...c,side:'seta'},{...c,length:length+10}],`Há filetes nos dois lados da linha. Cada trecho mede ${length} mm; o passo entre centros é ${length+60} mm.`);
}
for(const type of grooveNames){
  const doubled=['X','K','Duplo U','Duplo J'].includes(type),side=doubled?'ambos':'seta';
  const c={type,side,size:8};
  const other=grooveNames.filter(x=>x!==type);
  pairCase('chanfro-'+type,1,c,[{...c,type:other[0]},{...c,type:other[1]},{type:'Filete',side:'seta',size:8}],`Compare as faces preparadas no corte: esta indicação representa ${type.toLowerCase()}. A posição da linha de referência também faz parte da leitura.`);
}
for(const type of ['V','Bisel','U','J'])for(const supp of ['backing','melt']){
  const c={type,side:'seta',size:8,[supp]:true};
  pairCase(supp+'-'+type,2,c,[{type,side:'seta',size:8,[supp==='backing'?'melt':'backing']:true},{type,side:'seta',size:8},{type:'Filete',side:'seta',size:8}],supp==='backing'?'O retângulo no lado oposto indica material de apoio na raiz. Compare a barra sob a junta com as alternativas.':'O semicírculo preenchido no lado oposto pede melt-through. O corte correspondente mostra reforço de raiz visível no reverso.');
}
for(const [field,all] of [[true,false],[false,true],[true,true]]){
  const c={type:'Filete',size:6,side:'seta',field,all,showMeta:true};
  pairCase('complemento-'+field+'-'+all,1,c,[{...c,field:!field},{...c,all:!all},{...c,field:!field,all:!all}],`${field?'A bandeira determina soldagem em campo.':'Não há bandeira de solda em campo.'} ${all?'O círculo pede todo o contorno.':'Não há indicação de todo o contorno.'}`);
}
add('apoio-removivel',2,'O R dentro do símbolo de backing exige o quê?',()=>symbol({type:'V',backing:true,removable:true}),'Remover o apoio após soldar',['Remover o apoio após soldar','Manter o apoio permanente','Raiz sem abertura','Acabamento por laminação'],'O R dentro do retângulo de backing indica que o material de apoio deve ser removido após a soldagem.');
add('apoio-reverso',2,'Qual elemento é indicado pelo semicírculo aberto no lado oposto?',()=>symbol({type:'V',backWeld:true}),'Solda de apoio ou reverso',['Solda de apoio ou reverso','Melt-through','Backing em barra','Todo o contorno'],'O semicírculo aberto representa solda de apoio ou de reverso. A sequência e as notas do desenho distinguem as duas aplicações.');
add('cauda',1,'Onde aparece a referência ao detalhe B neste símbolo?',()=>symbol({type:'V',tail:'DET. B'}),'Na cauda',['Na cauda','Na raiz do símbolo','Na dimensão da perna','No símbolo de contorno'],'A cauda abriga referências e informações complementares. Aqui ela remete ao detalhe B do desenho.');
for(const size of [4,5,8,10])add('garganta-'+size,2,'Qual é a garganta teórica aproximada deste filete de pernas iguais?',()=>filletDetail({size}),String((size*.707).toFixed(2)).replace('.',',')+' mm',[String((size*.707).toFixed(2)).replace('.',',')+' mm',size+' mm',(size*2)+' mm',(size/2)+' mm'],`Para este encontro a 90°, garganta teórica = ${size} × 0,707 ≈ ${(size*.707).toFixed(2).replace('.',',')} mm.`);
function chooseBank(){
  const difficulty=Math.min(2,Math.floor((state.master[mode]||0)/4));
  const visualTurn=serial%4!==0;
  let pool=bank.filter(x=>x.tier<=difficulty&&x.id!==lastId&&(!visualTurn||x.kind==='pair'||x.kind==='cut'));
  const unused=pool.filter(x=>!state.seen[mode+'-'+x.id]);
  const b=pick(unused.length?unused:pool);lastId=b.id;return b;
}
function match(){
  const b=retry?.bank||chooseBank(),inverse=serial%2===0;
  q={bank:b,explain:b.explain};
  if(b.kind==='pair'){
    q.image=true;q.correctVisual=inverse?symbol(b.config):executionDrawing(b.config);
    shell(inverse?'Qual símbolo corresponde a esta execução?':'Qual execução corresponde ao símbolo?',inverse?executionDrawing(b.config):symbol(b.config));
    options(shuffle(b.options),b.answer,key=>inverse?symbol(b.views[+key]):executionDrawing(b.views[+key]));
  }else if(b.kind==='cut'){
    q.image=true;q.correctVisual=inverse?symbol({type:b.answer}):cut({type:b.answer});
    shell(inverse?'Qual símbolo corresponde a esta solda?':b.prompt,inverse?cut({type:b.answer}):b.visual());
    options(shuffle(b.options),b.answer,x=>inverse?symbol({type:x}):cut({type:x}));
  }else{
    q.image=false;q.correctVisual=b.visual();shell(b.prompt,b.visual());
    const distractors=shuffle(b.options.filter(x=>x!==b.answer)).slice(0,3);
    options(shuffle([b.answer,...distractors]),b.answer);
  }
}
