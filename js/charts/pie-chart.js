/* PIE CHART: parts of one whole, clockwise from 12 o'clock.
   Each slice is labelled outside with its name and share; a 2px gap separates slices.
   Used on the Seasonality page for each quarter's share of all hospitalisations.

   JV.charts.pie(element, {
     data, label(d), value(d), color(d), info(d), aria
   }) */
(function () {
  'use strict';
  const { mk, tip, plainPct } = JV.u;

  JV.charts.pie = function (el, o) {
    const W = el.clientWidth || 320, H = W < 520 ? 300 : 340;
    const { svg, g } = mk(el, H, { t: 0, r: 0, b: 0, l: 0 });
    svg.attr('aria-label', o.aria);
    g.attr('transform', 'translate(' + (Math.max(260, W) / 2) + ',' + (H / 2) + ')');

    const R = Math.max(60, Math.min(Math.max(260, W) / 2, H / 2) - 56);
    const total = d3.sum(o.data, o.value);
    const arcs = d3.pie()
      .sort(null)
      .value(o.value)
      .padAngle(2 / R)(o.data);
    const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(R)
    .cornerRadius(2);
    const labelPos = d3.arc()
    .innerRadius(R + 14)
    .outerRadius(R + 14);

    const slices = g.selectAll('.slice').data(arcs).join('g')
      .attr('class', 'slice')
      .attr('tabindex', 0)
      .attr('role', 'img')
      .attr('aria-label', 
        a => o.label(a.data) + ': ' + plainPct(o.value(a.data) / total));
    slices.append('path').attr('d', arc).style('fill', a => o.color(a.data));

    // outside labels use text colours; the slice colour sits in the legend
    const labels = g.selectAll('.pl')
    .data(arcs).join('text')
    .attr('class', 'pl')
    .attr('pointer-events', 'none');
    labels.each(function (a) {
      const [lx, ly] = labelPos.centroid(a);
      const anchor = Math.abs(lx) < 8 ? 'middle' : lx < 0 ? 'end' : 'start';
      const t = d3.select(this)
      .attr('transform', 'translate(' + lx + ',' + ly + ')')
      .attr('text-anchor', anchor);
      t.append('tspan')
      .attr('class', 'pie-name')
      .attr('x', 0)
      .attr('dy', '-0.1em')
      .text(o.label(a.data));
      t.append('tspan')
      .attr('class', 'pie-val')
      .attr('x', 0)
      .attr('dy', '1.25em')
      .text(plainPct(o.value(a.data) / total));
    });

    tip.bind(slices, a => o.info(a.data, o.value(a.data) / total));
  };
})();
