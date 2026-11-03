/* PAGE 1, Yearly overview: headline figures, one bar chart of yearly totals, and the table behind it. */
(function () {
  'use strict';
  const { $, fmt, pct, signedN, kfmt, listJoin, legend, tiles, table } = JV.u;

  JV.pages.overview = {
    // static content that only needs to be written once
    build(data) {
      const { yearly } = data;
      const first = yearly[0], last = yearly[yearly.length - 1];
      const by = yr => yearly.find(d => d.year === yr);
      const y2012 = by(2012), y2016 = by(2016), y2020 = by(2020);

      $('hero-val').textContent = fmt(last.value);
      $('hero-delta').textContent = (last.value >= first.value ? '▲ ' : '▼ ') +
        pct(last.value / first.value - 1) + ' on ' + first.year + ' (' + fmt(first.value) + ')';

      const lowest = d3.least(yearly, d => d.value);
      tiles('tiles-overview', [
        { label: 'Lowest year', value: fmt(lowest.value), sub: String(lowest.year) },
        { label: '2020 against 2019', value: pct(y2020.yoy), sub: signedN(y2020.value - y2020.prev) + ' hospitalisations' },
        { label: 'Average per year', value: fmt(Math.round(d3.mean(yearly, d => d.value))), sub: first.year + ' to ' + last.year }
      ]);

      $('t-year').textContent = 'Yearly totals rose ' + Math.round((y2016.value / y2012.value - 1) * 100) +
        '% from 2012 to 2016, then levelled off';
      legend('lg-year', [
        { label: 'Other years', color: 'var(--s1)', type: 'rect' },
        { label: '2020', color: 'var(--s2)', type: 'rect' }
      ]);

      const falls = yearly.filter(d => d.yoy != null && d.yoy < 0).map(d => d.year);
      table('tb-year', ['Year', 'Hospitalisations', 'On prior year'],
        yearly.map(d => [d.year, fmt(d.value), d.yoy == null ? '–' : pct(d.yoy)]));
      $('sub-table').textContent = 'The numbers behind the chart. Totals fell year on year only in ' + listJoin(falls) + '.';
    },

    draw(data) {
      const { yearly } = data;
      const first = yearly[0];
      JV.charts.bar($('ch-bar'), {
        data: yearly,
        x: d => d.year,
        xText: d => d.year,
        xShort: d => "'" + String(d.year).slice(2),
        value: d => d.value,
        color: d => (d.year === 2020 ? 'var(--s2)' : 'var(--s1)'),
        yFmt: kfmt,
        labelIf: d => d === first || d.year === 2020,
        labelFmt: d => fmt(d.value),
        aria: 'Bar chart of hospitalisations per calendar year, 2011 to 2021',
        barAria: d => d.year + ': ' + fmt(d.value) + ' hospitalisations',
        info: d => ({
          key: 'y' + d.year,
          title: String(d.year),
          rows: [{ value: fmt(d.value), label: 'hospitalisations' }]
            .concat(d.yoy == null ? [] : [{ value: pct(d.yoy), label: 'on ' + (d.year - 1) }])
        })
      });
    }
  };
})();
