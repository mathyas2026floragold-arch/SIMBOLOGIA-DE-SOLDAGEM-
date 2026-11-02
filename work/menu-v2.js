function menu(){
  window.scrollTo(0,0);mode=0;locked=false;retry=null;detect=null;stats();
  const heroDrawing=svg(
    '<path class="metal" d="M55 155 L246 155 L334 109 L143 109 Z"/>'+
    '<path class="metal" d="M146 112 L234 66 L234 12 L146 58 Z"/>'+
    '<path class="weld" d="M146 111 L234 65 L244 73 L158 120 Z"/>'+
    line('M271 40 H379 M271 40 L242 82 M242 82 l4 -12 M242 82 l12 -4')+
    line('M306 40 v23 l23 -23')+
    txt(283,64,'6')+
    line('M64 180 H247 M64 174 V186 M247 174 V186','dim')+
    txt(136,201,'200 mm')+
    txt(53,28,'MW / DESENHO 01','note')+
    txt(283,103,'SÍMBOLO','note')+
    txt(77,224,'DA LINHA À PEÇA.','note'),
    'Desenho original de junta em T com filete e indicação de soldagem','0 0 420 240');
  const previews=[symbol({type:'V',size:8,angle:60}),symbol({type:'Filete',side:'ambos',size:6,length:40,pitch:100}),symbol({type:'Filete',field:true,all:true,contour:'Convexo'}),symbol({type:'Filete',size:6})+cut({type:'Filete',size:6}),position('1F',.05)];
  const descriptions=['Encontre a solda certa para cada símbolo — e faça o caminho inverso.','Explore os detalhes do desenho e descubra o que cada marca pede.','Escolha as peças, combine os elementos e construa sua indicação.','Compare projeto e execução. Aprove a peça ou encontre a divergência.','Observe a orientação da peça e reconheça 1F–4F e 1G–4G.'];
  app.innerHTML=`<div class="hero"><div><span class="eyebrow">Seu laboratório de soldagem</span><h2>Olhe o símbolo.<br>Visualize a solda.</h2><p>Treine seu olhar de fabricação com desenhos, desafios rápidos e correção na hora.</p><div class="hero-tags"><span>5 jogos interativos</span><span>Desenhos originais</span><span>Uma questão por vez</span></div></div><div class="hero-art">${heroDrawing}</div></div><div class="menu-heading"><div><h2>Qual desafio você vai encarar?</h2><p>Escolha um jogo. Seu progresso vale em todos eles.</p></div><span class="menu-counter">05 BANCADAS DE TREINO</span></div><div class="menu">${names.slice(1).map((name,i)=>`<button class="mode" data-mode="${i+1}" type="button"><span class="mode-head"><span class="num">JOGO 0${i+1}</span><span class="mode-arrow" aria-hidden="true">↗</span></span><span class="game-preview ${i===3?'double':''}" aria-hidden="true">${previews[i]}</span><span class="mode-body"><h3>${name}</h3><small>${descriptions[i]}</small><span class="mode-cta"><span>Começar desafio</span><span aria-hidden="true">→</span></span></span></button>`).join('')}</div>`;
  app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>start(+b.dataset.mode));
}
