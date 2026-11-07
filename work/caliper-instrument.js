(function (root) {
  'use strict';

  const Engine = root.CaliperEngine || (typeof module === 'object' && module.exports ? require('./caliper-engine.js') : null);
  if (!Engine) throw new Error('O motor de medidas deve ser carregado antes do instrumento.');
  // Drawing, scoring and readout share one calibrated scale definition.
  const RESOLUTIONS = Object.freeze(Object.fromEntries(Engine.RESOLUTIONS.map(r => [r.id, Object.freeze({
    unit:r.unit,value:r.step,numerator:1,denominator:r.ticksPerUnit,cap:r.capacity,
    mainPitch:r.mainStep,mainTicks:r.mainTicks,divisions:r.divisions || undefined,
    vernierPitch:r.divisions?r.vernierPitchTicks/r.ticksPerUnit:undefined,
    vernierPitchTicks:r.vernierPitchTicks,dialPeriod:r.unit==='mm'?1:.1,label:r.label.split(' · ')[0]
  })])));
  const TYPES = Object.freeze(Object.fromEntries(Engine.TYPES.map(t => [t.id, Object.freeze({name:t.name,resolutions:t.resolutions})])));
  const p = n => String(Math.round(n * 1e7) / 1e7);
  const clean = n => Math.round(n * 1e10) / 1e10;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const num = (n, digits = 3) => {
    const fixed = Number(n).toFixed(digits);
    return (digits ? fixed.replace(/\.?0+$/, '') : fixed).replace('.', ',');
  };
  const text = (x, y, s, extra = '') => {
    const attribute = (name, fallback) => extra.match(new RegExp('(?:^|\\s)' + name + '=["\']([^"\']+)["\']'))?.[1] || fallback;
    const size = attribute('font-size', '16'), cssSize = /^\d+(?:\.\d+)?$/.test(size) ? size + 'px' : size;
    const style = `font-size:${cssSize};fill:${attribute('fill', '#252728')};font-family:${attribute('font-family', 'Arial,Helvetica,sans-serif')}`;
    return `<text x="${p(x)}" y="${p(y)}" ${extra} style="${esc(style)}">${esc(s)}</text>`;
  };
  const line = (x1, y1, x2, y2, extra = '') => `<line x1="${p(x1)}" y1="${p(y1)}" x2="${p(x2)}" y2="${p(y2)}" ${extra}/>`;
  const rect = (x, y, width, height, extra = '') => `<rect x="${p(x)}" y="${p(y)}" width="${p(width)}" height="${p(height)}" ${extra}/>`;
  const path = (d, extra = '') => `<path d="${d}" ${extra}/>`;
  const metal = (c, name = 'steel') => `url(#${c.prefix}-${name})`;
  function finishes(c) {
    return `<defs><linearGradient id="${c.prefix}-steel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f4f4f0"/><stop offset=".18" stop-color="#c6c8c5"/><stop offset=".5" stop-color="#e4e5e0"/><stop offset=".8" stop-color="#b2b5b0"/><stop offset="1" stop-color="#e3e4df"/></linearGradient><linearGradient id="${c.prefix}-edge" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#707570"/><stop offset=".4" stop-color="#dbddd7"/><stop offset=".65" stop-color="#a2a69e"/><stop offset="1" stop-color="#565c55"/></linearGradient><linearGradient id="${c.prefix}-bezel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e8e9e3"/><stop offset=".5" stop-color="#999e95"/><stop offset="1" stop-color="#d4d7ce"/></linearGradient></defs>`;
  }
  function settings(options = {}) {
    const type = options.type || 'analog', key = options.resolutionKey || 'mm-005';
    if (!TYPES[type] || !TYPES[type].resolutions.includes(key)) throw new RangeError('Combinação de instrumento e resolução não suportada.');
    const r = RESOLUTIONS[key], ticks = options.ticks ?? 0, maxTicks = Math.round(r.cap / r.value);
    if (!Number.isSafeInteger(ticks) || ticks < 0 || ticks > maxTicks) throw new RangeError('Posição fora da capacidade ou da resolução do instrumento.');
    const objectTicks = options.objectTicks;
    if (objectTicks !== undefined && (!Number.isSafeInteger(objectTicks) || objectTicks < 0 || objectTicks > maxTicks)) throw new RangeError('Dimensão da peça fora da capacidade do instrumento.');
    const value = clean(ticks * r.numerator / r.denominator);
    return { ...options, type, key, r, ticks, value, maxTicks, objectTicks, objectValue: objectTicks === undefined ? null : clean(objectTicks * r.numerator / r.denominator), reveal: options.reveal === true, annotated: options.annotated === true, contact: options.contact === true && objectTicks === ticks };
  }
  function geometry(options = {}) {
    const c = settings(options), vertical = c.type === 'depth' || c.type === 'height';
    const zeroPx = c.type === 'depth' ? 130 : c.type === 'height' ? 270 : 120;
    const pxPerUnit = (c.type === 'depth' ? 90 : c.type === 'height' ? -150 : 480) / c.r.cap;
    return { axis: vertical ? 'y' : 'x', zeroPx, pxPerUnit, sliderPx: clean(zeroPx + c.value * pxPerUnit), maxTicks: c.maxTicks, unit: c.r.unit, resolution: c.r.value, cap: c.r.cap };
  }
  const hook = (axis, scale) => `data-caliper-slider="" data-drag-axis="${axis}" data-drag-px-per-unit="${p(scale)}" style="cursor:${axis === 'x' ? 'ew' : 'ns'}-resize;touch-action:none"`;
  function formatReading(c) {
    return Engine.format(c.ticks,c.key) + (c.r.unit === 'in' ? ' pol' : ' mm');
  }
  function scaleTicks(c, x0, y, pxPerUnit, { vertical = false, upwards = false, end = c.r.cap, centimeters = false, labelEnd = end } = {}) {
    const step = c.type === 'dial' ? (c.r.unit === 'mm' ? 1 : 0.1) : c.r.mainPitch;
    const count = Math.floor((end + 1e-8) / step), sign = upwards ? -1 : 1;
    let s = '';
    for (let k = 0; k <= count; k++) {
      const v = clean(k * step);
      const labelStep = c.r.unit === 'mm' ? 10 * Math.max(1, Math.ceil((vertical ? 20 : 25) / (10 * pxPerUnit))) : 0.5 * Math.max(1, Math.ceil((vertical ? 20 : 25) / (0.5 * pxPerUnit)));
      const major = k % Math.round(labelStep / step) === 0;
      const middle = c.r.unit === 'mm' && k % 5 === 0;
      const length = major ? 20 : middle ? 15 : 10, at = (vertical ? y : x0) + sign * v * pxPerUnit;
      const data = `class="ci-main-tick" data-main-unit="${p(v)}"`;
      s += vertical ? line(x0, at, x0 + length, at, data + ' stroke="#262a26" stroke-width="1"') : line(at, y, at, y - length, data + ' stroke="#262a26" stroke-width=".9"');
      if (major && v <= labelEnd + 1e-8) s += vertical ? text(x0 - 7, at + 5, num(v, c.r.unit === 'in' ? 2 : 0), 'font-size="16" text-anchor="end"') : text(at, y - 24, num(centimeters && c.r.unit === 'mm' ? v / 10 : v, c.r.unit === 'in' ? 2 : 0), 'font-size="14" text-anchor="middle"');
    }
    return s;
  }
  function dial(c, cx, cy, radius, detail = false) {
    const period = c.r.dialPeriod, divisions = Math.round(period / c.r.value), pointer = c.ticks % divisions;
    let s = `<circle cx="${cx}" cy="${cy}" r="${radius + 5}" fill="#9cb0bf" stroke="#4a657a" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${radius}" fill="#fffdf4" stroke="#6e8291"/>`;
    for (let i = 0; i < divisions; i++) {
      const a = i / divisions * Math.PI * 2 - Math.PI / 2, outer = radius - 5, inner = radius - (i % 10 ? 12 : 19);
      s += line(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner, cx + Math.cos(a) * outer, cy + Math.sin(a) * outer, 'stroke="#243c50" stroke-width="1"');
      if (i % (detail ? 10 : 20) === 0) s += text(cx + Math.cos(a) * (radius - (detail ? 32 : 23)), cy + Math.sin(a) * (radius - (detail ? 32 : 23)) + 5, i, `font-size="${detail ? 18 : 16}" text-anchor="middle"`);
    }
    const a = pointer / divisions * Math.PI * 2 - Math.PI / 2;
    s += line(cx, cy, cx + Math.cos(a) * (radius - 23), cy + Math.sin(a) * (radius - 23), 'class="ci-dial-needle" stroke="#173c61" stroke-width="2.5"');
    s += `<circle cx="${cx}" cy="${cy}" r="4" fill="#173c61"/>`;
    if (detail) s += text(cx, cy + radius * 0.48, '× ' + c.r.label, 'font-size="16" text-anchor="middle"');
    return s;
  }
  function lcd(c, x, y, width = 156, height = 49) {
    let s = rect(x, y, width, height, 'rx="5" fill="#dce7dd" stroke="#5b7165" stroke-width="2"');
    s += text(x + width / 2, y + height * 0.64, c.reveal ? formatReading(c) : 'VISOR OCULTO', `font-size="${width > 300 ? 36 : c.reveal ? 22 : 18}" font-family="Consolas,monospace" text-anchor="middle" fill="#203e32"`);
    return s;
  }
  function wholeUniversalDrawing(c, g) {
    const pp = g.pxPerUnit, readOffset = 30, baseline = 148;
    const span = c.r.divisions * c.r.vernierPitch * pp, bodyWidth = Math.max(104, span + readOffset + 18);
    const ink = '#1d211b', paper = '#fff', face = '#f0f0ed';
    const outline = `fill="${paper}" stroke="${ink}" stroke-width="1.3"`;
    const detail = `fill="none" stroke="${ink}" stroke-width=".65"`;
    let s = '<g class="ci-technical-drawing" stroke-linecap="round" stroke-linejoin="round">';
    if (c.objectValue !== null) {
      const width = c.objectValue * pp, end = g.zeroPx + width;
      s += rect(g.zeroPx,210,width,31,`class="ci-workpiece" fill="#f9faf6" stroke="${c.contact?'#087f57':ink}" stroke-width="${c.contact?3:1.5}"`);
      for(let x=g.zeroPx+5;x<end-2;x+=9)s+=line(x,239,Math.min(x+8,end-2),231,'stroke="#8b9185" stroke-width=".6"');
    }
    // The beam's rated travel and auxiliary graduations use the exact same
    // physical datum as the enlarged reading face (30 px from the jaw face).
    s += rect(72,95,724,53,`class="ci-beam-body" ${outline}`);
    s += line(74,98,794,98,`class="ci-beam-guide" stroke="${ink}" stroke-width=".55"`);
    s += line(74,102,794,102,`class="ci-beam-guide" stroke="${ink}" stroke-width=".45"`);
    s += rect(788,99,6,45,`fill="${face}" stroke="${ink}" stroke-width=".6"`);
    s += rect(g.zeroPx,100,c.r.cap*pp,43,'data-caliper-beam="" fill="transparent" pointer-events="none"');
    s += scaleTicks(c,g.zeroPx+readOffset,baseline,pp,{end:(790-g.zeroPx-readOffset)/pp,centimeters:true,labelEnd:c.r.cap});
    s += text(758,119,c.r.unit==='mm'?'cm':'pol','font-size="11" text-anchor="middle"');

    // Ground measuring edges and the inset bevel follow the jaw profiles.
    s += path('M75 95 H120 V292 H113 L105 282 L96 263 L88 238 L82 214 L78 190 L75 158 Z',`class="ci-fixed-jaw" ${outline}`);
    s += rect(115,164,5,126,`fill="${face}"`);
    s += path('M80 104 V183 L85 213 L92 241 L102 268 L115 288',`class="ci-jaw-bevel" ${detail}`);
    for(let y=169;y<286;y+=8)s+=line(115,y+4,120,y,'stroke="#7b8175" stroke-width=".5"');
    s += line(120,164,120,288,`class="ci-external-fixed-contact" stroke="${ink}" stroke-width="1.6"`);
    s += path('M94 96 V59 L98 44 L104 33 L112 24 L120 18 V32 L117 49 V96 Z',outline);
    s += path('M99 91 V59 L103 45 L110 33 L116 27',`class="ci-jaw-bevel" ${detail}`);
    s += line(120,18,120,32,`class="ci-internal-fixed-contact" stroke="${ink}" stroke-width="1.3"`);

    s += `<g ${hook('x',pp)} transform="translate(${p(g.sliderPx)} 0)">`;
    s += rect(796-g.sliderPx,112,c.value*pp,7,`class="ci-depth-rod" fill="${paper}" stroke="${ink}" stroke-width="1"`);
    if(c.value>0)s+=line(796-g.sliderPx,115.5,796-g.sliderPx+c.value*pp,115.5,'stroke="#777e70" stroke-width=".45"');
    s += path(`M-10 84 H${p(bodyWidth)} V99 H17 V148 H${p(bodyWidth)} V201 H-10 Z`,`class="ci-slider-body" ${outline}`);
    s += line(20,88,bodyWidth-3,88,`stroke="${ink}" stroke-width=".55"`);
    s += line(20,197,bodyWidth-3,197,`stroke="${ink}" stroke-width=".45"`);
    s += text(23,96,'UNIVERSAL','font-size="8" letter-spacing="1.2"');
    s += path('M0 148 H32 V193 L30 212 L26 234 L20 257 L12 278 L5 292 H0 Z',`class="ci-moving-jaw" ${outline}`);
    s += rect(0,164,5,126,`fill="${face}"`);
    s += path('M27 166 V193 L25 213 L21 235 L15 259 L6 285',`class="ci-jaw-bevel" ${detail}`);
    for(let y=169;y<286;y+=8)s+=line(0,y+4,5,y,'stroke="#7b8175" stroke-width=".5"');
    s += line(0,164,0,288,`class="ci-external-moving-contact" stroke="${c.contact?'#087f57':ink}" stroke-width="${c.contact?2.5:1.6}"`);
    s += path('M-1 96 V54 L0 32 V18 L6 27 L12 39 L17 54 V96 Z',outline);
    s += path('M12 90 V55 L8 40 L3 30',`class="ci-jaw-bevel" ${detail}`);
    s += line(0,18,0,32,`class="ci-internal-moving-contact" stroke="${ink}" stroke-width="1.3"`);

    s += '<g class="ci-locking-screw">';
    s += rect(48,67,10,17,outline)+rect(44,79,18,4,outline);
    for(let y=69;y<78;y+=3)s+=line(49,y,57,y,'stroke="#68715e" stroke-width=".55"');
    s += rect(36,55,34,12,`rx="2" ${outline}`)+line(39,58,67,58,`stroke="${ink}" stroke-width=".55"`);
    for(let x=40;x<68;x+=4)s+=line(x,59,x,65,`stroke="${ink}" stroke-width=".7"`);
    s += '</g><g class="ci-guide-screws">';
    for(const [x,y] of [[8,110],[bodyWidth-7,190]]){
      s += `<circle cx="${p(x)}" cy="${y}" r="3.2" ${outline}/>`;
      s += line(x-1.8,y+1.5,x+1.8,y-1.5,`stroke="${ink}" stroke-width=".75"`);
    }
    s += '</g><g class="ci-thumbwheel">';
    s += rect(bodyWidth-35,201,12,4,outline)+rect(bodyWidth-47,205,36,14,`rx="3" ${outline}`);
    s += line(bodyWidth-44,208,bodyWidth-14,208,`stroke="${ink}" stroke-width=".5"`);
    for(let x=bodyWidth-42;x<bodyWidth-14;x+=4)s+=line(x,210,x,217,`stroke="${ink}" stroke-width=".65"`);
    s += '</g>';

    // Both sets of strokes meet at one edge, as on the single reading view.
    for(let k=0;k<=c.r.divisions;k++){
      const at=readOffset+k*c.r.vernierPitch*pp,stride=c.key==='mm-005'?2:5;
      s += line(at,baseline,at,baseline+(k%stride?11:19),`class="ci-whole-vernier" data-vernier-index="${k}" stroke="${ink}" stroke-width=".75"`);
      if(k%stride===0||k===c.r.divisions)s+=text(at,184,c.key==='mm-005'?k/2:k,`font-size="${c.r.unit==='in'?9:11}" text-anchor="middle"`);
    }
    s += text(bodyWidth-16,195,c.r.label,'font-size="9" text-anchor="end"');
    if(c.reveal){
      const index=c.ticks%c.r.mainTicks,at=readOffset+index*c.r.vernierPitch*pp;
      s+=line(at,132,at,168,'class="ci-coincidence" stroke="#087f57" stroke-width="1.5"');
    }
    s += '</g>';
    if(c.annotated){
      s += text(18,323,'Bicos externos','font-size="15"')+line(114,312,113,286,`stroke="${ink}" stroke-width=".65"`);
      s += text(18,15,'Bicos internos','font-size="14"')+line(105,21,110,30,`stroke="${ink}" stroke-width=".65"`);
      s += text(793,88,'Haste de profundidade','font-size="14" text-anchor="end"');
    }
    return s+'</g>';
  }
  function freeDimension(c,g){
    const left=g.zeroPx,right=g.sliderPx,opening=right-left,y=330,ink='#1d211b';
    let s='<g class="ci-opening-dimension" stroke-linecap="round" stroke-linejoin="round">';
    s+=line(left,296,left,338,`stroke="${ink}" stroke-width=".7"`)+line(right,296,right,338,`stroke="${ink}" stroke-width=".7"`);
    s+=line(left,y,right,y,`class="ci-dimension-span" stroke="${ink}" stroke-width=".8"`);
    if(opening>=16){
      s+=path(`M${p(left)} ${y} L${p(left+8)} ${y-3} V${y+3} Z`,`fill="${ink}"`);
      s+=path(`M${p(right)} ${y} L${p(right-8)} ${y-3} V${y+3} Z`,`fill="${ink}"`);
    }else{
      s+=line(left-15,y,left,y,`stroke="${ink}" stroke-width=".8"`)+line(right,y,right+15,y,`stroke="${ink}" stroke-width=".8"`);
      s+=path(`M${p(left)} ${y} L${p(left-8)} ${y-3} V${y+3} Z`,`fill="${ink}"`);
      s+=path(`M${p(right)} ${y} L${p(right+8)} ${y-3} V${y+3} Z`,`fill="${ink}"`);
    }
    if(c.reveal)s+=text(Math.max(160,(left+right)/2),352,formatReading(c),'class="ci-dimension-value" font-size="26" text-anchor="middle"');
    return s+'</g>';
  }
  function wholeHorizontal(c, g) {
    if(c.type==='analog')return wholeUniversalDrawing(c,g);
    const pp = g.pxPerUnit, span = c.r.divisions ? c.r.divisions * c.r.vernierPitch * pp : 0, readOffset = 30;
    const bodyWidth = Math.max(c.type === 'digital' ? 208 : c.type === 'dial' ? 146 : 98, span + readOffset + 18);
    const steel = metal(c), edge = metal(c, 'edge');
    let s = '';
    if (c.objectValue !== null) s += rect(g.zeroPx, 210, c.objectValue * pp, 31, `class="ci-workpiece" rx="2" fill="#a7bbc8" stroke="${c.contact ? '#087d53' : '#54748a'}" stroke-width="${c.contact ? 3 : 1.5}"`);
    // The beam is longer than the rated travel so that the full vernier stays
    // physically supported at maximum opening. Its graduations continue there.
    s += rect(72, 96, 724, 51, `rx="2" fill="${steel}" stroke="#62665f" stroke-width="1.3"`);
    s += line(74, 98, 794, 98, 'stroke="#fafbf5" stroke-width="1.5"');
    s += line(75, 145, 794, 145, 'stroke="#7b8076" stroke-width="1.3"');
    s += rect(g.zeroPx, 100, c.r.cap * pp, 43, 'data-caliper-beam="" fill="transparent" pointer-events="none"');
    s += scaleTicks(c, g.zeroPx + readOffset, 143, pp, { end: (790 - g.zeroPx - readOffset) / pp, centimeters: true, labelEnd: c.r.cap });
    s += text(735, 116, c.r.unit === 'mm' ? 'cm' : 'in', 'font-size="12"');
    s += path('M73 96 H120 V255 H114 L101 241 L88 218 L79 188 L73 153 Z', `class="ci-fixed-jaw" fill="${steel}" stroke="#555b52" stroke-width="1.5"`);
    s += path('M114 158 H120 V255 H114 Z', 'fill="#50584e"');
    s += path('M95 97 V56 L99 42 L108 29 L120 18 V32 L117 53 V97 Z', `fill="${edge}" stroke="#555b52" stroke-width="1.3"`);
    s += line(120,18,120,32,'class="ci-internal-fixed-contact" stroke="#242a22" stroke-width="1.3"');
    s += line(120, 164, 120, 250, 'stroke="#242a22" stroke-width="1.7"');
    s += `<g ${hook('x', pp)} transform="translate(${p(g.sliderPx)} 0)">`;
    // The rest of the coupled rod is concealed inside the beam. Its exposed
    // endpoint travels by exactly the same distance as the measuring jaw.
    s += rect(796 - g.sliderPx, 112, c.value * pp, 7, `class="ci-depth-rod" fill="${edge}" stroke="#666d60"`);
    // Top rail and lower strip wrap the beam; only the principal scale remains exposed.
    s += path(`M-9 86 H${p(bodyWidth)} V99 H18 V143 H${p(bodyWidth)} V194 H-9 Z`, `fill="${steel}" stroke="#50584e" stroke-width="1.4"`);
    s += line(21, 88, bodyWidth - 2, 88, 'stroke="#fafbf6" stroke-width="1.5"');
    s += path('M0 144 H32 V181 L27 207 L18 232 L5 255 H0 Z', `class="ci-moving-jaw" fill="${steel}" stroke="#50584e" stroke-width="1.5"`);
    s += path('M0 158 H5 V255 H0 Z', 'fill="#4e574a"');
    s += line(0, 164, 0, 250, `stroke="${c.contact ? '#087d53' : '#242a22'}" stroke-width="${c.contact ? 3 : 1.7}"`);
    s += path('M-1 96 V54 L0 32 V18 L6 29 L13 42 L17 56 V96 Z', `fill="${edge}" stroke="#555b52" stroke-width="1.3"`);
    s += line(0,18,0,32,'class="ci-internal-moving-contact" stroke="#242a22" stroke-width="1.3"');
    s += rect(48, 69, 10, 16, `fill="${edge}" stroke="#5a6156"`);
    s += rect(38, 63, 30, 10, `rx="3" fill="${edge}" stroke="#4a5145"`);
    for (let x = 42; x < 66; x += 4) s += line(x, 64, x, 71, 'stroke="#565e50" stroke-width=".8"');
    s += rect(bodyWidth - 43, 192, 29, 11, `rx="5" fill="${edge}" stroke="#555d4f"`);
    for (let x = bodyWidth - 39; x < bodyWidth - 15; x += 4) s += line(x, 194, x, 201, 'stroke="#4d5747" stroke-width=".8"');
    if (c.type === 'digital') {
      s += lcd(c, 24, 151, 164, 38);
      s += `<circle cx="48" cy="199" r="5" fill="#507d9b"/><circle cx="76" cy="199" r="5" fill="#687c87"/>`;
    } else if (c.type === 'dial') {
      s += dial(c, 77, 178, 48);
      s += line(readOffset, 119, readOffset, 144, 'class="ci-dial-main-index" stroke="#172d42" stroke-width="1.7"');
      s += path(`M${readOffset-4} 114 H${readOffset+4} L${readOffset} 120 Z`, 'fill="#172d42"');
    } else {
      s += line(readOffset - 9, 148, readOffset + span + 9, 148, 'stroke="#8c9285" stroke-width=".8"');
      for (let k = 0; k <= c.r.divisions; k++) {
        const at = readOffset + k * c.r.vernierPitch * pp, stride = c.key === 'mm-005' ? 2 : 5;
        s += line(at, 148, at, k % stride ? 158 : 165, `class="ci-whole-vernier" data-vernier-index="${k}" stroke="#22271f" stroke-width=".8"`);
        if (k % stride === 0 || k === c.r.divisions) s += text(at, 180, c.key === 'mm-005' ? k / 2 : k, 'font-size="12" text-anchor="middle"');
      }
      s += text(bodyWidth - 5, 211, c.r.label, 'font-size="11" text-anchor="end" fill="#555d4e"');
    }
    s += '</g>';
    if (c.annotated) {
      s += text(22, 279, 'Bicos externos', 'font-size="16" fill="#52748e"') + line(121, 272, 113, 246, 'stroke="#52748e"');
      s += text(18, 26, 'Bicos internos', 'font-size="16" fill="#52748e"') + line(120, 29, 129, 41, 'stroke="#52748e"');
      s += text(765, 88, 'Haste de profundidade acoplada ao cursor', 'font-size="16" fill="#52748e"');
    }
    return s;
  }
  function wholeDepth(c, g) {
    const pp = g.pxPerUnit, objectEnd = c.objectValue === null ? null : g.zeroPx + c.objectValue * pp;
    let s = '';
    if (objectEnd !== null) {
      s += path(`M140 130 H241 V${p(objectEnd)} H291 V130 H405 V276 H140 Z`, `class="ci-workpiece" fill="#c2d1dc" stroke="${c.contact ? '#087d53' : '#607f95'}" stroke-width="${c.contact ? 3 : 1.5}"`);
      s += line(243, objectEnd, 289, objectEnd, `stroke="${c.contact ? '#087d53' : '#385970'}" stroke-width="2"`);
    }
    s += rect(252, 130, 20, 90, 'data-caliper-beam="" fill="transparent" pointer-events="none"');
    s += `<g ${hook('y', pp)} transform="translate(0 ${p(c.value * pp)})">`;
    s += rect(253, 10, 22, 120, `class="ci-depth-probe" fill="${metal(c)}" stroke="#5b6354" stroke-width="1.5"`);
    s += scaleTicks(c, 254, 130, pp, { vertical: true, upwards: true, end: 200 * c.r.cap / 150, labelEnd: c.r.cap });
    s += line(253, 130, 275, 130, `stroke="${c.contact ? '#087d53' : '#304d63'}" stroke-width="${c.contact ? 3 : 2}"`);
    s += rect(250, 3, 28, 10, `rx="3" fill="${metal(c, 'edge')}" stroke="#5b6354"`);
    s += '</g>';
    s += rect(137, 111, 271, 19, 'rx="2" fill="#b4c7d5" stroke="#546f85" stroke-width="1.5"');
    s += rect(281, 97, 21, 13, 'rx="3" fill="#5f7c92"');
    // A depth gauge has a fixed bridge/vernier and a moving graduated probe.
    for (let k = 0; k <= c.r.divisions; k++) {
      const at = g.zeroPx - k * c.r.vernierPitch * pp;
      s += line(280, at, k % 5 ? 287 : 292, at, `class="ci-whole-vernier" data-vernier-index="${k}" stroke="#2b465b" stroke-width=".8"`);
    }
    s += text(478, 85, 'Ponte fixa · haste graduada móvel', 'font-size="22" font-weight="650"');
    s += text(478, 117, 'A referência é a face de apoio da ponte.', 'font-size="18" fill="#54738c"');
    if (c.annotated) s += text(478, 150, 'O terminal inferior indica a profundidade alcançada.', 'font-size="17" fill="#54738c"');
    return s;
  }
  function wholeHeight(c, g) {
    const pp = -g.pxPerUnit, objectTop = c.objectValue === null ? null : g.zeroPx + c.objectValue * g.pxPerUnit;
    let s = line(64, 270, 433, 270, 'stroke="#718da3" stroke-width="2"');
    if (objectTop !== null) s += rect(85, objectTop, 95, 270 - objectTop, `class="ci-workpiece" fill="#b8ccd9" stroke="${c.contact ? '#087d53' : '#587b94'}" stroke-width="${c.contact ? 3 : 1.5}"`);
    s += rect(248, 15, 42, 251, 'fill="#cedae4" stroke="#617f96" stroke-width="1.5"');
    s += rect(248, 120, 42, 150, 'data-caliper-beam="" fill="transparent" pointer-events="none"');
    // The scale reference sits above the scribing tip. Both main and vernier
    // share this offset; the measuring point remains on the reference plane.
    const readOffset = 40, scaleZero = g.zeroPx - readOffset;
    s += scaleTicks(c, 252, scaleZero, pp, { vertical: true, upwards: true, end: (scaleZero - 15) / pp });
    s += rect(205, 244, 157, 26, 'rx="5" fill="#8da5b9" stroke="#4e6d85" stroke-width="1.5"');
    const span = c.r.divisions * c.r.vernierPitch * pp;
    s += `<g ${hook('y', g.pxPerUnit)} transform="translate(0 ${p(g.sliderPx)})">`;
    s += rect(278, -span - readOffset - 10, 49, span + 22, 'rx="4" fill="#bdcfdc" stroke="#57758c" stroke-width="1.5"');
    s += path('M280 -48 H186 L173 -35 V-5 L178 0 H184 V-31 H280 Z', `fill="#a8bfce" stroke="${c.contact ? '#087d53' : '#4b6b83'}" stroke-width="${c.contact ? 3 : 1.5}"`);
    for (let k = 0; k <= c.r.divisions; k++) s += line(280, -readOffset - k * c.r.vernierPitch * pp, k % 5 ? 287 : 294, -readOffset - k * c.r.vernierPitch * pp, `class="ci-whole-vernier" data-vernier-index="${k}" stroke="#263f54" stroke-width=".8"`);
    s += rect(326, -58, 13, 25, 'rx="4" fill="#5c7890"');
    s += '</g>';
    s += text(484, 83, 'Base fixa · cursor com ponta de traçagem', 'font-size="22" font-weight="650"');
    s += text(484, 115, 'A altura parte da superfície de referência.', 'font-size="18" fill="#54738c"');
    if (c.annotated) s += text(484, 147, 'O cursor sobe na coluna graduada e toca o topo da peça.', 'font-size="17" fill="#54738c"');
    return s;
  }
  function vernierDetail(c) {
    const r = c.r, scale = r.unit === 'mm' ? r.divisions === 50 ? 20 : r.divisions === 20 ? 24 : 105 : r.divisions === 8 ? 2000 : 1600;
    const surface = c.type === 'analog' ? '#f9faf6' : metal(c);
    const coincide = c.ticks % r.mainTicks, mainTicks = c.ticks - coincide, main = mainTicks / r.denominator, height = 228;
    const originTicks = Math.max(0, mainTicks - r.mainTicks * 0.6), x = ticks => 140 + (ticks - originTicks) * scale / r.denominator;
    const coincidenceTicks = c.ticks + coincide * r.vernierPitchTicks;
    const mainY = 106, vernierY = 108;
    let content = text(25, 27, 'Lupa · escala principal e nônio contínuos', 'font-size="20" font-weight="700"');
    content += '<g class="ci-detail-window" data-window="0" data-px-per-unit="' + scale + '">';
    content += rect(15, 44, 1245, 62, 'rx="2" fill="' + surface + '" stroke="#787e71"');
    content += rect(15, 108, 1245, 84, 'rx="2" fill="' + surface + '" stroke="#787e71"');
    content += line(16, 46, 1258, 46, 'stroke="#fff" stroke-width="1.5"');
    content += text(30, 83, r.unit === 'mm' ? 'mm' : 'pol', 'font-size="17" fill="#535b4c"');
    const first = Math.max(0, Math.ceil(originTicks / r.mainTicks)), last = Math.floor((originTicks + 1090 * r.denominator / scale) / r.mainTicks);
    const chars = num(last * r.mainTicks / r.denominator, r.unit === 'mm' ? 0 : 4).length;
    const labelSize = Math.max(10, Math.min(17, Math.floor((r.mainPitch * scale - 3) / (.62 * chars))));
    for (let k = first; k <= last; k++) {
      const ticks = k * r.mainTicks, value = ticks / r.denominator, at = x(ticks), select = c.reveal && ticks === coincidenceTicks;
      const major = r.unit === 'mm' ? k % 5 === 0 : true;
      content += line(at, mainY - (major ? 27 : 17), at, mainY, 'class="ci-detail-main" data-main-unit="' + p(value) + '" stroke="' + (select ? '#087f57' : '#262c22') + '" stroke-width="' + (select ? 2.4 : 1.2) + '"');
      content += text(at, mainY - 33, num(value, r.unit === 'mm' ? 0 : 4), `class="ci-main-label" font-size="${labelSize}" text-anchor="middle"`);
    }
    content += '<g ' + hook('x', scale) + '>';
    content += rect(90, vernierY, 1150, 82, 'fill="transparent" pointer-events="all"');
    for (let k = 0; k <= r.divisions; k++) {
      const ticks = c.ticks + k * r.vernierPitchTicks, value = ticks / r.denominator, at = x(ticks), select = c.reveal && k === coincide;
      const stride = c.key === 'mm-005' ? 2 : r.divisions === 50 ? 5 : 1;
      content += line(at, vernierY, at, vernierY + (k % stride ? 21 : 32), 'class="ci-detail-vernier" data-vernier-index="' + k + '"' + (c.reveal ? ' data-vernier-unit="' + p(value) + '"' : '') + ' stroke="' + (select ? '#087f57' : '#262c22') + '" stroke-width="' + (select ? 2.4 : 1.2) + '"');
      if (k % stride === 0 || k === r.divisions) content += text(at, vernierY + 55, c.key === 'mm-005' ? k / 2 : k, 'font-size="18" text-anchor="middle"');
      if (select) content += line(at, mainY, at, vernierY + 33, 'class="ci-coincidence" stroke="#087f57" stroke-width="2"');
    }
    content += '</g></g>';
    content += text(25, height - 11, c.reveal ? num(main, 4) + ' + ' + coincide + ' × ' + r.label + ' = ' + formatReading(c) : r.divisions + ' divisões do nônio · resolução ' + r.label + ' · arraste a escala inferior para ajustar', 'font-size="17" fill="' + (c.reveal ? '#087f57' : '#56654e') + '"');
    return { content, height };
  }
  function dialDetail(c) {
    const period = c.r.dialPeriod, remainder = c.ticks % 100, main = (c.ticks - remainder) / c.r.denominator;
    const origin = Math.max(0, main - period), scale = 620 / (4 * period), x = value => 80 + (value - origin) * scale;
    let content = text(25, 29, 'Ampliação · escala principal e relógio', 'font-size="21" font-weight="700"');
    content += rect(29, 59, 717, 165, 'rx="9" fill="#f2f7fb" stroke="#c7dce9"');
    for (let k = Math.ceil(origin / period); k <= Math.floor((origin + 4 * period) / period); k++) {
      const v = clean(k * period), at = x(v);
      content += line(at, 105, at, 139, 'stroke="#263d51" stroke-width="1.4"') + text(at, 92, num(v, 2), 'font-size="18" text-anchor="middle"');
    }
    content += `<g ${hook('x', scale)}>${line(x(c.value), 140, x(c.value), 173, 'stroke="#476d8d" stroke-width="2.5"')}${text(x(c.value), 194, 'cursor', 'font-size="16" text-anchor="middle"')}</g>`;
    content += dial(c, 1010, 151, 104, true);
    content += text(25, 265, c.reveal ? `${num(main, 2)} + ${remainder} × ${c.r.label} = ${formatReading(c)}` : `Relógio: 100 divisões · uma volta = ${num(period, 2)} ${c.r.unit === 'mm' ? 'mm' : 'pol'}`, `font-size="19" fill="${c.reveal ? '#087f57' : '#52748e'}"`);
    return { content, height: 287 };
  }
  function digitalDetail(c, g) {
    let content = text(25, 29, 'Ampliação do visor digital', 'font-size="21" font-weight="700"');
    content += `<g ${hook('x', g.pxPerUnit * 3)}>${rect(238, 66, 774, 143, 'rx="18" fill="#b9cad7" stroke="#5a7890" stroke-width="2"')}${lcd(c, 316, 91, 620, 89)}</g>`;
    content += text(25, 255, c.reveal ? 'Leitura do visor: ' + formatReading(c) : 'Visor oculto. Encoste o bico na peça e confirme a medição.', `font-size="20" fill="${c.reveal ? '#087f57' : '#52748e'}"`);
    return { content, height: 281 };
  }
  // One enlarged caliper face for the assessment game. This is the instrument's
  // principal scale and sliding vernier sharing one edge, not a second diagram.
  function gameScale(c) {
    const r = c.r;
    const scale = r.unit === 'mm' ? r.divisions === 10 ? 50 : r.divisions === 20 ? 20 : 16 : r.divisions === 8 ? 1400 : 1200;
    const bucketTicks = r.unit === 'mm' ? 10 * r.denominator : r.denominator / 4;
    const marginTicks = r.unit === 'mm' ? (r.divisions === 10 ? 4 : 8) * r.denominator : r.denominator / 10;
    const originTicks = Math.max(0, Math.floor((c.ticks - marginTicks) / bucketTicks) * bucketTicks);
    const x = ticks => 60 + (ticks - originTicks) * scale / r.denominator;
    const mainY = 250, height = 410, zero = x(c.ticks), end = x(c.ticks + r.divisions * r.vernierPitchTicks);
    const index = c.ticks % r.mainTicks, coincidenceTicks = c.ticks + index * r.vernierPitchTicks;
    const first = Math.max(0, Math.ceil((originTicks - 60 * r.denominator / scale) / r.mainTicks));
    const last = Math.floor((originTicks + 1220 * r.denominator / scale) / r.mainTicks);
    let content = rect(0, 0, 1280, height, 'fill="#fff"');
    content += '<g class="ci-game-window" data-px-per-unit="' + scale + '">';
    // Read the metric main numbers in centimetres; every small interval is 1 mm.
    for (let k = first; k <= last; k++) {
      const ticks = k * r.mainTicks, value = ticks / r.denominator, at = x(ticks);
      const major = r.unit === 'mm' ? ticks % (10 * r.denominator) === 0 : r.divisions === 8 ? ticks % (r.denominator / 4) === 0 : ticks % (r.denominator / 10) === 0;
      const middle = r.unit === 'mm' && ticks % (5 * r.denominator) === 0;
      const selected = c.reveal && ticks === coincidenceTicks;
      content += line(at, mainY - (major ? 100 : middle ? 73 : 45), at, mainY, `class="ci-game-main" data-main-unit="${p(value)}" stroke="${selected ? '#087f57' : '#1d211b'}" stroke-width="${selected ? 2.8 : 1.35}"`);
      if (major && at >= 24 && at <= 1230) {
        const label = r.unit === 'mm' ? String(value / 10) : c.key === 'in-128' ? Engine.formatGraduation(ticks,c.key) : num(value, 1);
        content += text(at, 132, label, `font-size="${r.unit === 'mm' ? 64 : 42}" text-anchor="middle"`);
      }
    }
    content += line(0, mainY, 1280, mainY, 'stroke="#262b22" stroke-width="1.3"');
    content += text(1255, 111, r.unit === 'mm' ? 'cm' : 'pol', 'font-size="24" text-anchor="end"');
    content += '<g ' + hook('x',scale) + '>';
    content += rect(zero - 36, 8, end - zero + 72, 57, 'class="ci-game-cursor-top" fill="#f9faf6" stroke="#333b2e" stroke-width="1.5"');
    content += text(zero - 14, 44, TYPES[c.type].name, 'font-size="21"');
    content += text(end + 14, 44, r.label, 'font-size="21" text-anchor="end"');
    content += rect(zero - 36, mainY, end - zero + 72, 140, 'class="ci-game-cursor" fill="#f9faf6" stroke="#333b2e" stroke-width="1.5"');
    for (let k = 0; k <= r.divisions; k++) {
      const ticks = c.ticks + k * r.vernierPitchTicks, at = x(ticks), selected = c.reveal && k === index;
      const stride = c.key === 'mm-005' ? 2 : r.divisions === 50 ? 5 : 1;
      content += line(at, mainY, at, mainY + (k % stride ? 49 : 77), `class="ci-game-vernier" data-vernier-index="${k}" stroke="${selected ? '#087f57' : '#1d211b'}" stroke-width="${selected ? 2.8 : 1.4}"`);
      if (k % stride === 0 || k === r.divisions) content += text(at, mainY + 119, c.key === 'mm-005' ? k / 2 : k, 'font-size="39" text-anchor="middle"');
      if (selected) content += line(at, mainY - 45, at, mainY + 78, 'class="ci-coincidence" stroke="#087f57" stroke-width="2.8"');
    }
    content += '</g></g>';
    return { content,height };
  }
  function render(options = {}) {
    const c = settings(options), g = geometry(options), section = options.section || 'full';
    const technical = c.type === 'analog';
    c.prefix = 'ci-' + c.type + '-' + section;
    if (!['full', 'instrument', 'detail', 'game', 'free'].includes(section)) throw new RangeError('Seção do instrumento desconhecida.');
    if(section==='free'&&!technical)throw new RangeError('A vista livre usa o paquímetro universal analógico.');
    const instrument = section === 'detail' || section === 'game' ? '' : c.type === 'depth' ? wholeDepth(c, g) : c.type === 'height' ? wholeHeight(c, g) : wholeHorizontal(c, g);
    const detail = section === 'instrument' || section === 'free' ? null : c.type === 'digital' ? digitalDetail(c, g) : c.type === 'dial' ? dialDetail(c) : section === 'game' ? gameScale(c) : vernierDetail(c);
    const instrumentHeight=technical?330:300;
    const height = section === 'free' ? 360 : section === 'instrument' ? instrumentHeight : section === 'detail' || section === 'game' ? detail.height : instrumentHeight + detail.height;
    const body = section === 'free' ? instrument+freeDimension(c,g) : section === 'instrument' ? instrument : section === 'detail' || section === 'game' ? detail.content : instrument + `<g transform="translate(0 ${instrumentHeight})">${detail.content}</g>`;
    const width=section==='free'?840:1280,viewBox=section==='free'?'50 0 840 360':`0 0 1280 ${height}`;
    const label = TYPES[c.type].name + (c.reveal ? '. Leitura: ' + formatReading(c) : '. Instrumento com partes móveis e escalas para leitura.');
    return `<svg xmlns="http://www.w3.org/2000/svg" class="caliper-instrument ci-${c.type}${section === 'game' ? ' ci-game-scale' : section==='free'?' ci-free-instrument':''}" viewBox="${viewBox}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}"${c.reveal ? ` data-reading="${p(c.value)}"` : ''} style="display:block;width:100%;height:auto;overflow:visible;font-family:Segoe UI,Arial,sans-serif;background:${technical || section === 'game' ? '#fff' : 'linear-gradient(180deg,#f5f6f2,#e5e8df)'};border-radius:${technical || section === 'game' ? 0 : 10}px"><g font-size="16" fill="#1c3c55">${technical ? '' : finishes(c)}${body}</g></svg>`;
  }
  const api = Object.freeze({ RESOLUTIONS, TYPES, geometry, render });
  root.CaliperInstrument = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
