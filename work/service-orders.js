let serviceOrderCount=0;
const maintenanceServices={
  T:[
    {asset:'Transportador de correia · TC-204',location:'Conjunto de acionamento',part:'Enrijecedor do suporte do redutor',task:'Substituir o enrijecedor do suporte do redutor e restabelecer sua ligação à chapa-base. A geometria da ligação e os requisitos de soldagem estão definidos no detalhe indicado.'},
    {asset:'Conjunto motobomba · MB-112',location:'Base do acionamento',part:'Nervura de fixação do suporte',task:'Instalar a nervura de reposição na base do suporte do acionamento. Interpretar a indicação de soldagem do desenho de manutenção antes de preencher os requisitos da intervenção.'},
    {asset:'Mesa de transferência · MT-308',location:'Estrutura de apoio',part:'Suporte de guia lateral',task:'Substituir o suporte da guia lateral e recompor sua ligação à base existente. Considerar somente a junta identificada pela seta no detalhe do desenho.'}
  ],
  Canto:[
    {asset:'Transportador de roletes · TR-207',location:'Conjunto da guia lateral',part:'Cantoneira de apoio da guia',task:'Recompor a ligação entre as chapas da cantoneira de apoio substituída. A configuração da junta e a indicação de soldagem devem ser interpretadas a partir do detalhe anexo.'},
    {asset:'Mesa de montagem · MM-105',location:'Suporte auxiliar',part:'Esquadro de posicionamento',task:'Montar o esquadro de reposição no suporte auxiliar. Identificar no desenho os requisitos aplicáveis à união das chapas antes de registrar a indicação simbólica.'}
  ],
  Sobreposta:[
    {asset:'Transportador de peças · TP-306',location:'Guia de transferência',part:'Chapa de reforço do suporte',task:'Instalar a chapa de reforço sobre o suporte existente, mantendo a disposição de montagem representada. Interpretar a indicação de soldagem referente à borda indicada pela seta.'},
    {asset:'Mesa de alimentação · MA-118',location:'Suporte da guia',part:'Chapa de ligação de reposição',task:'Recompor a ligação da chapa de reposição ao suporte da guia. O desenho anexo define a região de união e os requisitos de distribuição da solda.'}
  ],
  Topo:[
    {asset:'Transportador de roletes · TR-309',location:'Suporte da guia de entrada',part:'Segmento de chapa do suporte',task:'Substituir o segmento de chapa do suporte e recompor sua união à peça remanescente. Interpretar a preparação das bordas e os demais elementos da indicação de soldagem do detalhe anexo.'},
    {asset:'Mesa de transferência · MT-208',location:'Conjunto de apoio da guia',part:'Extensão do suporte',task:'Unir a extensão de reposição à chapa do suporte existente. A preparação da junta, as dimensões e os complementos exigidos são os representados no desenho de manutenção.'}
  ]
};
function serviceOrder(c){
  if(c.serviceOrder)return c.serviceOrder;
  const service=pick(maintenanceServices[c.joint]||maintenanceServices.Topo);
  const number=String(++serviceOrderCount).padStart(4,'0');
  c.serviceOrder={...service,id:'OS-MEC-'+number,drawing:'DM-'+number,revision:'02',detail:'A'};
  return c.serviceOrder;
}
function serviceOrderPanel(c,activity){
  const order=serviceOrder(c);
  return `<article class="work-order" aria-label="Ordem de serviço de manutenção simulada"><div class="os-head"><div><span class="eyebrow">Manutenção mecânica · OS simulada</span><h3>${order.id} · ${order.part}</h3></div><span class="os-status">${activity}</span></div><dl class="os-data"><div><dt>Equipamento / TAG</dt><dd>${order.asset}</dd></div><div><dt>Local da intervenção</dt><dd>${order.location}</dd></div><div><dt>Documento de referência</dt><dd>${order.drawing} · rev. ${order.revision} · detalhe ${order.detail}</dd></div></dl><div class="os-description"><h4>Descrição do serviço solicitado</h4><p>${order.task}</p></div></article>`;
}
function serviceRequirements(c){
  const fillet=c.type==='Filete';
  const joint={T:'em T',Canto:'de canto',Sobreposta:'sobreposta',Topo:'de topo'}[c.joint]||c.joint;
  const rows=[
    `Junta ${joint}; ${fillet?'solda de filete':'solda em chanfro '+c.type}; ${fillet?'perna':'profundidade de preparação S'} = ${c.size} mm; ${c.side==='ambos'?'ambos os lados':c.side==='seta'?'lado da seta':'lado oposto à seta'}.`,
    c.length?`Solda intermitente: comprimento de cada trecho L = ${c.length} mm; passo entre centros P = ${c.pitch} mm.`:'Solda contínua em toda a extensão da junta indicada.',
    `${c.contour?'Contorno '+c.contour.toLowerCase():'Contorno não especificado'}; ${c.finish?'acabamento por '+(c.finish==='G'?'esmerilhamento (G)':'usinagem (M)'):'método de acabamento não especificado'}.`
  ];
  const details=[];
  if(c.root)details.push('abertura da raiz r = '+c.root+' mm');
  if(c.angle)details.push('ângulo '+(c.type==='Bisel'||c.type==='K'?'de bisel':'incluído do chanfro')+' = '+c.angle+'°');
  if(c.backing)details.push('material de apoio na raiz (backing)');
  if(c.melt)details.push('melt-through com reforço visível no reverso');
  if(c.field)details.push('soldagem em campo');
  if(c.all)details.push('soldagem em todo o contorno');
  if(details.length)rows.push(details.join('; ')+'.');
  return `<section class="os-specs" aria-label="Requisitos de soldagem da ordem de serviço"><h3>Requisitos técnicos · detalhe ${serviceOrder(c).detail}</h3><ul>${rows.map(x=>`<li>${x}</li>`).join('')}</ul><p class="os-instruction">Sua tarefa: converter os requisitos da OS em uma indicação de soldagem completa.</p></section>`;
}
