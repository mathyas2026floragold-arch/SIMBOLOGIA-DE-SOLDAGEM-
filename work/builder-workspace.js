// Shared assembly workspace for the standard and added welding families.
function renderSymbolBuilder(spec){
  $('#toast').textContent='';
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const keys=[...spec.keys],special=!!spec.special;
  const fieldAttr=special?'data-special-field':'data-field';
  const basicAttr=special?'data-special-basic':'data-basic';
  const fieldData=special?'specialField':'field',basicData=special?'specialBasic':'basic';
  const liveId=special?'special-live':'live',submitId=special?'special-submit':'submit';
  const fieldSelector=`[${fieldAttr}]`,basicSelector=`[${basicAttr}]`;
  const values={};
  keys.forEach(key=>values[key]=(spec.values[key]||[]).map(String));
  const paletteTypes=[...new Set(values.type||[])];
  if(keys.includes('type'))values.type=paletteTypes;
  const standardTypes=['Filete','Reto','V','X','Bisel','K','U','Duplo U','J','Duplo J'];
  const family=type=>standardTypes.includes(type)?'basic':'specific';
  const label=key=>spec.labels[key]||key;
  const display=(key,value)=>{
    if(value==='')return 'Não escolhido';
    const result=spec.format?spec.format(key,value):value;
    return String(result??value);
  };
  const groups=[
    {id:'geometry',title:'Organize as peças',hint:'Traduza a disposição descrita no texto.',keys:keys.filter(key=>key==='joint')},
    {id:'basic',title:keys.includes('side')?'Solda e lado':'Escolha a solda',hint:keys.includes('side')?'Escolha o símbolo da solda e seu lado de execução.':'Escolha o símbolo solicitado na descrição.',keys:keys.filter(key=>['type','side'].includes(key))},
    {id:'measure',title:'Medidas',hint:'Use as dimensões indicadas na ordem de serviço.',keys:keys.filter(key=>['size','length','pitch','root','angle','face','effective','thickness','count'].includes(key))},
    {id:'extra',title:'Complementos',hint:'Complete o acabamento e as exigências de execução.',keys:keys.filter(key=>!['joint','type','side','size','length','pitch','root','angle','face','effective','thickness','count'].includes(key))}
  ].filter(group=>group.keys.length);
  const control=key=>`<label class="builder-control" data-builder-control="${escape(key)}"><span>${escape(label(key))}</span><select ${fieldAttr}="${escape(key)}" aria-invalid="false"><option value="">Escolha…</option>${values[key].map(value=>`<option value="${escape(value)}">${escape(display(key,value))}</option>`).join('')}</select><small class="builder-field-error">Escolha uma opção.</small></label>`;
  const palette=`<div class="builder-palette-tools">${paletteTypes.some(type=>family(type)==='specific')?'<div class="builder-filters" role="group" aria-label="Filtrar famílias de símbolos"><button type="button" data-builder-filter="all" aria-pressed="true">Todos</button><button type="button" data-builder-filter="basic" aria-pressed="false">Filete e chanfros</button><button type="button" data-builder-filter="specific" aria-pressed="false">Específicas</button></div>':''}<small id="builder-filter-count">${paletteTypes.length} símbolos</small></div><div class="builder-palette" id="builder-palette">${paletteTypes.map(type=>`<button type="button" class="builder-basic-card" ${basicAttr}="${escape(type)}" data-builder-family="${family(type)}" aria-pressed="false" aria-label="Selecionar ${escape(type)}">${svg(`<g transform="translate(18 49)"><path class="builder-mini-reference" d="M-10 0 H68"/>${glyph(type)}</g>`,type,'0 0 100 100')}<span>${escape(type)}</span></button>`).join('')}</div><p class="builder-palette-selection" id="builder-palette-selection">Nenhum símbolo selecionado.</p>`;
  const jointPalette=keys.includes('joint')?`<div class="builder-joint-palette" aria-label="Disposição das peças">${values.joint.map(joint=>`<button type="button" data-builder-joint="${escape(joint)}" aria-pressed="false" aria-label="Dispor peças: ${escape(display('joint',joint))}">${assemblyJointDrawing(joint)}<span>${escape(display('joint',joint))}</span></button>`).join('')}</div>`:'';
  const previewTabs=spec.preview?'<div class="builder-preview-tabs" role="group" aria-label="Vista da construção"><button type="button" data-builder-view="drawing" aria-pressed="true">Desenho da peça</button><button type="button" data-builder-view="symbol" aria-pressed="false">Simbologia</button></div>':'';
  let previewView='drawing';
  $('#work').innerHTML=`<section class="symbol-builder" aria-label="Bancada de construção do desenho"><div class="builder-workspace-head"><div><span class="eyebrow">Sua bancada de montagem</span><h3>Transforme a descrição em desenho.</h3><p>Organize as peças e acrescente a solda descrita no texto.</p></div><div class="builder-completion"><strong id="builder-count">0/${keys.length} escolhas</strong><progress id="builder-fill" max="${keys.length}" value="0" aria-label="Campos preenchidos"></progress></div></div><div class="builder-workspace"><div class="builder-workspace-options">${groups.map((group,index)=>`<section class="builder-step" data-builder-group="${group.id}" aria-label="Etapa ${index+1}: ${group.title}"><div class="builder-step-head"><span class="builder-step-number">${String(index+1).padStart(2,'0')}</span><div><h3>${group.title}</h3><p>${group.hint}</p></div><small data-builder-group-count="${group.id}">0/${group.keys.length}</small></div>${group.id==='geometry'?jointPalette:group.id==='basic'?palette:''}<div class="builder-fields">${group.keys.map(control).join('')}</div></section>`).join('')}</div><aside class="builder-workspace-preview" aria-label="Prévia da sua montagem"><div class="builder-preview-head"><span class="eyebrow">Seu desenho</span><span class="builder-draft" id="builder-draft">Em construção</span></div>${previewTabs}<div class="builder-canvas" id="${liveId}"></div><div class="builder-preview-footer"><p id="builder-pending" aria-live="polite">Comece pelo símbolo básico.</p><small>A prévia mostra as suas escolhas. Confira a ordem de serviço antes de enviar.</small></div><div class="builder-workspace-actions"><button type="button" class="primary" id="${submitId}">Conferir desenho</button><button type="button" id="builder-reset">Limpar montagem</button></div></aside></div><div class="builder-mobile-submit"><span id="builder-count-bottom">0/${keys.length} escolhas</span><button type="button" class="primary" id="builder-submit-bottom">Conferir minhas escolhas</button></div></section>`;
  let triedSubmit=false;
  const isLocked=()=>typeof locked!=='undefined'&&locked;
  const read=()=>{
    const result={};
    app.querySelectorAll(fieldSelector).forEach(select=>result[select.dataset[fieldData]]=select.value);
    return result;
  };
  const update=()=>{
    const selection=read(),missing=keys.filter(key=>!selection[key]),filled=keys.length-missing.length;
    $('#builder-count').textContent=`${filled}/${keys.length} escolhas`;
    $('#builder-count-bottom').textContent=`${filled}/${keys.length} escolhas`;
    $('#builder-fill').setAttribute('value',String(filled));
    $('#builder-draft').textContent=missing.length?'Em construção':'Pronta para conferir';
    $('#builder-draft').className='builder-draft'+(missing.length?'':' complete');
    $('#builder-pending').textContent=missing.length?((selection.joint||selection.type)?`Próxima escolha: ${label(missing[0])}.`:'Comece pela disposição das peças.'):'Todos os campos preenchidos. Confira sua montagem com a OS.';
    $('#builder-palette-selection').textContent=selection.type?`Selecionado: ${selection.type}.`:'Nenhum símbolo selecionado.';
    $('#'+liveId).innerHTML=spec.preview?spec.preview(spec.toConfig(selection),previewView):selection.type?symbol(spec.toConfig(selection)):'<div class="builder-empty"><span class="builder-empty-icon" aria-hidden="true">↳</span><strong>Sua indicação aparece aqui</strong><p>Escolha um símbolo na paleta para começar.</p></div>';
    app.querySelectorAll('[data-builder-joint]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.builderJoint===selection.joint)));
    app.querySelectorAll('[data-builder-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.builderView===previewView)));
    app.querySelectorAll(basicSelector).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset[basicData]===selection.type)));
    app.querySelectorAll(fieldSelector).forEach(select=>{
      const key=select.dataset[fieldData],invalid=triedSubmit&&!selection[key];
      select.setAttribute('aria-invalid',String(invalid));
      const wrapper=app.querySelector(`[data-builder-control="${key}"]`);
      if(wrapper)wrapper.className='builder-control'+(invalid?' missing':'');
    });
    groups.forEach(group=>{
      const count=group.keys.filter(key=>selection[key]).length;
      const marker=app.querySelector(`[data-builder-group-count="${group.id}"]`);
      if(marker)marker.textContent=`${count}/${group.keys.length}`;
      const section=app.querySelector(`[data-builder-group="${group.id}"]`);
      if(section)section.className='builder-step'+(count===group.keys.length?' complete':'');
    });
    return selection;
  };
  const applyFilter=value=>{
    let visible=0;
    app.querySelectorAll(basicSelector).forEach(button=>{
      const show=value==='all'||family(button.dataset[basicData])===value;
      button.className='builder-basic-card'+(show?'':' is-hidden');
      button.setAttribute('aria-hidden',String(!show));
      button.setAttribute('tabindex',show?'0':'-1');
      if(show)visible++;
    });
    app.querySelectorAll('[data-builder-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.builderFilter===value)));
    $('#builder-filter-count').textContent=`${visible} ${visible===1?'símbolo':'símbolos'}`;
  };
  app.querySelectorAll(fieldSelector).forEach(select=>select.onchange=()=>{
    if(isLocked())return;
    update();
    if(triedSubmit)$('#toast').textContent=keys.some(key=>!read()[key])?'Complete os campos destacados antes de conferir.':'';
  });
  app.querySelectorAll(basicSelector).forEach(button=>button.onclick=()=>{
    if(isLocked())return;
    const select=app.querySelector(`[${fieldAttr}="type"]`);
    if(select){select.value=button.dataset[basicData];select.onchange();}
  });
  app.querySelectorAll('[data-builder-filter]').forEach(button=>button.onclick=()=>{if(!isLocked())applyFilter(button.dataset.builderFilter);});
  app.querySelectorAll('[data-builder-joint]').forEach(button=>button.onclick=()=>{if(isLocked())return;const select=app.querySelector(`[${fieldAttr}="joint"]`);if(select){select.value=button.dataset.builderJoint;select.onchange();}});
  app.querySelectorAll('[data-builder-view]').forEach(button=>button.onclick=()=>{if(isLocked())return;previewView=button.dataset.builderView;update();});
  const reset=()=>{
    if(isLocked())return;
    app.querySelectorAll(fieldSelector).forEach(select=>select.value='');
    triedSubmit=false;previewView='drawing';$('#toast').textContent='';
    delete q.mine;delete q.builderReview;q.explain='';
    applyFilter('all');update();
  };
  $('#builder-reset').onclick=reset;
  $('#'+submitId).onclick=()=>{
    if(isLocked())return;
    triedSubmit=true;
    const selection=update(),missing=keys.filter(key=>!selection[key]);
    if(missing.length){
      $('#toast').textContent=`Faltam ${missing.length} ${missing.length===1?'escolha':'escolhas'}. Complete os campos destacados.`;
      return;
    }
    $('#toast').textContent='';
    const errors=keys.filter(key=>selection[key]!==String(spec.expected(key)));
    q.mine=spec.reviewVisual?spec.reviewVisual(spec.toConfig(selection)):symbol(spec.toConfig(selection));
    q.explain=errors.length?'Revise os campos indicados na conferência da montagem.':'Sua montagem atende aos requisitos da ordem de serviço.';
    q.builderReview=`<div class="builder-review"><table><caption>Conferência do seu desenho</caption><thead><tr><th scope="col">Campo</th><th scope="col">Sua escolha</th><th scope="col">Esperado</th><th scope="col">Resultado</th></tr></thead><tbody>${keys.map(key=>{const correct=!errors.includes(key);return `<tr data-builder-review="${correct?'correct':'wrong'}"><th scope="row">${escape(label(key))}</th><td>${escape(display(key,selection[key]))}</td><td>${escape(display(key,String(spec.expected(key))))}</td><td><span class="builder-review-status ${correct?'correct':'wrong'}">${correct?'✓ Correto':'↺ Ajustar'}</span></td></tr>`;}).join('')}</tbody></table></div>`;
    grade(errors.length?'incorreto':'correto',null,[],'correto');
  };
  $('#builder-submit-bottom').onclick=()=>$('#'+submitId).onclick();
  update();
  return {read,update,reset};
}
