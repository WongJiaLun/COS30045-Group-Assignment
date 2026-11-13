/* HISTOGRAM: Shows distribution bins of a dataset using d3.bin(). */
(function () {
  'use strict';
  const { mk, yGrid, tip, fmt } = JV.u;

  JV.charts.histogram = function (el, o) {
    const W = el.clientWidth || 320;
    const H = o.height || el.clientHeight || (W < 520 ? 270 : 320);
    const { svg, g, w, h } = mk(el, H, { t: 26, r: 8, b: 28, l: 46 });
    svg.attr('aria-label', o.aria);

    const x = d3.scaleLinear()
      .domain(d3.extent(o.data)).nice()
      .range([0, w]);

    const bins = d3.bin()
      .domain(x.domain())
      .thresholds(x.ticks(10))
      (o.data);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)]).nice()
      .range([h, 0]);

    yGrid(g, y, w, 4, fmt);

    // Render X Axis
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickFormat(fmt).ticks(W / 80))
      .selectAll("text")
      .attr("class", "tl");

    const bars = g.selectAll(".bar")
      .data(bins)
      .join("g")
      .attr("class", "bar")
      .attr("tabindex", 0);

    // Keep an invisible rect for hover/hit detection
    bars.append("rect")
      .attr("class", "hit")
      .attr("x", d => x(d.x0))
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0)))
      .attr("y", 0)
      .attr("height", h);

    // Visible bars
    bars.append("rect")
      .attr("x", d => x(d.x0) + 1)
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", d => y(d.length))
      .attr("height", d => y(0) - y(d.length))
      .style("fill", o.color || "var(--s1)");

    tip.bind(bars, o.info);
  };
})();