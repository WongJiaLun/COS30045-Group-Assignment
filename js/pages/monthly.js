/* PAGE 2, Monthly trend: a period filter, three figures, one line graph and one scatterplot.
   The period filter scopes everything on the page. */
(function () {
  'use strict';
  const { $, MON, fmt, pct, legend, tiles, table, segmented, tip } = JV.u;

  const state = { id: 'all', a: 0 };
  let presets = [];

  JV.pages.monthly = {
    build(data) {
      const { monthly } = data;
      presets = JV.data.periods(monthly);
      this.buildFilter(data);
    },

    buildFilter(data) {
      segmented('seg-range', presets, state.id, id => {
        const p = presets.find(x => x.id === id);
        state.id = p.id; state.a = p.a;
        this.buildFilter(data);
        this.draw(data);
      });
    },

    draw(data) {
      tip.hide();
      const rows = data.monthly.slice(state.a);

      /* figures */
      const hi = d3.greatest(rows, d => d.value), lo = d3.least(rows, d => d.value);
      tiles('tiles-monthly', [
        { label: 'Highest month', value: fmt(hi.value), sub: hi.label },
        { label: 'Lowest month', value: fmt(lo.value), sub: lo.label },
        { label: 'Average per month', value: fmt(Math.round(d3.mean(rows, d => d.value))), sub: rows.length + ' months' }
      ]);

      /* line graph */
      legend('lg-line', [
        { label: 'Monthly count', color: 'var(--s1)', type: 'line' },
        { label: '12-month average', color: 'var(--ink2)', type: 'line' }
      ]);
      const axisStart = JV.charts.line($('ch-line'), {
        data: rows,
        series: [
          { value: d => d.value, color: 'var(--s1)' },
          { value: d => d.avg12, color: 'var(--ink2)' }
        ],
        aria: 'Line graph of monthly hospitalisations from ' + rows[0].label + ' to ' + rows[rows.length - 1].label,
        info: d => {
          const r = [{ 
            value: fmt(d.value), 
            label: 'hospitalisations', 
            color: 'var(--s1)'
           }];
          if (d.avg12 != null) r.push({ value: fmt(Math.round(d.avg12)), label: '12-month average', color: 'var(--ink2)' });
          if (d.yoy != null) r.push({ value: pct(d.yoy), label: 'on ' + MON[d.m] + ' ' + (d.year - 1) });
          return { key: d.key, title: d.label, rows: r };
        }
      });
      $('sub-line').textContent = rows[0].label + ' to ' + rows[rows.length - 1].label +
        '. Vertical axis starts at ' + fmt(axisStart) + '.';
      table('tb-line', ['Month', 'Hospitalisations', '12-month average', 'On a year earlier'],
        rows.map(d => [d.label, fmt(d.value), d.avg12 == null ? '–' : fmt(Math.round(d.avg12)), d.yoy == null ? '–' : pct(d.yoy)]));

      /* scatterplot: only months that have a year-earlier figure */
      const pts = rows.filter(d => d.prev != null);
      const worst = d3.least(pts, d => d.yoy), best = d3.greatest(pts, d => d.yoy);
      legend('lg-scatter', [
        { label: '2020 months', color: 'var(--s2)', type: 'dot' },
        { label: 'Other months', color: 'var(--s1)', type: 'dot' },
        { label: 'Same as a year earlier', color: 'var(--muted)', type: 'line' }
      ]);
      JV.charts.scatter($('ch-scatter'), {
        points: pts,
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
      $('sub-scatter').textContent = 'Each dot is a month. Dots above the line had more hospitalisations than the same month a year earlier. ' +
        'Lowest: ' + worst.label + ' (' + pct(worst.yoy) + '). Highest: ' + best.label + ' (' + pct(best.yoy) + ').';
      table('tb-scatter', ['Month', 'Year earlier', 'This month', 'Change'],
        pts.map(d => [d.label, fmt(d.prev), fmt(d.value), pct(d.yoy)]));
    }
  };
})();
