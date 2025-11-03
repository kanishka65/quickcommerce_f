// heatmap.js
window.renderHeatmap = function(selector, matrix) {
  // Clear previous heatmap
  d3.select(selector).selectAll('*').remove();
  
  const container = d3.select(selector);
  const containerWidth = container.node().clientWidth || 400;
  
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  const margins = { top: 30, right: 30, bottom: 50, left: 60 };
  const cellSize = Math.max(10, (containerWidth - margins.left - margins.right) / cols);
  
  const width = (cellSize * cols) + margins.left + margins.right;
  const height = (cellSize * rows) + margins.top + margins.bottom;

  const svg = container
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g').attr('transform', `translate(${margins.left},${margins.top})`);

  // Color scale
  const maxVal = Math.max(...matrix.flat());
  const color = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal]);

  // Days of week
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Draw cells
  matrix.forEach((row, r) => {
    row.forEach((val, c) => {
      g.append('rect')
        .attr('x', c * cellSize)
        .attr('y', r * cellSize)
        .attr('width', cellSize - 1)
        .attr('height', cellSize - 1)
        .attr('fill', color(val))
        .on('mouseover', function(event) {
          tooltip.transition().duration(200).style('opacity', .9);
          tooltip.html(`${days[r]} ${c}:00<br>₹${val}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
          tooltip.transition().duration(500).style('opacity', 0);
        });
    });
  });

  // X axis (hours)
  const hours = Array.from({length: cols}, (_, i) => i);
  g.selectAll('.hour-label')
    .data(hours)
    .enter().append('text')
    .attr('class', 'hour-label')
    .attr('x', (d) => d * cellSize + cellSize/2)
    .attr('y', rows * cellSize + 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '10px')
    .text(d => d % 3 === 0 ? d : '');

  // Y axis (days)
  g.selectAll('.day-label')
    .data(days)
    .enter().append('text')
    .attr('class', 'day-label')
    .attr('x', -10)
    .attr('y', (d, i) => i * cellSize + cellSize/2 + 4)
    .attr('text-anchor', 'end')
    .style('font-size', '12px')
    .text(d => d);
};