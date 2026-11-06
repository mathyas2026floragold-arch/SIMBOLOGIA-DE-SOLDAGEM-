'use strict';
const assert=require('node:assert/strict');
const E=require('./caliper-engine.js');
const near=(actual,expected,label,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${label}: ${actual} ≠ ${expected}`);
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
// Independent nominal models: [ticks/unit, main ticks, divisions, span, capacity].
const models={
  'mm-01':[10,10,10,9,150],
  'mm-005':[20,20,20,39,150],
  'mm-002':[50,50,50,49,150],
  'mm-001':[100,100,100,99,150],
  'in-128':[128,8,8,7/16,6],
  'in-1000':[1000,25,25,.6,6]
};
const compatible={analog:['mm-01','mm-005','mm-002','in-128','in-1000'],digital:['mm-001','in-1000'],dial:['mm-001','in-1000'],depth:['mm-005','mm-002','in-1000'],height:['mm-002','in-1000']};
assert.deepEqual(new Set(E.RESOLUTIONS.map(r=>r.id)),new Set(Object.keys(models)));
assert.deepEqual(new Set(E.TYPES.map(t=>t.id)),new Set(Object.keys(compatible)));
for(const [type,keys] of Object.entries(compatible))assert.deepEqual(E.supportedResolutions(type).map(r=>r.id),keys,'only the selected physical model is offered');
assert.throws(()=>E.explain(1,'mm-001','analog'),RangeError);
assert.throws(()=>E.getResolution('invalid'),RangeError);assert.throws(()=>E.getType('micrometer'),RangeError);

const minima=[0,4,10,18,30,45],names=['Conhecendo o paquímetro','Leitura da escala principal','Leitura do nônio','Medidas com casas decimais','Leitura avançada','Desafio profissional'];
assert.deepEqual(E.LEVELS.map(l=>l.min),minima);assert.deepEqual(E.LEVELS.map(l=>l.name),names);
for(let i=0;i<6;i++){const level=E.getLevel(minima[i]);assert.equal(level.index,i);assert.equal(level.level,i+1);assert.equal(level.next,minima[i+1]??null);if(i)assert.equal(E.getLevel(minima[i]-1).index,i-1);}
assert.equal(E.getLevel(-1).level,1);assert.equal(E.getLevel(99999).level,6);

let roundTrips=0,alignments=0;
for(const [key,[scale,mainTicks,divisions,span,capacity]] of Object.entries(models)){
  const r=E.getResolution(key);near(r.step,1/scale,'step '+key);near(r.mainStep,mainTicks/scale,'main graduation '+key);near(r.span,span,'vernier span '+key);assert.equal(r.divisions,divisions);assert.equal(r.capacity,capacity);assert.equal(r.maxTicks,capacity*scale);
  assert.equal(E.clampTicks(-2,key),0);assert.equal(E.clampTicks(r.maxTicks+1,key),r.maxTicks);
  assert.equal(E.quantize(-1,key),0);assert.equal(E.quantize(capacity+1,key),r.maxTicks);
  assert.equal(E.valueOf(0,key),0);assert.equal(E.valueOf(r.maxTicks,key),capacity);
  for(let ticks=0;ticks<=r.maxTicks;ticks++){
    // The reference does not call the implementation's value conversion.
    const expected=ticks/scale;near(E.valueOf(ticks,key),expected,'integer-tick conversion '+key);
    assert.equal(E.quantize(expected,key),ticks,'exact measurement round-trips without floating-point drift');
    const shown=E.format(ticks,key),parsed=E.parseAnswer(shown,key);
    assert.ok(parsed.valid&&parsed.onGrid,'displayed measurement is a valid graduation');assert.equal(parsed.ticks,ticks);assert.equal(E.grade(ticks,key,shown).correct,true,'the displayed correct answer is accepted');roundTrips++;
  }
  // Exhaust every residual line, including zero, near the start and the end.
  const representativeType=key==='mm-001'?'dial':'analog';
  for(const base of [0,Math.floor(r.maxTicks/mainTicks)-1])for(let index=0;index<mainTicks;index++){
    const ticks=base*mainTicks+index,reading=E.explain(ticks,key,representativeType);
    if(representativeType==='dial')continue;
    near(reading.main,base*mainTicks/scale,'main reading '+key);assert.equal(reading.vernierIndex,index);
    near(reading.contribution,index/scale,'vernier contribution '+key);near(reading.total,ticks/scale,'complete reading '+key);
    const pitch=span/divisions,coincidence=ticks/scale+index*pitch;
    const principalIntervals=key==='mm-005'?2:1;
    near(coincidence,reading.main+index*(mainTicks/scale)*principalIntervals,'selected vernier line coincides with a principal graduation '+key,1e-8);
    near(coincidence/(mainTicks/scale),Math.round(coincidence/(mainTicks/scale)),'coincidence lies on the principal scale '+key,1e-8);alignments++;
  }
  assert.equal(E.parseAnswer(String(capacity+1),key).valid,false,'answers outside the instrument capacity are rejected rather than clamped');
}
assert.equal(E.quantize(33.15,'mm-005'),663);near(E.valueOf(663,'mm-005'),33.15,'33.15 mm exact at 0.05 mm');
const sample=E.explain(663,'mm-005','analog');assert.equal(sample.main,33);assert.equal(sample.vernierIndex,3);near(sample.contribution,.15,'three 0.05 mm divisions');assert.equal(E.format(663,'mm-005'),'33,15');
const imperial=E.explain(1234,'in-1000','analog');near(imperial.main,1.225,'inch principal has 0.025 in increments');assert.equal(imperial.vernierIndex,9);near(imperial.contribution,.009,'nine thousandths');
const fractions=E.explain(175,'in-128','analog');near(fractions.main,21/16,'fractional main reading');assert.equal(fractions.vernierIndex,7);near(fractions.contribution,7/128,'fractional vernier contribution');assert.equal(E.format(175,'in-128'),'1 47/128');
assert.equal(E.grade(64,'in-128','2/4').correct,true);assert.equal(E.grade(64,'in-128','0,5').correct,true);assert.equal(E.grade(192,'in-128','1 2/4').correct,true);assert.equal(E.grade(1,'in-128','0.0078125').correct,true);
assert.equal(E.grade(1,'in-128','1/256').correct,false,'a halfway value cannot be silently quantized into the correct response');
assert.equal(E.grade(663,'mm-005','33.1500000002').correct,true,'tiny floating-point representation noise is accepted');
assert.equal(E.grade(663,'mm-005','33,151').correct,false,'off-grid values never count as the nearest graduation');
assert.equal(E.grade(663,'mm-005','33,20').correct,false,'an adjacent valid graduation remains wrong');
assert.equal(E.grade(1500,'mm-01','151').valid,false,'clamping cannot convert an out-of-capacity answer into an acerto');
for(const input of ['', ' ', '1,2.3', '1.2.3', '1e3', 'Infinity', 'NaN', '--1', '1,', '2 mm', '3 pol', '0/0', '1/0', '1/2/3', '1 7/4', 'globalThis.__caliperPwned=true'])assert.equal(E.parseAnswer(input,'in-128').valid,false,'malformed measurement is rejected: '+input);
assert.equal(globalThis.__caliperPwned,undefined);assert.equal(E.parseAnswer('3/8','mm-005').valid,false,'fraction notation is not substituted for the selected metric display');

for(const [key,total,main,dialIndex] of [['mm-001',3315,33,15],['in-1000',1234,1.2,34]]){
  const dial=E.explain(total,key,'dial');assert.equal(dial.method,'dial');assert.equal(dial.vernierIndex,null);assert.equal(dial.dialIndex,dialIndex);near(dial.main,main,'dial principal');near(dial.main+dial.contribution,dial.total,'dial total');assert.ok(dial.steps.some(s=>s.includes('Ponteiro')));
  const digital=E.explain(total,key,'digital');assert.equal(digital.method,'digital');assert.equal(digital.vernierIndex,null);near(digital.main,digital.total,'digital direct reading');assert.ok(digital.steps.some(s=>s.includes('não utiliza nônio')));
}
for(const type of ['depth','height'])for(const resolution of E.supportedResolutions(type)){const reading=E.explain(53,resolution.id,type);assert.equal(reading.method,'vernier');near(reading.main+reading.contribution,reading.total,'specialized vernier reading');}

let generated=0;
for(const resolution of E.RESOLUTIONS)for(const difficulty of ['easy','medium','hard'])for(let level=1;level<=6;level++){
  const rng=seeded(level*900+resolution.maxTicks);
  for(let questionIndex=0;questionIndex<100;questionIndex++){
    const ticks=E.nextMeasure({resolutionKey:resolution.id,difficulty,questionIndex,level},rng);
    assert.ok(Number.isInteger(ticks)&&ticks>=0&&ticks<=resolution.maxTicks,'generated position is a bounded integer tick');
    if(difficulty==='easy')near(ticks/resolution.ticksPerUnit,Math.round(ticks/resolution.ticksPerUnit),'easy measurements use integer units');
    if(level===1)assert.ok(E.valueOf(ticks,resolution.id)<=(resolution.unit==='mm'?20:1),'first level has a compact reading range');
    generated++;
  }
  const maximum=E.nextMeasure({resolutionKey:resolution.id,difficulty:'hard',questionIndex:0,level:6},()=>.999999999);
  assert.equal(maximum,resolution.maxTicks,'last level can reach the capacity without exceeding it');
}
assert.throws(()=>E.nextMeasure({difficulty:'invalid'}),RangeError);assert.throws(()=>E.nextMeasure({},()=>1),RangeError);assert.throws(()=>E.quantize(NaN,'mm-005'),TypeError);
console.log(`PASS: ${roundTrips} exact tick/display/grade round-trips, ${alignments} vernier coincidences and ${generated} generated questions; six levels, five compatible model types, strict answers, inch fractions and dial/digital calculations.`);
