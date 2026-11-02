const weldingProcesses=[
  {code:'GTAW',name:'TIG · arco com eletrodo de tungstênio e proteção gasosa'},
  {code:'GMAW',name:'MIG/MAG · arco com arame e proteção gasosa'},
  {code:'SMAW',name:'Eletrodo revestido'},
  {code:'FCAW',name:'Arame tubular'},
  {code:'SAW',name:'Arco submerso'},
  {code:'PAW',name:'Arco plasma'},
  {code:'RSW',name:'Soldagem a ponto por resistência'},
  {code:'RSEW',name:'Soldagem por costura por resistência'}
];
function processName(code){return weldingProcesses.find(p=>p.code===code)?.name||code;}
function supportedProcesses(type){
  if(type==='Ponto')return ['RSW'];
  if(type==='Costura')return ['RSEW'];
  if(['Tampão','Aresta flangeada','Canto flangeado'].includes(type))return ['GTAW','GMAW','SMAW','FCAW'];
  return ['GTAW','GMAW','SMAW','FCAW','SAW','PAW'];
}
function processChoices(type){return ['Sem processo indicado',...supportedProcesses(type)];}
function processLabel(code){return code==='Sem processo indicado'?code:code+' · '+processName(code);}
// The fork is the tail of the welding symbol, not another basic weld glyph.
function weldingTail(c){
  if(!c.process&&!c.tail)return '';
  let result=line('M375 130 H400 M400 130 l26 -18 M400 130 l26 18');
  const process=c.process||'',reference=c.tail||'';
  if(process)result+=`<text class="tail-process" x="435" y="${reference?125:135}">${process}</text>`;
  if(reference)result+=`<text class="tail-reference" x="435" y="${process?148:135}">${reference}</text>`;
  return `<g class="welding-tail" aria-label="Cauda com processo e referência">${result}</g>`;
}
