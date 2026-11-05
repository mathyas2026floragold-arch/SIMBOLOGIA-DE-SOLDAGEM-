(() => {
  'use strict';
  const E = window.MetroEngine, I = window.MetroInstruments;
  const app = document.querySelector('#main');
  const STORAGE = 'metrologia-pro-v1', SESSION_LENGTH = 8;
  const TRACK_IDS = E.TRACKS.map(t => t.id);
  const CAREERS = [
    { min: 0, name: 'Aprendiz' }, { min: 120, name: 'Auxiliar de medição' },
    { min: 320, name: 'Técnico em formação' }, { min: 650, name: 'Inspetor' },
    { min: 1100, name: 'Especialista' }, { min: 1700, name: 'Analista de precisão' },
    { min: 2500, name: 'Mestre da medida' }, { min: 3500, name: 'Referência técnica' }
  ];
  const BADGES = [
    { id: 'first', symbol: '↗', name: 'Primeiro passo', text: 'Acerte seu primeiro desafio.' },
    { id: 'reader', symbol: '⌁', name: 'Olhar técnico', text: 'Acerte cinco leituras de instrumentos.' },
    { id: 'three', symbol: '△', name: 'Três habilidades', text: 'Acerte ao menos uma questão de cada trilha.' },
    { id: 'streak', symbol: 'ϟ', name: 'Ritmo de precisão', text: 'Acerte dez desafios seguidos.' },
    { id: 'perfect', symbol: '✧', name: 'Missão perfeita', text: 'Complete uma missão com oito acertos.' },
    { id: 'master', symbol: '◎', name: 'Divisões finas', text: 'Chegue à etapa 6 em uma das trilhas.' }
  ];
  const freshState = () => ({ version: 1, xp: 0, total: 0, correct: 0, streak: 0, bestStreak: 0,
    tracks: Object.fromEntries(TRACK_IDS.map(id => [id, { total: 0, correct: 0 }])),
    badges: [], history: [], daily: {}, preferences: { sound: false, motion: false, answerMode: 'choice' }, session: null });
  let storageAvailable = true, toastTimer, route = 'home', guideTab = 'conversion';
  let lab = { instrument: 'ruler', resolution: 1, value: 12 };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = value => new Intl.NumberFormat('pt-BR').format(value);
  const unit = value => value === 'in' ? 'pol.' : 'mm';
  const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const count = n => Number.isFinite(n) ? Math.max(0, Math.min(100000000, Math.floor(n))) : 0;
  const trackInfo = id => E.TRACKS.find(t => t.id === id);
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${({ arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', back: '<path d="M19 12H5m5-5-5 5 5 5"/>', convert: '<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>', fraction: '<path d="m7 21 10-18M3 4h5v7H3m13 2h5v7h-5"/>', ruler: '<path d="M3 6h18v12H3zm4 0v6m5-6v3m5-3v6"/>', bulb: '<path d="M8 16c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7M9 19h6m-5 3h4M8 16h8"/>', book: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1zm0 0v15"/>', check: '<path d="m5 12 4 4 10-10"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>' })[name] || ''}</svg>`;
  function load() {
    const base = freshState();
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE) || 'null');
      if (!raw || raw.version !== 1) return base;
      for (const key of ['xp', 'total', 'correct', 'streak', 'bestStreak']) base[key] = count(raw[key]);
      base.correct = Math.min(base.correct, base.total);
      for (const id of TRACK_IDS) {
        base.tracks[id].total = count(raw.tracks?.[id]?.total);
        base.tracks[id].correct = Math.min(count(raw.tracks?.[id]?.correct), base.tracks[id].total);
      }
      base.badges = Array.isArray(raw.badges) ? raw.badges.filter(id => BADGES.some(b => b.id === id)) : [];
      base.history = Array.isArray(raw.history) ? raw.history.filter(r => TRACK_IDS.includes(r.track) && typeof r.correct === 'boolean').slice(-20) : [];
      base.daily = raw.daily && typeof raw.daily === 'object' && !Array.isArray(raw.daily) ? Object.fromEntries(Object.entries(raw.daily).filter(([k]) => /^\d{4}-\d{2}-\d{2}$/.test(k)).slice(-31).map(([k, v]) => [k, count(v)])) : {};
      base.preferences = { sound: raw.preferences?.sound === true, motion: raw.preferences?.motion === true, answerMode: raw.preferences?.answerMode === 'typed' ? 'typed' : 'choice' };
      const s = raw.session, q = s?.question;
      if (s && ['mixed', ...TRACK_IDS].includes(s.track) && Array.isArray(s.results) && s.results.length <= SESSION_LENGTH && q && TRACK_IDS.includes(q.track) && Number.isFinite(q.answer) && typeof q.prompt === 'string' && Array.isArray(q.choices) && q.choices.length === 4) {
        base.session = { ...s, answered: Math.min(count(s.answered), SESSION_LENGTH), correct: count(s.correct), xp: count(s.xp), zoom: 1, completed: s.completed === true, locked: s.locked === true };
      }
    } catch { storageAvailable = false; }
    return base;
  }
  let state = load();
  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    document.querySelector('#header-xp').textContent = `${num(state.xp)} XP`;
  }
  function career() {
    let index = 0;
    while (index + 1 < CAREERS.length && state.xp >= CAREERS[index + 1].min) index++;
    const current = CAREERS[index], next = CAREERS[index + 1];
    return { ...current, index, level: index + 1, next, progress: next ? 100 * (state.xp - current.min) / (next.min - current.min) : 100 };
  }
  function toast(message) {
    const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 3300);
  }
  function focusHeading() { const h = app.querySelector('h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
  function moveTop() { window.scrollTo({ top: 0, behavior: 'instant' }); }
  function applyPreferences() { document.body.classList.toggle('no-animation', state.preferences.motion); }
  function beep(right) {
    if (!state.preferences.sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return;
      const context = new Audio(), gain = context.createGain(), oscillator = context.createOscillator();
      oscillator.connect(gain); gain.connect(context.destination); oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(right ? 660 : 260, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(right ? 880 : 200, context.currentTime + .15);
      gain.gain.setValueAtTime(.05, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .2);
      oscillator.start(); oscillator.stop(context.currentTime + .22); oscillator.onended = () => context.close();
    } catch { /* Audio is optional. */ }
  }
  function confetti() {
    if (state.preferences.motion || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 20; i++) { const dot = document.createElement('i'); dot.className = 'confetti-dot'; dot.style.left = `${20 + Math.random() * 60}%`; dot.style.animationDelay = `${Math.random() * .15}s`; dot.setAttribute('aria-hidden', 'true'); document.body.append(dot); setTimeout(() => dot.remove(), 1800); }
  }
  function unlockBadges(perfect = false) {
    const earned = [];
    const rules = { first: state.correct > 0, reader: state.tracks.reading.correct >= 5, three: TRACK_IDS.every(id => state.tracks[id].correct > 0), streak: state.bestStreak >= 10, perfect, master: TRACK_IDS.some(id => E.getStage(state.tracks[id].correct).index === 5) };
    for (const b of BADGES) if (rules[b.id] && !state.badges.includes(b.id)) { state.badges.push(b.id); earned.push(b.name); }
    return earned;
  }
  const heroArt = () => `<svg viewBox="0 0 350 290" role="img" aria-label="Ilustração de paquímetro e referência de conversão de unidades"><defs><linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#dce5ec"/><stop offset="1" stop-color="#7e94ac"/></linearGradient></defs><g transform="rotate(-18 175 150)"><path d="M32 117h286v23H32z" fill="url(#metal)" stroke="#edf4fa" stroke-width="1.2"/><g stroke="#253f60" stroke-width="1.2">${Array.from({ length: 28 }, (_, i) => `<path d="M${43 + i * 9.3} 118v${i % 5 === 0 ? 13 : 7}"/>`).join('')}</g><path d="M32 94h19v94l-19 26zM106 102h21v87l-21 25z" fill="url(#metal)" stroke="#e1ebf5" stroke-width="1.3"/><path d="M20 95h31V64H40l-7 21H20zM106 102h33V86h-10l-2-24h-12z" fill="#a8b9ca" stroke="#e1ebf5"/><rect x="89" y="109" width="58" height="43" rx="4" fill="#e2edfa" stroke="#90a7c1"/><rect x="98" y="116" width="39" height="23" rx="3" fill="#263c55"/><path d="M104 126h27m-24-5v10m6-10v7m6-7v10m6-10v7" stroke="#dff177" stroke-width="1.2"/><circle cx="119" cy="153" r="8" fill="#637e9a" stroke="#e1ebf5"/><path d="M32 231h94m-94-4v8m94-8v8" stroke="#b9d17d" stroke-width="1.3" stroke-dasharray="3 3"/></g><circle cx="252" cy="213" r="27" fill="#203a51" stroke="#dff17766"/><path d="m241 213 8 8 14-17" fill="none" stroke="#dff177" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function renderHome() {
    route = 'home'; const c = career(), today = state.daily[dayKey()] || 0, goal = Math.min(today, SESSION_LENGTH), fraction = goal / SESSION_LENGTH;
    const active = state.session && !state.session.completed;
    app.innerHTML = `<div class="fade-in">${!storageAvailable ? '<p class="storage-alert" role="status">O armazenamento do navegador está indisponível. Seu progresso será mantido somente enquanto esta página estiver aberta.</p>' : ''}<div class="page-heading"><div><span class="eyebrow">SEU LABORATÓRIO DE METROLOGIA</span><h1>Boa prática. Boas medidas.</h1><p>Um desafio de cada vez. Mais precisão a cada conquista.</p></div><span class="status-chip"><span class="status-dot"></span>No seu ritmo</span></div>${active ? `<div class="resume-strip"><div><strong>Sua missão está em andamento.</strong><p>${state.session.answered} de ${SESSION_LENGTH} desafios concluídos. Continue de onde parou.</p></div><button class="button secondary" data-action="resume">Retomar missão ${icon('arrow')}</button></div>` : ''}<div class="dashboard-top"><section class="hero"><div><span class="eyebrow">DA PRIMEIRA DIVISÃO À MEDIDA CERTA</span><h2>Precisão se<br>conquista.<br><em>Pratique.</em></h2><p>Converta unidades, descubra frações e aprenda a ler os instrumentos.</p><button class="button primary" data-start="mixed">Começar treino completo ${icon('arrow')}</button></div><div class="hero-art">${heroArt()}<span class="formula-tag">1 POLEGADA = 25,4 MILÍMETROS</span></div><span class="hero-cross" aria-hidden="true">+ &nbsp; + &nbsp; +</span></section><aside class="daily-panel" aria-label="Sua evolução"><div class="panel-kicker">SEU PRÓXIMO PASSO <span class="small-chip">META DO DIA</span></div><div class="goal-row"><div class="goal-ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="ring-base" cx="40" cy="40" r="34"/><circle class="ring-value" cx="40" cy="40" r="34" stroke-dasharray="213.63" stroke-dashoffset="${213.63 * (1 - fraction)}"/></svg><strong>${goal}<small>/8</small></strong></div><div><h3>${goal === 8 ? 'Meta conquistada!' : 'Pratique um pouco.'}</h3><p>${goal === 8 ? 'Cada nova missão conta.' : '8 desafios para manter o ritmo.'}</p></div></div><div class="career-progress"><div class="career-title"><span class="level-square">${c.level}</span><div><strong>${esc(c.name)}</strong><small>Nível de carreira ${c.level} de ${CAREERS.length}</small></div></div><div class="progress" role="progressbar" aria-label="Progresso do nível de carreira" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(c.progress)}"><span style="width:${c.progress}%"></span></div><p class="progress-caption">${c.next ? `${num(c.next.min - state.xp)} XP para o próximo nível` : 'Todos os níveis de carreira conquistados.'}</p></div></aside></div><div class="section-heading" id="tracks"><div><h2>Escolha sua próxima medida.</h2><p>Três habilidades. Uma evolução que acompanha você.</p></div><span class="section-index">03 TRILHAS DE PRECISÃO</span></div><div class="track-grid">${E.TRACKS.map((t, i) => trackCard(t, i)).join('')}</div><div class="dashboard-bottom"><section class="surface"><div class="surface-title"><h3>Seu ritmo de prática</h3><span class="eyebrow">RESULTADOS REAIS</span></div><div class="metrics"><div class="metric"><strong>${num(state.total)}</strong><small>desafios respondidos</small></div><div class="metric"><strong>${state.total ? Math.round(100 * state.correct / state.total) + '<span>%</span>' : '—'}</strong><small>aproveitamento</small></div><div class="metric"><strong>${state.streak}<span> seguidos</span></strong><small>melhor sequência: ${state.bestStreak}</small></div></div><div class="history-dots" aria-label="Últimos resultados">${state.history.length ? state.history.map(h => `<i class="${h.correct ? 'right' : 'wrong'}" title="${esc(trackInfo(h.track).name)}: ${h.correct ? 'acerto' : 'revisar'}"></i>`).join('') + '<small>últimos ' + state.history.length + ' desafios</small>' : '<span class="empty-note">Sua história de precisão começa na primeira missão.</span>'}</div></section><section class="surface"><div class="surface-title"><h3>Pequenas grandes conquistas</h3><span class="small-chip">${state.badges.length}/${BADGES.length}</span></div><div class="achievement-list">${BADGES.map(b => `<span tabindex="0" class="achievement ${state.badges.includes(b.id) ? 'earned' : ''}" title="${esc(b.name + ' · ' + b.text)}" aria-label="${esc(b.name + ': ' + b.text + (state.badges.includes(b.id) ? ' Conquistada.' : ' Ainda não conquistada.'))}">${b.symbol}</span>`).join('')}</div><p class="achievement-note">Explore as três trilhas para completar sua coleção.</p></section></div></div>`;
    app.querySelectorAll('.track-card .track-progress span:last-child').forEach((element, index) => {
      const correct = state.tracks[TRACK_IDS[index]].correct;
      element.textContent = `${correct} ${correct === 1 ? 'acerto' : 'acertos'}`;
    });
    document.querySelector('.nav-button[data-action="home"]').classList.add('active');
  }
  function trackCard(t, index) {
    const progress = state.tracks[t.id], stage = E.getStage(progress.correct);
    const names = ['Polegadas → mm', 'Milímetros → pol.', 'Régua e paquímetro'];
    return `<article class="track-card ${['blue', 'violet', 'teal'][index]}"><div class="track-card-top"><span class="track-icon">${icon(['convert', 'fraction', 'ruler'][index])}</span><span class="track-number">0${index + 1}</span></div><span class="eyebrow">${esc(t.eyebrow)}</span><h3>${names[index]}</h3><p>${esc(t.description)}</p><div class="track-progress"><span>Etapa ${stage.level}/6 · ${esc(stage.name)}</span><span>${progress.correct} acertos</span></div><div class="mini-stage" aria-hidden="true">${E.LEVELS.map((_, n) => `<span class="${n <= stage.index ? 'done' : ''}"></span>`).join('')}</div><button class="button" data-start="${t.id}">Iniciar desafio ${icon('arrow')}</button></article>`;
  }
  function startSession(track, options = {}) {
    if (!['mixed', ...TRACK_IDS].includes(track)) return;
    state.session = { track, options, answered: 0, correct: 0, xp: 0, results: [], question: null, locked: false, hintUsed: false, completed: false, zoom: 1, nextTrack: null };
    newQuestion(); renderQuiz(); moveTop(); focusHeading();
  }
  function newQuestion() {
    const s = state.session;
    const track = s.nextTrack || (s.track === 'mixed' ? TRACK_IDS[s.answered % TRACK_IDS.length] : s.track);
    const last = s.question, recent = s.results.map(r => r.fingerprint).filter(Boolean).slice(-6); let q;
    for (let i = 0; i < 12; i++) {
      q = E.generateQuestion(track, state.tracks[track].correct, s.options || {});
      if ((!last || fingerprint(q) !== fingerprint(last)) && !recent.includes(fingerprint(q))) break;
    }
    s.question = q; s.locked = false; s.hintUsed = false; s.nextTrack = null; s.result = null; s.input = ''; s.chosen = null; s.zoom = 1;
    save();
  }
  function renderQuiz() {
    const s = state.session; if (!s) return renderHome(); if (s.completed) return renderSummary();
    route = 'quiz'; const q = s.question, stage = E.getStage(state.tracks[q.track].correct), typed = state.preferences.answerMode === 'typed';
    const inputHelp = q.answerFormat === 'fraction' ? 'Use uma fração simplificada (3/8), uma fração mista (1 1/4) ou um número inteiro.' : 'Digite o número sem a unidade. Você pode usar vírgula ou ponto.';
    const label = q.answerFormat === 'fraction' ? 'Fração em polegadas' : q.unit === 'in' ? 'Polegadas decimais' : 'Medida em milímetros';
    app.innerHTML = `<div class="fade-in"><div class="mission-bar"><button class="back-button" data-action="home">${icon('back')} Voltar ao painel</button><div class="mission-counter"><div class="mission-dots" aria-hidden="true">${Array.from({ length: SESSION_LENGTH }, (_, i) => `<span class="${s.results[i] ? s.results[i].correct ? 'right' : 'wrong' : i === s.results.length && !s.locked ? 'current' : ''}"></span>`).join('')}</div><span>Desafio ${Math.min(s.answered + (s.locked ? 0 : 1), SESSION_LENGTH)}/${SESSION_LENGTH}</span></div></div><div class="mission-meta"><span class="eyebrow">${s.track === 'mixed' ? 'TREINO COMPLETO · ' : ''}${esc(trackInfo(q.track).name)}</span><span class="stage-pill">Etapa ${q.level}/6 · ${esc(E.LEVELS[q.stage].name)}</span></div><div class="question-layout"><div><section class="question-card"><span class="question-context">${esc(q.context)}</span><h1>${esc(q.prompt)}</h1><p class="question-instruction">${q.kind === 'reading' ? 'Observe a extremidade indicada ou a coincidência das escalas. Use o zoom para examinar os traços.' : q.answerFormat === 'fraction' ? 'Indique a medida em fração ou número inteiro, na unidade pedida.' : 'Indique a medida decimal na unidade pedida.'}</p>${q.kind === 'reading' ? instrumentPanel(q) : `<div class="conversion-stage"><div class="big-measure"><strong>${esc(q.sourceText)}</strong><small>${q.sourceUnit === 'in' ? 'polegadas' : 'milímetros'}</small></div><span class="convert-arrow" aria-hidden="true">→</span><div class="big-measure target-measure"><strong>?</strong><small>${q.unit === 'in' ? 'polegadas' : 'milímetros'}</small></div></div><p class="conversion-reference">REFERÊNCIA INTERNACIONAL &nbsp; 1 in = 25,4 mm</p>`}<div class="question-tools"><button class="text-button" data-action="hint" ${s.hintUsed ? 'aria-expanded="true"' : 'aria-expanded="false"'}>${icon('bulb')} ${s.hintUsed ? 'Dica aberta' : 'Preciso de uma dica'}</button><button class="text-button" data-action="guide">${icon('book')} Consultar guia</button></div>${s.hintUsed ? `<div class="hint-card"><strong>Um caminho para a resposta</strong>${esc(q.hint)}<small>Com dica, este desafio vale 10 XP.</small></div>` : ''}</section>${s.locked ? feedbackHTML() : '<div id="feedback-slot"></div>'}</div><aside class="answer-card"><h2>Sua leitura conta.</h2><p>${s.locked ? 'Resposta conferida. Examine o raciocínio ao lado.' : 'Escolha uma opção ou escreva sua resposta.'}</p><div class="answer-mode" role="group" aria-label="Como responder"><button data-answer-mode="choice" aria-pressed="${!typed}" class="${!typed ? 'active' : ''}" ${s.locked ? 'disabled' : ''}>Alternativas</button><button data-answer-mode="typed" aria-pressed="${typed}" class="${typed ? 'active' : ''}" ${s.locked ? 'disabled' : ''}>Escrever medida</button></div>${typed ? `<form id="answer-form" class="typed-answer" novalidate><label class="answer-field" for="measurement-answer">${label}</label><div class="measurement-input"><input id="measurement-answer" name="answer" type="text" inputmode="${q.answerFormat === 'fraction' ? 'text' : 'decimal'}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Digite a medida" value="${esc(s.input)}" aria-describedby="input-help input-error" ${s.locked ? 'disabled' : ''}><span>${unit(q.unit)}</span></div><p class="input-help" id="input-help">${inputHelp}</p>${!s.locked && q.answerFormat === 'fraction' ? '<div class="keyboard-shortcuts" role="group" aria-label="Atalhos de fração"><button type="button" data-insert="/" aria-label="Inserir barra de fração">/</button><button type="button" data-insert=" " aria-label="Inserir espaço de fração mista">espaço</button><button type="button" data-action="clear-input">limpar</button></div>' : ''}<p id="input-error" class="input-error" role="alert"></p><button type="submit" class="button dark answer-submit" ${s.locked ? 'disabled' : ''}>Conferir medida ${icon('check')}</button></form>` : `<div class="choice-list">${q.choices.map((choice, i) => { const right = s.locked && E.gradeAnswer(q, choice.value).correct; return `<button class="choice-button ${right ? 'correct' : s.locked && s.chosen === i ? 'incorrect' : ''}" data-choice="${i}" ${s.locked ? 'disabled' : ''}><span class="choice-letter">${right ? '✓' : 'ABCD'[i]}</span><span class="choice-label">${esc(choice.label)}<small class="choice-unit">${unit(q.unit)}</small></span></button>`; }).join('')}</div><p id="input-error" class="input-error" role="alert"></p>`}<div class="scoring-note">${icon('target')} ${s.hintUsed ? '10 XP com a dica.' : '20 XP por acerto. Sequências rendem bônus.'}</div></aside></div></div>`;
    if (s.locked || s.hintUsed) app.querySelector('[data-action="hint"]').disabled = true;
  }
  function instrumentPanel(q) {
    const s = state.session, width = Math.round(800 * s.zoom);
    return `<div class="instrument-toolbar"><span>Escala ampliada · deslize para os lados</span><div class="zoom-tools" role="group" aria-label="Zoom da escala"><button data-zoom="out" aria-label="Diminuir zoom">−</button><output id="zoom-value" aria-label="Nível de zoom">${Math.round(s.zoom * 100)}%</output><button data-zoom="in" aria-label="Aumentar zoom">+</button></div></div><div class="instrument-viewport" tabindex="0" role="region" aria-label="Escala do instrumento, área com rolagem horizontal"><div class="instrument-canvas" id="question-drawing" style="width:${width}px">${I.renderInstrument(q)}</div></div>`;
  }
  function feedbackHTML() {
    const s = state.session, q = s.question, result = s.result;
    return `<section class="feedback ${result.correct ? '' : 'incorrect'}" id="question-feedback" aria-labelledby="feedback-title" tabindex="-1">${result.unlocked ? `<div class="stage-unlocked" role="status">Nova etapa: ${esc(result.unlocked)}. Sua precisão está evoluindo!</div>` : ''}<div class="feedback-heading"><h2 id="feedback-title">${result.correct ? 'Medida certa!' : 'Vamos ajustar a leitura.'}</h2>${result.correct ? `<span class="earned-xp">+${result.xp} XP</span>` : ''}</div><div class="expected-answer"><span>${result.correct ? 'Sua resposta' : 'Medida esperada'}</span><strong>${esc(q.answerText)} ${unit(q.unit)}</strong></div><p>${esc(q.explanation)}</p><div class="calculation-steps">${q.breakdown.map(step => `<div class="calculation-step"><span>${esc(step.label)}</span><strong>${esc(step.value)}</strong></div>`).join('')}</div>${q.kind === 'reading' ? `<div class="feedback-answer-drawing"><div class="instrument-viewport" tabindex="0" role="region" aria-label="Instrumento com leitura explicada"><div class="instrument-canvas" style="width:800px">${I.renderInstrument(q, { answer: true })}</div></div></div>` : ''}<div class="feedback-actions"><small>${result.correct ? `${state.streak} acerto${state.streak === 1 ? '' : 's'} seguido${state.streak === 1 ? '' : 's'}. Continue no seu ritmo.` : 'O próximo desafio retoma esta habilidade com outra medida.'}</small><button class="button dark" data-action="next">${s.answered === SESSION_LENGTH ? 'Ver resultado' : 'Próxima medida'} ${icon('arrow')}</button></div></section>`;
  }
  function fingerprint(q) { return [q.track, q.kind, q.instrument, q.value, q.resolution, q.fractionDenominator, q.precision].join('|'); }
  function submit(input, chosen = null) {
    const s = state.session; if (!s || s.locked || s.completed) return;
    const q = s.question, result = E.gradeAnswer(q, input);
    if (!result.valid) { const el = document.querySelector('#input-error'); el.textContent = result.error; document.querySelector('#measurement-answer')?.setAttribute('aria-invalid', 'true'); return; }
    s.locked = true; s.input = input; s.chosen = chosen;
    const before = E.getStage(state.tracks[q.track].correct).index;
    state.total++; state.tracks[q.track].total++; state.daily[dayKey()] = (state.daily[dayKey()] || 0) + 1;
    let xp = 0;
    if (result.correct) {
      state.correct++; state.tracks[q.track].correct++; state.streak++; state.bestStreak = Math.max(state.bestStreak, state.streak);
      xp = s.hintUsed ? 10 : 20 + Math.min(state.streak - 1, 4) * 2;
      state.xp += xp; s.xp += xp; s.correct++;
    } else { state.streak = 0; s.nextTrack = q.track; }
    s.answered++;
    const after = E.getStage(state.tracks[q.track].correct);
    s.result = { correct: result.correct, xp, unlocked: after.index > before ? after.name : null };
    s.results.push({ track: q.track, correct: result.correct, fingerprint: fingerprint(q), prompt: q.prompt, expected: q.answerText + ' ' + unit(q.unit), input: result.normalized + ' ' + unit(q.unit) });
    state.history.push({ track: q.track, correct: result.correct }); state.history = state.history.slice(-20);
    const badges = unlockBadges(); save(); beep(result.correct); renderQuiz();
    const feedback = document.querySelector('#question-feedback');
    feedback.scrollIntoView({ behavior: state.preferences.motion ? 'instant' : 'smooth', block: window.innerWidth <= 850 ? 'start' : 'nearest' });
    feedback.focus({ preventScroll: true });
    if (badges.length) toast(`Conquista desbloqueada: ${badges.join(' · ')}`);
  }
  function next() {
    const s = state.session; if (!s?.locked) return;
    if (s.answered >= SESSION_LENGTH) { s.completed = true; const badges = unlockBadges(s.correct === SESSION_LENGTH); save(); renderSummary(); moveTop(); focusHeading(); if (s.correct === SESSION_LENGTH) confetti(); if (badges.length) toast(`Conquista: ${badges.join(' · ')}`); }
    else { newQuestion(); renderQuiz(); moveTop(); focusHeading(); }
  }
  function renderSummary() {
    route = 'summary'; const s = state.session, perfect = s.correct === SESSION_LENGTH;
    app.innerHTML = `<section class="session-summary fade-in"><span class="eyebrow summary-kicker">MISSÃO CONCLUÍDA · ${s.track === 'mixed' ? 'TRÊS HABILIDADES EM PRÁTICA' : esc(trackInfo(s.track).name)}</span><h1>${perfect ? 'Precisão em cada resposta.' : s.correct >= 5 ? 'Uma boa medida de evolução.' : 'Toda prática faz diferença.'}</h1><p>${perfect ? 'Oito desafios. Oito acertos. Continue ampliando seu domínio.' : 'Confira o que aprendeu e retome as medidas que merecem atenção.'}</p><div class="summary-card"><div class="summary-medal" aria-hidden="true">${perfect ? '✧' : '◎'}</div><div class="summary-stats"><div><strong>${s.correct}/${SESSION_LENGTH}</strong><small>respostas corretas</small></div><div><strong>+${s.xp}</strong><small>XP nesta missão</small></div><div><strong>${Math.round(100 * s.correct / SESSION_LENGTH)}%</strong><small>aproveitamento</small></div></div><div class="summary-results" aria-label="Resultado dos oito desafios">${s.results.map((r, i) => `<span class="${r.correct ? '' : 'wrong'}" title="Desafio ${i + 1}: ${r.correct ? 'acerto' : 'revisar'}" aria-label="Desafio ${i + 1}: ${r.correct ? 'acerto' : 'revisar'}">${r.correct ? '✓' : '·'}</span>`).join('')}</div><div class="summary-review">${s.results.filter(r => !r.correct).map(r => `<div class="review-row"><div><strong>${esc(trackInfo(r.track).name)}</strong><p>${esc(r.prompt)}</p><p>Sua resposta: ${esc(r.input)}</p></div><strong>${esc(r.expected)}</strong></div>`).join('') || '<p class="empty-note">Você acertou todas as medidas desta missão.</p>'}</div><div class="summary-actions"><button class="button dark" data-start="${s.track}">Jogar outra missão ${icon('arrow')}</button><button class="button secondary" data-action="home">Voltar ao painel</button></div></div><p>As etapas avançam com seus acertos em cada trilha.</p></section>`;
  }
  function showDialog(id) { const dialog = document.getElementById(id); if (dialog && !dialog.open) dialog.showModal(); }
  function closeDialog(id) { document.getElementById(id)?.close(); }
  function renderGuide(tab = guideTab) {
    guideTab = tab;
    document.querySelectorAll('[data-guide]').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.guide === tab)); b.tabIndex = b.dataset.guide === tab ? 0 : -1; });
    const panel = document.querySelector('#guide-content'); panel.setAttribute('aria-labelledby', 'guide-tab-' + tab);
    const calculator = `<div class="calc-box"><h4>Teste uma conversão sem pontuação</h4><div class="calc-grid"><label class="sr-only" for="calc-input">Medida para converter</label><input id="calc-input" placeholder="Ex.: 3/8" type="text" inputmode="text" autocomplete="off"><label class="sr-only" for="calc-unit">Unidade da medida</label><select id="calc-unit"><option value="in">polegadas</option><option value="mm">milímetros</option></select></div><div class="calc-result" id="calc-result" role="status">Digite uma medida para comparar as unidades.</div></div>`;
    if (tab === 'conversion') panel.innerHTML = `<h3>Uma referência. Dois caminhos.</h3><p>A polegada internacional vale exatamente <strong>25,4 milímetros</strong>. Multiplique para chegar a milímetros; divida para chegar a polegadas.</p><div class="formula-grid"><div class="formula-card"><small>POLEGADA → MILÍMETRO</small><strong>in × 25,4 = mm</strong></div><div class="formula-card"><small>MILÍMETRO → POLEGADA</small><strong>mm ÷ 25,4 = in</strong></div></div><div class="guide-note">Exemplo: 3/8 in = 0,375 in. Então 0,375 × 25,4 = <strong>9,525 mm</strong>.</div><p>Nos resultados aproximados, arredonde somente no final e use as casas decimais solicitadas no enunciado.</p>${calculator}`;
    if (tab === 'fractions') panel.innerHTML = `<h3>Uma polegada, várias divisões.</h3><p>O denominador mostra em quantas partes iguais a unidade foi dividida. O numerador diz quantas dessas partes você tem.</p><div class="fraction-bars">${[2, 4, 8, 16].map(d => `<div class="fraction-bar"><strong>1/${d}</strong><div aria-hidden="true">${Array.from({ length: d }, (_, i) => `<i class="${i === 0 ? 'filled' : ''}"></i>`).join('')}</div></div>`).join('')}</div><table class="guide-table"><thead><tr><th>POLEGADA</th><th>DECIMAL</th><th>MILÍMETRO</th></tr></thead><tbody>${[.125, .25, .375, .5, .75, 1].map(v => `<tr><td>${E.formatFraction(v, 8)}</td><td>${E.formatDecimal(v, v === 1 ? 0 : 3)}</td><td>${E.formatDecimal(E.inchToMm(v), v === 1 ? 1 : 3)}</td></tr>`).join('')}</tbody></table><p><strong>Fração mista:</strong> 1 3/8 in = 1 + 3/8 = 1,375 in. <strong>Simplificação:</strong> 4/8 = 1/2.</p><div class="guide-note">Para a fração mais próxima de 1/32 in: multiplique a polegada decimal por 32, arredonde para o inteiro mais próximo, escreva esse valor sobre 32 e simplifique. Ex.: 0,30 × 32 = 9,6 → 10/32 = <strong>5/16 in</strong>.</div>${calculator}`;
    if (tab === 'reading') panel.innerHTML = `<h3>Primeiro a escala. Depois a medida.</h3><ol class="reading-steps"><li><strong>Identifique a unidade e a divisão.</strong><br>Na régua, conte os intervalos entre duas medidas conhecidas. Dez intervalos entre 10 e 20 mm significam divisões de 1 mm.</li><li><strong>Observe a referência correta.</strong><br>Na régua, a medida parte do zero e termina na extremidade indicada. No paquímetro, observe os milímetros completos antes do zero do nônio.</li><li><strong>Encontre o traço do nônio que coincide.</strong><br>Multiplique seu índice pela resolução. Em um nônio de 0,05 mm, o traço 3 acrescenta 0,15 mm.</li><li><strong>Some as duas leituras.</strong><br>16 mm na escala principal + 0,15 mm no nônio = <strong>16,15 mm</strong>.</li></ol><table class="guide-table"><thead><tr><th>NÔNIO</th><th>ABRANGÊNCIA</th><th>RESOLUÇÃO</th></tr></thead><tbody><tr><td>10 divisões</td><td>9 mm</td><td>0,1 mm</td></tr><tr><td>20 divisões</td><td>19 mm</td><td>0,05 mm</td></tr><tr><td>50 divisões</td><td>49 mm</td><td>0,02 mm</td></tr></tbody></table><div class="guide-note">Resolução é a menor divisão que o modelo permite ler. Ela não informa, sozinha, a exatidão de um instrumento real.</div><button class="button dark" data-action="lab">Abrir bancada livre ${icon('arrow')}</button>`;
  }
  function calculate() {
    const input = document.querySelector('#calc-input'), out = document.querySelector('#calc-result'); if (!input || !out) return;
    if (!input.value.trim()) { out.textContent = 'Digite uma medida para comparar as unidades.'; return; }
    const parsed = E.parseMeasurement(input.value);
    if (!parsed.valid || parsed.value < 0 || parsed.value > 1000000) { out.textContent = parsed.valid ? 'Use uma medida de zero a 1.000.000.' : parsed.error; return; }
    const inputUnit = document.querySelector('#calc-unit').value;
    if (inputUnit === 'in') {
      const converted = E.inchToMm(parsed.value);
      const exact = (BigInt(parsed.rational.numerator) * 127n * 100000000n) % (BigInt(parsed.rational.denominator) * 5n) === 0n;
      out.textContent = `${parsed.normalized} in ${exact ? '=' : '≈'} ${E.formatDecimal(converted, 8).replace(/,?0+$/, '') || '0'} mm`;
    } else {
      const converted = E.mmToInch(parsed.value), quantized = E.nearestFraction(converted, 128);
      const exactFraction = Math.abs(converted - quantized) < 1e-10;
      out.textContent = `${parsed.normalized} mm ≈ ${E.formatDecimal(converted, 6)} in · ${exactFraction ? '=' : '≈'} ${E.formatFraction(converted, 128)} in (escala de 1/128)`;
    }
  }
  function initLab(reset = false) {
    if (reset) lab = { instrument: 'ruler', resolution: 1, value: 12 };
    document.querySelector('#lab-instrument').value = lab.instrument;
    const res = document.querySelector('#lab-resolution'), choices = lab.instrument === 'ruler' ? [1, .5] : [.1, .05, .02];
    res.innerHTML = choices.map(v => `<option value="${v}">${E.formatDecimal(v, v === 1 ? 0 : v === .1 || v === .5 ? 1 : 2)} mm</option>`).join('');
    if (!choices.includes(lab.resolution)) lab.resolution = choices[0];
    res.value = lab.resolution;
    lab.value = Math.round(lab.value / lab.resolution) * lab.resolution;
    const slider = document.querySelector('#lab-value'); slider.step = lab.resolution; slider.value = lab.value;
    renderLab();
  }
  function renderLab() {
    const digits = lab.resolution === 1 ? 0 : lab.resolution === .5 || lab.resolution === .1 ? 1 : 2;
    document.querySelector('#lab-output').textContent = E.formatDecimal(lab.value, digits) + ' mm';
    document.querySelector('#lab-drawing').innerHTML = I.renderInstrument({ ...lab, unit: 'mm' }, { answer: true });
    const main = Math.floor(lab.value + 1e-8), vernier = Math.round((lab.value - main) / lab.resolution);
    document.querySelector('#lab-equation').textContent = lab.instrument === 'ruler' ? `Cada intervalo vale ${E.formatDecimal(lab.resolution, digits)} mm.` : `${main} mm + (${vernier} × ${E.formatDecimal(lab.resolution, digits)} mm) = ${E.formatDecimal(lab.value, digits)} mm`;
  }
  function showSettings() {
    document.querySelector('#setting-sound').checked = state.preferences.sound;
    document.querySelector('#setting-motion').checked = state.preferences.motion;
    showDialog('settings-dialog');
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button, a[data-action]'); if (!button) return;
    if (button.dataset.close) return closeDialog(button.dataset.close);
    if (button.dataset.start) return startSession(button.dataset.start);
    if (button.dataset.guide) return renderGuide(button.dataset.guide);
    if (button.dataset.answerMode) { if (state.session?.locked) return; state.session.input = document.querySelector('#measurement-answer')?.value ?? state.session.input ?? ''; state.preferences.answerMode = button.dataset.answerMode; save(); return renderQuiz(); }
    if (button.dataset.choice !== undefined) { const index = Number(button.dataset.choice), q = state.session?.question; if (q?.choices[index]) submit(q.choices[index].value, index); return; }
    if (button.dataset.zoom) {
      if (!state.session) return;
      state.session.zoom = Math.max(.7, Math.min(1.6, Math.round((state.session.zoom + (button.dataset.zoom === 'in' ? .15 : -.15)) * 100) / 100));
      const drawing = document.querySelector('#question-drawing'); if (drawing) drawing.style.width = Math.round(800 * state.session.zoom) + 'px';
      document.querySelector('#zoom-value').textContent = Math.round(state.session.zoom * 100) + '%'; return;
    }
    if (button.dataset.insert !== undefined) { const input = document.querySelector('#measurement-answer'); if (!input || input.disabled) return; const at = input.selectionStart ?? input.value.length; input.setRangeText(button.dataset.insert, at, input.selectionEnd ?? at, 'end'); input.focus(); return; }
    const action = button.dataset.action;
    if (action === 'home') { event.preventDefault(); renderHome(); moveTop(); focusHeading(); }
    if (action === 'resume') { renderQuiz(); moveTop(); focusHeading(); }
    if (action === 'next') next();
    if (action === 'hint' && state.session && !state.session.locked && !state.session.hintUsed) { state.session.input = document.querySelector('#measurement-answer')?.value ?? state.session.input ?? ''; state.session.hintUsed = true; save(); renderQuiz(); }
    if (action === 'guide') { renderGuide(); showDialog('guide-dialog'); }
    if (action === 'lab') { closeDialog('guide-dialog'); initLab(); showDialog('lab-dialog'); }
    if (action === 'settings') showSettings();
    if (action === 'sources') showDialog('sources-dialog');
    if (action === 'reset-confirm') { closeDialog('settings-dialog'); showDialog('reset-dialog'); }
    if (action === 'reset') { state = freshState(); save(); applyPreferences(); closeDialog('reset-dialog'); renderHome(); moveTop(); toast('Seu progresso foi reiniciado. Vamos à primeira medida.'); }
    if (action === 'clear-input') { const input = document.querySelector('#measurement-answer'); if (input) { input.value = ''; input.focus(); } }
  });
  document.addEventListener('submit', event => { if (event.target.id === 'answer-form') { event.preventDefault(); submit(document.querySelector('#measurement-answer').value); } });
  document.addEventListener('input', event => {
    if (event.target.id === 'calc-input') calculate();
    if (event.target.id === 'lab-value') { lab.value = Math.round(Number(event.target.value) / lab.resolution) * lab.resolution; renderLab(); }
    if (event.target.id === 'measurement-answer') { state.session.input = event.target.value; event.target.removeAttribute('aria-invalid'); const error = document.querySelector('#input-error'); if (error) error.textContent = ''; save(); }
  });
  document.addEventListener('change', event => {
    const id = event.target.id;
    if (id === 'calc-unit') calculate();
    if (id === 'lab-instrument') { lab.instrument = event.target.value; lab.resolution = lab.instrument === 'ruler' ? 1 : .1; initLab(); }
    if (id === 'lab-resolution') { lab.resolution = Number(event.target.value); initLab(); }
    if (id === 'setting-sound') { state.preferences.sound = event.target.checked; save(); if (state.preferences.sound) beep(true); }
    if (id === 'setting-motion') { state.preferences.motion = event.target.checked; applyPreferences(); save(); }
  });
  document.querySelector('.guide-tabs').addEventListener('keydown', event => {
    const tabs = ['conversion', 'fractions', 'reading']; const index = tabs.indexOf(guideTab);
    if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const nextTab = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs[(index + (event.key === 'ArrowRight' ? 1 : 2)) % tabs.length]; renderGuide(nextTab); document.querySelector(`[data-guide="${nextTab}"]`).focus(); }
  });
  applyPreferences(); save(); renderHome();
})();
