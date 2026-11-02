// Spatial reading of a welding symbol and of a fillet cross-section.
// The symbol plate is a location map, not a single fabrication requirement.
const anatomyParts={
  symbol:[
    {id:'reference',term:'Linha de referência',tier:2,region:[272,218,338,24],prompt:'Como se chama a linha horizontal destacada?',wrong:['Seta de indicação','Cauda da indicação','Símbolo básico da solda'],explain:'A linha de referência organiza os elementos da indicação. Na convenção de linha única usada no jogo, os símbolos abaixo dela referem-se ao lado da seta.'},
    {id:'arrow',term:'Seta de indicação',tier:2,region:[94,229,123,121],prompt:'Qual elemento aponta para a junta ou região a soldar?',wrong:['Linha de referência','Símbolo de contorno','Cauda da indicação'],explain:'A seta liga a indicação à junta, peça ou região correspondente no desenho. Ela não é a seta de avanço da solda nem o vetor de gravidade.'},
    {id:'basic',term:'Símbolo básico da solda',tier:2,region:[414,224,50,50],prompt:'Qual função tem o elemento geométrico destacado?',wrong:['Método de acabamento','Símbolo de contorno','Número de soldas'],explain:'O símbolo básico identifica a família ou o tipo de solda. Ele não determina, sozinho, a configuração da junta nem sua posição em relação à gravidade.'},
    {id:'length',term:'Comprimento do trecho',tier:2,region:[509,235,26,34],prompt:'O que representa L na posição destacada?',wrong:['Passo entre centros','Abertura da raiz','Profundidade da preparação'],explain:'L é o comprimento de cada trecho. Quando há indicação L–P, o primeiro valor à direita do símbolo é o comprimento; o segundo é o passo.'},
    {id:'pitch',term:'Passo entre centros',tier:2,region:[550,235,35,34],prompt:'O que representa P na posição destacada?',wrong:['Comprimento do trecho','Distância livre entre os trechos','Perna do filete'],explain:'O passo P é a distância entre centros de trechos consecutivos. Ele não é o vão livre entre o fim de um trecho e o começo do seguinte.'},
    {id:'contour',term:'Símbolo de contorno',tier:2,region:[413,299,51,18],prompt:'Qual informação é transmitida pelo traço suplementar destacado?',wrong:['Método de acabamento','Linha de referência','Ângulo do chanfro'],explain:'O traço suplementar indica o contorno solicitado: plano, convexo ou côncavo. A letra de acabamento, quando presente, especifica o método para obter esse contorno.'},
    {id:'depth',term:'Profundidade S e tamanho efetivo E',tier:3,region:[308,235,94,35],prompt:'Qual par de informações ocupa a posição S(E)?',wrong:['Comprimento e passo dos trechos','Ângulo e abertura da raiz','Quantidade e diâmetro de pontos'],explain:'Na notação S(E) adotada neste material, S é a profundidade da preparação e E, entre parênteses, é o tamanho efetivo solicitado para a solda em chanfro. Não são duas medidas de comprimento da junta.'},
    {id:'opening',term:'Abertura da raiz',tier:3,region:[428,237,22,26],prompt:'Que dimensão é indicada por R nesta posição interna?',wrong:['Face da raiz','Ângulo do chanfro','Tamanho efetivo da solda'],explain:'R localiza a abertura da raiz: o afastamento entre as peças na raiz da junta. A face da raiz é outra dimensão e deve ser cotada no detalhe da preparação. Não confunda este marcador de abertura com a letra R dentro do retângulo de backing, que solicita retirar o apoio após a soldagem.'},
    {id:'angle',term:'Ângulo do chanfro',tier:3,region:[427,271,24,28],prompt:'Qual dimensão angular ocupa a região A?',wrong:['Abertura da raiz','Ângulo da seta de indicação','Ângulo de trabalho da tocha'],explain:'A é a posição reservada ao ângulo da preparação indicado no símbolo. Em V, o ângulo incluído é medido entre as faces preparadas; não é o ângulo de trabalho da tocha.'},
    {id:'finish',term:'Método de acabamento',tier:3,region:[427,316,24,26],prompt:'Qual informação é colocada na posição F, junto ao contorno?',wrong:['Família de posições de filete','Quantidade de soldas','Face da raiz'],explain:'F é um marcador de localização do método de acabamento neste mapa; não é uma letra de processo a executar. Na indicação real, G pode indicar esmerilhamento e M, usinagem.'},
    {id:'tail',term:'Cauda da indicação',tier:3,region:[641,188,96,79],prompt:'Como se chama a bifurcação destacada na extremidade da linha?',wrong:['Seta de indicação','Símbolo de todo contorno','Linha de cotagem'],explain:'A cauda permite acrescentar referências, processos e outras instruções. Ela pode ser omitida quando não há informação desse tipo a registrar.'},
    {id:'process',term:'Processo ou referência na cauda',tier:3,region:[649,275,110,34],prompt:'Que tipo de informação está associado ao texto junto à cauda?',wrong:['Perna e garganta do filete','Comprimento e passo dos trechos','Abertura e face da raiz'],explain:'A cauda pode registrar a abreviatura do processo e uma referência a detalhe, especificação ou documento. A escolha do processo não altera a regra de lado da seta e lado oposto.'},
    {id:'field',term:'Soldagem em campo',tier:3,region:[198,138,56,70],prompt:'O que indica a bandeira destacada?',wrong:['Soldagem em todo contorno','Solda no reverso','Acabamento por usinagem'],explain:'A bandeira indica que a soldagem deve ser executada em campo, no local de montagem. Ela não é uma indicação de posição vertical ou de sentido de avanço.'},
    {id:'all',term:'Soldagem em todo contorno',tier:3,region:[196,216,29,29],prompt:'O que indica o círculo na junção da seta com a referência?',wrong:['Solda a ponto','Contorno convexo','Soldagem em campo'],explain:'O círculo nessa junção solicita soldagem ao redor de todo o contorno da junta indicada. Um círculo em outra posição pode pertencer a um símbolo básico diferente.'},
    {id:'count',term:'Número de soldas',tier:3,region:[522,274,47,30],prompt:'O que representa N, entre parênteses, na região destacada?',wrong:['Passo entre centros','Profundidade da preparação','Número de revisão do desenho'],explain:'A posição (N) é usada para indicar a quantidade de soldas nas famílias em que ela se aplica, como pontos ou tampões. Este mapa reúne posições possíveis, e não solicita todos esses elementos para uma única solda.'}
  ],
  fillet:[
    {id:'leg-horizontal',term:'Perna horizontal do filete',tier:2,region:[248,348,226,35],prompt:'Qual dimensão do filete está destacada na base?',wrong:['Garganta teórica','Convexidade','Abertura da raiz'],explain:'A perna horizontal vai da raiz ao pé da solda sobre a chapa horizontal. Ela é medida sobre a superfície da peça, não sobre a face curva do cordão.'},
    {id:'leg-vertical',term:'Perna vertical do filete',tier:2,region:[202,118,36,226],prompt:'Qual dimensão do filete está destacada ao lado da chapa vertical?',wrong:['Garganta teórica','Espessura da chapa horizontal','Convexidade'],explain:'A perna vertical vai da raiz ao pé da solda sobre a chapa vertical. Neste desenho as duas pernas são iguais, mas uma indicação real pode solicitar pernas diferentes.'},
    {id:'face',term:'Face real da solda',tier:2,region:[306,148,152,142],prompt:'Que superfície está destacada no exterior do cordão?',wrong:['Face da raiz','Garganta teórica','Superfície da chapa-base'],explain:'A face real é a superfície exposta do metal de solda entre os pés do cordão. A linha reta tracejada é uma referência teórica e não acompanha esta face convexa.'},
    {id:'root',term:'Raiz da solda',tier:2,region:[246,316,29,29],prompt:'Como se chama o encontro das duas superfícies sob o filete?',wrong:['Pé da solda','Face real da solda','Topo do reforço'],explain:'A raiz fica no encontro das superfícies das duas peças sob o filete. Ela não deve ser confundida com os pés, que são os encontros da face exposta da solda com as peças.'},
    {id:'throat',term:'Garganta teórica',tier:3,region:[285,251,54,54],prompt:'Qual medida liga a raiz perpendicularmente à face teórica?',wrong:['Perna vertical do filete','Convexidade','Comprimento do cordão'],explain:'A garganta teórica a é a menor distância da raiz à linha reta que une os pés do filete ideal. Em um filete de pernas iguais a 90°, a ≈ 0,707 × perna. O segmento termina na face teórica: a convexidade não é somada. A garganta efetiva deve ser definida considerando a geometria útil e a penetração aplicável; não é automaticamente a distância até a face convexa.'},
    {id:'convexity',term:'Convexidade',tier:3,region:[350,200,43,43],prompt:'Que altura está destacada entre a linha teórica e a face curva?',wrong:['Garganta teórica','Perna horizontal do filete','Face da raiz'],explain:'A convexidade é o afastamento da face real em relação à linha reta que une os pés, medido perpendicularmente a essa referência. O destaque está no meio da face, afastado das pernas; ele não representa a garganta teórica.'}
  ]
};
for(const parts of Object.values(anatomyParts))for(const part of parts)part.choices=[part.term,...part.wrong];

function shouldAnatomyDetective(){
  if(retry||difficultyFor(2)<2)return false;
  const mix=mixFor(2);mix.anatomyTurn=(mix.anatomyTurn||0)+1;
  return mix.anatomyTurn%4===0;
}

function anatomyDrawing(kind,focusId,answered=false){
  const part=anatomyParts[kind]?.find(p=>p.id===focusId);
  if(!part)return '';
  const [x,y,w,h]=part.region;
  const focus=`<g class="anatomy-focus" data-anatomy-focus="${focusId}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/><circle cx="${x+w+8}" cy="${y-5}" r="9"/><text x="${x+w+8}" y="${y-1}" text-anchor="middle">?</text></g>`;
  const answer=answered?`<g class="anatomy-label"><rect x="18" y="${kind==='symbol'?366:400}" width="724" height="39" rx="8"/><text x="35" y="${kind==='symbol'?391:425}">${part.term}</text></g>`:'';
  let content='';
  if(kind==='symbol'){
    content=`<path class="wire" d="M105 335 L210 230 H650 M105 335 l5 -21 M105 335 l21 -7 M650 230 l72 -32 M650 230 l72 32"/>
      <path class="wire" d="M210 230 V148 L244 160 L210 175"/><circle class="wire" cx="210" cy="230" r="10"/>
      <path class="wire" d="M422 230 L439 268 L456 230 M419 307 H459"/>
      <text class="anatomy-token" x="315" y="258">S(E)</text><text class="anatomy-token" x="432" y="257">R</text>
      <text class="anatomy-token" x="431" y="292">A</text><text class="anatomy-token" x="431" y="337">F</text>
      <text class="anatomy-token" x="517" y="258">L</text><text class="anatomy-token" x="538" y="258">–</text><text class="anatomy-token" x="558" y="258">P</text>
      <text class="anatomy-token" x="530" y="297">(N)</text><text class="anatomy-token anatomy-tail-token" x="658" y="298">GMAW / DET. A</text>
      <path class="anatomy-guide" d="M701 269 V277"/>`;
  }else{
    content=`<path class="metal" d="M150 330 H590 V350 H150 Z M240 70 H260 V330 H240 Z"/>
      <path class="weld" d="M260 330 V130 Q400 190 460 330 Z"/>
      <path class="anatomy-theory" d="M260 130 L460 330"/>
      <path class="anatomy-face" d="M260 130 Q400 190 460 330"/>
      <path class="anatomy-leg" d="M260 342 V373 M460 342 V373 M260 364 H460 M260 364 l10 -5 M260 364 l10 5 M460 364 l-10 -5 M460 364 l-10 5 M229 130 H211 M229 330 H211 M220 130 V330 M220 130 l-5 10 M220 130 l5 10 M220 330 l-5 -10 M220 330 l5 -10"/>
      <path class="anatomy-throat" d="M260 330 L360 230 M354 224 L348 230 L354 236"/>
      <path class="anatomy-convexity" d="M360 230 L380 210 M360 230 l1 -8 M360 230 l8 -1 M380 210 l-1 8 M380 210 l-8 1"/>
      <circle class="anatomy-root" cx="260" cy="330" r="5"/>
      <circle class="anatomy-toe" cx="260" cy="130" r="3"/><circle class="anatomy-toe" cx="460" cy="330" r="3"/>`;
    if(focusId==='face')content+='<path class="anatomy-selected-line" d="M260 130 Q400 190 460 330"/>';
    if(focusId==='throat')content+='<path class="anatomy-selected-line" d="M260 330 L360 230"/>';
    if(focusId==='convexity')content+='<path class="anatomy-selected-line" d="M360 230 L380 210"/>';
  }
  return `<svg class="anatomy-diagram" data-anatomy-kind="${kind}" viewBox="${kind==='symbol'?'0 125 780 295':'0 50 780 400'}" role="img" aria-label="Desenho de estudo com uma parte destacada">${content}${focus}${answer}</svg>`;
}

function anatomyDetective(inputKind){
  if(!detect?.anatomy){
    const mix=mixFor(2),kind=inputKind||((mix.anatomyKindTurn||0)%2?'fillet':'symbol');
    mix.anatomyKindTurn=(mix.anatomyKindTurn||0)+1;
    const available=anatomyParts[kind].filter(p=>p.tier<=Math.max(2,difficultyFor(2)));
    mix.anatomyQueues=mix.anatomyQueues||{};
    let queue=(mix.anatomyQueues[kind]||[]).filter(id=>available.some(p=>p.id===id));
    // Include newly unlocked parts before refilling with already seen ones.
    const known=new Set(queue),previous=mix['anatomyEligible_'+kind]||[];
    queue.push(...shuffle(available.filter(p=>!known.has(p.id)&&!previous.includes(p.id)).map(p=>p.id)));
    const count=Math.min(4,available.length),focusIds=[];
    while(focusIds.length<count){
      if(!queue.length)queue=shuffle(available.map(p=>p.id).filter(id=>!focusIds.includes(id)));
      const id=queue.shift();if(!focusIds.includes(id))focusIds.push(id);
    }
    mix.anatomyQueues[kind]=queue;mix['anatomyEligible_'+kind]=available.map(p=>p.id);
    const steps=focusIds.map(id=>{const p=available.find(p=>p.id===id);return [p.prompt,p.term,p.choices,p.explain];});
    detect={anatomy:true,kind,index:0,steps,focusIds};
  }
  const d=detect,focusId=d.focusIds[d.index];
  const [prompt,answer,choices,explain]=d.steps[d.index];
  q={detect:true,anatomy:true,anatomyKind:d.kind,anatomyFocus:focusId,image:false,explain,correctVisual:anatomyDrawing(d.kind,focusId,true)};
  const caveat=d.kind==='symbol'?'Mapa de localização: nem todos os elementos se aplicam à mesma solda. S, E, R, A, F, L, P e N são marcadores de posição neste mapa.':'Corte esquemático de um filete de pernas iguais a 90°. O traço tracejado é uma referência geométrica; o perfil curvo representa o cordão executado.';
  shell(prompt,`<div class="anatomy-context"><span class="eyebrow">Investigação do desenho</span><p>${caveat}</p></div>${anatomyDrawing(d.kind,focusId)}<small>Elemento ${d.index+1}/${d.steps.length} · observe somente a região azul destacada</small>`);
  options(shuffle(choices),answer);
}
