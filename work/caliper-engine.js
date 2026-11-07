(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CaliperEngine=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Integer ticks are the source of truth. Spans and mainStep use the unit
  // declared on each model; 150 mm and 6 in are separate training capacities.
  const RESOLUTIONS=Object.freeze([
    {id:'mm-01',label:'0,1 mm',unit:'mm',step:.1,mainStep:1,divisions:10,span:9,capacity:150,maxTicks:1500,digits:1,ticksPerUnit:10,note:'Nônio didático: 10 divisões ocupam 9 mm.'},
    {id:'mm-005',label:'0,05 mm',unit:'mm',step:.05,mainStep:1,divisions:20,span:39,capacity:150,maxTicks:3000,digits:2,ticksPerUnit:20},
    {id:'mm-002',label:'0,02 mm',unit:'mm',step:.02,mainStep:1,divisions:50,span:49,capacity:150,maxTicks:7500,digits:2,ticksPerUnit:50},
    {id:'mm-001',label:'0,01 mm',unit:'mm',step:.01,mainStep:1,divisions:0,span:0,capacity:150,maxTicks:15000,digits:2,ticksPerUnit:100,note:'Resolução oferecida nos modelos digital e com relógio; sem nônio analógico.'},
    {id:'in-128',label:'1/128 pol',unit:'in',step:1/128,mainStep:1/16,divisions:8,span:7/16,capacity:6,maxTicks:768,digits:7,ticksPerUnit:128},
    {id:'in-1000',label:'0,001 pol · 1/1000',unit:'in',step:.001,mainStep:.025,divisions:25,span:.6,capacity:6,maxTicks:6000,digits:3,ticksPerUnit:1000,note:'Modelo analógico: 25 divisões de 0,024 pol; principal de 0,025 pol.'}
  ].map(r=>{
    // Express every graduation in integer resolution steps. In a direct vernier,
    // one vernier interval is one (or two, on the expanded scale) main intervals
    // minus exactly one resolution step. Never derive the residual from floats.
    const mainTicks=r.mainStep*r.ticksPerUnit;
    const vernierPitchTicks=r.divisions?r.span*r.ticksPerUnit/r.divisions:null;
    const vernierMainMultiple=r.divisions?(vernierPitchTicks+1)/mainTicks:null;
    if(!Number.isSafeInteger(mainTicks)||r.divisions&&(!Number.isSafeInteger(vernierPitchTicks)||!Number.isSafeInteger(vernierMainMultiple)))throw new Error('Modelo de escala inconsistente: '+r.id);
    return Object.freeze({...r,mainTicks,vernierPitchTicks,vernierMainMultiple});
  }));
  const TYPES=Object.freeze([
    {id:'analog',name:'Paquímetro universal analógico',label:'Universal analógico',method:'vernier',resolutions:['mm-01','mm-005','mm-002','in-128','in-1000'],description:'Escala principal e nônio móvel. O modelo de 0,1 mm é didático.'},
    {id:'digital',name:'Paquímetro digital',label:'Digital',method:'digital',resolutions:['mm-001','in-1000'],description:'Leitura direta no visor, sem nônio. Modelos de 0,01 mm ou 0,001 pol.'},
    {id:'dial',name:'Paquímetro com relógio',label:'Com relógio comparador',method:'dial',resolutions:['mm-001','in-1000'],description:'Escala principal e ponteiro: 100 divisões por volta; 1 mm ou 0,1 pol por volta.'},
    {id:'depth',name:'Paquímetro de profundidade',label:'Profundidade',method:'vernier',resolutions:['mm-005','mm-002','in-1000'],description:'Modelo com base de apoio e haste de profundidade, com escala principal e nônio.'},
    {id:'height',name:'Medidor de altura com nônio',label:'Altura',method:'vernier',resolutions:['mm-002','in-1000'],description:'Modelo vertical com base de referência e nônio, em 0,02 mm ou 0,001 pol.'}
  ].map(type=>Object.freeze({...type,resolutions:Object.freeze(type.resolutions)})));
  const LEVELS=Object.freeze([
    {name:'Conhecendo o paquímetro',min:0},
    {name:'Leitura da escala principal',min:4},
    {name:'Leitura do nônio',min:10},
    {name:'Medidas com casas decimais',min:18},
    {name:'Leitura avançada',min:30},
    {name:'Desafio profissional',min:45}
  ].map((level,index)=>Object.freeze({...level,index,level:index+1})));
  function getResolution(key){const id=typeof key==='object'&&key?key.id:key;const found=RESOLUTIONS.find(r=>r.id===id);if(!found)throw new RangeError('Resolução de paquímetro desconhecida.');return found;}
  function getType(key){const id=typeof key==='object'&&key?key.id:key;const found=TYPES.find(type=>type.id===id);if(!found)throw new RangeError('Tipo de paquímetro desconhecido.');return found;}
  function supportedResolutions(type){return getType(type).resolutions.map(getResolution);}
  function finite(value,label){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError((label||'Valor')+' deve ser um número finito.');return value;}
  // A decimal is a ratio of integers. Number is only the legacy/display
  // projection; rounding, limits and answer equality never depend on it.
  function decimalRatio(text,allowExponent=false){
    const match=text.match(/^([+-]?)(\d*)(?:[.,](\d*))?(?:[eE]([+-]?\d+))?$/);
    if(!match||!(match[2]||match[3])||!allowExponent&&match[4]!==undefined)throw new TypeError('Decimal inválido.');
    const fraction=match[3]||'',scale=fraction.length-Number(match[4]||0);
    let numerator=BigInt((match[2]||'0')+fraction),denominator=1n;
    if(scale>0)denominator=10n**BigInt(scale);else if(scale<0)numerator*=10n**BigInt(-scale);
    if(match[1]==='-')numerator=-numerator;
    return {numerator,denominator};
  }
  function nearestTick(numerator,denominator,ticksPerUnit){
    return Number((2n*numerator*BigInt(ticksPerUnit)+denominator)/(2n*denominator));
  }
  function clampTicks(ticks,key){const r=getResolution(key);return Math.max(0,Math.min(r.maxTicks,Math.round(finite(ticks,'Ticks'))));}
  function quantize(value,key){
    const r=getResolution(key),measure=finite(value,'Medida');
    if(measure<=0)return 0;if(measure>=r.capacity)return r.maxTicks;
    const ratio=decimalRatio(String(measure),true);
    return nearestTick(ratio.numerator,ratio.denominator,r.ticksPerUnit);
  }
  function valueOf(ticks,key){const r=getResolution(key);return clampTicks(ticks,r)/r.ticksPerUnit;}
  const gcd=(a,b)=>{while(b){const rest=a%b;a=b;b=rest;}return a||1n;};
  function formatGraduation(ticks,key){
    const r=getResolution(key),n=ticks;
    if(!Number.isSafeInteger(n)||n<0)throw new RangeError('Graduação inválida.');
    const integer=BigInt(n);
    if(r.id==='in-128'){
      const whole=integer/128n,rest=integer%128n;if(!rest)return String(whole);
      const divisor=gcd(rest,128n);return (whole?whole+' ':'')+rest/divisor+'/'+128n/divisor;
    }
    const factor=10n**BigInt(r.digits),scaled=integer*factor/BigInt(r.ticksPerUnit);
    return String(scaled/factor)+(r.digits?','+String(scaled%factor).padStart(r.digits,'0'):'');
  }
  function format(ticks,key){const r=getResolution(key);return formatGraduation(clampTicks(ticks,r),r);}
  function parseAnswer(input,key){
    const r=getResolution(key),invalid=error=>({valid:false,value:null,ticks:null,onGrid:false,normalized:'',error});
    if(typeof input!=='string'||!input.trim())return invalid('Digite a medida antes de confirmar.');
    const text=input.trim();if(text.length>128)return invalid('A medida contém dígitos demais.');
    let numerator,denominator,match;
    if(text.includes('/')){
      if(r.id!=='in-128')return invalid('Neste modelo, use uma medida decimal com vírgula ou ponto.');
      if((match=text.match(/^([+-]?)(\d+)[ \t]+(\d+)[ \t]*\/[ \t]*(\d+)$/))){
        const whole=BigInt(match[2]),n=BigInt(match[3]),d=BigInt(match[4]);
        if(!d)return invalid('O denominador não pode ser zero.');
        if(n>=d)return invalid('Na fração mista, a parte fracionária deve ser menor que uma unidade.');
        numerator=(whole*d+n)*(match[1]==='-'?-1n:1n);denominator=d;
      }else if((match=text.match(/^([+-]?)(\d+)[ \t]*\/[ \t]*(\d+)$/))){
        const n=BigInt(match[2]),d=BigInt(match[3]);if(!d)return invalid('O denominador não pode ser zero.');
        numerator=n*(match[1]==='-'?-1n:1n);denominator=d;
      }else return invalid('Use uma fração como 3/8 ou uma fração mista como 1 1/4.');
    }else{
      if(!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text))return invalid('Use somente a medida, com vírgula ou ponto, sem unidade nem notação científica.');
      const ratio=decimalRatio(text);numerator=ratio.numerator;denominator=ratio.denominator;
    }
    if(numerator<0n||numerator>BigInt(r.capacity)*denominator)return invalid('Informe uma medida entre 0 e '+String(r.capacity).replace('.',',')+' '+(r.unit==='in'?'pol':'mm')+'.');
    const value=Number(numerator)/Number(denominator);
    const ticks=nearestTick(numerator,denominator,r.ticksPerUnit),onGrid=numerator*BigInt(r.ticksPerUnit)%denominator===0n;
    // Keep off-grid source digits. Number(value) could otherwise turn an exact
    // near-miss such as 33.150000000000000001 into the correct-looking 33.15.
    const normalized=onGrid?format(ticks,r):text.replace('.',',').replace(/[ \t]*\/[ \t]*/g,'/').replace(/[ \t]+/g,' ');
    return {valid:true,value,ticks,onGrid,normalized};
  }
  function explain(ticks,key,type){
    const r=getResolution(key),model=type?getType(type):TYPES.find(item=>item.resolutions.includes(r.id));
    if(!model.resolutions.includes(r.id))throw new RangeError('Esta resolução não está disponível neste modelo de instrumento.');
    const n=clampTicks(ticks,r),total=n/r.ticksPerUnit,unit=r.unit==='in'?'pol':'mm';
    if(model.method==='digital')return {method:'digital',main:total,vernierIndex:null,dialIndex:null,contribution:0,total,mainStep:r.step,divisions:0,steps:['Confira a unidade selecionada no visor ('+unit+').','Leia diretamente '+format(n,r)+' '+unit+' no visor digital. Este modelo não utiliza nônio.']};
    const divisions=model.method==='dial'?100:r.divisions;
    const mainTicks=model.method==='dial'?100:r.mainTicks;
    const index=n%mainTicks,main=(n-index)/r.ticksPerUnit,contribution=index/r.ticksPerUnit;
    const mainText=r.unit==='mm'?String(main):formatGraduation(n-index,r);
    const contributionText=formatGraduation(index,r);
    const resolutionText=formatGraduation(1,r);
    const steps=['Escala principal: '+mainText+' '+unit+'.',model.method==='dial'?'Ponteiro do relógio: divisão '+index+' × '+resolutionText+' '+unit+' = '+contributionText+' '+unit+'.':'Nônio: traço '+index+' × '+resolutionText+' '+unit+' = '+contributionText+' '+unit+'.'];
    if(model.method==='vernier'&&r.id==='mm-005')steps.push('No nônio expandido, cada número marca dois traços (0,10 mm). Conte cada intervalo de 0,05 mm, inclusive os traços sem número.');
    steps.push('Resultado: '+mainText+' + '+contributionText+' = '+format(n,r)+' '+unit+'.');
    return {method:model.method,main,vernierIndex:model.method==='vernier'?index:null,dialIndex:model.method==='dial'?index:null,contribution,total,mainStep:mainTicks/r.ticksPerUnit,divisions,span:model.method==='vernier'?r.span:undefined,steps};
  }
  function grade(ticks,key,input,type){
    const r=getResolution(key),expectedTicks=clampTicks(ticks,r),parsed=parseAnswer(input,r),expected=format(expectedTicks,r);
    const explanation=explain(expectedTicks,r,type).steps.join(' ');
    if(!parsed.valid)return {valid:false,correct:false,normalized:'',expected,error:parsed.error,explanation};
    const correct=parsed.onGrid&&parsed.ticks===expectedTicks;
    return {valid:true,correct,normalized:parsed.normalized,expected,explanation,...(!parsed.onGrid?{error:'A resposta precisa coincidir com uma divisão de '+r.label+'.'}:{})};
  }
  function getLevel(correct=0){const count=Number.isFinite(Number(correct))?Math.max(0,Math.floor(Number(correct))):0;let index=0;while(index+1<LEVELS.length&&count>=LEVELS[index+1].min)index++;const current=LEVELS[index],next=LEVELS[index+1]?.min??null;return {...current,correct:count,next,remaining:next===null?0:next-count,progress:next===null?100:100*(count-current.min)/(next-current.min)};}
  function nextMeasure({resolutionKey='mm-005',difficulty='medium',questionIndex=0,level=1}={},rng=Math.random){
    const r=getResolution(resolutionKey);if(!['easy','medium','hard'].includes(difficulty))throw new RangeError('Dificuldade desconhecida.');
    if(typeof rng!=='function')throw new TypeError('rng deve ser uma função.');const sample=rng();if(!Number.isFinite(sample)||sample<0||sample>=1)throw new RangeError('rng deve retornar um número de zero (inclusive) a um (exclusive).');
    const requestedLevel=typeof level==='object'&&level?level.level:level;
    const stage=Math.max(1,Math.min(6,Math.floor(Number(requestedLevel)||1)));
    const bounds=r.unit==='mm'?[20,40,65,90,120,150]:[1,2,3,4,5,6];
    const max=Math.min(r.maxTicks,Math.floor(bounds[stage-1]*r.ticksPerUnit));
    const stride=difficulty==='easy'?r.ticksPerUnit:difficulty==='medium'&&stage<=2?Math.max(1,Math.round(r.ticksPerUnit/(stage===1?2:4))):1;
    const count=Math.max(1,Math.floor(max/stride));
    const index=Number.isFinite(Number(questionIndex))?Math.max(0,Math.floor(Number(questionIndex))):0;
    return clampTicks(((Math.floor(sample*count)+index%count)%count+1)*stride,r);
  }
  return Object.freeze({RESOLUTIONS,TYPES,LEVELS,getResolution,getType,supportedResolutions,quantize,clampTicks,valueOf,format,formatGraduation,parseAnswer,grade,explain,nextMeasure,getLevel});
});
