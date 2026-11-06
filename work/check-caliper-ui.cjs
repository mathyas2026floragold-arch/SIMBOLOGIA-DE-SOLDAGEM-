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
function harness(records=new Map([['moto-work-v1',personal]]),initialTime=1800000000000){
  const document=new Element('document');document.innerHTML=html.match(/<body>([\s\S]*?)<script>/)[1];document.createElement=tag=>new Element(tag);
  const query=document.querySelector.bind(document);document.querySelector=selector=>selector==='main > details'?query('main').children.find(el=>el.tagName==='details'):query(selector);
  const timeouts=new Map(),intervals=new Map(),frames=new Map();let sequence=0,now=initialTime,seed=793;
  const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  class TestDate extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
  const window={scrollTo(){},addEventListener(){}};
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
  return {document,records,run,$,host,click,submit,choose,activity,input,blur,key,state,advance,now:()=>now,flushFrames,flushTimers,intervals,frames};
}

let h=harness();
assert.deepEqual(h.document.querySelectorAll('[data-mode]').map(el=>el.dataset.mode),['1','2','3','4','5','6'],'five welding games and the caliper share the menu');
h.click('[data-mode="6"]');
assert.ok(h.$('#stats').hidden&&h.$('#preview-notice').hidden&&h.$('main > details').hidden,'caliper setup hides the welding status and footer');
h.run('menu();');assert.equal(h.$('#stats').hidden,false);assert.equal(h.$('#preview-notice').hidden,false);assert.equal(h.$('main > details').hidden,false);
h.click('[data-mode="6"]');h.submit('cp-setup-form');
assert.equal(h.state().session.config.activity,'free');
const jump=h.input('cp-jump','33,15');h.blur(jump);
assert.ok(h.document.querySelector('#cp-jump-form'),'text-input blur does not leave the free workspace');
h.submit('cp-jump-form');assert.equal(h.state().session.ticks,663);assert.ok(h.$('#cp-measure').textContent.includes('33,15'),'typed position is painted synchronously');
h.key('ArrowRight');assert.equal(h.state().session.ticks,664);assert.ok(h.$('#cp-measure').textContent.includes('33,20'));
h.key('ArrowLeft',true);assert.equal(h.state().session.ticks,654,'Shift moves ten physical divisions');
h.key('Home');assert.equal(h.state().session.ticks,0);h.key('ArrowLeft');assert.equal(h.state().session.ticks,0);
h.key('End');assert.equal(h.state().session.ticks,3000);h.key('ArrowRight');assert.equal(h.state().session.ticks,3000);
h.key('Home');h.key('ArrowRight');assert.ok(h.$('#cp-status').textContent.includes('0,05'));
h.click('[data-cp="eye"]');
function assertHidden(current,label){
  assert.ok(current.$('#cp-measure').textContent.includes('—'),label+' readout is masked');
  assert.equal(current.$('#cp-instrument-area').querySelectorAll('[data-reading]').length,0,label+' full instrument has no revealed value');
  assert.equal(current.$('#cp-detail-area').querySelectorAll('[data-reading]').length,0,label+' detail has no revealed value');
  assert.equal(current.$('#cp-detail-area').querySelectorAll('[data-vernier-unit]').length,0,label+' vernier does not label its absolute position');
  assert.equal(current.$('#cp-live-explanation').textContent,'',label+' live explanation is empty');
}
assertHidden(h,'hidden free mode');assert.ok(!h.$('#cp-status').textContent.includes('0,05'),'hiding the readout clears the previous numeric status');
h.click('[data-cp="loupe"]');assert.ok(h.$('.cp-simulator').classList.contains('cp-loupe-open'));assertHidden(h,'hidden enlarged loupe');
h.key('Escape');assert.ok(!h.$('.cp-simulator').classList.contains('cp-loupe-open'),'Escape closes the focused view');
h.click('[data-cp="explain"]');assertHidden(h,'requesting help while hidden');
assert.equal(h.state().stats.total,0);assert.equal(h.state().stats.points,0,'free exploration never earns points');
const savedFree=h.state().session.ticks;h.run('menu();');assert.equal(h.intervals.size,0,'closing the caliper stops its interval');

// A fresh execution reads the same persisted state and restores the hidden
// cursor position. No application internals are exposed by this harness.
h=harness(h.records);h.click('[data-mode="6"]');h.click('[data-cp="resume"]');
assert.equal(h.state().session.ticks,savedFree);assertHidden(h,'restored free mode');
h.click('[data-cp="configure"]');h.activity('challenge');h.choose('cp-assessment','training');h.submit('cp-setup-form');
let s=h.state().session;
const answer=E.format(s.targetTicks,s.config.resolutionKey);
h.input('cp-answer',answer);h.submit('cp-answer-form');assert.equal(h.state().session.answered,0,'a guessed answer cannot bypass physical contact');assert.match(h.$('#cp-error').textContent,/Encoste/);
h.click('[data-cp="minimum"]');s=h.state().session;assert.equal(s.ticks,s.targetTicks);assertHidden(h,'unanswered training contact');
h.input('cp-answer','33,xx');h.submit('cp-answer-form');assert.equal(h.state().session.answered,0,'malformed input is not scored');
const answerInput=h.input('cp-answer',answer);h.blur(answerInput);assert.ok(h.document.querySelector('#cp-answer-form'),'answer blur preserves the challenge');
h.advance(1250);h.submit('cp-answer-form');
assert.equal(h.state().stats.total,1);assert.equal(h.state().stats.correct,1);assert.equal(h.state().stats.points,20);assert.equal(h.state().session.locked,true);
h.submit('cp-answer-form');assert.equal(h.state().stats.total,1,'locked training cannot score the same measurement twice');
const lockedTicks=h.state().session.ticks;h.key('ArrowRight');assert.equal(h.state().session.ticks,lockedTicks,'answered position remains fixed');
h.click('[data-cp="eye"]');assertHidden(h,'hidden correction');assert.ok(!h.$('#cp-feedback').textContent.includes(answer),'hidden feedback does not leave the measurement visible');assert.equal(h.$('#cp-answer').value,'');
h.click('[data-cp="eye"]');assert.ok(h.$('#cp-feedback').textContent.includes(answer));
h.click('[data-cp="next"]');s=h.state().session;h.click('[data-cp="minimum"]');
const wrong=E.format(s.targetTicks===E.getResolution(s.config.resolutionKey).maxTicks?s.targetTicks-1:s.targetTicks+1,s.config.resolutionKey);
h.input('cp-answer',wrong);h.advance(1500);h.submit('cp-answer-form');
assert.equal(h.state().stats.total,2);assert.equal(h.state().stats.correct,1);assert.equal(h.state().stats.wrong,1);assert.equal(h.state().stats.points,20,'incorrect reading adds no points');
h.click('[data-cp="finish"]');assert.equal(h.state().stats.sessions,1);
const trainingSummary=JSON.stringify(h.state().stats);h.run('menu();');h.click('[data-mode="6"]');h.click('[data-cp="resume"]');assert.equal(JSON.stringify(h.state().stats),trainingSummary,'opening a completed summary is idempotent');

// Exam results remain private until the final response. Aggregate counters
// are applied exactly once, including after a page reload.
h.click('[data-cp="configure"]');h.choose('cp-assessment','exam');h.choose('cp-quantity','10');h.submit('cp-setup-form');
const beforeExam=h.state().stats;
for(let i=0;i<10;i++){
  assert.equal(h.document.querySelectorAll('[data-cp="hint"]').length,0,'exam has no hint button');
  assert.equal(h.document.querySelectorAll('.cp-guide').length,0,'exam has no reference guide before submission');
  assertHidden(h,'active exam');assert.equal(h.$('#cp-feedback').textContent,'','exam gives no correction between responses');
  const target=h.state().session.targetTicks,key=h.state().session.config.resolutionKey;
  h.click('[data-cp="minimum"]');const correct=i%3!==1;
  h.input('cp-answer',E.format(correct?target:target+1,key));h.advance(1250);h.submit('cp-answer-form');
  if(i<9){assert.equal(h.state().session.answered,i+1);assert.equal(JSON.stringify(h.state().stats),JSON.stringify(beforeExam),'exam score is deferred until completion');assert.equal(h.$('#cp-feedback').textContent,'');}
  if(i===4){
    const savedQuestion=h.state().session;h.run('menu();');
    h=harness(h.records,h.now()+2000);h.click('[data-mode="6"]');h.click('[data-cp="resume"]');
    assert.equal(h.state().session.answered,5,'reload preserves the number of recorded exam answers');
    assert.equal(h.state().session.targetTicks,savedQuestion.targetTicks,'reload resumes the same unanswered piece');
    assert.equal(h.state().session.ticks,savedQuestion.ticks,'reload preserves the manipulated opening');
    assert.equal(JSON.stringify(h.state().stats),JSON.stringify(beforeExam),'reloading an active exam does not apply pending results');
    assert.notEqual(h.$('#cp-clock').textContent,'00:00','the exam timer continues across reload');
  }
}
assert.equal(h.state().session.completed,true);assert.equal(h.state().session.examApplied,true);
assert.equal(h.state().stats.total,beforeExam.total+10);assert.equal(h.state().stats.correct,beforeExam.correct+7);assert.equal(h.state().stats.wrong,beforeExam.wrong+3);assert.equal(h.state().stats.points,beforeExam.points+155);
assert.equal(h.state().stats.sessions,beforeExam.sessions+1);assert.equal(h.intervals.size,0,'completed exam stops its interval');
const finalStats=JSON.stringify(h.state().stats);h.run('menu();');h=harness(h.records);h.click('[data-mode="6"]');h.click('[data-cp="resume"]');assert.equal(JSON.stringify(h.state().stats),finalStats,'reloaded completed exam is never applied again');

// Vertical geometry uses the same quantized state as horizontal geometry.
// Pointer movement may wait for one animation frame; keyboard movement may not.
for(const [type,resolution,forward] of [['depth','mm-002','ArrowDown'],['height','mm-002','ArrowUp']]){
  h.click('[data-cp="configure"]');h.activity('free');h.choose('cp-type',type);h.choose('cp-resolution',resolution);h.submit('cp-setup-form');
  h.key(forward);assert.equal(h.state().session.ticks,1,type+' keyboard follows the physical vertical direction');
  const handle=h.$('#cp-instrument-area').querySelector('[data-caliper-slider]'),axis=handle.getAttribute('data-drag-axis'),factor=Number(handle.getAttribute('data-drag-px-per-unit'));
  const event=(x,y)=>({target:handle,pointerId:14,clientX:x,clientY:y,preventDefault(){}});
  h.host().onpointerdown(event(0,0));h.host().onpointermove(event(axis==='x'?factor*.06:0,axis==='y'?factor*.06:0));
  h.flushFrames();h.host().onpointerup(event(0,0));assert.equal(h.state().session.ticks,4,type+' drag advances exactly three divisions');
  h.key('Home');assert.equal(h.state().session.ticks,0);h.key('End');assert.equal(h.state().session.ticks,7500);
}
assert.equal(h.records.get('moto-work-v1'),personal,'all caliper activity leaves the saved welding progress byte-for-byte unchanged');
h.run('menu();');assert.equal(h.document.querySelectorAll('[data-mode]').length,6);assert.equal(h.$('#stats').hidden,false);
console.log('PASS: six-game menu; free typed/keyboard/drag positioning, hidden readings and status, contact grading, training/exam scoring and idempotency, resume after reload, vertical geometry and unchanged welding progress.');
