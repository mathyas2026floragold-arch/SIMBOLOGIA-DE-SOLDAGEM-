'use strict';
const assert=require('node:assert/strict');
const E=require('./engine.js');
const near=(actual,expected,message,tolerance=1e-10)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${message}: ${actual} ≠ ${expected}`);
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
// This deliberately does not use the engine parser or its conversion helpers.
function independentValue(text){let s=String(text).trim().replace(',','.');let sign=1;if(s[0]==='-'){sign=-1;s=s.slice(1);}if(s.includes(' ')){const [whole,part]=s.split(/\s+/),[n,d]=part.split('/').map(Number);return sign*(Number(whole)+n/d);}if(s.includes('/')){const [n,d]=s.split('/').map(Number);return sign*n/d;}return sign*Number(s);}

assert.deepEqual(E.TRACKS.map(track=>track.id),['inch-mm','mm-inch','reading']);
const minima=[0,4,9,16,25,36];assert.deepEqual(E.LEVELS.map(level=>level.min),minima);
for(let i=0;i<minima.length;i++){
  assert.equal(E.getStage(minima[i]).index,i);assert.equal(E.getStage(minima[i]).level,i+1);
  assert.equal(E.getStage(minima[i]).next,minima[i+1]??null);
  if(i)assert.equal(E.getStage(minima[i]-1).index,i-1);
}
assert.equal(E.getStage(-10).index,0);assert.equal(E.getStage(NaN).index,0);assert.equal(E.getStage(9999).index,5);
assert.deepEqual(E.LEVELS.map(level=>level.denominator),[4,8,16,32,64,128]);

const valid=[['0',0],['12',12],['1,25',1.25],['1.25',1.25],[',5',.5],['.5',.5],['3/8',.375],['2/4',.5],['1 1/4',1.25],['-1 1/4',-1.25],['+2,50',2.5],[' 3 / 8 ',.375],['-7/4',-1.75]];
for(const [text,value] of valid){const parsed=E.parseMeasurement(text);assert.equal(parsed.valid,true,text);near(parsed.value,value,'strict parser '+text);assert.ok(parsed.normalized.length);}
for(const input of ['', ' ', '1,2.3', '1.2.3', '1/0', '1 1/0', '0/0', '1/2/3', '1 5/4', '--1', '+-1', '1e3', 'Infinity', 'NaN', '12 mm', '1 in', '1"', '1,', '1.', '½', null, undefined, {value:2}])assert.equal(E.parseMeasurement(input).valid,false,'reject malformed input '+String(input));
assert.equal(E.formatDecimal(12.7,2),'12,70');assert.equal(E.formatDecimal(1.005,2),'1,01');assert.equal(E.formatDecimal(-1.005,2),'-1,01');assert.equal(E.formatDecimal(0,0),'0');
assert.equal(E.formatFraction(.375,128),'3/8');assert.equal(E.formatFraction(1.75,128),'1 3/4');assert.equal(E.formatFraction(-1.25,64),'-1 1/4');assert.equal(E.formatFraction(.999,16),'1');
near(E.nearestFraction(10/25.4,16),6/16,'10 mm to nearest sixteenth');near(E.nearestFraction(.25,2),.5,'positive tie rounds away from zero');near(E.nearestFraction(-.25,2),-.5,'negative tie rounds away from zero');
assert.throws(()=>E.nearestFraction(.5,0),RangeError);assert.throws(()=>E.formatFraction(Infinity),TypeError);

// Independent inch/mm fixtures from the exact NIST factor 127/5.
for(const [inch,mm] of [[1,25.4],[.5,12.7],[.25,6.35],[.375,9.525],[1/16,1.5875],[1/64,.396875],[1/128,.1984375],[2.5,63.5]]){near(E.inchToMm(inch),mm,'inch to millimetre fixture');near(E.mmToInch(mm),inch,'reverse fixture');}
near(E.mmToInch(1),5/127,'one millimetre is 5/127 inch');
assert.throws(()=>E.inchToMm(NaN),TypeError);

const fractionQuestion={kind:'fraction',answerFormat:'fraction',answer:.5,answerText:'1/2',precision:1,explanation:'Meia polegada.'};
assert.equal(E.gradeAnswer(fractionQuestion,'2/4').correct,true,'equivalent unreduced fractions are accepted');
assert.equal(E.gradeAnswer(fractionQuestion,'0,5').valid,false,'fraction exercise requires the requested notation');
assert.equal(E.gradeAnswer(fractionQuestion,'3/4').correct,false);assert.equal(E.gradeAnswer(fractionQuestion,'1/0').valid,false);
assert.equal(E.gradeAnswer({...fractionQuestion,answer:1,answerText:'1'},'1').correct,true,'whole numbers are valid fraction answers');
const decimalQuestion={kind:'decimal',answerFormat:'decimal',answer:.3,answerText:'0,3',precision:1,explanation:'Três décimos.'};
assert.equal(E.gradeAnswer(decimalQuestion,'0,3000000001').correct,true,'tiny numerical representation differences are tolerated');
assert.equal(E.gradeAnswer(decimalQuestion,'0,31').correct,false,'tolerance never accepts a neighbouring measurement');
assert.equal(E.gradeAnswer(decimalQuestion,'3/10').valid,false,'decimal exercise explains a notation mismatch');

const ids=new Set(),readingResolutions={ruler:new Set(),caliper:new Set()};let approximateFraction=0,approximateDecimal=0;
function checkQuestion(q){
  assert.ok(!ids.has(q.id),'question IDs are unique without timestamps');ids.add(q.id);
  assert.ok(Number.isFinite(q.answer)&&Number.isFinite(q.value));assert.ok(Number.isInteger(q.precision)&&q.precision>=0&&q.precision<=10);
  assert.ok(q.prompt&&q.context&&q.hint&&q.explanation&&q.breakdown.length>=2);
  assert.equal(q.choices.length,4);assert.equal(new Set(q.choices.map(c=>c.label)).size,4);assert.equal(new Set(q.choices.map(c=>independentValue(c.value))).size,4,'all choices represent different numeric measurements');
  assert.ok(q.choices.every(choice=>typeof choice.value==='string'));
  assert.equal(q.choices.filter(choice=>E.gradeAnswer(q,choice.value).correct).length,1,'there is exactly one correct choice');
  assert.ok(q.choices.every(choice=>E.gradeAnswer(q,choice.value).valid),'all choices use a valid requested notation');
  near(independentValue(q.answerText),q.answer,'formatted answer preserves its numeric value');assert.equal(E.gradeAnswer(q,q.answerText).correct,true);
  if(q.kind==='reading'){
    assert.equal(q.sourceText,undefined,'reading does not expose a preformatted answer in its source card');
    near(q.answer,q.value,'instrument measurement matches its answer');near(q.answer/q.resolution,Math.round(q.answer/q.resolution),'reading lies on a physical graduation',1e-8);
    readingResolutions[q.instrument].add(q.resolution);
    if(q.instrument==='caliper'){
      assert.equal(q.unit,'mm');assert.ok([10,20,50].includes(q.vernierDivisions));assert.equal(q.resolution,1/q.vernierDivisions);
      assert.ok(Number.isInteger(q.mainScale)&&q.vernierIndex>0&&q.vernierIndex<q.vernierDivisions);
      near(q.answer,q.mainScale+q.vernierIndex/q.vernierDivisions,'main scale plus vernier reading');
      near(q.value+q.vernierIndex*(q.vernierDivisions-1)/q.vernierDivisions,Math.round(q.value+q.vernierIndex*(q.vernierDivisions-1)/q.vernierDivisions),'selected vernier line aligns with a main graduation');
    }
    return;
  }
  assert.equal(typeof q.sourceText,'string');near(independentValue(q.sourceText),q.value,'source text never silently rounds the original measurement');
  assert.equal(q.unit,q.targetUnit);
  const raw=q.track==='inch-mm'?q.value*127/5:q.value*5/127;
  if(q.track==='inch-mm'){assert.equal(q.sourceUnit,'in');assert.equal(q.targetUnit,'mm');}
  else {assert.equal(q.sourceUnit,'mm');assert.equal(q.targetUnit,'in');}
  if(q.exact)near(q.answer,raw,'exact conversion uses the internationally defined factor');
  else if(q.kind==='fraction'){
    approximateFraction++;near(q.answer,Math.round(raw*q.fractionDenominator)/q.fractionDenominator,'nearest requested fractional division');
    assert.ok(q.prompt.includes('1/'+q.fractionDenominator));assert.match(q.prompt,/mais próximo|mais próxima/);
  }else{
    approximateDecimal++;near(q.answer,Number(raw.toFixed(q.precision)),'decimal rounding agrees with independent division');assert.ok(q.prompt.includes(q.precision+' casas decimais'));
  }
}
for(let stage=0;stage<minima.length;stage++){
  const rng=seeded(800+stage);
  for(const track of ['inch-mm','mm-inch'])for(const direction of ['decimal','fraction'])for(let i=0;i<80;i++)checkQuestion(E.generateQuestion(track,minima[stage],{rng,direction}));
  for(const instrument of ['ruler','caliper'])for(let i=0;i<60;i++)checkQuestion(E.generateQuestion('reading',minima[stage],{rng,instrument}));
  for(let i=0;i<30;i++){
    const q=E.generateQuestion('reading',minima[stage],{rng});checkQuestion(q);
    if(stage===0){assert.equal(q.instrument,'ruler');assert.equal(q.unit,'mm');assert.equal(q.resolution,1);}
    if(stage===1&&q.instrument==='ruler'){assert.equal(q.unit,'mm');assert.equal(q.resolution,.5);}
  }
}
assert.ok(approximateFraction>20&&approximateDecimal>20,'both approximation paths are exercised');
assert.deepEqual(readingResolutions.ruler,new Set([1,.5,1/16,1/32]));assert.deepEqual(readingResolutions.caliper,new Set([.1,.05,.02]));
for(const track of E.TRACKS.map(t=>t.id))for(const rng of [()=>0,()=>.999999])checkQuestion(E.generateQuestion(track,36,{rng}));
// Default inch→mm practice mixes source notations after the introduction.
// Inspect the actual displayed numbers rather than relying on a format flag.
const introRng=seeded(901);
for(let i=0;i<100;i++)assert.doesNotMatch(E.generateQuestion('inch-mm',0,{rng:introRng}).sourceText,/[.,]/,'introductory source remains an integer or fraction');
for(let stage=1;stage<minima.length;stage++){
  const rng=seeded(1600+stage);let decimals=0,fractions=0;
  for(let i=0;i<100;i++){
    const q=E.generateQuestion('inch-mm',minima[stage],{rng});checkQuestion(q);
    if(/[.,]/.test(q.sourceText))decimals++;
    if(q.sourceText.includes('/'))fractions++;
  }
  assert.ok(decimals>=15&&decimals<=65,`advanced stage ${stage}: decimal source practice occurs regularly (${decimals}/100)`);
  assert.ok(fractions>0,`advanced stage ${stage}: fractional source practice remains available`);
}
for(let stage=0;stage<minima.length;stage++)for(const direction of ['decimal','fraction']){
  const rng=seeded(2100+stage);
  for(let i=0;i<30;i++){
    const q=E.generateQuestion('inch-mm',minima[stage],{rng,direction});
    near(independentValue(q.sourceText),q.value,'explicit source notation remains exact');
    if(!Number.isInteger(q.value))assert.ok(direction==='decimal'?/[.,]/.test(q.sourceText):q.sourceText.includes('/'),'explicit source direction is respected');
    if(direction==='decimal')assert.ok(!q.sourceText.includes('/'),'forced decimal source never becomes a fraction');
    else assert.doesNotMatch(q.sourceText,/[.,]/,'forced fractional source never becomes a decimal');
  }
}
assert.throws(()=>E.generateQuestion('micrometer',0),RangeError);assert.throws(()=>E.generateQuestion('reading',0,{instrument:'micrometer'}),RangeError);assert.throws(()=>E.generateQuestion('inch-mm',0,{rng:()=>1}),RangeError);
// Regression: every fractional reading needs its last complete millimetre
// visible to the left of the vernier zero, including fractions above 0.7 mm.
const Instruments=require('./instruments.js');
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match=>[match[1],match[2]]));
let visibleZeroCases=0;
for(const divisions of [10,20,50])for(const main of [0,16])for(let index=0;index<divisions;index++){
  const value=main+index/divisions;
  const svg=Instruments.caliperSVG({value,resolution:1/divisions,unit:'mm',answer:true});
  const window=svg.match(/<g\b([^>]*class="caliper-window"[^>]*data-window="0"[^>]*)>([\s\S]*?)<\/g>/);
  assert.ok(window,'first vernier window is present');
  const windowAttrs=attributes(window[1]);
  const lines=[...window[2].matchAll(/<line\b[^>]*\/>/g)].map(match=>attributes(match[0]));
  const mainLine=lines.find(line=>line.class==='main-tick'&&Number(line['data-main-mm'])===Math.floor(value));
  const nextMain=lines.find(line=>line.class==='main-tick'&&Number(line['data-main-mm'])===Math.floor(value)+1);
  const zero=lines.find(line=>line.class==='vernier-tick'&&line['data-vernier-index']==='0');
  const end=lines.find(line=>line.class==='vernier-tick'&&line['data-vernier-index']===windowAttrs['data-end-index']);
  const label=`resolution ${1/divisions}, value ${value}`;
  assert.ok(mainLine&&nextMain&&zero&&end,'main millimetre, next millimetre, zero and last index are visible: '+label);
  const mainX=Number(mainLine.x1),zeroX=Number(zero.x1),nextX=Number(nextMain.x1);
  assert.ok(mainX<=zeroX+1e-5&&zeroX<nextX,'main tick brackets the zero in the first window: '+label);
  if(index===0)near(mainX,zeroX,'whole-millimetre zero coincides with its main tick',1e-5);
  else assert.ok(mainX<zeroX,'fractional reading retains its floor before the zero: '+label);
  for(const tick of [zero,end]){
    const x=Number(tick.x1);assert.ok(x>=80-1e-5&&x<=764+1e-5,'zero and last vernier index remain inside the readable window: '+label);
  }
  visibleZeroCases++;
}
console.log(`PASS: ${ids.size} questions; independent conversion and rounding, strict parsing, six stages, fractions, notation/tolerance, unique choices; ${visibleZeroCases} SVG cases retain the last complete millimetre and bracket the vernier zero within the first window.`);
