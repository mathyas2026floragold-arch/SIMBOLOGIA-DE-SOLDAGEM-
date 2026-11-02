const builderJointChoices=['Topo','T','Canto','Sobreposta','Borda','Superfícies curvas','Curva/plano','Superfície'];
function builderJointLabel(joint){return ({T:'T / ângulo',Borda:'Aresta / borda','Superfícies curvas':'Duas superfícies convexas','Curva/plano':'Superfície convexa e chapa plana',Superfície:'Superfície de uma peça'})[joint]||joint;}
function constructionPreview(c,view='drawing'){
  if(!c.joint)return '<div class="builder-empty"><span class="builder-empty-icon" aria-hidden="true">↳</span><strong>Seu desenho começa pelas peças</strong><p>Leia a descrição e escolha a disposição das peças.</p></div>';
  if(view==='symbol')return c.type?symbol(c):'<div class="builder-empty"><strong>Escolha a solda para criar sua indicação.</strong><p>A simbologia acompanhará as suas escolhas.</p></div>';
  return constructionDrawing(c);
}
function constructionResult(c){
  return `<div class="construction-result"><section><h4>Peça e solda</h4>${constructionDrawing(c)}</section><section><h4>Indicação de soldagem</h4>${c.type?symbol(c):'<p>Sem símbolo escolhido.</p>'}</section></div>`;
}
