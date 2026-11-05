(function(root,factory){
  const engine=factory();
  if(typeof module==='object'&&module.exports)module.exports=engine;
  root.MetroEngine=engine;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TRACKS=Object.freeze([
    {id:'inch-mm',name:'Polegada → milímetro',eyebrow:'Conversão exata',description:'Transforme polegadas decimais e fracionárias em milímetros.',accent:'#37b4ff'},
    {id:'mm-inch',name:'Milímetro → polegada',eyebrow:'Decimal e fração',description:'Converta para polegadas e pratique o arredondamento solicitado.',accent:'#a78bfa'},
    {id:'reading',name:'Leitura de instrumentos',eyebrow:'Régua e paquímetro',description:'Reconheça divisões da régua e some escala principal e nônio.',accent:'#45d9a5'}
  ].map(Object.freeze));
  const LEVELS=Object.freeze([
    {name:'Primeiras medidas',min:0,denominator:4,decimalPlaces:2},
    {name:'Divisões e metades',min:4,denominator:8,decimalPlaces:3},
    {name:'Leitura técnica',min:9,denominator:16,decimalPlaces:3},
    {name:'Precisão em prática',min:16,denominator:32,decimalPlaces:4},
    {name:'Frações finas',min:25,denominator:64,decimalPlaces:4},
    {name:'Domínio metrológico',min:36,denominator:128,decimalPlaces:5}
  ].map((level,index)=>Object.freeze({...level,index,level:index+1})));
  const REFERENCES=Object.freeze([
    {title:'NIST · definição exata da polegada',url:'https://www.nist.gov/pml/owm/si-units-length'},
    {title:'Mitutoyo · leitura da escala principal e do nônio',url:'https://www2.mitutoyo.co.jp/eng/support/service/catalog/08/E11003.pdf'},
    {title:'Mitutoyo · paquímetro com resolução de 0,02 mm',url:'https://www2.mitutoyo.co.jp/eng/products/nogisu/hyojyun.html'}
  ].map(Object.freeze));
  let serial=0;
  const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const r=a%b;a=b;b=r;}return a||1;};
  function rational(n,d=1){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0)throw new RangeError('Razão numérica fora do intervalo seguro.');if(d<0){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
  const number=r=>r.n/r.d;
  const scale=(r,n,d=1)=>rational(r.n*n,r.d*d);
  const ratioObject=r=>({numerator:r.n,denominator:r.d});
  const roundHalfAway=value=>Math.sign(value)*Math.floor(Math.abs(value)+0.5+Number.EPSILON*Math.max(1,Math.abs(value)));
  function finite(value){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError('Informe um número finito.');return value;}
  function decimalPlaces(r){let d=r.d,twos=0,fives=0;while(d%2===0){d/=2;twos++;}while(d%5===0){d/=5;fives++;}return d===1?Math.max(twos,fives):null;}
  function formatDecimal(value,places=2){finite(value);if(!Number.isInteger(places)||places<0||places>10)throw new RangeError('Use de zero a dez casas decimais.');const factor=10**places;const rounded=roundHalfAway((value+Math.sign(value)*Number.EPSILON*Math.max(1,Math.abs(value)))*factor)/factor;return (Object.is(rounded,-0)?0:rounded).toFixed(places).replace('.',',');}
  function validDenominator(d){if(!Number.isSafeInteger(d)||d<1||d>1000000)throw new RangeError('O denominador deve ser inteiro e positivo.');}
  function nearestFraction(value,denominator=128){finite(value);validDenominator(denominator);return roundHalfAway(value*denominator)/denominator;}
  function fractionText(r){const sign=r.n<0?'-':'',n=Math.abs(r.n),whole=Math.floor(n/r.d),rest=n%r.d;if(!rest)return sign+whole;return sign+(whole?whole+' ':'')+rest+'/'+r.d;}
  // The denominator specifies the measurement grid (1/16, 1/32, ...), then the result is reduced.
  function formatFraction(value,maxDenominator=128){validDenominator(maxDenominator);return fractionText(rational(roundHalfAway(finite(value)*maxDenominator),maxDenominator));}
  const inchToMm=value=>finite(value)*127/5;
  const mmToInch=value=>finite(value)*5/127;
  function parseMeasurement(input){
    const invalid=error=>({valid:false,value:null,normalized:'',error});
    if(typeof input!=='string')return invalid('Digite a medida como texto.');
    const text=input.trim();if(!text)return invalid('Digite uma medida antes de conferir.');
    let r,kind,match;
    if((match=text.match(/^([+-]?)(\d+)[ \t]+(\d+)[ \t]*\/[ \t]*(\d+)$/))){
      const whole=Number(match[2]),n=Number(match[3]),d=Number(match[4]);
      if(!d)return invalid('O denominador não pode ser zero.');
      if(![whole,n,d].every(Number.isSafeInteger)||!Number.isSafeInteger(whole*d+n))return invalid('A medida contém dígitos demais.');
      if(n>=d)return invalid('Na fração mista, use uma parte fracionária menor que uma unidade.');
      r=rational((match[1]==='-'?-1:1)*(whole*d+n),d);kind='fraction';
    }else if((match=text.match(/^([+-]?)(\d+)[ \t]*\/[ \t]*(\d+)$/))){
      const n=Number(match[2]),d=Number(match[3]);if(!d)return invalid('O denominador não pode ser zero.');
      if(![n,d].every(Number.isSafeInteger))return invalid('A medida contém dígitos demais.');
      r=rational((match[1]==='-'?-1:1)*n,d);kind='fraction';
    }else if(/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text)){
      const sign=text.startsWith('-')?-1:1,plain=text.replace(/^[+-]/,'').replace(',','.');
      const [whole='',part='']=plain.split('.'),n=Number((whole||'0')+part),d=10**part.length;
      if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d))return invalid('A medida contém dígitos demais.');
      r=rational(sign*n,d);kind=part?'decimal':'integer';
    }else return invalid('Use apenas um número com vírgula ou ponto, uma fração (3/8) ou uma fração mista (1 1/4), sem unidade.');
    const value=number(r);if(!Number.isFinite(value))return invalid('A medida precisa ser finita.');
    const normalized=kind==='fraction'?fractionText(r):String(Object.is(value,-0)?0:value).replace('.',',');
    return {valid:true,value,normalized,kind,rational:ratioObject(r)};
  }
  function getStage(correct=0){const count=Number.isFinite(Number(correct))?Math.max(0,Math.floor(Number(correct))):0;let index=0;while(index+1<LEVELS.length&&count>=LEVELS[index+1].min)index++;const base=LEVELS[index],next=LEVELS[index+1]?.min??null;return {...base,correct:count,next,remaining:next===null?0:next-count,progress:next===null?100:100*(count-base.min)/(next-base.min),maxDenominator:base.denominator};}
  function rngTools(rng){if(typeof rng!=='function')throw new TypeError('rng deve ser uma função.');const draw=()=>{const v=rng();if(!Number.isFinite(v)||v<0||v>=1)throw new RangeError('rng deve retornar um valor de zero (inclusive) a um (exclusive).');return v;};return {draw,int:(min,max)=>min+Math.floor(draw()*(max-min+1)),pick:items=>items[Math.floor(draw()*items.length)],shuffle:items=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(draw()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}};}
  function roundedRational(r,denominator){return rational(roundHalfAway(r.n*denominator/r.d),denominator);}
  function makeChoices(q,answerRatio,random){
    const fraction=q.answerFormat==='fraction',den=fraction?q.fractionDenominator:10**q.precision;
    const center=Math.round(number(answerRatio)*den),increment=fraction?1:Math.max(1,Math.round((q.resolution||1/den)*den));
    const values=[center];for(const offset of [increment,-increment,2*increment,-2*increment,3*increment]){const candidate=center+offset;if(candidate>=0&&!values.includes(candidate))values.push(candidate);if(values.length===4)break;}
    return random.shuffle(values).map(n=>{const text=fraction?fractionText(rational(n,den)):formatDecimal(n/den,q.precision);return {label:text,value:text};});
  }
  function finish(q,answerRatio,random){
    q.answer=number(answerRatio);q.answerRational=ratioObject(answerRatio);
    q.answerText=q.answerFormat==='fraction'?fractionText(answerRatio):formatDecimal(q.answer,q.precision);
    q.tolerance=Math.min(1e-9,10**(-q.precision)*1e-4);
    q.choices=makeChoices(q,answerRatio,random);return q;
  }
  function generateQuestion(track,correct=0,options={}){
    if(!TRACKS.some(t=>t.id===track))throw new RangeError('Trilha de metrologia desconhecida.');
    const stage=getStage(correct),random=rngTools(options.rng??Math.random);
    if(options.direction!==undefined&&!['decimal','fraction'].includes(options.direction))throw new RangeError('Formato de conversão desconhecido.');
    if(options.instrument!==undefined&&!['ruler','caliper'].includes(options.instrument))throw new RangeError('Instrumento desconhecido.');
    const q={id:'metro-'+(++serial),track,stage:stage.index,level:stage.level,kind:'decimal',prompt:'',context:'',value:0,unit:'mm',precision:0,hint:'',explanation:'',breakdown:[],answerFormat:'decimal',exact:true};
    if(track==='reading'){
      const instrument=options.instrument||(stage.index>=2&&random.draw()<(.3+stage.index*.04)?'caliper':'ruler');q.kind='reading';q.instrument=instrument;
      if(instrument==='caliper'){
        const divisions=stage.index<3?10:stage.index===3?20:50;
        const main=random.int(5,95),index=random.int(1,divisions-1),ratio=rational(main*divisions+index,divisions);
        Object.assign(q,{unit:'mm',resolution:1/divisions,precision:divisions===10?1:2,mainScale:main,vernierIndex:index,vernierDivisions:divisions,value:number(ratio),scaleMin:0,scaleMax:150});
        q.prompt='Qual é a medida indicada pelo paquímetro?';q.context='Nônio métrico · resolução de '+formatDecimal(q.resolution,q.precision)+' mm';
        q.hint='Leia os milímetros completos antes do zero do nônio. Depois some o índice alinhado multiplicado pela resolução.';
        q.explanation='Escala principal: '+main+' mm. O traço '+index+' do nônio acrescenta '+formatDecimal(index/divisions,q.precision)+' mm; leitura total: '+formatDecimal(number(ratio),q.precision)+' mm.';
        q.breakdown=[{label:'Escala principal',value:main+' mm'},{label:'Nônio',value:index+' × '+formatDecimal(q.resolution,q.precision)+' = '+formatDecimal(index/divisions,q.precision)+' mm'},{label:'Leitura total',value:formatDecimal(number(ratio),q.precision)+' mm'}];
        return finish(q,ratio,random);
      }
      const imperial=stage.index>=2&&random.draw()<.5;
      if(imperial){
        const den=stage.index>=4?32:16,ratio=rational(random.int(1,3*den-1),den);
        Object.assign(q,{unit:'in',resolution:1/den,precision:Math.log2(den),fractionDenominator:den,answerFormat:'fraction',value:number(ratio),scaleMin:0,scaleMax:3});
        q.prompt='Qual é a medida indicada pela régua em polegadas?';q.context='Régua em polegadas · divisões de 1/'+den+' in';
        q.hint='Conte as polegadas completas e as pequenas divisões. Simplifique a fração ao responder.';
        q.explanation='Cada pequena divisão vale 1/'+den+' in. O ponto indicado corresponde a '+fractionText(ratio)+' in.';
        q.breakdown=[{label:'Divisão da régua',value:'1/'+den+' in'},{label:'Leitura simplificada',value:fractionText(ratio)+' in'}];
        return finish(q,ratio,random);
      }
      const den=stage.index===0?1:2,ratio=rational(random.int(5*den,75*den),den);
      Object.assign(q,{unit:'mm',resolution:1/den,precision:den===1?0:1,value:number(ratio),scaleMin:0,scaleMax:80});
      q.prompt='Qual é a medida indicada pela régua em milímetros?';q.context='Régua métrica · divisões de '+formatDecimal(q.resolution,q.precision)+' mm';
      q.hint='Observe a graduação em que termina a marca, partindo do zero da régua.';
      q.explanation='Cada pequena divisão representa '+formatDecimal(q.resolution,q.precision)+' mm. A marca termina em '+formatDecimal(number(ratio),q.precision)+' mm.';
      q.breakdown=[{label:'Valor da divisão',value:formatDecimal(q.resolution,q.precision)+' mm'},{label:'Leitura',value:formatDecimal(number(ratio),q.precision)+' mm'}];return finish(q,ratio,random);
    }
    const inchRatio=rational(random.int(1,(stage.index===0?2:4)*stage.denominator),stage.denominator);
    if(track==='inch-mm'){
      const answer=scale(inchRatio,127,5),sourcePlaces=decimalPlaces(inchRatio);
      const sourceFormat=options.direction||(stage.index>=1&&random.draw()<.4?'decimal':'fraction');
      Object.assign(q,{kind:'decimal',value:number(inchRatio),unit:'mm',sourceUnit:'in',targetUnit:'mm',sourceText:sourceFormat==='decimal'?formatDecimal(number(inchRatio),sourcePlaces):fractionText(inchRatio),sourceRational:ratioObject(inchRatio),precision:decimalPlaces(answer)});
      q.prompt='Converta '+q.sourceText+' in para milímetros. Escreva o valor decimal exato.';q.context='Polegada → milímetro · 1 in = 25,4 mm exatos';
      q.hint='Multiplique a medida em polegadas por 25,4. Se houver fração mista, transforme-a em uma única medida primeiro.';
      q.explanation=q.sourceText+' in × 25,4 = '+formatDecimal(number(answer),q.precision)+' mm. O fator 25,4 é exato; aqui não é necessário arredondar.';
      q.breakdown=[{label:'Medida em polegadas',value:q.sourceText+' in'},{label:'Fator exato',value:'× 25,4 mm/in'},{label:'Resultado',value:formatDecimal(number(answer),q.precision)+' mm'}];return finish(q,answer,random);
    }
    const kind=options.direction||(stage.index===0?'fraction':random.draw()<.5?'fraction':'decimal');
    const paired=stage.index===0||random.draw()<.6;
    const source=paired?scale(inchRatio,127,5):rational(random.int(20,1500),10);
    const raw=scale(source,5,127);let answer=raw,precision=decimalPlaces(raw);
    Object.assign(q,{kind,answerFormat:kind,value:number(source),unit:'in',sourceUnit:'mm',targetUnit:'in',sourceText:formatDecimal(number(source),decimalPlaces(source)),sourceRational:ratioObject(source)});
    if(kind==='fraction'){
      q.fractionDenominator=stage.denominator;answer=roundedRational(raw,stage.denominator);q.precision=Math.log2(stage.denominator);
      q.exact=raw.n*answer.d===answer.n*raw.d;
      q.prompt='Converta '+q.sourceText+' mm para polegadas fracionárias. '+(q.exact?'A medida corresponde exatamente à escala de 1/'+stage.denominator+' in. Simplifique a fração.':'Arredonde para o múltiplo de 1/'+stage.denominator+' in mais próximo e simplifique a fração.');
      q.context='Milímetro → polegada fracionária · escala de 1/'+stage.denominator+' in';
    }else{
      if(precision===null){precision=stage.decimalPlaces;answer=roundedRational(raw,10**precision);}
      q.precision=precision;q.exact=raw.n*answer.d===answer.n*raw.d;
      q.prompt='Converta '+q.sourceText+' mm para polegadas decimais. '+(q.exact?'Escreva o valor decimal exato.':'Arredonde para '+precision+' casas decimais.');
      q.context='Milímetro → polegada decimal'+(q.exact?' · resultado exato':' · '+precision+' casas decimais');
    }
    q.hint='Divida os milímetros por 25,4. '+(kind==='fraction'?'Na escala pedida, multiplique as polegadas pelo denominador e arredonde a quantidade de divisões.':'Arredonde somente no final, quando solicitado.');
    const answerText=kind==='fraction'?fractionText(answer):formatDecimal(number(answer),q.precision);
    q.explanation=q.sourceText+' mm ÷ 25,4 '+(q.exact?'= ':'≈ ')+answerText+' in.'+(q.exact?' A equivalência é exata.':kind==='fraction'?' Foi escolhido o múltiplo de 1/'+stage.denominator+' in mais próximo.':' O resultado foi arredondado a '+q.precision+' casas decimais.');
    q.breakdown=[{label:'Medida em milímetros',value:q.sourceText+' mm'},{label:'Operação',value:'÷ 25,4 mm/in'},{label:q.exact?'Equivalência exata':'Resultado arredondado',value:answerText+' in'}];return finish(q,answer,random);
  }
  function gradeAnswer(question,input){
    if(!question||!Number.isFinite(question.answer))throw new TypeError('Questão de metrologia inválida.');
    const parsed=parseMeasurement(input),expected=question.answerText??String(question.answer),explanation=question.explanation||'';
    if(!parsed.valid)return {valid:false,correct:false,normalized:'',error:parsed.error,expected,explanation};
    const format=question.answerFormat||(question.kind==='fraction'?'fraction':'decimal');
    if(format==='fraction'&&parsed.kind==='decimal')return {valid:false,correct:false,normalized:parsed.normalized,error:'Neste desafio, responda com uma fração (3/8), fração mista (1 1/4) ou número inteiro; não use decimal.',expected,explanation};
    if(format==='decimal'&&parsed.kind==='fraction')return {valid:false,correct:false,normalized:parsed.normalized,error:'Neste desafio, escreva a medida em formato decimal, usando vírgula ou ponto.',expected,explanation};
    const tolerance=Number.isFinite(question.tolerance)?Math.max(0,question.tolerance):1e-9;
    return {valid:true,correct:Math.abs(parsed.value-question.answer)<=tolerance,normalized:parsed.normalized,expected,explanation};
  }
  return Object.freeze({TRACKS,LEVELS,REFERENCES,MM_PER_INCH:25.4,getStage,generateQuestion,gradeAnswer,parseMeasurement,formatDecimal,formatFraction,inchToMm,mmToInch,nearestFraction});
});
