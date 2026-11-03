/* Start-up: load the data, build each page once, then draw the page that is showing.
   Also handles the tabs (click, arrow keys, #overview / #monthly / #seasonality / #who in the address),
   and resizing. */
(function () {
  'use strict';
  const { $, tip } = JV.u;

  const ORDER = ['overview', 'monthly', 'seasonality', 'who'];
  let data = null;
  let current = ORDER.indexOf(location.hash.slice(1)) >= 0 ? location.hash.slice(1) : 'overview';

  function draw() {
    tip.hide();
    JV.pages[current].draw(data);
  }

  function show(id, focusTab, toTop) {
    current = id;
    ORDER.forEach(p => {
      const on = p === id, tab = $('tab-' + p);
      $('page-' + p).hidden = !on;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focusTab) tab.focus();
      if (on && tab.scrollIntoView) tab.scrollIntoView({ block: 'nearest', inline: 'nearest' }); // the tab row slides on a phone
    });
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* the address cannot change in some viewers */ }
    draw();
    if (toTop) window.scrollTo(0, 0); // a shorter page should not open part-way down
  }

  function wireTabs() {
    ORDER.forEach((id, i) => {
      const tab = $('tab-' + id);
      tab.addEventListener('click', () => show(id, false, true));
      tab.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        show(ORDER[(i + (e.key === 'ArrowRight' ? 1 : ORDER.length - 1)) % ORDER.length], true, true);
      });
    });

    // the address changed by hand (typing #monthly, or the back button)
    window.addEventListener('hashchange', () => {
      const id = location.hash.slice(1);
      if (ORDER.indexOf(id) >= 0 && id !== current) show(id, false, true);
    });
  }

  function start(loaded) {
    data = loaded;
    ORDER.forEach(p => JV.pages[p].build(data));

    $('data-note').textContent = 'Source: ' + data.file + ' (' + d3.format(',')(data.rows) + ' rows). ' +
      'The Hospitalisations column is added up by month, sex and area.' +
      (data.skipped ? ' ' + data.skipped + ' rows without a month or a Hospitalisations figure were left out.' : '');

    wireTabs();
    show(current);

    // redraw when the width changes (rotating a phone, resizing a window)
    const wrap = document.querySelector('.wrap');
    let lastW = wrap.clientWidth;
    new ResizeObserver(() => {
      if (wrap.clientWidth !== lastW) { lastW = wrap.clientWidth; draw(); }
    }).observe(wrap);
  }

  JV.data.load().then(start).catch(err => {
    const msg = document.createElement('p');
    msg.className = 'error';
    msg.textContent = 'The data could not be loaded: ' + err.message;
    const main = $('main'); main.textContent = ''; main.appendChild(msg);
  });
})();
