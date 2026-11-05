(function (root) {
  'use strict';

  const INSTRUMENTS = Object.freeze({
    ruler: Object.freeze({
      id: 'ruler', name: 'Régua graduada', units: ['mm', 'in'],
      resolutions: { mm: [1, 0.5], in: [1 / 16, 1 / 32] },
      recommendedMinWidth: 780
    }),
    caliper: Object.freeze({
      id: 'caliper', name: 'Paquímetro com nônio', units: ['mm'],
      resolutions: { mm: [0.1, 0.05, 0.02] },
      verniers: [
        { resolution: 0.1, divisions: 10, span: 9 },
        { resolution: 0.05, divisions: 20, span: 19 },
        { resolution: 0.02, divisions: 50, span: 49 }
      ],
      recommendedMinWidth: 780
    })
  });

  const round = n => Math.round(n * 1e9) / 1e9;
  const point = n => String(Math.round(n * 1e5) / 1e5);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  const number = (n, digits = 2) => Number(n).toFixed(digits).replace(/\.?0+$/, '').replace('.', ',');
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const fraction = (value, denominator) => {
    const ticks = Math.round(value * denominator), whole = Math.floor(ticks / denominator);
    const remainder = ticks % denominator;
    if (!remainder) return String(whole);
    const divisor = gcd(remainder, denominator);
    return (whole ? whole + ' ' : '') + remainder / divisor + '/' + denominator / divisor;
  };
  function validate(instrument, value, resolution, unit) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('A leitura deve ser um número não negativo.');
    const allowed = INSTRUMENTS[instrument].resolutions[unit];
    if (!allowed || !allowed.some(r => Math.abs(r - resolution) < 1e-9)) {
      throw new RangeError('Unidade ou resolução não suportada para este instrumento.');
    }
    if (Math.abs(value / resolution - Math.round(value / resolution)) > 1e-6) {
      throw new RangeError('A leitura precisa coincidir com uma divisão da resolução indicada.');
    }
  }
  const text = (x, y, content, extra = '') => `<text x="${point(x)}" y="${point(y)}" ${extra}>${escape(content)}</text>`;
  const line = (x1, y1, x2, y2, extra = '') => `<line x1="${point(x1)}" y1="${point(y1)}" x2="${point(x2)}" y2="${point(y2)}" ${extra}/>`;
  function frame(instrument, height, content, { answer, reading, interactive, label }) {
    return `<svg xmlns="http://www.w3.org/2000/svg" class="metro-instrument metro-${instrument}" viewBox="0 0 820 ${height}" width="820" height="${height}" role="img" aria-label="${escape(label)}"${interactive ? ' tabindex="0" data-interactive="true"' : ''}${answer ? ` data-reading="${point(reading)}"` : ''} style="display:block;width:100%;height:auto;font-family:Segoe UI,Arial,sans-serif;background:#fff;border-radius:14px;color:#18314b"><g font-size="16" fill="#18314b">${content}</g></svg>`;
  }

  function rulerSVG(options = {}) {
    const { value = 0, resolution = 1, unit = 'mm', answer = false, interactive = false } = options;
    validate('ruler', value, resolution, unit);
    const metric = unit === 'mm', denominator = metric ? 0 : Math.round(1 / resolution);
    const resolutionLabel = metric ? number(resolution, 1) + ' mm' : '1/' + denominator + ' pol';
    const readingLabel = metric ? number(value, 1) + ' mm' : fraction(value, denominator) + ' pol';
    const x = 64, width = 692;
    const fullEnd = metric ? Math.max(20, Math.ceil((value + 8) / 10) * 10) : Math.max(1, Math.ceil(value + 0.25));
    const zoomStart = metric ? Math.max(0, Math.floor(value) - 2) : Math.max(0, Math.floor(value) - 0.25);
    const zoomEnd = zoomStart + (metric ? 6 : 1.5);
    let content = text(28, 30, 'Régua graduada', 'font-size="22" font-weight="750"');
    content += text(28, 57, 'Resolução: ' + resolutionLabel, 'fill="#52718c"');

    function scale(start, end, y, detail) {
      const pixels = width / (end - start), position = v => x + (v - start) * pixels;
      let s = `<g class="ruler-window" data-view="${detail ? 'detail' : 'whole'}" data-px-per-unit="${point(pixels)}">`;
      s += `<rect x="${x}" y="${y}" width="${width}" height="74" rx="5" fill="#e8eef3" stroke="#8ea5b8" stroke-width="1.3"/>`;
      const first = Math.ceil((start - 1e-8) / resolution), last = Math.floor((end + 1e-8) / resolution);
      for (let tick = first; tick <= last; tick++) {
        const v = round(tick * resolution), at = position(v);
        let height, labelled;
        if (metric) {
          const whole = Math.abs(v - Math.round(v)) < 1e-7;
          const five = whole && Math.round(v) % 5 === 0;
          const ten = whole && Math.round(v) % 10 === 0;
          labelled = detail ? whole : ten;
          height = ten ? 30 : five ? 25 : whole ? 20 : 12;
        } else {
          const n = Math.round(v * denominator);
          const whole = n % denominator === 0;
          labelled = whole;
          height = whole ? 31 : n % (denominator / 2) === 0 ? 26 : n % (denominator / 4) === 0 ? 21 : n % (denominator / 8) === 0 ? 16 : 11;
        }
        const selected = answer && Math.abs(v - value) < 1e-7;
        s += line(at, y, at, y + height, `class="ruler-tick" data-scale-value="${point(v)}" stroke="${selected ? '#09845b' : '#243c50'}" stroke-width="${selected ? 2.8 : 1.2}"`);
        if (labelled) s += text(at, y + 58, metric ? String(Math.round(v)) : String(Math.round(v)), 'text-anchor="middle" font-size="17"');
      }
      // The object begins at zero in the complete view. In the detail view,
      // the same object continues in from the cropped left edge.
      const objectStart = position(Math.max(0, start)), edge = position(value);
      if (edge > objectStart) s += `<rect class="measured-object" x="${point(objectStart)}" y="${y - 31}" width="${point(edge - objectStart)}" height="23" rx="2" fill="#879caf" stroke="#405d75" stroke-width="1.2"/>`;
      if (value >= start && value <= end) s += line(edge, y - 35, edge, y + 34, `class="object-edge" stroke="${answer ? '#09845b' : '#536f86'}" stroke-width="${answer ? 2.5 : 1.2}" stroke-dasharray="4 3"`);
      s += text(x + width - 9, y + 71, metric ? 'mm' : 'pol', 'text-anchor="end" font-size="16" fill="#52718c"');
      return s + '</g>';
    }
    content += scale(0, fullEnd, 106, false);
    content += text(28, 211, 'Ampliação da extremidade · mesma unidade', 'font-size="16" fill="#52718c"');
    content += scale(zoomStart, zoomEnd, 254, true);
    if (answer) {
      content += `<rect x="22" y="343" width="776" height="31" rx="7" fill="#e4f5ec"/>`;
      content += text(38, 365, 'Leitura: ' + readingLabel, 'font-size="18" font-weight="750" fill="#08784f"');
    }
    return frame('ruler', 386, content, {
      answer, reading: value, interactive,
      label: answer ? 'Régua graduada. Leitura correta: ' + readingLabel : 'Régua graduada com objeto e ampliação da extremidade. Leia as divisões da escala.'
    });
  }

  function caliperSVG(options = {}) {
    const { value = 0, resolution = 0.1, unit = 'mm', answer = false, interactive = false } = options;
    validate('caliper', value, resolution, unit);
    const divisions = Math.round(1 / resolution), pitch = (divisions - 1) / divisions;
    const totalTicks = Math.round(value / resolution);
    // Integer arithmetic prevents 12.98 becoming main=12/index=48 because
    // of a binary floating-point remainder.
    const main = Math.floor(totalTicks / divisions), coincident = totalTicks % divisions;
    const cleanValue = round(totalTicks / divisions);
    const count = divisions === 50 ? 4 : divisions === 20 ? 2 : 1;
    const height = count === 4 ? 492 : 360;
    const rowTop = count === 1 ? 151 : count === 2 ? 91 : 73;
    const rowStep = count === 4 ? 88 : 98;
    const pixels = divisions === 50 ? 48 : divisions === 20 ? 64 : 66;
    const chunks = [];
    for (let window = 0; window < count; window++) {
      const start = Math.round(window * divisions / count), end = Math.round((window + 1) * divisions / count);
      chunks.push({ start, end });
    }
    let content = text(28, 29, 'Paquímetro · leitura ampliada', 'font-size="22" font-weight="750"');
    content += text(28, 55, `Nônio: ${divisions} divisões = ${divisions - 1} mm · resolução ${number(resolution, 2)} mm`, 'fill="#52718c" font-size="16"');

    chunks.forEach(({ start, end }, window) => {
      const y = rowTop + window * rowStep;
      // Keep the last complete millimetre visible before the vernier zero.
      // Later windows retain their own contiguous enlarged view.
      const origin = window === 0 ? Math.max(0, main - 0.2) : cleanValue + start * pitch - 0.7;
      const left = 80, right = 764;
      const at = mm => left + (mm - origin) * pixels;
      const mainY = y + 29, vernierY = y + 46;
      const absoluteCoincidence = round(cleanValue + coincident * pitch);
      let s = `<g class="caliper-window" data-window="${window}" data-px-per-mm="${pixels}" data-start-index="${start}" data-end-index="${end}">`;
      s += `<rect x="19" y="${y - 5}" width="780" height="85" rx="9" fill="#f5f8fb" stroke="#d5e1ea"/>`;
      s += text(30, mainY - 1, 'mm', 'font-size="16" fill="#52718c"');
      s += text(30, vernierY + 18, 'n', 'font-size="16" fill="#52718c"');
      s += line(left, mainY, right, mainY, 'stroke="#7591a7" stroke-width="1.2"');
      s += line(left, vernierY, right, vernierY, 'stroke="#7591a7" stroke-width="1.2"');
      const minMain = Math.max(0, Math.ceil(origin)), maxMain = Math.floor(origin + (right - left) / pixels);
      for (let mm = minMain; mm <= maxMain; mm++) {
        const x = at(mm), selected = answer && Math.abs(mm - absoluteCoincidence) < 1e-7 && coincident >= start && coincident <= end;
        s += line(x, mainY - 13, x, mainY, `class="main-tick" data-main-mm="${mm}" stroke="${selected ? '#087f59' : '#263d50'}" stroke-width="${selected ? 2.4 : 1.2}"`);
        s += text(x, mainY - 17, String(mm), 'text-anchor="middle" font-size="16"');
      }
      for (let k = start; k <= end; k++) {
        const mm = round(cleanValue + k * pitch), x = at(mm), selected = answer && k === coincident;
        s += line(x, vernierY, x, vernierY + 14, `class="vernier-tick" data-vernier-index="${k}"${answer ? ` data-vernier-mm="${point(mm)}"` : ''} stroke="${selected ? '#087f59' : '#263d50'}" stroke-width="${selected ? 2.4 : 1.2}"`);
        s += text(x, vernierY + 31, String(k), 'text-anchor="middle" font-size="16"');
        if (selected) s += line(x, mainY - 1, x, vernierY + 1, 'class="coincidence-guide" stroke="#087f59" stroke-width="2" stroke-dasharray="3 2"');
      }
      s += '</g>';
      content += s;
    });
    const footer = count === 4 ? 451 : 306;
    if (answer) {
      content += `<rect x="22" y="${footer - 5}" width="776" height="39" rx="8" fill="#e4f5ec"/>`;
      content += text(37, footer + 21, `${main} mm + ${coincident} × ${number(resolution, 2)} mm = ${number(cleanValue, 2)} mm`, 'font-size="19" font-weight="750" fill="#08784f"');
    } else {
      content += text(28, footer + 9, 'Em cima: escala principal em mm. Embaixo: índice de cada divisão do nônio.', 'font-size="16" fill="#52718c"');
      if (count > 1) content += text(28, footer + 31, 'As janelas são trechos consecutivos do mesmo nônio, ampliados na mesma proporção.', 'font-size="16" fill="#52718c"');
    }
    return frame('caliper', height, content, {
      answer, reading: cleanValue, interactive,
      label: answer ? 'Paquímetro. Leitura correta: ' + number(cleanValue, 2) + ' milímetros.' : 'Paquímetro com escala principal e nônio em janelas ampliadas. Compare o zero e a coincidência das divisões.'
    });
  }

  function renderInstrument(question, { answer = false } = {}) {
    if (!question || !Object.prototype.hasOwnProperty.call(INSTRUMENTS, question.instrument)) {
      throw new RangeError('Instrumento desconhecido. Use ruler ou caliper.');
    }
    const options = { ...question, answer };
    return question.instrument === 'ruler' ? rulerSVG(options) : caliperSVG(options);
  }

  const api = Object.freeze({ rulerSVG, caliperSVG, renderInstrument, INSTRUMENTS });
  root.MetroInstruments = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
