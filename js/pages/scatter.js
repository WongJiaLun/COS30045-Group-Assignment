/* PAGE 5, Scatterplot: A standalone page for the year-over-year comparison scatterplot. */
(function () {
  'use strict';
  const { $, MON, fmt, pct, legend, segmented, tip } = JV.u;

  const state = { id: 'all', a: 0 };
  let presets = [];

  JV.pages.scatter = {
    build(data) {
      presets = JV.data.periods(data.monthly);
      this.buildFilter(data);
    },

    buildFilter(data) {
      segmented('seg-scatter', presets, state.id, id => {
        const p = presets.find(x => x.id === id);
        state.id = p.id; state.a = p.a;
        this.buildFilter(data);
        this.draw(data);
      });
    },

    draw(data) {
      tip.hide();
      const rows = data.monthly.slice(state.a);
      const pts = rows.filter(d => d.prev != null);
      
      if (pts.length === 0) return;

      const worst = d3.least(pts, d => d.yoy), best = d3.greatest(pts, d => d.yoy);
      
      legend('lg-scatter', [
        { label: '2020 months', color: 'var(--s2)', type: 'dot' },
        { label: 'Other months', color: 'var(--s1)', type: 'dot' },
        { label: 'Same as a year earlier', color: 'var(--muted)', type: 'line' }
      ]);

      $('sub-scatter').textContent = 'Each dot is a month. Dots above the line had more hospitalisations than the same month a year earlier. ' +
        'Lowest: ' + worst.label + ' (' + pct(worst.yoy) + '). Highest: ' + best.label + ' (' + pct(best.yoy) + ').';

      const chartEl = $('ch-scatter');

      JV.charts.scatter(chartEl, {
        points: pts,
        height: chartEl.clientHeight,
        x: d => d.prev,
        y: d => d.value,
        color: d => (d.year === 2020 ? 'var(--s2)' : 'var(--s1)'),
        xTitle: 'Same month a year earlier',
        yTitle: 'This month',
        notes: [{ point: worst, text: worst.label }, { point: best, text: best.label }],
        aria: 'Scatterplot of each month’s hospitalisations against the same month a year earlier',
        info: d => ({
          key: 's' + d.key,
          title: d.label,
          rows: [
            { value: fmt(d.value), label: 'this month' },
            { value: fmt(d.prev), label: MON[d.m] + ' ' + (d.year - 1) },
            { value: pct(d.yoy), label: 'change' }
          ]
        })
      });
    }
  };
})();