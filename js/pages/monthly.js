/* PAGE 2, Monthly trend: a period filter, three figures, and one line graph. */
(function () {
  'use strict';
  const { $, MON, fmt, pct, legend, tiles, segmented, tip } = JV.u;

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
        const p = presets.find(x => x.id === id); //Finds the '5yr' preset 
        state.id = p.id; state.a = p.a;// updates the starting index
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
      
      const chartEl = $('ch-line');

      JV.charts.line(chartEl, {
        data: rows,
        height: chartEl.clientHeight,
        series: [
          { value: d => d.value, color: 'var(--s1)' },
          { value: d => d.avg12, color: 'var(--ink2)' }
        ],
        aria: 'Line graph of monthly hospitalisations from ' + rows[0].label + ' to ' + rows[rows.length - 1].label,
        info: d => {
          const r = [{ value: fmt(d.value), label: 'hospitalisations', color: 'var(--s1)' }];
          if (d.avg12 != null) r.push({ value: fmt(Math.round(d.avg12)), label: '12-month average', color: 'var(--ink2)' });
          if (d.yoy != null) r.push({ value: pct(d.yoy), label: 'on ' + MON[d.m] + ' ' + (d.year - 1) });
          return { key: d.key, title: d.label, rows: r };
        }
      });
    }
  };
})();