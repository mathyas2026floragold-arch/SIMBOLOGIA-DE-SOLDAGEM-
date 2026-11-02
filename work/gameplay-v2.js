function config() {
  const tier = Math.min(2, Math.floor((state.master[mode] || 0) / 4));
  const basic = ['Reto', 'V', 'Bisel'];
  const type = Math.random() < (tier ? .45 : .65) ? 'Filete' : pick(tier ? grooveNames : basic);
  const double = ['X', 'K', 'Duplo U', 'Duplo J'].includes(type);
  const fillet = type === 'Filete';
  const joint = fillet ? pick(['T', 'T', 'Canto', 'Sobreposta']) : 'Topo';
  const c = {
    type, joint,
    side: double ? 'ambos' : joint === 'Canto' || joint === 'Sobreposta' ? 'seta' : pick(['seta', 'oposto', ...(fillet ? ['ambos'] : [])]),
    size: pick(fillet ? [4, 5, 6, 8] : [6, 8, 10]),
    length: fillet && Math.random() < .75 ? pick([30, 40, 50, 60]) : 0,
    pitch: 0,
    contour: fillet ? pick(['Plano', 'Convexo', 'Côncavo']) : (tier ? pick(['Plano', 'Convexo']) : ''),
    finish: '', field: false, all: false, backing: false, melt: false
  };
  if (c.length) c.pitch = pick([80, 100, 120, 150]);
  if (tier && c.contour && Math.random() < .5) c.finish = pick(['G', 'M']);
  if (tier && Math.random() < .35) c.field = true;
  if (tier && fillet && joint === 'T' && Math.random() < .25) c.all = true;
  if (!fillet && tier) {
    c.root = pick([2, 3, 4]);
    c.face = pick([1, 2, 3]);
    if (['V', 'Bisel', 'X', 'K'].includes(type)) c.angle = pick([45, 60, 70]);
    if (!double && type !== 'Reto' && Math.random() < .4) {
      c.backing = Math.random() < .5;
      c.melt = !c.backing;
    }
  }
  return c;
}

const fields = {
  type: ['Filete', ...grooveNames], side: ['seta', 'oposto', 'ambos'],
  size: ['4', '5', '6', '8', '10'], length: ['0', '30', '40', '50', '60'],
  pitch: ['0', '80', '100', '120', '150'], contour: ['Sem contorno', 'Plano', 'Convexo', 'Côncavo'],
  finish: ['Sem método', 'G', 'M'], root: ['2', '3', '4'], angle: ['45', '60', '70'],
  field: ['Não', 'Sim'], all: ['Não', 'Sim'], backing: ['Não', 'Sim'], melt: ['Não', 'Sim']
};
const labels = {
  type: 'Símbolo básico', side: 'Lado da linha', size: 'Dimensão (mm)',
  length: 'Comprimento do trecho (mm)', pitch: 'Passo entre centros (mm)',
  contour: 'Contorno', finish: 'Método de acabamento', root: 'Abertura da raiz (mm)',
  angle: 'Ângulo do chanfro (°)', field: 'Solda em campo', all: 'Todo contorno',
  backing: 'Material de apoio · backing', melt: 'Melt-through'
};
const sideLabels = { seta: 'Abaixo · lado da seta', oposto: 'Acima · lado oposto', ambos: 'Acima e abaixo · ambos' };

function gameplayNumberOptions(value, unit = ' mm') {
  const values = [...new Set([value, Math.max(1, value - 2), value + 2, value + 4])];
  return shuffle(values).slice(0, 4).map(x => x + unit);
}

function detective() {
  if (!detect) {
    const c = config();
    const fillet = c.type === 'Filete';
    const typeOptions = [c.type, ...shuffle(['Filete', ...grooveNames].filter(x => x !== c.type)).slice(0, 3)];
    const base = [
      ['Qual é o tipo de junta?', c.joint, ['Topo', 'T', 'Canto', 'Sobreposta'], 'Observe a disposição das chapas no corte, e não apenas o metal de adição.'],
      ['Qual tipo de solda o símbolo solicita?', c.type, typeOptions, 'Compare a geometria do símbolo com a preparação da junta.'],
      ['Em qual lado a solda foi indicada?', c.side, ['seta', 'oposto', 'ambos'], 'Abaixo: lado da seta; acima: lado oposto; indicações dos dois lados: ambos.']
    ];
    const extra = [
      [fillet ? 'Qual é a perna do filete?' : 'Qual é a profundidade de preparação S?', c.size + ' mm', gameplayNumberOptions(c.size), fillet ? 'A dimensão à esquerda do triângulo é a perna.' : 'O valor à esquerda do símbolo de chanfro é a profundidade de preparação S, nesta indicação.']
    ];
    if (c.length) {
      extra.push(['Qual é o comprimento de cada trecho?', c.length + ' mm', gameplayNumberOptions(c.length), 'O primeiro valor à direita é o comprimento de cada trecho.']);
      extra.push(['Qual é o passo entre centros?', c.pitch + ' mm', gameplayNumberOptions(c.pitch), 'O segundo valor à direita é o passo, medido entre centros.']);
    } else extra.push(['Qual distribuição foi especificada?', 'Contínua', ['Contínua', 'Intermitente', 'Alternada', 'Apenas nas extremidades'], 'A ausência de comprimento e passo solicita solda contínua na extensão da junta indicada.']);
    if (c.contour) extra.push(['Qual contorno foi especificado?', c.contour, ['Plano', 'Convexo', 'Côncavo', 'Sem contorno'], 'Observe o traço suplementar junto ao símbolo básico.']);
    if (c.finish) extra.push(['Qual método de acabamento foi indicado?', c.finish === 'G' ? 'Esmerilhamento' : 'Usinagem', ['Esmerilhamento', 'Usinagem', 'Cinzelamento', 'Martelamento'], c.finish === 'G' ? 'G indica esmerilhamento.' : 'M indica usinagem.']);
    if (c.root) extra.push(['Qual é a abertura da raiz?', c.root + ' mm', gameplayNumberOptions(c.root), 'A abertura da raiz é o vão entre as faces na raiz da junta.']);
    if (c.type === 'V' && c.face) extra.push(['Qual é a face da raiz f?', c.face + ' mm', gameplayNumberOptions(c.face), 'A face da raiz é a parte não biselada junto à raiz; veja a cota f no detalhe.']);
    if (c.angle) extra.push(['Qual é o ângulo total do chanfro?', c.angle + '°', ['45°', '60°', '70°', '90°'], 'O ângulo do chanfro é o ângulo incluído entre as faces preparadas.']);
    if (c.field) extra.push(['O que a bandeira exige?', 'Solda em campo', ['Solda em campo', 'Backing', 'Melt-through', 'Todo contorno'], 'A bandeira indica soldagem em campo, no local de montagem.']);
    if (c.all) extra.push(['O que o círculo junto à seta exige?', 'Todo contorno', ['Todo contorno', 'Solda em campo', 'Contorno convexo', 'Backing'], 'O círculo solicita solda ao redor de todo o contorno da junta indicada.']);
    if (c.backing || c.melt) extra.push(['Qual complemento foi indicado na raiz?', c.backing ? 'Backing' : 'Melt-through', ['Backing', 'Melt-through', 'Solda de apoio', 'Sem complemento'], c.backing ? 'O retângulo indica material de apoio na raiz.' : 'O semicírculo preenchido exige reforço visível de raiz no reverso.']);
    detect = { c, index: 0, steps: [...base, ...shuffle(extra).slice(0, 3)] };
  }
  const d = detect, c = d.c;
  const [prompt, answer, opts, explain] = d.steps[d.index];
  q = { explain: explain + ` Resposta: ${answer}.`, correctVisual: symbol(c), detect: true };
  const detail = c.type === 'V' && c.root ? `<details><summary>Ver detalhe da raiz</summary>${rootDetail(c)}</details>` : '';
  shell(prompt, `<div class="split"><div><h3>Desenho da junta</h3>${cut(c)}</div><div><h3>Indicação de projeto</h3>${symbol(c)}</div></div>${detail}<small>Investigação ${d.index + 1}/${d.steps.length} · peça MW–${String(10 + serial).padStart(3, '0')} · dimensões em mm</small>`);
  options(shuffle(opts), answer);
}

function builder() {
  const c = retry?.config ? { ...retry.config, size: pick([4, 5, 6, 8, 10].filter(x => x !== retry.config.size)) } : config();
  const fillet = c.type === 'Filete';
  const keys = ['type', 'side', 'size', ...(fillet ? ['length', 'pitch'] : []), 'contour', 'finish', 'field', ...(fillet ? ['all'] : []), ...(!fillet && c.root ? ['root'] : []), ...(!fillet && c.angle ? ['angle'] : []), ...(!fillet && !['X', 'K', 'Duplo U', 'Duplo J'].includes(c.type) ? ['backing', 'melt'] : [])];
  const expected = k => k === 'finish' ? (c.finish || 'Sem método') : k === 'contour' ? (c.contour || 'Sem contorno') : ['field', 'all', 'backing', 'melt'].includes(k) ? (c[k] ? 'Sim' : 'Não') : String(c[k] || 0);
  const format = (key, value) => key === 'side' ? sideLabels[value] : value === '0' && key === 'length' ? 'Contínua · sem limite de comprimento' : value === '0' && key === 'pitch' ? 'Sem passo' : key === 'finish' && value === 'G' ? 'G · Esmerilhamento' : key === 'finish' && value === 'M' ? 'M · Usinagem' : value;
  const situation = [
    `Junta ${c.joint === 'T' ? 'em T' : c.joint.toLowerCase()}, ${fillet ? 'filete' : 'chanfro ' + c.type.toLowerCase()} de ${c.size} mm${fillet ? ' de perna' : ' de profundidade de preparação S'}`,
    c.side === 'ambos' ? 'nos dois lados' : c.side === 'seta' ? 'no lado da seta' : 'no lado oposto',
    c.length ? `trechos de ${c.length} mm com passo de ${c.pitch} mm` : 'solda contínua na extensão indicada',
    c.contour ? `contorno ${c.contour.toLowerCase()}` : 'sem contorno especificado',
    c.finish ? `acabamento por ${c.finish === 'G' ? 'esmerilhamento (G)' : 'usinagem (M)'}` : 'sem método de acabamento especificado',
    c.root ? `abertura da raiz ${c.root} mm` : '', c.angle ? `ângulo do chanfro ${c.angle}°` : '',
    c.field ? 'solda em campo' : '', c.all ? 'todo contorno' : '', c.backing ? 'com backing' : '', c.melt ? 'com melt-through' : ''
  ].filter(Boolean).join('; ') + '.';
  q = { config: c, builder: true, explain: '', correctVisual: symbol(c) };
  shell('Monte o símbolo para esta execução.', `<div class="split"><div>${cut(c)}</div><div><h3>Ordem de fabricação</h3><p>${situation}</p></div></div>`);
  $('#work').innerHTML = `<div class="builder">${keys.map(key => `<label>${key === 'size' ? (fillet ? 'Perna do filete (mm)' : 'Profundidade de preparação S (mm)') : labels[key]}<select data-field="${key}"><option value="">Escolha…</option>${fields[key].map(v => `<option value="${v}">${format(key, v)}</option>`).join('')}</select></label>`).join('')}</div><h3 style="margin-top:24px">Sua montagem em tempo real</h3><div class="scene" id="live"><p class="sub">Escolha o símbolo básico para começar.</p></div><p><button class="primary" id="submit">Conferir montagem</button></p>`;
  const read = () => { const r = {}; app.querySelectorAll('[data-field]').forEach(s => r[s.dataset.field] = s.value); return r; };
  const toConfig = r => {
    const result = { joint: c.joint };
    for (const [k, v] of Object.entries(r)) result[k] = ['field', 'all', 'backing', 'melt'].includes(k) ? v === 'Sim' : ['size', 'length', 'pitch', 'root', 'angle'].includes(k) ? Number(v) : v === 'Sem método' || v === 'Sem contorno' ? '' : v;
    return result;
  };
  app.querySelectorAll('[data-field]').forEach(s => s.onchange = () => {
    const r = read();
    $('#live').innerHTML = r.type ? symbol(toConfig(r)) : '<p class="sub">Escolha o símbolo básico para começar.</p>';
  });
  $('#submit').onclick = () => {
    const r = read();
    if (Object.values(r).some(v => !v)) { $('#toast').textContent = 'Escolha todas as peças antes de conferir.'; return; }
    $('#toast').textContent = '';
    const errors = keys.filter(k => r[k] !== expected(k));
    q.mine = symbol(toConfig(r));
    q.explain = errors.length ? 'Revise ' + errors.map(k => `${labels[k]}: ${format(k, expected(k))}`).join('; ') + '.' : 'Você combinou corretamente o símbolo, o lado, as dimensões e os complementos solicitados.';
    grade(errors.length ? 'incorreto' : 'correto', null, [], 'correto');
  };
}

function inspector() {
  const c = retry?.config ? { ...retry.config, size: pick([4, 5, 6, 8, 10].filter(x => x !== retry.config.size)) } : config();
  const hard = (state.master[mode] || 0) >= 4;
  const fillet = c.type === 'Filete';
  const eligible = ['Dimensão errada'];
  if ((fillet && c.joint === 'T') || (!fillet && ['V', 'Bisel', 'U', 'J'].includes(c.type))) eligible.push('Lado errado');
  if (c.length) eligible.push('Contínua em vez de intermitente', 'Comprimento errado', 'Passo errado');
  if (fillet && c.side === 'seta') eligible.push('Tipo de junta errado');
  if (hard && fillet && c.contour) eligible.push('Contorno errado');
  if (!fillet) eligible.push('Chanfro errado');
  if (hard && c.root) eligible.push('Abertura da raiz errada');
  if (hard && c.angle) eligible.push('Ângulo de chanfro errado');
  if (hard && c.finish) eligible.push('Acabamento incorreto');
  if (hard && c.field) eligible.push('Local de execução errado');
  if (hard && c.all) eligible.push('Todo contorno não executado');
  const error = retry?.error && eligible.includes(retry.error) ? retry.error : pick(['Conforme', 'Conforme', ...eligible]);
  const exec = { ...c, execution: true };
  if (error === 'Lado errado') exec.side = c.side === 'seta' ? 'oposto' : 'seta';
  if (error === 'Dimensão errada') exec.size = c.size === 6 ? 8 : 6;
  if (error === 'Contínua em vez de intermitente') { exec.length = 0; exec.pitch = 0; }
  if (error === 'Comprimento errado') exec.length = c.length === 40 ? 60 : 40;
  if (error === 'Passo errado') exec.pitch = c.pitch === 100 ? 150 : 100;
  if (error === 'Tipo de junta errado') exec.joint = c.joint === 'T' ? 'Sobreposta' : 'T';
  if (error === 'Contorno errado') exec.contour = c.contour === 'Plano' ? 'Convexo' : 'Plano';
  if (error === 'Chanfro errado') {
    const choices = ['X', 'K'].includes(c.type) ? ['X', 'K'] : ['Duplo U', 'Duplo J'].includes(c.type) ? ['Duplo U', 'Duplo J'] : ['U', 'J'].includes(c.type) ? ['U', 'J'] : ['Reto', 'V', 'Bisel'];
    exec.type = pick(choices.filter(t => t !== c.type));
  }
  if (error === 'Abertura da raiz errada') exec.root = c.root === 2 ? 4 : 2;
  if (error === 'Ângulo de chanfro errado') exec.angle = c.angle === 60 ? 45 : 60;
  if (error === 'Acabamento incorreto') exec.finish = c.finish === 'G' ? 'M' : 'G';
  if (error === 'Local de execução errado') exec.field = false;
  if (error === 'Todo contorno não executado') exec.all = false;
  q = {
    config: c, error, phase: 0,
    explain: error === 'Conforme' ? 'A execução coincide com o projeto nos elementos mostrados.' : `A divergência é: ${error.toLowerCase()}. Compare a execução com a referência correta abaixo.`,
    correctVisual: cut({ ...c, execution: true })
  };
  shell('A execução corresponde ao projeto?', `<div class="split"><div><h3>Projeto</h3>${symbol(c)}</div><div><h3>Execução</h3>${cut(exec)}</div></div>`);
  $('#work').innerHTML = '<div class="pills"><button id="approve">✓ Conforme</button><button id="reject">✕ Há divergência</button></div>';
  $('#approve').onclick = () => grade('Conforme', null, [], error);
  $('#reject').onclick = () => {
    if (error === 'Conforme') { grade('divergência', null, [], error); return; }
    q.phase = 1;
    $('#work').innerHTML = '<h3>Qual é a divergência exata?</h3><div class="pills" id="faults"></div>';
    const choices = shuffle([error, ...shuffle(eligible.filter(e => e !== error)).slice(0, 4)]);
    choices.forEach(label => {
      const b = document.createElement('button'); b.textContent = label;
      b.onclick = () => grade(label, b, [], error);
      $('#faults').append(b);
    });
  };
}

function positions() {
  const mastery = state.master[mode] || 0;
  const code = retry?.code || pick(codes.filter(c => c !== lastId));
  lastId = code;
  const inverse = serial % 2 === 0;
  const initialYaw = pick(mastery >= 4 ? [-.35, -.15, .15, .35] : [0, .1]);
  q = {
    code, image: inverse,
    explain: `${code}: solda ${code[1] === 'F' ? 'de filete' : 'em chanfro/topo'} na posição ${posNames[code[0]]}. A gravidade permanece para baixo; observe a face da solda, seu eixo e o acesso da tocha.`,
    correctVisual: position(code, initialYaw)
  };
  if (inverse) {
    shell(`Qual peça está na posição ${code}?`, '');
    const distractors = mastery >= 4 ? codes.filter(c => c[1] === code[1] && c !== code) : codes.filter(c => c !== code);
    const opts = shuffle([code, ...shuffle(distractors).slice(0, 3)]);
    const yaws = Object.fromEntries(opts.map(c => [c, initialYaw + pick([-.1, 0, .1])]));
    options(opts, code, c => position(c, yaws[c]));
  } else {
    shell('Qual é a posição desta solda?', position(code, initialYaw));
    let yaw = initialYaw;
    const controls = document.createElement('div');
    controls.className = 'pills';
    controls.innerHTML = '<button id="rotateLeft" aria-label="Girar câmera à esquerda">↶ Girar vista</button><button id="rotateRight" aria-label="Girar câmera à direita">Girar vista ↷</button>';
    app.querySelector('.scene').after(controls);
    $('#rotateLeft').onclick = () => { yaw = Math.max(-.4, yaw - .15); app.querySelector('.scene').innerHTML = position(code, yaw); };
    $('#rotateRight').onclick = () => { yaw = Math.min(.4, yaw + .15); app.querySelector('.scene').innerHTML = position(code, yaw); };
    options(shuffle(codes), code);
  }
}
