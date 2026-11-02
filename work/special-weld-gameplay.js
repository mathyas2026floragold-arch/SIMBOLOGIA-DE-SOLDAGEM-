const specialWeldDefaults={
  'V flangeado':{dimensionLabel:'Tamanho efetivo E',definition:'União entre duas superfícies curvas convexas.',joint:'Superfícies curvas',sideRule:'selectable',sizes:[3,4,5,6],asset:'Guia de transferência · GT-214',part:'Ligação entre perfis conformados'},
  'Bisel flangeado':{dimensionLabel:'Tamanho efetivo E',definition:'União entre uma superfície curva convexa e uma superfície plana.',joint:'Curva/plano',sideRule:'selectable',sizes:[3,4,5,6],asset:'Transportador de peças · TP-202',part:'Fixação de perfil conformado à chapa-base'},
  'Aresta flangeada':{dimensionLabel:'Tamanho da solda de aresta',definition:'União de duas bordas flangeadas, representada por símbolo de desenho legado.',joint:'Borda',sideRule:'seta',sizes:[2,3,4],legacy:true,asset:'Calha de transferência · CT-118',part:'União das bordas de fechamento'},
  'Canto flangeado':{dimensionLabel:'Tamanho da solda de aresta',definition:'União de uma borda flangeada com outra peça, representada por símbolo de desenho legado.',joint:'Canto',sideRule:'seta',sizes:[2,3,4],legacy:true,asset:'Caixa de proteção · CP-106',part:'União do fechamento lateral'},
  'Tampão':{dimensionLabel:'Diâmetro do furo',definition:'Preenchimento de um furo para unir duas peças sobrepostas.',joint:'Sobreposta',sideRule:'selectable',sizes:[6,8,10],asset:'Suporte de guia · SG-306',part:'Ligação da chapa de reposição'},
  'Ponto':{dimensionLabel:'Diâmetro do ponto',definition:'Ligação localizada por um ponto de solda, sem furo de tampão.',joint:'Sobreposta',sideRule:'neutro',sizes:[4,6,8],asset:'Painel de fechamento · PF-302',part:'Ligação das chapas de fechamento'},
  'Costura':{dimensionLabel:'Largura da costura',definition:'Ligação por uma faixa de solda, distinta de pontos isolados.',joint:'Sobreposta',sideRule:'neutro',sizes:[3,4,5],asset:'Calha de alimentação · CA-410',part:'Ligação longitudinal das chapas'},
  'Reverso':{dimensionLabel:'',definition:'Solda realizada no reverso após a solda principal; não é material de apoio.',joint:'Topo',sideRule:'oposto',sizes:[],asset:'Mesa de transferência · MT-206',part:'Recomposição da chapa de ligação'},
  'Revestimento':{dimensionLabel:'Espessura da camada',definition:'Deposição de uma camada de solda sobre uma superfície, sem unir duas peças.',joint:'Superfície',sideRule:'seta',sizes:[2,3,4],asset:'Mesa de apoio · MA-311',part:'Superfície de contato da chapa'}
};
let specialOrderCount=0;
function isSpecialWeld(c){return !!c&&Object.prototype.hasOwnProperty.call(specialWeldDefaults,c.type);}
function specialWeldMetadata(type){
  const base=specialWeldDefaults[type];
  if(!base)return null;
  const info=typeof addedWeldInfo!=='undefined'?addedWeldInfo[type]||{}:{};
  // Study-library wording must not replace the rules supported by the game drawings.
  return {...base,...info,sideRule:base.sideRule,joint:base.joint,sizes:[...base.sizes],
    sides:base.sideRule==='selectable'?['seta','oposto']:[base.sideRule],
    supportsField:base.sideRule!=='neutro'};
}
function specialWeldTypes(){return Object.keys(specialWeldDefaults);}
function chooseSpecialWeld(){return !retry&&Math.random()<.34;}
function specialConfig(type=pick(specialWeldTypes())){
  const m=specialWeldMetadata(type);
  const tier=typeof difficultyFor==='function'?difficultyFor():0;
  const fieldControls=m.supportsField&&tier>=2;
  const c={special:true,type,joint:m.joint,side:pick(m.sides),field:fieldControls&&Math.random()<.3,fieldControls,all:false,finish:'',contour:''};
  if(m.sizes.length)c.size=pick(m.sizes);
  return c;
}
function specialRetryConfig(c){
  const copy={...c},sizes=specialWeldMetadata(c.type).sizes;
  if(sizes.length>1)copy.size=pick(sizes.filter(n=>n!==c.size));
  return copy;
}
function specialOrder(c){
  if(c.specialOrder)return c.specialOrder;
  const m=specialWeldMetadata(c.type),number=String(++specialOrderCount).padStart(4,'0');
  const task=m.legacy?'Interpretar o desenho de manutenção legado e identificar a indicação original da ligação no detalhe A. A análise deve considerar a geometria representada, sem substituir o símbolo por outro de aparência semelhante.':c.type==='Revestimento'?'Interpretar a indicação referente à superfície de contato da chapa no detalhe A e registrar os requisitos de deposição representados.':c.type==='Reverso'?'Interpretar a indicação da ligação de reposição no detalhe A, incluindo a sequência indicada no lado oposto da junta.':'Recompor a ligação do componente de reposição conforme a geometria e a indicação de soldagem do detalhe A do desenho de manutenção.';
  c.specialOrder={id:'OS-ESP-'+number,drawing:'DM-ESP-'+number,revision:m.legacy?'Legado · rev. 01':'02',asset:m.asset,part:m.part,task};
  return c.specialOrder;
}
function specialOrderPanel(c,activity){
  const order=specialOrder(c);
  return `<article class="work-order" aria-label="Ordem de serviço de manutenção simulada"><div class="os-head"><div><span class="eyebrow">Manutenção mecânica · OS simulada</span><h3>${order.id} · ${order.part}</h3></div><span class="os-status">${activity}</span></div><dl class="os-data"><div><dt>Equipamento / TAG</dt><dd>${order.asset}</dd></div><div><dt>Documento de referência</dt><dd>${order.drawing} · ${order.revision} · detalhe A</dd></div><div><dt>Área analisada</dt><dd>Ligação indicada no desenho</dd></div></dl><div class="os-description"><h4>Descrição do serviço solicitado</h4><p>${order.task}</p></div></article>`;
}
function specialTypeDistractors(type,limited=true){
  const close={
    'V flangeado':['Bisel flangeado','V','U'],
    'Bisel flangeado':['V flangeado','Bisel','J'],
    'Aresta flangeada':['Canto flangeado','V flangeado','Revestimento'],
    'Canto flangeado':['Aresta flangeada','Bisel flangeado','Filete'],
    'Tampão':['Ponto','Costura','Filete'],
    'Ponto':['Costura','Tampão','Filete'],
    'Costura':['Ponto','Tampão','Revestimento'],
    'Reverso':['Tampão','Revestimento','Filete'],
    'Revestimento':['Reverso','Filete','Costura']
  };
  if(!limited)return close[type];
  const available=availableWeldTypes();
  return [...new Set([...close[type],...available].filter(t=>t!==type&&available.includes(t)))].slice(0,3);
}
function specialSizeOptions(c){
  const sizes=specialWeldMetadata(c.type).sizes;
  return [...new Set([c.size,...sizes,...[2,3,4,5,6,8,10]])].slice(0,4).map(n=>n+' mm');
}
function specialDetective(input){
  if(!detect||!detect.special){
    const c=input||specialConfig(),m=specialWeldMetadata(c.type);
    const meaningOptions=[m.definition,...shuffle(specialWeldTypes().filter(t=>t!==c.type&&availableWeldTypes().includes(t))).slice(0,3).map(t=>specialWeldMetadata(t).definition)];
    const jointChoices=[...new Set([m.joint,...shuffle(availableJointTypes().filter(j=>j!==m.joint)).slice(0,3)])];
    const steps=[
      ['Qual geometria de ligação aparece no detalhe A?',m.joint,jointChoices,c.type==='Revestimento'?'O desenho mostra uma superfície recebendo metal de adição, sem união de duas peças.':`A geometria do detalhe corresponde a ${m.joint.toLowerCase()}; identifique a junta antes de interpretar o símbolo.`],
      ['Qual tipo de solda a indicação representa?',c.type,[c.type,...specialTypeDistractors(c.type)],m.definition],
      ['Qual interpretação corresponde ao símbolo?',m.definition,meaningOptions,'Observe o formato do símbolo e a geometria da ligação no corte.']
    ];
    if(c.size!==undefined)steps.push([`Qual é a dimensão indicada: ${m.dimensionLabel.toLowerCase()}?`,c.size+' mm',specialSizeOptions(c),`A dimensão indicada é ${c.size} mm; neste caso, ela representa ${m.dimensionLabel.toLowerCase()}.`]);
    if(m.sideRule==='neutro')steps.push(['O símbolo centralizado na linha informa qual lado?', 'Sem significado de lado neste exemplo',['Sem significado de lado neste exemplo','Somente o lado da seta','Somente o lado oposto','Ambos os lados'], 'Neste exemplo, o símbolo está centralizado e não distingue lado da seta e lado oposto.']);
    else steps.push(['Qual é o lado indicado pela posição do símbolo?',c.side,['seta','oposto','ambos','Sem significado de lado'],c.side==='oposto'?'O símbolo acima da linha de referência indica o lado oposto ao da seta.':'O símbolo abaixo da linha de referência indica o lado da seta.']);
    if(c.type==='Reverso')steps.push(['Qual sequência o desenho indica?', 'Reverso após a solda principal',['Reverso após a solda principal','Apoio em barra antes da solda','Apenas reforço de raiz por melt-through','Somente revestimento superficial'],'O semicírculo aberto representa a solda de reverso; a referência à segunda operação define sua sequência.']);
    if(m.supportsField&&c.fieldControls!==false)steps.push(['Onde a soldagem deve ser executada?',c.field?'Em campo':'Em oficina',['Em campo','Em oficina','Em ambos, obrigatoriamente','Local não relacionado à bandeira'],c.field?'A bandeira no encontro da seta com a linha de referência solicita soldagem em campo.':'Nesta OS, a ausência da bandeira corresponde à execução em oficina.']);
    detect={special:true,c,index:0,steps};
  }
  const {c,index,steps}=detect,[prompt,answer,choices,explain]=steps[index];
  q={detect:true,special:true,explain:explain+` Resposta: ${answer}.`,correctVisual:symbol(c)};
  shell(prompt,`${specialOrderPanel(c,'Leitura do desenho anexo')}<div class="split"><div><h3>Detalhe A · geometria</h3>${cut(c)}</div><div><h3>Indicação de projeto</h3>${symbol(c)}</div></div><small>Investigação ${index+1}/${steps.length} · ${specialOrder(c).drawing}</small>`);
  options(shuffle(choices),answer);
}
function specialBuilder(input){
  const c=input||(isSpecialWeld(retry?.config)?{...retry.config}:specialConfig());
  const preview=typeof previewActive!=='undefined'&&previewActive;
  const stage=typeof trainingStage==='function'?trainingStage():{tier:difficultyFor(),sides:['seta','oposto','ambos']};
  const tier=preview?5:stage.tier,m=specialWeldMetadata(c.type);
  const typeChoices=[...new Set([...(preview?allWeldFamilies:typeof availableWeldTypes==='function'?availableWeldTypes():['Filete',...grooveNames,...specialWeldTypes()]),c.type])];
  const jointChoices=[...new Set([...(preview?builderJointChoices:typeof availableJointTypes==='function'?availableJointTypes():builderJointChoices),c.joint])];
  const fieldControls=m.supportsField&&(c.field===true||tier>=2&&c.fieldControls!==false);
  const sideControls=m.sideRule==='selectable'&&(tier>=1||c.side&&c.side!=='seta')||m.sideRule!=='selectable'&&c.side&&c.side!==m.sides[0];
  const keys=['joint','type',...(c.size!==undefined?['size']:[]),...(sideControls?['side']:[]),...(fieldControls?['field']:[]),
    ...(c.length||c.pitch?['length']:[]),...(c.length||c.pitch?['pitch']:[]),...(c.contour?['contour']:[]),...(c.finish?['finish']:[]),
    ...(c.all?['all']:[]),...(c.root?['root']:[]),...(c.angle?['angle']:[]),...(c.count?['count']:[]),...(c.backing||c.melt?['backing','melt']:[]),'process',...(c.tail?['tail']:[])];
  const sizes=[...new Set([...(m.sizes||[]),3,4,5,6,8,10])].sort((a,b)=>a-b);
  const commonValues=typeof fields!=='undefined'?fields:{};
  const values={...commonValues,joint:jointChoices,type:typeChoices,size:[...new Set([...sizes.map(String),...(c.size!==undefined?[String(c.size)]:[])])],
    side:[...new Set([...m.sides,...(c.side?[c.side]:[])])],field:['false','true'],all:['false','true'],backing:['false','true'],melt:['false','true'],process:processChoices(c.type),tail:['Sem referência','DET. A','DET. B','DET. C']};
  for(const key of ['length','pitch','root','angle','count'])if(keys.includes(key))values[key]=[...new Set([...(commonValues[key]||[]),String(c[key]||0)])];
  if(keys.includes('contour'))values.contour=[...new Set([...(commonValues.contour||['Sem contorno','Plano','Convexo','Côncavo']),c.contour])];
  if(keys.includes('finish'))values.finish=[...new Set([...(commonValues.finish||['Sem método','G','M']),c.finish])];
  const fieldLabels={...(typeof labels!=='undefined'?labels:{}),joint:'Disposição das peças',type:'Símbolo básico',size:m.dimensionLabel+' (mm)',side:'Posição na linha de referência',field:'Local de execução',count:'Quantidade de soldas',process:'Processo de soldagem · cauda',tail:'Referência na cauda'};
  const sideText={seta:'Abaixo · lado da seta',oposto:'Acima · lado oposto',ambos:'Acima e abaixo · ambos',neutro:'Centralizado · sem distinção de lado'};
  const show=(key,value)=>key==='process'?processLabel(value):key==='joint'?builderJointLabel(value):key==='side'?sideText[value]:key==='field'?(value==='true'?'Em campo · com bandeira':'Em oficina · sem bandeira'):['all','backing','melt'].includes(key)?(value==='true'?'Sim':'Não'):value==='0'&&key==='length'?'Contínua':value==='0'&&key==='pitch'?'Sem passo':value;
  q={special:true,config:c,builder:true,correctVisual:constructionResult(c),explain:''};
  const order=specialOrder(c);
  shell('Leia a descrição e construa o desenho.',`${drawingBrief(c)}<details class="builder-order"><summary>${order.id} · ${order.asset} · consultar OS completa</summary>${specialOrderPanel(c,'Construção pela descrição')}</details>`);
  const mounted=r=>{
    const chosen=specialWeldMetadata(r.type),result={type:r.type,joint:r.joint};
    if(r.side)result.side=r.side;else if(chosen?.sides.length===1)result.side=chosen.sides[0];
    else if(!keys.includes('side'))result.side='seta';
    for(const [key,value] of Object.entries(r)){
      if(value===''||['joint','type','side'].includes(key))continue;
      result[key]=['field','all','backing','melt'].includes(key)?value==='true':['size','length','pitch','root','angle','count'].includes(key)?Number(value):['Sem método','Sem contorno','Sem referência','Sem processo indicado'].includes(value)?'':value;
    }
    if(!keys.includes('length'))result.length=0;
    return result;
  };
  const expected=key=>key==='process'?(c.process||'Sem processo indicado'):key==='finish'?(c.finish||'Sem método'):key==='contour'?(c.contour||'Sem contorno'):['length','pitch'].includes(key)?String(c[key]||0):String(c[key]);
  renderSymbolBuilder({special:true,config:c,keys,values,labels:fieldLabels,format:show,expected,toConfig:mounted,preview:constructionPreview,reviewVisual:constructionResult});
}
function specialInspector(input){
  const c=input||(isSpecialWeld(retry?.config)?specialRetryConfig(retry.config):specialConfig());
  const m=specialWeldMetadata(c.type);
  const eligible=['Tipo de solda errado',...(c.size!==undefined?['Dimensão errada']:[]),...(m.sideRule==='selectable'?['Lado errado']:[]),...(m.supportsField&&c.fieldControls!==false?['Local de execução errado']:[])];
  const error=retry?.error&&eligible.includes(retry.error)?retry.error:pick(['Conforme',...eligible]);
  const exec={...c,execution:true};
  if(error==='Tipo de solda errado')exec.type=pick(specialTypeDistractors(c.type));
  if(error==='Dimensão errada')exec.size=pick(specialWeldMetadata(c.type).sizes.filter(s=>s!==c.size));
  if(error==='Lado errado')exec.side=c.side==='seta'?'oposto':'seta';
  if(error==='Local de execução errado')exec.field=!c.field;
  const explanations={
    'Conforme':'A geometria, o lado, as dimensões e o local de execução correspondem à indicação de soldagem apresentada na OS.',
    'Tipo de solda errado':'A execução representa outro tipo de solda; compare o símbolo e a geometria correta abaixo.',
    'Dimensão errada':`O tipo de solda corresponde ao desenho, mas a dimensão executada difere dos ${c.size} mm especificados.`,
    'Lado errado':`A execução está no lado ${c.side==='seta'?'oposto ao da seta, mas a OS solicita o lado da seta':'da seta, mas a OS solicita o lado oposto'}. Compare a posição do metal de adição em relação à seta.`,
    'Local de execução errado':c.field?'A bandeira solicita soldagem em campo; a execução foi identificada como realizada em oficina.':'A OS prevê soldagem em oficina, sem bandeira; a execução foi identificada como realizada em campo.'
  };
  q={special:true,config:c,error,phase:0,correctVisual:cut({...c,execution:true}),explain:explanations[error]};
  shell('O serviço executado corresponde à indicação da OS?',`${specialOrderPanel(c,'Conferência da execução')}<div class="split"><div><h3>Desenho de referência</h3>${symbol(c)}</div><div><h3>Execução</h3>${cut(exec)}</div></div>`);
  $('#work').innerHTML='<div class="pills"><button type="button" id="special-approve">✓ Conforme</button><button type="button" id="special-reject">✕ Há divergência</button></div>';
  $('#special-approve').onclick=()=>grade('Conforme',null,[],error);
  $('#special-reject').onclick=()=>{
    if(error==='Conforme'){grade('divergência',null,[],error);return;}
    q.phase=1;$('#work').innerHTML='<h3>Qual é a divergência exata?</h3><div class="pills" id="special-faults"></div>';
    shuffle(eligible).forEach(value=>{const button=document.createElement('button');button.type='button';button.textContent=value;button.onclick=()=>grade(value,button,[],error);$('#special-faults').append(button);});
  };
}
