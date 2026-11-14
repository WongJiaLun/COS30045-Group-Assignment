/* PAGE 1, Yearly overview: headline figures and a bar chart of calendar-year totals. */
(function () {
  'use strict';
  const { $, fmt, pct, plainPct, signedN, kfmt, tiles, legend } = JV.u;

  JV.pages.overview = {
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

      $('t-year').textContent = 'Yearly totals rose ' + plainPct(y2016.value / y2012.value - 1, 0) + ' from 2012 to 2016, then levelled off';
      legend('lg-year', [
        { label: 'Other years', color: 'var(--s1)', type: 'rect' },
        { label: '2020', color: 'var(--s2)', type: 'rect' }
      ]);
    },

    draw(data) {
      const { yearly } = data;

      JV.charts.bar($('ch-bar'), {
        data: yearly,
        x: d => d.year,
        xText: d => String(d.year),
        xShort: d => "'" + String(d.year).slice(2),
        value: d => d.value,
        color: d => d.year === 2020 ? 'var(--s2)' : 'var(--s1)',
        yFmt: kfmt,
        labelIf: d => d.year === 2011 || d.year === 2020,
        labelFmt: d => fmt(d.value),
        info: d => {
          const rows = [{ value: fmt(d.value), label: 'hospitalisations' }];
          if (d.yoy != null) {
            rows.push({ value: pct(d.yoy), label: 'on ' + (d.year - 1) });
          }
          return { key: 'y' + d.year, title: String(d.year), rows };
        },
        aria: 'Bar chart of calendar-year hospitalisation totals from 2011 to 2021',
        barAria: d => `${d.year}: ${fmt(d.value)} hospitalisations`
      });
    }
  };
})();