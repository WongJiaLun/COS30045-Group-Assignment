/* Reads the one CSV file in /data and turns it into the structures the pages use.

   The file has one row per combination of year, month, remoteness area, cause of injury, age group, sex,
   road user and counterparty. The charts need totals, so this file adds up the Hospitalisations column for each
   month, sex and remoteness area. Every figure on every page is built from those sums (a "cell" is one
   month + sex + area with its total), so the monthly, yearly, sex and area numbers always agree.

   The CSV is read with d3.csv, so the folder has to be opened through a web server (see README): browsers do not
   let a page opened by double-click read other files. */
(function () {
  'use strict';
  const JV = (window.JV = window.JV || {});
  const MON = JV.u.MON;
  const FILE = 'data/JomVisualsDataFinal.csv';

  // the file records sex as Male, Female or "intersex or indeterminate or missing"
  const SEX = ['Male', 'Female', 'Other'];
  const sexOf = s => (s === 'Male' ? 'Male' : s === 'Female' ? 'Female' : 'Other');
  // remoteness areas in their natural order, from the biggest cities outwards; anything else follows by size
  const AREA_ORDER = ['Major Cities', 'Inner Regional', 'Outer Regional', 'Regional', 'Remote', 'Very Remote'];

  // cells: [[ '2011-01', 'Male', 'Major Cities', 1234 ], ...]  ->  the series the pages use
  function build(cells, info) {
    if (!cells.length) throw new Error('The file has no rows with a Year-Month and a Hospitalisations figure.');

    const areaTotals = d3.rollup(cells, v => d3.sum(v, c => c[3]), c => c[2]);
    const areas = Array.from(areaTotals.keys()).sort((a, b) => {
      const ia = AREA_ORDER.indexOf(a), ib = AREA_ORDER.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0 || ib >= 0) return ia >= 0 ? -1 : 1;
      return areaTotals.get(b) - areaTotals.get(a);
    });

    // one record per month: the total, the total for each sex and the total for each area
    const byMonth = d3.group(cells, c => c[0]);
    const months = Array.from(byMonth, ([key, rows]) => {
      const sex = { Male: 0, Female: 0, Other: 0 }, area = {};
      areas.forEach(a => { area[a] = 0; });
      rows.forEach(c => { sex[sexOf(c[1])] += c[3]; area[c[2]] += c[3]; });
      return { key, value: d3.sum(rows, c => c[3]), sex, area };
    }).sort((a, b) => (a.key < b.key ? -1 : 1));

    // the 12-month average and the year-earlier comparisons assume one row per month with no gaps
    const idx = k => +k.slice(0, 4) * 12 + (+k.slice(5, 7) - 1);
    for (let i = 1; i < months.length; i++) {
      if (idx(months[i].key) - idx(months[i - 1].key) !== 1) {
        throw new Error('The file is missing a month between ' + months[i - 1].key + ' and ' + months[i].key + '.');
      }
    }
    if (months[0].key.slice(5, 7) !== '01' || months[months.length - 1].key.slice(5, 7) !== '12') {
      throw new Error('The file must cover whole calendar years, from January to December.');
    }

    const monthly = months.map((d, i) => {
      const year = +d.key.slice(0, 4), m = +d.key.slice(5, 7) - 1;
      return Object.assign(d, { year, m, i, label: MON[m] + ' ' + year });
    });
    monthly.forEach((d, i) => {
      d.avg12 = i >= 11 ? d3.mean(monthly.slice(i - 11, i + 1), x => x.value) : null; // 12-month average
      d.prev = i >= 12 ? monthly[i - 12].value : null;                                 // same month, a year earlier
      d.yoy = i >= 12 ? d.value / monthly[i - 12].value - 1 : null;
    });

    const yearly = Array.from(d3.rollup(monthly, v => d3.sum(v, d => d.value), d => d.year), ([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
    yearly.forEach((d, i) => {
      d.prev = i ? yearly[i - 1].value : null;
      d.yoy = i ? d.value / yearly[i - 1].value - 1 : null;
    });

    return {
      yearly, monthly, years: yearly.map(d => d.year), areas, sexes: SEX,
      file: info.file, rows: info.rows, skipped: info.skipped
    };
  }

  // adds up Hospitalisations for each month + sex + area from the parsed CSV rows
  function fromRows(rows) {
    const sums = new Map();
    let skipped = 0;
    rows.forEach(r => {
      if (!r.ym || !isFinite(r.h)) { skipped++; return; }
      const k = r.ym + '|' + r.sex + '|' + r.area;
      sums.set(k, (sums.get(k) || 0) + r.h);
    });
    const cells = Array.from(sums, ([k, v]) => { const p = k.split('|'); return [p[0], p[1], p[2], v]; });
    return { cells, skipped };
  }

  // the dashboard's quick period choices, shared by the pages that have a Period filter
  function periods(monthly) {
    return [
      { id: 'all', label: 'All years', a: 0 },
      { id: '5y', label: 'Last 5 years', a: Math.max(0, monthly.length - 60) },
      { id: '3y', label: 'Last 3 years', a: Math.max(0, monthly.length - 36) },
      { id: '2020', label: '2020 onward', a: Math.max(0, monthly.findIndex(d => d.year === 2020)) }
    ];
  }

  // what to tell the person when the CSV cannot be fetched
  function fetchProblem(err) {
    return new Error(location.protocol === 'file:'
      ? 'The CSV cannot be read because the page was opened from a file. Start a local web server in this folder and open it from there, ' +
        'for example run "python3 -m http.server 8000" and go to http://localhost:8000 (see the README).'
      : 'The file ' + FILE + ' could not be read (' + err.message + ').');
  }

  JV.data = {
    periods,
    load() {
      // only the columns the dashboard needs are kept, so the other columns cost almost nothing
      return d3.csv(FILE, r => ({
        ym: (r['Year-Month'] || '').trim(),
        sex: (r['Sex'] || '').trim(),
        area: (r['ABS remoteness area'] || '').trim(),
        h: (r['Hospitalisations'] || '').trim() === '' ? NaN : +r['Hospitalisations']
      }))
        .then(
          rows => {
            const agg = fromRows(rows);
            // a problem with the data itself (a missing month, say) is reported as it is
            return build(agg.cells, { file: FILE.split('/').pop(), rows: rows.length, skipped: agg.skipped });
          },
          err => { throw fetchProblem(err); }
        );
    }
  };
})();
