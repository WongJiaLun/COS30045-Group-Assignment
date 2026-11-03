/* LINE GRAPH: one or more series over months, with a hover crosshair that reads every series.
   Used on the Monthly trend page for monthly counts and the 12-month average.

   JV.charts.line(element, {
     data,                          // monthly rows with key, m, year, label
     series: [{ value(d), color }], // the first series gets its peak and low marked
     info(d), aria
   })  -> returns where the vertical axis starts */
(function () {
  'use strict';
  const { mk, yGrid, xBand, xTicks, tip, fmt } = JV.u;

  // a dot on the point plus a short label such as "Mar 2021 · 3,787"
  function mark(g, d, value, y, cx, w, above, color) {
    const px = cx(d), py = y(value(d));
    g.append('circle')
      .attr('class', 'dot')
      .attr('cx', px)
      .attr('cy', py)
      .attr('r', 4.5)
      .style('fill', color);
    g.append('text')
      .attr('class', 'alab')
      .attr('x', px)
      .attr('y', above ? py - 11 : py + 21)
      .attr('text-anchor', px < 70 ? 'start' : px > w - 70 ? 'end' : 'middle')
      .text(d.label + ' · ' + fmt(value(d)));
  }

  JV.charts.line = function (el, o) {
    const data = o.data;
    const W = el.clientWidth || 320, H = W < 520 ? 280 : 340;
    const { svg, g, w, h } = mk(el, H, { t: 30, r: 14, b: 30, l: 50 });
    svg.attr('aria-label', o.aria);

    const x = xBand(data, w);
    const cx = d => x(d.key) + x.bandwidth() / 2;

    // the vertical axis does not start at zero, so it adapts to the visible range
    const vals = data.flatMap(d => o.series.map(s => s.value(d)).filter(v => v != null));
    const lo = d3.min(vals), 
    hi = d3.max(vals), 
    pad = (hi - lo) * 0.14;
    const y = d3.scaleLinear([lo - pad, hi + pad], [h, 0])
    .nice(5);

    yGrid(g, y, w, 5, fmt);
    xTicks(g, data, x, h);

    // one 2px line per series; gaps where a series has no value (the average needs 12 months)
    o.series.forEach(s => {
      g.append('path')
      .datum(data)
      .attr('class', 'ln')
        .attr('d', d3.line().defined(d => s.value(d) != null).x(cx).y(d => y(s.value(d))))
        .style('stroke', s.color);
    });

    // mark the highest and lowest point of the first series
    const main = o.series[0];
    mark(g, d3.greatest(data, main.value), main.value, y, cx, w, true, main.color);
    mark(g, d3.least(data, main.value), main.value, y, cx, w, false, main.color);

    // crosshair snaps to the nearest month; the overlay catches the pointer over the whole plot
    const cross = g.append('g')
    .attr('class', 'cross')
    .style('display', 'none');
    cross.append('line')
      .attr('y1', 0)
      .attr('y2', h);
    const dots = o.series.map(s => cross.append('circle')
    .attr('r', 4.5)
    .style('fill', s.color));

    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', w)
      .attr('height', h)
      .on('pointerenter pointermove', e => {
        const px = d3.pointer(e)[0];
        const d = data[Math.max(0, Math.min(data.length - 1, Math.floor(px / x.step())))];
        cross.style('display', null);
        cross.select('line')
        .attr('x1', cx(d))
        .attr('x2', cx(d));
        o.series.forEach((s, i) => {
          const v = s.value(d);
          if (v == null) dots[i].style('display', 'none');
          else dots[i].style('display', null)
          .attr('cx', cx(d))
          .attr('cy', y(v));
        });
        const t = o.info(d);
        tip.show(e, t.title, t.rows, t.key);
      })
      .on('pointerleave', () => { cross.style('display', 'none'); tip.hide(); });

    return y.domain()[0];
  };
})();
