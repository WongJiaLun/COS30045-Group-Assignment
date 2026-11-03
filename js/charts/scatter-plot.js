/* SCATTERPLOT: one dot per observation on two numeric axes that share one scale,
   with an optional "y = x" reference line. Hovering finds the nearest dot, so the
   pointer never has to land exactly on a small dot.
   Used on the Monthly trend page: each dot is a month, plotted against the same month a year earlier.

   JV.charts.scatter(element, {
     points, x(d), y(d), color(d),
     xTitle, yTitle, info(d), aria,
     notes: [{ point, text }]       // dots to label directly
   }) */
(function () {
  'use strict';
  const { mk, yGrid, tip, fmt } = JV.u;

  JV.charts.scatter = function (el, o) {
    const W = el.clientWidth || 320, H = W < 520 ? 320 : 380;
    const { svg, g, w, h } = mk(el, H, { t: 16, r: 18, b: 50, l: 60 });
    svg.attr('aria-label', o.aria);

    // both axes use the same range so the y = x line means "no change"
    const all = o.points.flatMap(d => [o.x(d), o.y(d)]);
    const lo = d3.min(all), hi = d3.max(all), pad = (hi - lo) * 0.05;
    const x = d3.scaleLinear([lo - pad, hi + pad], [0, w]).nice(5);
    const y = d3.scaleLinear(x.domain(), [h, 0]);

    // gridlines and ticks on both axes
    yGrid(g, y, w, 5, fmt);
    x.ticks(5).forEach(v => {
      g.append('line')
        .attr('class', 'xt')
        .attr('x1', x(v))
        .attr('x2', x(v))
        .attr('y1', h)
        .attr('y2', h + 5);
      g.append('text')
        .attr('class', 'tl')
        .attr('x', x(v))
        .attr('y', h + 19)
        .attr('text-anchor', 'middle')
        .text(fmt(v));
    });
    g.append('text')
      .attr('class', 'at')
      .attr('x', w / 2)
      .attr('y', h + 42)
      .text(o.xTitle);
    g.append('text')
      .attr('class', 'at')
      .attr('transform', 'rotate(-90)')
      .attr('x', -h / 2)
      .attr('y', -48)
      .text(o.yTitle);

    // reference line: same count as a year earlier
    const [d0, d1] = x.domain();
    g.append('line')
      .attr('class', 'refline')
      .attr('x1', x(d0))
      .attr('y1', y(d0))
      .attr('x2', x(d1))
      .attr('y2', y(d1));

    // dots: 8px or larger, with a 2px ring in the surface colour so overlaps stay legible
    g.selectAll('.pt')
    .data(o.points)
    .join('circle')
    .attr('class', 'dot pt')
      .attr('cx', d => x(o.x(d)))
      .attr('cy', d => y(o.y(d)))
      .attr('r', 4.5)
      .style('fill', o.color);

    // direct labels for the dots the story needs
    (o.notes || []).forEach(n => {
      const px = x(o.x(n.point)), py = y(o.y(n.point)), flip = px > w - 110;
      g.append('text')
        .attr('class', 'alab')
        .attr('x', px + (flip ? -9 : 9))
        .attr('y', py + 4)
        .attr('text-anchor', flip ? 'end' : 'start')
        .text(n.text);
    });

    // nearest-dot hover: a ring marks the dot, within 40px of the pointer
    const hl = g.append('circle')
    .attr('class', 'hl')
    .attr('r', 8)
    .style('display', 'none');
    const delaunay = d3.Delaunay.from(o.points, d => x(o.x(d)), d => y(o.y(d)));
    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', w)
      .attr('height', h)
      .on('pointerenter pointermove', e => {
        const [px, py] = d3.pointer(e);
        const d = o.points[delaunay.find(px, py)];
        const dx = x(o.x(d)) - px, dy = y(o.y(d)) - py;
        if (Math.sqrt(dx * dx + dy * dy) > 40) { hl.style('display', 'none'); tip.hide(); return; }
        hl.style('display', null)
          .attr('cx', x(o.x(d)))
          .attr('cy', y(o.y(d)));
        const t = o.info(d);
        tip.show(e, t.title, t.rows, t.key);
      })
      .on('pointerleave', () => { hl.style('display', 'none'); tip.hide(); });
  };
})();
