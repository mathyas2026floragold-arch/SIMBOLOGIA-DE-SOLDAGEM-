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
    {id:'mm-001',label:'0,01 mm',unit:'mm',step:.01,mainStep:1,divisions:100,span:99,capacity:150,maxTicks:15000,digits:2,ticksPerUnit:100,note:'Resolução oferecida nos modelos digital e com relógio.'},
    {id:'in-128',label:'1/128 pol',unit:'in',step:1/128,mainStep:1/16,divisions:8,span:7/16,capacity:6,maxTicks:768,digits:7,ticksPerUnit:128},
    {id:'in-1000',label:'0,001 pol · 1/1000',unit:'in',step:.001,mainStep:.025,divisions:25,span:.6,capacity:6,maxTicks:6000,digits:3,ticksPerUnit:1000,note:'Modelo analógico: 25 divisões de 0,024 pol; principal de 0,025 pol.'}
  ].map(Object.freeze));
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
  function clampTicks(ticks,key){const r=getResolution(key);return Math.max(0,Math.min(r.maxTicks,Math.round(finite(ticks,'Ticks'))));}
  function quantize(value,key){const r=getResolution(key);return clampTicks(Math.round(finite(value,'Medida')*r.ticksPerUnit),r);}
  function valueOf(ticks,key){const r=getResolution(key);return clampTicks(ticks,r)/r.ticksPerUnit;}
  const gcd=(a,b)=>{while(b){const rest=a%b;a=b;b=rest;}return a||1;};
  function format(ticks,key){
    const r=getResolution(key),n=clampTicks(ticks,r);
    if(r.id==='in-128'){
      const whole=Math.floor(n/128),rest=n%128;if(!rest)return String(whole);
      const divisor=gcd(rest,128);return (whole?whole+' ':'')+rest/divisor+'/'+128/divisor;
    }
    return (n/r.ticksPerUnit).toFixed(r.digits).replace('.',',');
  }
  function parseAnswer(input,key){
    const r=getResolution(key),invalid=error=>({valid:false,value:null,ticks:null,onGrid:false,normalized:'',error});
    if(typeof input!=='string'||!input.trim())return invalid('Digite a medida antes de confirmar.');
    const text=input.trim();if(text.length>128)return invalid('A medida contém dígitos demais.');
    let value,match;
    if(text.includes('/')){
      if(r.id!=='in-128')return invalid('Neste modelo, use uma medida decimal com vírgula ou ponto.');
      if((match=text.match(/^([+-]?)(\d+)[ \t]+(\d+)[ \t]*\/[ \t]*(\d+)$/))){
        const whole=Number(match[2]),n=Number(match[3]),d=Number(match[4]);
        if(!d)return invalid('O denominador não pode ser zero.');
        if(![whole,n,d].every(Number.isSafeInteger)||!Number.isSafeInteger(whole*d+n))return invalid('A medida contém dígitos demais.');
        if(n>=d)return invalid('Na fração mista, a parte fracionária deve ser menor que uma unidade.');
        value=(whole+n/d)*(match[1]==='-'?-1:1);
      }else if((match=text.match(/^([+-]?)(\d+)[ \t]*\/[ \t]*(\d+)$/))){
        const n=Number(match[2]),d=Number(match[3]);if(!d)return invalid('O denominador não pode ser zero.');
        if(![n,d].every(Number.isSafeInteger))return invalid('A medida contém dígitos demais.');value=n/d*(match[1]==='-'?-1:1);
      }else return invalid('Use uma fração como 3/8 ou uma fração mista como 1 1/4.');
    }else{
      if(!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text))return invalid('Use somente a medida, com vírgula ou ponto, sem unidade nem notação científica.');
      value=Number(text.replace(',','.'));
    }
    if(!Number.isFinite(value))return invalid('A medida deve ser finita.');
    if(value<0||value>r.capacity)return invalid('Informe uma medida entre 0 e '+String(r.capacity).replace('.',',')+' '+(r.unit==='in'?'pol':'mm')+'.');
    const ticks=Math.round(value*r.ticksPerUnit),target=ticks/r.ticksPerUnit;
    const tolerance=Math.min(1e-9,r.step*1e-6),onGrid=Math.abs(value-target)<=tolerance;
    return {valid:true,value,ticks,onGrid,normalized:onGrid?format(ticks,r):String(value).replace('.',',')};
  }
  function explain(ticks,key,type){
    const r=getResolution(key),model=type?getType(type):TYPES.find(item=>item.resolutions.includes(r.id));
    if(!model.resolutions.includes(r.id))throw new RangeError('Esta resolução não está disponível neste modelo de instrumento.');
    const n=clampTicks(ticks,r),total=n/r.ticksPerUnit,unit=r.unit==='in'?'pol':'mm';
    if(model.method==='digital')return {method:'digital',main:total,vernierIndex:null,dialIndex:null,contribution:0,total,mainStep:r.step,divisions:0,steps:['Confira a unidade selecionada no visor ('+unit+').','Leia diretamente '+format(n,r)+' '+unit+' no visor digital. Este modelo não utiliza nônio.']};
    const divisions=model.method==='dial'?100:r.divisions;
    const mainTicks=model.method==='dial'?100:Math.round(r.mainStep*r.ticksPerUnit);
    const index=n%mainTicks,main=(n-index)/r.ticksPerUnit,contribution=index/r.ticksPerUnit;
    const mainText=r.id==='in-128'?format(n-index,r):main.toFixed(r.unit==='mm'?0:3).replace('.',',');
    const contributionText=r.id==='in-128'?format(index,r):contribution.toFixed(r.digits).replace('.',',');
    const resolutionText=r.id==='in-128'?'1/128':r.step.toFixed(r.digits).replace('.',',');
    const steps=['Escala principal: '+mainText+' '+unit+'.',model.method==='dial'?'Ponteiro do relógio: divisão '+index+' × '+resolutionText+' '+unit+' = '+contributionText+' '+unit+'.':'Nônio: traço '+index+' × '+resolutionText+' '+unit+' = '+contributionText+' '+unit+'.','Resultado: '+mainText+' + '+contributionText+' = '+format(n,r)+' '+unit+'.'];
    return {method:model.method,main,vernierIndex:model.method==='vernier'?index:null,dialIndex:model.method==='dial'?index:null,contribution,total,mainStep:mainTicks/r.ticksPerUnit,divisions,span:model.method==='vernier'?r.span:undefined,steps};
  }
  function grade(ticks,key,input){
    const r=getResolution(key),expectedTicks=clampTicks(ticks,r),parsed=parseAnswer(input,r),expected=format(expectedTicks,r);
    const explanation=explain(expectedTicks,r).steps.join(' ');
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
  return Object.freeze({RESOLUTIONS,TYPES,LEVELS,getResolution,getType,supportedResolutions,quantize,clampTicks,valueOf,format,parseAnswer,grade,explain,nextMeasure,getLevel});
});
