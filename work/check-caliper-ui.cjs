'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {Element}=require('./check-five-modes.cjs');
const E=require('./caliper-engine.js');
const html=fs.readFileSync(path.join(__dirname,'../SIMBOLOGIA DE SOLDAGEM.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];

// Standard DOM properties used by the real event handlers. Keep these local
// to this test process rather than changing the shared five-game harness.
for(const property of ['id','name'])Object.defineProperty(Element.prototype,property,{configurable:true,get(){return this.getAttribute(property)||'';},set(value){this.setAttribute(property,value);}});
Object.defineProperty(Element.prototype,'hidden',{configurable:true,get(){return this.getAttribute('hidden')!==null;},set(value){if(value)this.setAttribute('hidden','');else this.removeAttribute('hidden');}});
Object.defineProperty(Element.prototype,'disabled',{configurable:true,get(){return this.getAttribute('disabled')!==null;},set(value){if(!this._disabledInitialized){this._disabledInitialized=true;if(!value)return;}if(value)this.setAttribute('disabled','');else this.removeAttribute('disabled');}});
Object.defineProperty(Element.prototype,'style',{configurable:true,get(){return this._style||(this._style={});}});
Object.defineProperty(Element.prototype,'ownerSVGElement',{configurable:true,get(){for(let el=this.parent;el;el=el.parent)if(el.tagName==='svg')return el;return null;}});
const closest=Element.prototype.closest;
Element.prototype.closest=function(selector){for(const part of selector.split(',')){const result=closest.call(this,part.trim());if(result)return result;}return null;};
Element.prototype.getScreenCTM=function(){return {a:1,b:0,c:0,d:1,e:0,f:0};};
Element.prototype.setPointerCapture=function(id){this.capturedPointer=id;};
Element.prototype.releasePointerCapture=function(){delete this.capturedPointer;};

const KEY='desafio-paquimetro-v1';
const personal=JSON.stringify({xp:620,total:23,right:20,streak:3,master:{1:4,2:5,3:6,4:2,5:1},seen:{personal:true}});
function harness(records=new Map([['moto-work-v1',personal]]),initialTime=1800000000000,fullscreenMode='unsupported'){
  const document=new Element('document');document.innerHTML='<html><body>'+html.match(/<body>([\s\S]*?)<script>/)[1]+'</body></html>';document.createElement=tag=>new Element(tag);
  const query=document.querySelector.bind(document);document.querySelector=selector=>selector==='main > details'?query('main').children.find(el=>el.tagName==='details'):query(selector);
  document.body=query('body');document.documentElement=query('html');document.fullscreenElement=null;
  const timeouts=new Map(),intervals=new Map(),frames=new Map();let sequence=0,now=initialTime,seed=793;
  const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  class TestDate extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
  const documentEvents=new Map(),windowEvents=new Map();
  const add=(events,name,listener)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(listener);};
  const dispatch=(events,name,event={})=>{for(const listener of events.get(name)||[])listener({preventDefault(){},...event});};
  document.addEventListener=(name,listener)=>add(documentEvents,name,listener);
  const window={scrollX:0,scrollY:0,scrollTo(x,y){this.scrollX=x;this.scrollY=y;},addEventListener:(name,listener)=>add(windowEvents,name,listener)};
  const fullscreen={requests:0,exits:0,resolve:null};
  if(fullscreenMode!=='unsupported'){
    query('#app').requestFullscreen=()=>{fullscreen.requests++;if(fullscreenMode==='reject')return Promise.reject(new Error('NotAllowedError'));if(fullscreenMode==='pending')return new Promise(resolve=>{fullscreen.resolve=()=>{document.fullscreenElement=query('#app');dispatch(documentEvents,'fullscreenchange');resolve();};});document.fullscreenElement=query('#app');dispatch(documentEvents,'fullscreenchange');return Promise.resolve();};
    document.exitFullscreen=()=>{fullscreen.exits++;document.fullscreenElement=null;dispatch(documentEvents,'fullscreenchange');return Promise.resolve();};
  }
  const context=vm.createContext({console,document,window,history:{},Math:math,Date:TestDate,localStorage:{getItem:key=>records.get(key)||null,setItem:(key,value)=>records.set(key,String(value))},matchMedia:()=>({matches:true}),confirm:()=>false,
    setTimeout:fn=>{const id=++sequence;timeouts.set(id,fn);return id;},clearTimeout:id=>timeouts.delete(id),setInterval:fn=>{const id=++sequence;intervals.set(id,fn);return id;},clearInterval:id=>intervals.delete(id),requestAnimationFrame:fn=>{const id=++sequence;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)});
  vm.runInContext(script,context);
  const run=code=>vm.runInContext(code,context),flushTimers=()=>{while(timeouts.size){const [id,fn]=timeouts.entries().next().value;timeouts.delete(id);fn();}},flushFrames=()=>{while(frames.size){const [id,fn]=frames.entries().next().value;frames.delete(id);fn();}};
  const $=selector=>{const el=document.querySelector(selector);assert.ok(el,'Missing rendered element '+selector);return el;};
  const host=()=>$('#app');
  const click=selector=>{const button=$(selector);assert.ok(!button.disabled,'Cannot click disabled '+selector);if(typeof button.onclick==='function')button.onclick();else{assert.equal(typeof host().onclick,'function');host().onclick({target:button});}flushFrames();flushTimers();};
  const submit=id=>{host().onsubmit({preventDefault(){},target:$('#'+id)});flushFrames();flushTimers();};
  const choose=(id,value)=>{const control=$('#'+id);assert.ok(!control.disabled,'Cannot change disabled '+id);control.value=String(value);host().onchange({target:control});flushTimers();};
  const activity=value=>{const input=$('[value="'+value+'"]');host().onchange({target:input});flushTimers();};
  const input=(id,value)=>{const control=$('#'+id);assert.ok(!control.disabled);control.value=String(value);host().oninput?.({target:control});flushTimers();return control;};
  const blur=control=>{host().onchange({target:control});flushTimers();};
  const key=(name,shiftKey=false,area='#cp-instrument-area')=>{host().onkeydown({target:$(area),key:name,shiftKey,preventDefault(){}});flushFrames();flushTimers();};
  const state=()=>{flushTimers();return JSON.parse(records.get(KEY));};
  const advance=ms=>{now+=ms;for(const fn of intervals.values())fn();};
  return {document,window,fullscreen,dispatchWindow:(name,event)=>dispatch(windowEvents,name,event),dispatchDocument:(name,event)=>dispatch(documentEvents,name,event),records,run,$,host,click,submit,choose,activity,input,blur,key,state,advance,now:()=>now,flushFrames,flushTimers,intervals,frames};
}

function singleScene(h,label){
  assert.equal(h.$('#cp-instrument-area').querySelectorAll('.caliper-instrument').length,1,label+' renders one instrument');
  assert.equal(h.document.querySelectorAll('#cp-detail-area').length,0,label+' has no second drawing panel');
  assert.equal(h.document.querySelectorAll('.cp-below').length,0,label+' has no separate sidebar');
}
const analogResolutions=['mm-01','mm-005','mm-002','in-128','in-1000'];
function universalOnly(h,label){
  const state=h.state();
  assert.equal(state.settings.type,'analog',label+' settings use only the universal analog caliper');
  assert.equal(state.session.config.type,'analog',label+' session uses only the universal analog caliper');
  assert.deepEqual(h.$('#cp-resolution').querySelectorAll('option').map(option=>option.value),analogResolutions,label+' offers exactly the analog resolutions');
  assert.equal(h.document.querySelector('#cp-type'),null,label+' has a fixed instrument instead of a type selector');
  for(const unsupported of ['digital','dial','depth','height'])assert.equal(h.document.querySelectorAll('option[value="'+unsupported+'"]').length,0,label+' never offers '+unsupported);
  assert.equal(h.$('#cp-resolution').querySelectorAll('option[value="mm-001"]').length,0,label+' does not offer a fictitious 0.01 mm vernier');
  assert.equal(h.$('#cp-instrument-area').querySelectorAll('.ci-analog').length,1,label+' draws the analog caliper');
}
function hidden(h,label){
  assert.equal(h.$('#cp-instrument-area').querySelectorAll('[data-reading]').length,0,label+' does not reveal a numeric reading');
  assert.equal(h.$('#cp-instrument-area').querySelectorAll('[data-vernier-unit]').length,0,label+' does not label absolute vernier positions');
  assert.equal(h.$('#cp-instrument-area').querySelectorAll('.ci-coincidence').length,0,label+' does not identify the answer');
  assert.equal(h.$('#cp-instrument-area').querySelectorAll('.ci-dimension-value').length,0,label+' hides the numeric jaw-opening dimension');
  const reading=h.document.querySelector('#cp-measure');if(reading)assert.match(reading.textContent,/—/,label+' masks the free readout');
  const explanation=h.document.querySelector('#cp-live-explanation');if(explanation)assert.equal(explanation.textContent,'',label+' hides the explanation');
}
function configure(h,values){
  h.click('[data-cp="configure"]');
  for(const [id,value] of Object.entries(values))h.choose('cp-'+id,value);
  h.submit('cp-setup-form');
}
function reading(h,correct=true){
  const s=h.state().session,key=s.config.resolutionKey;
  h.input('cp-answer',E.format(correct?s.targetTicks:s.targetTicks+1,key));h.advance(1250);h.submit('cp-answer-form');
}

let h=harness();
assert.deepEqual(h.document.querySelectorAll('[data-mode]').map(e=>e.dataset.mode),['1','2','3','4','5','6']);
h.click('[data-mode="6"]');
assert.ok(h.$('#stats').hidden&&h.$('#preview-notice').hidden&&h.$('main > details').hidden);
assert.equal(h.state().session.config.activity,'reading','the game opens directly as an assessment');
assert.equal(h.state().session.config.assessment,'training');
singleScene(h,'reading');hidden(h,'reading');universalOnly(h,'reading');
assert.ok(h.$('#cp-answer-form'));assert.ok(h.$('.cp-correct')&&h.$('.cp-wrong'),'inline answer counters are present');
assert.equal(h.state().session.ticks,h.state().session.targetTicks,'the displayed reading is ready to interpret');
const target=h.state().session.ticks,handle=h.$('#cp-instrument-area').querySelector('[data-caliper-slider]');
const pointer=(x,y)=>({target:handle,pointerId:7,clientX:x,clientY:y,preventDefault(){}});
h.key('ArrowRight');h.key('End');h.host().onpointerdown(pointer(0,0));h.host().onpointermove(pointer(100,0));h.host().onpointerup(pointer(100,0));
assert.equal(h.state().session.ticks,target,'assessment readings cannot be moved');
h.input('cp-answer','bad');h.submit('cp-answer-form');assert.equal(h.state().session.answered,0,'invalid text is not graded');
const typed=h.input('cp-answer',E.format(target,'mm-005'));h.blur(typed);assert.ok(h.$('#cp-answer-form'),'blur does not reset the question');
h.advance(1250);h.submit('cp-answer-form');
assert.equal(h.state().session.correct,1);assert.equal(h.state().stats.points,20);assert.equal(h.state().session.locked,true);
assert.match(h.$('.cp-correct').textContent,/1/);assert.match(h.$('#cp-feedback').textContent,/Correto/);
h.submit('cp-answer-form');assert.equal(h.state().stats.total,1,'the same answer cannot score twice');
const answer=E.format(target,'mm-005');h.click('[data-cp="eye"]');hidden(h,'hidden correction');
assert.ok(!h.$('#cp-feedback').textContent.includes(answer));assert.equal(h.$('#cp-answer').value,'');
h.click('[data-cp="eye"]');assert.ok(h.$('#cp-feedback').textContent.includes(answer));
h.click('[data-cp="next"]');reading(h,false);
assert.equal(h.state().session.correct,1);assert.equal(h.state().session.wrong,1);assert.equal(h.state().stats.points,20);
h.click('[data-cp="finish"]');const summary=JSON.stringify(h.state().stats),config=JSON.stringify(h.state().session.config);
assert.match(h.$('[data-cp="restart"]').textContent,/Praticar novamente/);assert.match(h.$('[data-cp="exit"]').textContent,/Encerrar/);
h.run('menu();');h=harness(h.records);h.click('[data-mode="6"]');
assert.equal(JSON.stringify(h.state().stats),summary,'reopening a completed result does not grade it again');
h.click('[data-cp="restart"]');assert.equal(JSON.stringify(h.state().session.config),config);assert.equal(h.state().session.answered,0,'practise again keeps configuration and resets session counters');
h.click('[data-cp="finish"]');h.click('[data-cp="exit"]');
assert.equal(h.$('#stats').hidden,false);assert.equal(h.$('main > details').hidden,false);assert.equal(h.document.querySelectorAll('[data-mode]').length,6);

// Free manipulation still uses the same single viewport, alternating the full
// physical instrument and a fixed close-up of its own moving vernier.
h=harness();h.click('[data-mode="6"]');configure(h,{activity:'free'});
singleScene(h,'free instrument');assert.equal(h.state().session.config.activity,'free');
assert.equal(h.state().session.ticks,E.quantize(56.1,'mm-005'),'a new metric free session opens at 56.10 mm');
assert.ok(h.$('.cp-free'));assert.ok(h.$('.ci-free-instrument'));assert.ok(h.$('.cp-canvas-fit'));
assert.equal(h.document.querySelector('.cp-movement'),null,'free exploration omits the open/close and step button bar');
assert.equal(h.document.querySelector('[data-cp-step]'),null);assert.equal(h.document.querySelector('[data-cp="minimum"]'),null);assert.equal(h.document.querySelector('[data-cp="maximum"]'),null);
assert.equal(h.document.querySelector('#cp-zoom'),null,'free exploration has a fixed proportional view rather than a variable zoom');
assert.equal(h.document.querySelector('[data-cp="zoom-in"]'),null);assert.equal(h.document.querySelector('[data-cp="zoom-out"]'),null);
assert.equal(h.$('[data-cp="view"]').getAttribute('aria-label'),'Ampliar nônio');
assert.match(h.$('.ci-dimension-value').textContent,/56,10/,'the opening dimension and numeric readout share the calibrated measure');
const jump=h.input('cp-jump','33,15');h.blur(jump);h.submit('cp-jump-form');
assert.equal(h.state().session.ticks,663);assert.match(h.$('#cp-measure').textContent,/33,15/);
h.key('ArrowRight');assert.equal(h.state().session.ticks,664);assert.match(h.$('#cp-measure').textContent,/33,20/);
h.key('ArrowLeft',true);assert.equal(h.state().session.ticks,654);
h.key('Home');h.key('ArrowLeft');assert.equal(h.state().session.ticks,0);
h.key('End');h.key('ArrowRight');assert.equal(h.state().session.ticks,3000);
h.key('Home');h.key('ArrowRight');h.click('[data-cp="eye"]');hidden(h,'free');
assert.ok(!h.$('#cp-status').textContent.includes('0,05'),'eye clears the previous numeric status');
h.click('[data-cp="explain"]');hidden(h,'hidden help request');
h.click('[data-cp="view"]');singleScene(h,'free vernier close-up');assert.ok(h.$('.ci-focus-instrument'));assert.ok(h.$('.cp-free-focus'));assert.ok(h.$('.ci-slider-body'));assert.ok(h.$('.cp-canvas-fit'));assert.equal(h.document.querySelector('.ci-game-scale'),null,'the close-up retains the detailed physical instrument instead of substituting an assessment drawing');hidden(h,'free vernier close-up');
assert.equal(h.state().stats.total,0);assert.equal(h.state().stats.points,0);
const freePosition=h.state().session.ticks;h.run('menu();');assert.equal(h.intervals.size,0);
h=harness(h.records);h.click('[data-mode="6"]');assert.equal(h.state().session.ticks,freePosition);hidden(h,'restored free');

// The fixed lens follows physical movement without changing its proportions,
// duplicating drawings, revealing the value or introducing scroll-based zoom.
const focused=[];
for(const key of analogResolutions){
  const lens=harness();lens.click('[data-mode="6"]');configure(lens,{activity:'free',resolution:key});
  const beforeStats=JSON.stringify(lens.state().stats),beforeTicks=lens.state().session.ticks;
  lens.click('[data-cp="view"]');const firstBox=lens.$('.ci-focus-instrument').getAttribute('viewBox').split(/\s+/).map(Number);
  assert.match(lens.$('#cp-instrument-canvas').getAttribute('style'),/width:100%;min-width:100%/);
  assert.equal(lens.document.querySelector('.cp-movement'),null,'the focused free instrument also omits the movement bar');
  lens.key('ArrowRight');const movedBox=lens.$('.ci-focus-instrument').getAttribute('viewBox').split(/\s+/).map(Number);
  assert.equal(lens.state().session.ticks,beforeTicks+1,'the close-up still moves by exactly one selected division');
  assert.ok(movedBox[0]>firstBox[0],'the camera follows the moving reading area');assert.deepEqual(movedBox.slice(1),firstBox.slice(1),'the camera translates without changing size or stretching the instrument');
  assert.match(lens.$('#cp-measure').textContent,new RegExp(E.format(beforeTicks+1,key).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  lens.click('[data-cp="eye"]');hidden(lens,'fixed close-up '+key);singleScene(lens,'fixed close-up '+key);
  assert.equal(lens.document.querySelector('#cp-zoom'),null);assert.equal(JSON.stringify(lens.state().stats),beforeStats);
  const hiddenBox=lens.$('.ci-focus-instrument').getAttribute('viewBox');lens.click('[data-cp="eye"]');assert.equal(lens.$('.ci-focus-instrument').getAttribute('viewBox'),hiddenBox,'revealing does not shift the lens toward an answer-dependent graduation');
  lens.click('[data-cp="view"]');assert.ok(lens.$('.ci-free-instrument'));assert.equal(lens.state().session.ticks,beforeTicks+1);focused.push(lens);
}

// The direct free workspace parks the exact assessment instead of replacing
// its question, typed answer, results or score. Training time excludes the
// exploration; an exam continues against the wall clock, including reloads.
let parked=harness();parked.click('[data-mode="6"]');reading(parked);parked.click('[data-cp="next"]');
parked.input('cp-answer','12,');parked.advance(2000);
const trainingBefore=parked.state().session,trainingStats=parked.state().stats;
assert.match(parked.$('[data-cp="free"]').textContent,/Modo livre/);parked.click('[data-cp="free"]');
singleScene(parked,'direct free');assert.ok(parked.host().classList.contains('cp-fullscreen-fallback'),'direct free entry opens the full-screen workspace');
assert.equal(parked.state().suspendedSession.pausedAt,parked.now());assert.equal(parked.state().session.ticks,1122);
assert.deepEqual(parked.state().suspendedSession.results,trainingBefore.results);assert.deepEqual(parked.state().stats,trainingStats);
parked.key('ArrowRight',false);parked.key('ArrowRight',false);parked.key('ArrowRight',false);parked.click('[data-cp="eye"]');
parked.click('[data-cp="configure"]');assert.equal(parked.$('#cp-config').open,true);assert.deepEqual(parked.state().suspendedSession.results,trainingBefore.results);
parked.click('[data-cp="view"]');singleScene(parked,'parked assessment with magnified free scale');hidden(parked,'parked free scale');
assert.equal(parked.$('[data-cp="view"]').getAttribute('aria-label'),'Ver instrumento');parked.click('[data-cp="view"]');
assert.equal(parked.$('[data-cp="view"]').getAttribute('aria-label'),'Ampliar nônio');
parked.advance(9000);parked.click('[data-cp="resume-assessment"]');
assert.equal(parked.state().session.targetTicks,trainingBefore.targetTicks);assert.equal(parked.$('#cp-answer').value,'12,');
assert.equal(parked.state().session.startedAt,trainingBefore.startedAt+9000);assert.equal(parked.state().session.questionStartedAt,trainingBefore.questionStartedAt+9000);
assert.equal(parked.state().suspendedSession,null);assert.deepEqual(parked.state().stats,trainingStats);hidden(parked,'resumed training question');
parked.click('[data-cp="free"]');assert.equal(parked.state().session.ticks,1125,'re-entering free retains its physical cursor position');hidden(parked,'re-entered free');
parked.advance(5000);parked.run('menu();');parked=harness(parked.records,parked.now()+3000);parked.click('[data-mode="6"]');
assert.equal(parked.state().session.ticks,1125);hidden(parked,'reloaded free with parked assessment');
parked.click('[data-cp="resume-assessment"]');assert.equal(parked.$('#cp-answer').value,'12,');assert.equal(parked.state().session.targetTicks,trainingBefore.targetTicks);
assert.equal(parked.state().session.startedAt,trainingBefore.startedAt+17000);assert.deepEqual(parked.state().stats,trainingStats);

let parkedExam=harness();parkedExam.click('[data-mode="6"]');configure(parkedExam,{assessment:'exam',quantity:'10'});reading(parkedExam);
parkedExam.input('cp-answer',E.format(parkedExam.state().session.targetTicks,'mm-005'));parkedExam.advance(1000);
const examBeforeFree=parkedExam.state().session,examStatsBeforeFree=parkedExam.state().stats;
parkedExam.click('[data-cp="free"]');assert.equal(parkedExam.state().suspendedSession.pausedAt,undefined,'a parked exam keeps running');
parkedExam.advance(7000);parkedExam.run('menu();');parkedExam=harness(parkedExam.records,parkedExam.now()+2000);parkedExam.click('[data-mode="6"]');
parkedExam.click('[data-cp="resume-assessment"]');
assert.equal(parkedExam.state().session.startedAt,examBeforeFree.startedAt);assert.equal(parkedExam.state().session.questionStartedAt,examBeforeFree.questionStartedAt);
assert.equal(parkedExam.state().session.targetTicks,examBeforeFree.targetTicks);assert.equal(parkedExam.$('#cp-answer').value,examBeforeFree.input);
assert.deepEqual(parkedExam.state().session.results,examBeforeFree.results);assert.deepEqual(parkedExam.state().stats,examStatsBeforeFree);
hidden(parkedExam,'resumed exam');assert.equal(parkedExam.$('#cp-feedback').textContent,'');parkedExam.submit('cp-answer-form');
assert.equal(parkedExam.state().session.answered,2);assert.equal(parkedExam.state().stats.total,0,'exploring and resuming never commits partial exam points');
parkedExam.click('[data-cp="finish"]');assert.equal(parkedExam.state().stats.total,2);assert.equal(parkedExam.state().stats.correct,2);

// Physical contact remains mandatory only in the contact activity.
configure(h,{activity:'challenge',assessment:'training'});let s=h.state().session;
h.input('cp-answer',E.format(s.targetTicks,s.config.resolutionKey));h.submit('cp-answer-form');
assert.equal(h.state().session.answered,0);assert.match(h.$('#cp-error').textContent,/Encoste/);
h.click('[data-cp="minimum"]');assert.equal(h.state().session.ticks,h.state().session.targetTicks);hidden(h,'contact before grading');
reading(h);assert.equal(h.state().stats.total,1);assert.equal(h.state().stats.correct,1);assert.equal(h.state().stats.points,20);
h.click('[data-cp="next"]');h.click('[data-cp="minimum"]');reading(h,false);
assert.equal(h.state().stats.wrong,1);assert.equal(h.state().stats.points,20);
h.click('[data-cp="finish"]');const contactSummary=JSON.stringify(h.state().stats);h.run('menu();');h.click('[data-mode="6"]');assert.equal(JSON.stringify(h.state().stats),contactSummary);

// An exam never exposes correctness, hints, or a numeric answer before its
// completion. Reload at the halfway point must preserve pending results.
let exam=harness();exam.click('[data-mode="6"]');configure(exam,{assessment:'exam',quantity:'10'});
const beforeExam=exam.state().stats;
for(let i=0;i<10;i++){
  singleScene(exam,'exam');hidden(exam,'exam');
  assert.equal(exam.document.querySelectorAll('[data-cp="hint"]').length,0);assert.equal(exam.document.querySelectorAll('.cp-correct').length,0);assert.equal(exam.document.querySelectorAll('.cp-wrong').length,0);
  assert.equal(exam.$('#cp-feedback').textContent,'');reading(exam,i%3!==1);
  if(i<9){assert.equal(exam.state().session.answered,i+1);assert.equal(JSON.stringify(exam.state().stats),JSON.stringify(beforeExam));assert.equal(exam.$('#cp-feedback').textContent,'');}
  if(i===4){const saved=exam.state().session;exam.run('menu();');exam=harness(exam.records,exam.now()+2000);exam.click('[data-mode="6"]');assert.equal(exam.state().session.answered,5);assert.equal(exam.state().session.targetTicks,saved.targetTicks);assert.equal(JSON.stringify(exam.state().stats),JSON.stringify(beforeExam));assert.notEqual(exam.$('#cp-clock').textContent,'00:00');}
}
assert.equal(exam.state().session.completed,true);assert.equal(exam.state().session.examApplied,true);assert.equal(exam.state().stats.total,10);assert.equal(exam.state().stats.correct,7);assert.equal(exam.state().stats.wrong,3);assert.equal(exam.state().stats.points,155);assert.equal(exam.state().stats.sessions,1);assert.equal(exam.intervals.size,0);
const examSummary=JSON.stringify(exam.state().stats);exam.run('menu();');exam=harness(exam.records);exam.click('[data-mode="6"]');assert.equal(JSON.stringify(exam.state().stats),examSummary,'completed exam results apply exactly once');

// All supported metric and imperial resolutions remain on the same universal
// analog caliper. Keyboard and pointer travel use the selected resolution.
let universal=harness();universal.click('[data-mode="6"]');
for(const resolution of analogResolutions){
  configure(universal,{activity:'free',resolution});universalOnly(universal,'free '+resolution);
  assert.equal(universal.state().session.ticks,E.quantize(E.getResolution(resolution).unit==='in'?2.25:56.1,resolution),'new free '+resolution+' opens at the calibrated reference measure');
  universal.key('Home');
  universal.key('ArrowRight');assert.equal(universal.state().session.ticks,1);
  const moving=universal.$('#cp-instrument-area').querySelector('[data-caliper-slider]'),axis=moving.getAttribute('data-drag-axis'),factor=Number(moving.getAttribute('data-drag-px-per-unit'));
  assert.equal(axis,'x','the universal analog cursor moves along the main horizontal scale');
  const event=(x,y)=>({target:moving,pointerId:14,clientX:x,clientY:y,preventDefault(){}});
  universal.host().onpointerdown(event(0,0));universal.host().onpointermove(event(factor*3*E.getResolution(resolution).step,0));universal.flushFrames();universal.host().onpointerup(event(0,0));assert.equal(universal.state().session.ticks,4);
  universal.key('End');assert.equal(universal.state().session.ticks,E.getResolution(resolution).maxTicks);
  universal.key('Home');assert.equal(universal.state().session.ticks,0);
}

// Legacy free exploration is the only session that migrates to the new reading
// entrance. Existing scores and genuinely active legacy exams are preserved.
const legacyFree=harness();legacyFree.click('[data-mode="6"]');configure(legacyFree,{activity:'free'});const legacyData=legacyFree.state();delete legacyData.layoutVersion;legacyData.settings.assessment='exam';legacyData.stats={...legacyData.stats,total:5,correct:4,wrong:1,points:95};
legacyFree.records.set(KEY,JSON.stringify(legacyData));const migrated=harness(legacyFree.records);migrated.click('[data-mode="6"]');assert.equal(migrated.state().layoutVersion,2);assert.equal(migrated.state().session.config.activity,'reading');assert.equal(migrated.state().session.config.assessment,'training');assert.equal(migrated.state().stats.points,95);assert.equal(migrated.state().stats.correct,4);
const legacyExam=harness();legacyExam.click('[data-mode="6"]');configure(legacyExam,{assessment:'exam'});reading(legacyExam);const legacyExamData=legacyExam.state();delete legacyExamData.layoutVersion;legacyExam.records.set(KEY,JSON.stringify(legacyExamData));const kept=harness(legacyExam.records);kept.click('[data-mode="6"]');assert.equal(kept.state().session.answered,1);assert.equal(kept.state().session.config.assessment,'exam');assert.equal(kept.state().stats.total,0);

// Former non-analog sessions are kept verbatim as archived evidence. They are
// never relabelled, requantized, or regraded as universal-caliper questions.
const migratedInstruments=[];
for(const [type,key,expectedKey] of [['digital','mm-001','mm-005'],['dial','mm-001','mm-005'],['depth','mm-002','mm-002'],['height','in-1000','in-1000']]){
  const fixture=harness();fixture.click('[data-mode="6"]');const data=fixture.state();
  const oldConfig={...data.settings,type,resolutionKey:key,activity:'challenge',assessment:'exam'};
  const record={type,key,ticks:E.quantize(1.23,key),input:E.format(E.quantize(1.23,key),key),correct:true,points:20,time:1400};
  data.settings={...oldConfig};data.stats={...data.stats,total:5,correct:4,wrong:1,points:95};data.history=[{...record}];
  data.session={...data.session,config:oldConfig,ticks:record.ticks,targetTicks:record.ticks,answered:1,correct:1,wrong:0,points:20,results:[record],lastResult:record,input:record.input};
  data.legacySessions=[{marker:'earlier archive'}];
  const originalSession=JSON.parse(JSON.stringify(data.session)),oldStats=JSON.parse(JSON.stringify(data.stats));
  fixture.records.set(KEY,JSON.stringify(data));const migratedType=harness(fixture.records);migratedType.click('[data-mode="6"]');const restored=migratedType.state();
  universalOnly(migratedType,'restored '+type);assert.equal(restored.session.config.resolutionKey,expectedKey);
  assert.equal(restored.session.config.activity,'reading');assert.equal(restored.session.config.assessment,'training');assert.equal(restored.session.answered,0);
  assert.deepEqual(restored.stats,oldStats,'archiving '+type+' neither awards nor removes accumulated scores');assert.deepEqual(restored.history,data.history,'past '+type+' results remain unchanged');
  assert.deepEqual(restored.legacySessions[0],data.legacySessions[0]);assert.deepEqual(restored.legacySessions.at(-1),originalSession,'the former '+type+' session is archived losslessly');
  migratedType.run('menu();');const reloaded=harness(migratedType.records);reloaded.click('[data-mode="6"]');
  assert.equal(reloaded.state().legacySessions.length,restored.legacySessions.length,'reloading '+type+' migration does not duplicate the archive');assert.deepEqual(reloaded.state().stats,oldStats);
  migratedInstruments.push(reloaded);
  migratedInstruments.push(migratedType);
}
for(const invalidKey of ['mm-001','unknown']){
  const fixture=harness();fixture.click('[data-mode="6"]');const data=fixture.state();data.settings.resolutionKey=invalidKey;data.session=null;
  fixture.records.set(KEY,JSON.stringify(data));const restored=harness(fixture.records);restored.click('[data-mode="6"]');
  universalOnly(restored,'invalid resolution '+invalidKey);assert.equal(restored.state().session.config.resolutionKey,'mm-005');migratedInstruments.push(restored);
}

async function fullscreenChecks(){
  const settle=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
  const f=harness();f.click('[data-mode="6"]');configure(f,{activity:'free'});f.click('[data-cp="eye"]');
  f.window.scrollTo(17,420);f.host().scrollTop=61;f.host().scrollLeft=3;f.document.body.style.overflow='auto';f.document.documentElement.style.overflow='scroll';
  f.input('cp-jump','33,15');const before=JSON.stringify(f.state().session),stable=f.host();f.click('[data-cp="fullscreen"]');
  assert.equal(f.host(),stable);assert.ok(f.host().classList.contains('cp-fullscreen-fallback'));assert.equal(f.document.body.style.overflow,'hidden');assert.equal(f.document.documentElement.style.overflow,'hidden');assert.equal(f.$('#cp-jump').value,'33,15');assert.equal(JSON.stringify(f.state().session),before);hidden(f,'fallback fullscreen');
  f.dispatchWindow('keydown',{key:'Escape'});assert.equal(f.host().classList.contains('cp-fullscreen-fallback'),false);assert.equal(f.document.body.style.overflow,'auto');assert.equal(f.document.documentElement.style.overflow,'scroll');assert.equal(f.window.scrollX,17);assert.equal(f.window.scrollY,420);assert.equal(f.host().scrollTop,61);assert.equal(f.host().scrollLeft,3);
  f.click('[data-cp="view"]');assert.ok(f.$('.ci-focus-instrument'));assert.equal(f.document.querySelector('#cp-zoom'),null);assert.equal(JSON.stringify(f.state().session),before);singleScene(f,'fixed lens fullscreen');hidden(f,'fixed lens fullscreen');
  const zoomedReading=harness();zoomedReading.click('[data-mode="6"]');zoomedReading.$('#cp-instrument-area').scrollLeft=40;zoomedReading.$('#cp-instrument-area').scrollTop=20;zoomedReading.choose('cp-zoom','8');
  assert.equal(zoomedReading.$('#cp-instrument-canvas').style.width,'800%');assert.equal(zoomedReading.$('#cp-instrument-canvas').style.minWidth,'7680px');assert.equal(zoomedReading.$('#cp-instrument-area').scrollLeft,320);assert.equal(zoomedReading.$('#cp-instrument-area').scrollTop,160);singleScene(zoomedReading,'800 percent assessment');hidden(zoomedReading,'800 percent assessment');
  for(let i=0;i<4;i++)zoomedReading.click('[data-cp="zoom-out"]');assert.equal(zoomedReading.$('#cp-zoom-value').textContent,'100%');for(let i=0;i<4;i++)zoomedReading.click('[data-cp="zoom-in"]');assert.equal(zoomedReading.$('#cp-zoom-value').textContent,'800%');
  f.click('[data-cp="fullscreen"]');f.run('menu();');assert.equal(f.host().classList.contains('cp-fullscreen-fallback'),false);assert.equal(f.document.body.style.overflow,'auto');

  const native=harness(undefined,1800000000000,'native');native.click('[data-mode="6"]');const input=native.input('cp-answer','12,50'),nativeBefore=JSON.stringify(native.state().session),nativeHost=native.host();
  native.click('[data-cp="fullscreen"]');await settle();assert.equal(native.document.fullscreenElement,nativeHost);assert.equal(native.fullscreen.requests,1);assert.equal(input.value,'12,50');assert.equal(JSON.stringify(native.state().session),nativeBefore);singleScene(native,'native fullscreen');hidden(native,'native fullscreen');
  reading(native);assert.equal(native.document.fullscreenElement,nativeHost,'a correction keeps the stable fullscreen element');native.click('[data-cp="next"]');assert.equal(native.document.fullscreenElement,nativeHost);hidden(native,'next fullscreen question');
  native.document.fullscreenElement=null;native.dispatchDocument('fullscreenchange');assert.match(native.$('[data-cp="fullscreen"]').textContent,/Tela cheia/);
  native.click('[data-cp="fullscreen"]');await settle();native.run('menu();');await settle();assert.equal(native.document.fullscreenElement,null);assert.ok(native.fullscreen.exits>=1);
  const denied=harness(undefined,1800000000000,'reject');denied.click('[data-mode="6"]');denied.click('[data-cp="fullscreen"]');await settle();assert.ok(denied.host().classList.contains('cp-fullscreen-fallback'));denied.click('[data-cp="fullscreen"]');assert.equal(denied.host().classList.contains('cp-fullscreen-fallback'),false);
  const pending=harness(undefined,1800000000000,'pending');pending.click('[data-mode="6"]');pending.click('[data-cp="fullscreen"]');pending.run('menu();');pending.fullscreen.resolve();await settle();assert.equal(pending.document.fullscreenElement,null,'a late fullscreen request cannot cover the menu');
  for(const current of [h,exam,parked,parkedExam,universal,migrated,kept,...migratedInstruments,...focused,f,zoomedReading,native,denied,pending])assert.equal(current.records.get('moto-work-v1'),personal,'all activity preserves welding progress byte for byte');
}
fullscreenChecks().then(()=>console.log('PASS: universal analog caliper only with five metric/imperial resolutions; single-scene reading, free/contact operation, exact counters, hidden exams, restart/exit, migration and unchanged welding progress; native/fallback fullscreen and 100–800% zoom.')).catch(error=>{console.error(error);process.exitCode=1;});
