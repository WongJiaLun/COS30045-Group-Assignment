/* PAGE 4, Who and where: a Period filter, three figures, and a bar chart of hospitalisations by area. */
(function () {
  'use strict';
  const { $, fmt, plainPct, tiles, segmented, tip } = JV.u;

  const state = { id: 'all', a: 0 };
  let presets = [];

  JV.pages.who = {
    build(data) {
      presets = JV.data.periods(data.monthly);
      this.buildFilter(data);
    },

    buildFilter(data) {
      segmented('seg-who', presets, state.id, id => {
        const p = presets.find(x => x.id === id);
        state.id = p.id; state.a = p.a;
        this.buildFilter(data);
        this.draw(data);
      });
    },

    draw(data) {
      tip.hide();
      const rows = data.monthly.slice(state.a);
      const first = rows[0].label, last = rows[rows.length - 1].label;
      const total = d3.sum(rows, d => d.value);
      
      const sex = { Male: 0, Female: 0, Other: 0 };
      Object.keys(sex).forEach(k => { sex[k] = d3.sum(rows, d => d.sex[k]); });
      
      const areas = data.areas.map(a => ({ area: a, value: d3.sum(rows, d => d.area[a]) }));
      const topArea = d3.greatest(areas, d => d.value);

      /* figures */
      tiles('tiles-who', [
        { label: 'Male share', value: plainPct(sex.Male / total), sub: fmt(sex.Male) + ' hospitalisations' },
        { label: 'Female share', value: plainPct(sex.Female / total), sub: fmt(sex.Female) + ' hospitalisations' },
        { label: 'Largest area', value: topArea.area, sub: plainPct(topArea.value / total) + ' of hospitalisations' }
      ]);

      /* bar chart */
      const chartEl = $('ch-area');

      JV.charts.bar(chartEl, {
        data: areas,
        height: chartEl.clientHeight,
        x: d => d.area,
        xText: d => d.area,
        xShort: d => d.area,
        value: d => d.value,
        color: () => 'var(--muted)',
        yFmt: v => (v === 0 ? '0' : v / 1000 + 'K'),
        labelIf: () => true,
        labelFmt: d => fmt(d.value),
        barWidth: 64,
        aria: 'Bar chart of hospitalisations by area, ' + first + ' to ' + last,
        barAria: d => d.area + ': ' + fmt(d.value) + ' hospitalisations, ' + plainPct(d.value / total) + ' of the total',
        info: d => ({
          key: 'a' + d.area + state.id,
          title: d.area,
          rows: [
            { value: fmt(d.value), label: 'hospitalisations' },
            { value: plainPct(d.value / total), label: 'of the total' }
          ]
        })
      });
    }
  };
})();