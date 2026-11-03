/* PAGE 3, Seasonality: a "years included" filter, three figures, one pie chart and a month-by-month table.
   The filter scopes everything on the page. */
(function () {
  'use strict';
  const { $, MON, FULL, fmt, pct, plainPct, legend, tiles, table, segmented, tip } = JV.u;

  const state = { excl: false };
  // quarters keep their colour in every view
  const QUARTERS = [
    { q: 0, label: 'Jan–Mar', color: 'var(--s1)' },
    { q: 1, label: 'Apr–Jun', color: 'var(--s2)' },
    { q: 2, label: 'Jul–Sep', color: 'var(--s3)' },
    { q: 3, label: 'Oct–Dec', color: 'var(--s4)' }
  ];

  // how far each calendar month sits above or below a typical month, averaged over the years included
  function monthIndex(monthly, yrs) {
    const mean = new Map(yrs.map(y => [y, d3.mean(monthly.filter(d => d.year === y), d => d.value)]));
    return d3.range(12).map(m => {
      const rows = monthly.filter(d => d.m === m && mean.has(d.year));
      return {
        m,
        idx: d3.mean(rows, d => d.value / mean.get(d.year) - 1),
        avg: d3.mean(rows, d => d.value)
      };
    });
  }

  JV.pages.seasonality = {
    build(data) { this.buildFilter(data); },

    buildFilter(data) {
      segmented('seg-years', [{ id: 'all', label: 'All years' }, { id: 'no2020', label: 'Without 2020' }],
        state.excl ? 'no2020' : 'all', id => {
          state.excl = id === 'no2020';
          this.buildFilter(data);
          this.draw(data);
        });
    },

    draw(data) {
      tip.hide();
      const yrs = state.excl ? data.years.filter(y => y !== 2020) : data.years;
      const rows = data.monthly.filter(d => yrs.indexOf(d.year) >= 0);
      const idx = monthIndex(data.monthly, yrs);

      /* quarter totals for the pie */
      const total = d3.sum(rows, d => d.value);
      const quarters = QUARTERS.map(qq => Object.assign({}, qq, {
        value: d3.sum(rows.filter(d => Math.floor(d.m / 3) === qq.q), d => d.value)
      }));
      const topQ = d3.greatest(quarters, d => d.value);

      /* figures */
      const hi = d3.greatest(idx, d => d.idx), lo = d3.least(idx, d => d.idx);
      tiles('tiles-season', [
        { label: 'Busiest month on average', value: FULL[hi.m], sub: pct(hi.idx) + ' against a typical month' },
        { label: 'Quietest month on average', value: FULL[lo.m], sub: pct(lo.idx) + ' against a typical month' },
        { label: 'Largest quarter', value: topQ.label, sub: plainPct(topQ.value / total) + ' of all hospitalisations' }
      ]);

      /* pie chart */
      legend('lg-pie', quarters.map(d => ({ label: d.label, color: d.color, type: 'rect' })));
      $('sub-pie').textContent = 'Share of all hospitalisations in ' + yrs[0] + ' to ' + yrs[yrs.length - 1] +
        (state.excl ? ' without 2020' : '') + ', split by quarter of the year.';
      JV.charts.pie($('ch-pie'), {
        data: quarters,
        label: d => d.label,
        value: d => d.value,
        color: d => d.color,
        aria: 'Pie chart of the share of hospitalisations in each quarter of the year',
        info: (d, share) => ({
          key: 'q' + d.q + state.excl,
          title: d.label,
          rows: [{ value: plainPct(share), label: 'of all hospitalisations' }, { value: fmt(d.value), label: 'hospitalisations' }]
        })
      });
      table('tb-pie', ['Quarter', 'Hospitalisations', 'Share'],
        quarters.map(d => [d.label, fmt(d.value), plainPct(d.value / total)]));

      /* month-by-month table */
      table('tb-month', ['Month', 'Average count', 'Against a typical month'],
        idx.map(d => [FULL[d.m], fmt(Math.round(d.avg)), pct(d.idx)]));
    }
  };
})();
