/* BAR CHART: one column per category, growing from a zero baseline.
   Used on the Yearly overview page for calendar-year totals and on Who and where for the areas.

   JV.charts.bar(element, {
     data, x(d), xText(d), xShort(d), value(d), color(d),
     yFmt(v), labelIf(d), labelFmt(d), info(d), aria, barAria(d), height,
     barWidth   // widest a bar may be, 24 by default (use more when there are only a few bars)
   }) */
(function () {
  'use strict';
  const { mk, yGrid, xLabels, barPath, tip } = JV.u;

  JV.charts.bar = function (el, o) {
    const W = el.clientWidth || 320;
    const H = o.height || (W < 520 ? 270 : 320);
    const { svg, g, w, h } = mk(el, H, { t: 26, r: 8, b: 28, l: 46 });
    svg.attr('aria-label', o.aria);

    const x = d3.scaleBand(o.data.map(o.x), [0, w])
    .paddingInner(0.2)
    .paddingOuter(0.1);
    const y = d3.scaleLinear([0, d3.max(o.data, o.value)], [h, 0])
    .nice(4);

    yGrid(g, y, w, 4, o.yFmt);
    xLabels(g, o.data.map(d => ({ x: x(o.x(d)) + x.bandwidth() / 2, text: o.xText(d), short: o.xShort(d) })), h);

    const bw = Math.min(o.barWidth || 24, x.bandwidth()); // thin bars, extra width stays as air
    const bars = g.selectAll('.bar')
    .data(o.data).join('g')
      .attr('class', 'bar')
      .attr('tabindex', 0)
      .attr('role', 'img')
      .attr('aria-label', o.barAria);
    // the invisible rect is the hover target: the whole band, not just the painted bar
    bars.append('rect')
      .attr('class', 'hit')
      .attr('x', d => x(o.x(d)))
      .attr('width', x.bandwidth())
      .attr('y', 0)
      .attr('height', h);
    bars.append('path')
      .attr('d', d => barPath(x(o.x(d)) + (x.bandwidth() - bw) / 2, h, y(o.value(d)), bw, 4))
      .style('fill', o.color);

    // label only the bars the story needs
    o.data.filter(o.labelIf).forEach(d => {
      g.append('text')
        .attr('class', 'vlab')
        .attr('x', x(o.x(d)) + x.bandwidth() / 2)
        .attr('y', y(o.value(d)) - 7)
        .text(o.labelFmt(d));
    });

    tip.bind(bars, o.info);
  };
})();
