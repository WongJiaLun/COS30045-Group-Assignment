/* Shared helpers: formatters, tooltip, SVG setup, axes, legends, tiles and tables.
   Everything is attached to the global JV.u so the other files can pick what they need. */
(function () {
  'use strict';
  const JV = (window.JV = window.JV || {});

  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MINUS = '−';
  const $ = id => document.getElementById(id);
  const fmt = d3.format(',');

  /* ---------- number formatting ---------- */
  const sgn = v => (v > 0 ? '+' : v < 0 ? MINUS : '');
  // signed percentage from a fraction: 0.0527 -> "+5.3%"
  const pct = (v, dp = 1) => {
    const k = Math.pow(10, dp + 2);
    return sgn(Math.round(v * k) / k) + Math.abs(v * 100).toFixed(dp) + '%';
  };
  const plainPct = (v, dp = 1) => (v * 100).toFixed(dp) + '%';
  const signedN = v => sgn(v) + fmt(Math.abs(v));
  const kfmt = v => (v === 0 ? '0' : (v / 1000) + 'K');
  const pfmt = v => { const r = Math.round(v * 100); return (r > 0 ? '+' : r < 0 ? MINUS : '') + Math.abs(r) + '%'; };
  const listJoin = a => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

  /* ---------- tooltip ---------- */
  const tipSel = d3.select('#tip');
  let tipKey = null;
  const tip = {
    // evt needs clientX / clientY; rows are { value, label, color? }
    show(evt, title, rows, key) {
      if (key !== tipKey) {
        tipKey = key;
        tipSel.html('');
        tipSel.append('div').attr('class', 'tt-title').text(title);
        rows.forEach(r => {
          const row = tipSel.append('div').attr('class', 'tt-row');
          if (r.color) row.append('span').attr('class', 'tt-key').style('background', r.color);
          row.append('span').attr('class', 'tt-val').text(r.value);
          row.append('span').attr('class', 'tt-lab').text(r.label);
        });
      }
      tipSel.style('opacity', 1);
      const node = tipSel.node(), w = node.offsetWidth, h = node.offsetHeight;
      let x = evt.clientX + 14, y = evt.clientY - h - 12;
      if (x + w > window.innerWidth - 8) x = evt.clientX - w - 14;
      if (x < 8) x = 8;
      if (y < 8) y = evt.clientY + 16;
      tipSel.style('left', x + 'px').style('top', y + 'px');
    },
    hide() { tipSel.style('opacity', 0); tipKey = null; },
    // attach hover + keyboard focus to a selection; info(d) -> { key, title, rows }
    bind(sel, info) {
      sel.on('pointerenter pointermove', function (e, d) { const t = info(d); tip.show(e, t.title, t.rows, t.key); })
        .on('pointerleave', tip.hide)
        .on('focus', function (e, d) {
          const r = this.getBoundingClientRect(), t = info(d);
          tip.show({ clientX: r.left + r.width / 2, clientY: r.top }, t.title, t.rows, t.key);
        })
        .on('blur', tip.hide);
    }
  };

  /* ---------- SVG scaffolding ---------- */
  // Empties el and returns an svg plus an inner <g> offset by the margins m = {t, r, b, l}
  function mk(el, height, m) {
    const root = d3.select(el);
    root.selectAll('*').remove();
    const W = Math.max(260, el.clientWidth || 320);
    const svg = root.append('svg').attr('width', W).attr('height', height)
      .attr('viewBox', '0 0 ' + W + ' ' + height).attr('role', 'img');
    const g = svg.append('g').attr('transform', 'translate(' + m.l + ',' + m.t + ')');
    return { svg, g, W, w: W - m.l - m.r, h: height - m.t - m.b };
  }

  // horizontal gridlines with value labels on the left
  function yGrid(g, y, w, ticks, fmtFn) {
    const ts = Array.isArray(ticks) ? ticks : y.ticks(ticks);
    ts.forEach(v => {
      const yy = y(v);
      g.append('line').attr('class', 'gl' + (Math.abs(v) < 1e-9 && y.domain()[0] <= 0 ? ' zero' : ''))
        .attr('x1', 0).attr('x2', w).attr('y1', yy).attr('y2', yy);
      g.append('text').attr('class', 'tl').attr('x', -8).attr('y', yy).attr('dy', '0.32em')
        .attr('text-anchor', 'end').text(fmtFn(v));
    });
  }

  // category labels under a chart; uses item.short when labels would touch
  function xLabels(g, items, h) {
    const tight = items.length > 1 && items[1].x - items[0].x < 34;
    items.forEach(it => g.append('text').attr('class', 'tl').attr('x', it.x).attr('y', h + 19)
      .attr('text-anchor', 'middle').text(tight && it.short ? it.short : it.text));
  }

  // column path: flat at the baseline y0, 4px rounded at the data end y1 (works up or down)
  function barPath(x, y0, y1, w, r) {
    const hg = Math.abs(y1 - y0);
    if (hg < 0.5) return 'M' + x + ',' + y0 + 'h' + w;
    r = Math.min(r, hg, w / 2);
    if (y1 <= y0) return 'M' + x + ',' + y0 + 'V' + (y1 + r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 + r) + 'V' + y0 + 'Z';
    return 'M' + x + ',' + y0 + 'V' + (y1 - r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 - r) + 'V' + y0 + 'Z';
  }

  // month axis: one band per month, shared by any chart that needs aligned months
  function xBand(data, w) { return d3.scaleBand(data.map(d => d.key), [0, w]).paddingInner(0.15).paddingOuter(0); }
  function xTicks(g, data, x, h) {
    const showJul = data.length <= 48;
    const yearEvery = x.step() * 12 < 44 ? 2 : 1;
    data.forEach(d => {
      if (d.m !== 0 && !(showJul && d.m === 6)) return;
      const px = x(d.key) + x.bandwidth() / 2;
      g.append('line').attr('class', 'xt').attr('x1', px).attr('x2', px).attr('y1', h).attr('y2', h + 5);
      if (d.m === 0 && d.year % yearEvery !== 0) return;
      g.append('text').attr('class', 'tl').attr('x', px).attr('y', h + 19)
        .attr('text-anchor', 'middle').text(d.m === 0 ? d.year : 'Jul');
    });
  }

  /* ---------- DOM builders (textContent only, so data is never parsed as HTML) ---------- */
  // items: { label, color, type: 'rect' | 'dot' | 'line' }
  function legend(id, items) {
    const el = $(id); el.textContent = '';
    items.forEach(it => {
      const s = document.createElement('span'); s.className = 'lg';
      const k = document.createElement('i'); k.className = 'lg-key ' + it.type; k.style.background = it.color;
      s.appendChild(k); s.appendChild(document.createTextNode(it.label)); el.appendChild(s);
    });
  }
  // items: { label, value, sub }
  function tiles(id, items) {
    const el = $(id); el.textContent = '';
    items.forEach(it => {
      const t = document.createElement('div'); t.className = 'tile';
      [['lab', it.label], ['val', it.value], ['sub', it.sub]].forEach(pair => {
        const d = document.createElement('div'); d.className = pair[0]; d.textContent = pair[1]; t.appendChild(d);
      });
      el.appendChild(t);
    });
  }
  function table(id, cols, rows) {
    const t = d3.select('#' + id); t.selectAll('*').remove();
    const tb = t.append('table');
    tb.append('thead').append('tr').selectAll('th').data(cols).join('th')
      .attr('scope', 'col').attr('class', (c, i) => (i ? 'num' : null)).text(c => c);
    tb.append('tbody').selectAll('tr').data(rows).join('tr').selectAll('td').data(r => r).join('td')
      .attr('class', (c, i) => (i ? 'num' : null)).text(c => c);
  }
  // segmented button group; options: [{ id, label }], onPick(id)
  function segmented(id, options, activeId, onPick) {
    const seg = $(id); seg.textContent = '';
    options.forEach(o => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = o.label;
      b.setAttribute('aria-pressed', String(o.id === activeId));
      b.addEventListener('click', () => onPick(o.id));
      seg.appendChild(b);
    });
  }

  JV.u = { MON, FULL, MINUS, $, fmt, sgn, pct, plainPct, signedN, kfmt, pfmt, listJoin, tip, mk, yGrid, xLabels, barPath, xBand, xTicks, legend, tiles, table, segmented };
  JV.charts = JV.charts || {};
  JV.pages = JV.pages || {};
})();
