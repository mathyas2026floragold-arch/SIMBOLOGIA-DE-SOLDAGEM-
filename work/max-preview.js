let previewActive=false,personalProgress=null,maxPreviewFirst=false;
const maxPreviewRequested=typeof location!=='undefined'&&new URLSearchParams(location.search).get('nivel')==='maximo';
function enterMaxPreview(){
  if(!previewActive){
    personalProgress={...state,master:{...state.master},seen:{...state.seen}};
    state={...state,xp:thresholds[thresholds.length-1],total:0,right:0,streak:0,master:{1:44,2:44,3:44,4:44,5:44},seen:{}};
    previewActive=true;
  }
  maxPreviewFirst=true;stats();start(3);
}
function exitMaxPreview(){
  if(!previewActive)return;
  state=personalProgress;
  try{const latest=JSON.parse(localStorage.getItem(KEY));if(latest&&typeof latest.xp==='number'&&latest.master&&latest.seen)state={...state,...latest};}catch(e){}
  personalProgress=null;previewActive=false;maxPreviewFirst=false;
  if(typeof location!=='undefined')try{const url=new URL(location.href);url.searchParams.delete('nivel');history.replaceState(null,'',url.href);}catch(e){}
  menu();
}
function renderPreviewNotice(){
  $('#preview-notice').innerHTML=previewActive?'<div class="max-preview-banner"><div><strong>PRÉVIA · NÍVEL 12 — REFERÊNCIA TÉCNICA</strong><p>14.500 XP demonstrativos · dificuldade máxima. As respostas desta prévia não alteram seu progresso salvo.</p></div><button type="button" id="exit-preview">Voltar ao meu progresso</button></div>':'';
  const back=$('#exit-preview');if(back)back.onclick=exitMaxPreview;
  $('#reset').disabled=previewActive;
}
