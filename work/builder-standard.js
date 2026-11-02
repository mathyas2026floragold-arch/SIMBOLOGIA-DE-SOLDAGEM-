function builder() {
  if(isSpecialWeld(retry?.config))return specialBuilder();
  const generated=retry?.config?{...retry.config}:technicalBuilderConfig();
  if(isSpecialWeld(generated))return specialBuilder(generated);
  if(previewActive&&maxPreviewFirst)maxPreviewFirst=false;
  const preview=typeof previewActive!=='undefined'&&previewActive;
  const stage=typeof trainingStage==='function'?trainingStage():{tier:difficultyFor(),sides:['seta','oposto','ambos']};
  const tier=preview?5:stage.tier;
  const c=generated;
  const fillet=c.type==='Filete';
  const doubled=['X','K','Duplo U','Duplo J'].includes(c.type);
  const keys=['joint','type',...(tier>=1||(c.side&&c.side!=='seta')?['side']:[]),'size',
    ...(tier>=2||c.length||c.pitch?['length']:[]),...(c.length||c.pitch?['pitch']:[]),
    ...(c.contour||tier>=2?['contour']:[]),...(c.finish||tier>=3?['finish']:[]),
    ...(c.field||tier>=2?['field']:[]),...(c.all||fillet&&tier>=4?['all']:[]),
    ...(!fillet&&c.root?['root']:[]),...(!fillet&&c.face?['face']:[]),...(!fillet&&c.angle?['angle']:[]),
    ...(c.effective?['effective']:[]),...(c.thickness?['thickness']:[]),
    ...(c.backing||c.melt||!fillet&&!doubled&&tier>=4?['backing','melt']:[]),...(c.backing?['removable']:[]),'process','tail'];
  const typeChoices=[...new Set([...(preview?allWeldFamilies:typeof availableWeldTypes==='function'?availableWeldTypes():fields.type),c.type])];
  const jointChoices=[...new Set([...(preview?builderJointChoices:typeof availableJointTypes==='function'?availableJointTypes():builderJointChoices),c.joint])];
  const values={...fields,type:typeChoices,joint:jointChoices,
    side:[...new Set([...(preview?['seta','oposto','ambos']:stage.sides||['seta']),c.side].filter(Boolean))],
    size:[...new Set([...(tier===0?['4','6']:fields.size),String(c.size)])],face:['1','2','3'],effective:['6','8','10','12'],thickness:['8','10','12','16','18','20'],removable:['Não','Sim'],process:processChoices(c.type),tail:['Sem referência','DET. A','DET. B','DET. C']};
  for(const key of ['length','pitch','root','angle','face','effective','thickness'])if(keys.includes(key))values[key]=[...new Set([...(values[key]||[]),String(c[key]||0)])];
  const expected=k=>k==='process'?(c.process||'Sem processo indicado'):k==='tail'?(c.tail||'Sem referência'):k==='finish'?(c.finish||'Sem método'):k==='contour'?(c.contour||'Sem contorno'):['field','all','backing','melt','removable'].includes(k)?(c[k]?'Sim':'Não'):String(c[k]||0);
  const format=(k,v)=>k==='process'?processLabel(v):k==='joint'?builderJointLabel(v):k==='side'?sideLabels[v]:v==='0'&&k==='length'?'Contínua':v==='0'&&k==='pitch'?'Sem passo':k==='finish'&&v==='G'?'G · Esmerilhamento':k==='finish'&&v==='M'?'M · Usinagem':v;
  const fieldLabels={...labels,joint:'Disposição das peças',size:fillet?'Perna do filete (mm)':'Profundidade de preparação S (mm)',face:'Face da raiz f (mm) · detalhe',effective:'Tamanho efetivo E (mm)',thickness:'Espessura da chapa t (mm) · detalhe',removable:'Retirar material de apoio · R',process:'Processo de soldagem · cauda',tail:'Referência na cauda'};
  const toConfig=r=>{
    const result={};
    for(const [k,v] of Object.entries(r)){
      if(v==='')continue;
      result[k]=['field','all','backing','melt','removable'].includes(k)?v==='Sim':['size','length','pitch','root','angle','face','effective','thickness'].includes(k)?Number(v):['Sem método','Sem contorno','Sem referência','Sem processo indicado'].includes(v)?'':v;
    }
    if(!keys.includes('side'))result.side='seta';
    if(!keys.includes('length'))result.length=0;
    return result;
  };
  q={config:c,builder:true,explain:'',correctVisual:constructionResult(c)};
  const order=serviceOrder(c);
  shell('Leia a descrição e construa o desenho.',`${drawingBrief(c)}<details class="builder-order"><summary>${order.id} · ${order.asset} · consultar OS completa</summary>${serviceOrderPanel(c,'Construção pela descrição')}</details>`);
  renderSymbolBuilder({special:false,config:c,keys,values,labels:fieldLabels,format,expected,toConfig,preview:constructionPreview,reviewVisual:constructionResult});
}
