/* PAGE 1, Yearly overview: headline figures and a histogram of monthly distribution. */
(function () {
  'use strict';
  const { $, fmt, pct, signedN, tiles } = JV.u;

  JV.pages.overview = {
    build(data) {
      const { yearly } = data;
      const first = yearly[0], last = yearly[yearly.length - 1];
      const by = yr => yearly.find(d => d.year === yr);
      const y2020 = by(2020);

      $('hero-val').textContent = fmt(last.value);
      $('hero-delta').textContent = (last.value >= first.value ? '▲ ' : '▼ ') +
        pct(last.value / first.value - 1) + ' on ' + first.year + ' (' + fmt(first.value) + ')';

      const lowest = d3.least(yearly, d => d.value);
      tiles('tiles-overview', [
        { label: 'Lowest year', value: fmt(lowest.value), sub: String(lowest.year) },
        { label: '2020 against 2019', value: pct(y2020.yoy), sub: signedN(y2020.value - y2020.prev) + ' hospitalisations' },
        { label: 'Average per year', value: fmt(Math.round(d3.mean(yearly, d => d.value))), sub: first.year + ' to ' + last.year }
      ]);

      $('t-year').textContent = 'Distribution of Monthly Hospitalisations';
      $('lg-year').textContent = ''; 
    },

    draw(data) {
      const chartEl = $('ch-bar');
      const values = data.monthly.map(d => d.value);

      JV.charts.histogram(chartEl, {
        data: values,
        height: chartEl.clientHeight,
        color: 'var(--s1)',
        aria: 'Histogram showing the distribution of monthly hospitalisation counts',
        info: d => ({
          key: 'h' + d.x0,
          title: `${fmt(d.x0)} to ${fmt(d.x1)} cases`,
          rows: [{ value: d.length, label: d.length === 1 ? 'month' : 'months' }]
        })
      });
    }
  };
})();