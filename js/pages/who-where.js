/* PAGE 4, Who and where: a Period filter, three figures, a line graph of monthly hospitalisations by sex and a
   bar chart of hospitalisations by area (the file's ABS remoteness area), each with its table.
   The period filter scopes everything on the page. */
(function () {
  'use strict';
  const { $, fmt, plainPct, legend, tiles, table, segmented, tip } = JV.u;

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

      /* line graph: one line per sex, on a shared axis */
      legend('lg-sex', [
        { label: 'Male', color: 'var(--s1)', type: 'line' },
        { label: 'Female', color: 'var(--s2)', type: 'line' }
      ]);
      const axisStart = JV.charts.line($('ch-sex'), {
        data: rows,
        series: [
          { value: d => d.sex.Male, color: 'var(--s1)' },
          { value: d => d.sex.Female, color: 'var(--s2)' }
        ],
        aria: 'Line graph of monthly hospitalisations for males and females from ' + first + ' to ' + last,
        info: d => ({
          key: 'x' + d.key,
          title: d.label,
          rows: [
            { value: fmt(d.sex.Male), label: 'male', color: 'var(--s1)' },
            { value: fmt(d.sex.Female), label: 'female', color: 'var(--s2)' }
          ]
        })
      });
      const other = sex.Other
        ? ' ' + fmt(sex.Other) + (sex.Other === 1 ? ' hospitalisation was' : ' hospitalisations were') +
          ' recorded as intersex, indeterminate or missing: too few to draw, but counted in the table as “Other or missing”.'
        : ' “Other or missing” in the table means recorded as intersex, indeterminate or missing.';
      $('sub-sex').textContent = first + ' to ' + last + '. Vertical axis starts at ' + fmt(axisStart) + '. The labels mark the highest and lowest month for males.' + other;
      table('tb-sex', ['Month', 'Male', 'Female', 'Other or missing', 'All'],
        rows.map(d => [d.label, fmt(d.sex.Male), fmt(d.sex.Female), fmt(d.sex.Other), fmt(d.value)]));

      /* bar chart: one bar per area, from zero */
      $('sub-area').textContent = first + ' to ' + last + '. Area is the ABS remoteness area recorded in the file. ' +
        'The file has no population figures, so these are counts, not rates.';
      JV.charts.bar($('ch-area'), {
        data: areas,
        x: d => d.area,
        xText: d => d.area,
        xShort: d => d.area,
        value: d => d.value,
        color: () => 'var(--muted)',
        yFmt: v => (v === 0 ? '0' : v / 1000 + 'K'),
        labelIf: () => true,
        labelFmt: d => fmt(d.value),
        barWidth: 64,
        height: 300,
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
      table('tb-area', ['Area', 'Hospitalisations', 'Share'],
        areas.map(d => [d.area, fmt(d.value), plainPct(d.value / total)]));
    }
  };
})();
