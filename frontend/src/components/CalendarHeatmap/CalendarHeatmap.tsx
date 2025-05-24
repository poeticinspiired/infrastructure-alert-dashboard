import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';

interface CalendarHeatmapProps {
  data: {
    day: string;
    time: string;
    value: number;
  }[];
  width: number;
  height: number;
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ data, width, height }) => {
  const [svgRef, setSvgRef] = useState<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef || !data || data.length === 0) return;

    // Clear previous content
    d3.select(svgRef).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 30, right: 30, bottom: 30, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef)
      .attr('width', width)
      .attr('height', height);

    // Create container group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define days and time slots
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = Array.from(new Set(data.map(d => d.time)));

    // Set up scales
    const xScale = d3.scaleBand()
      .domain(timeSlots)
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleBand()
      .domain(days)
      .range([0, innerHeight])
      .padding(0.1);

    const colorScale = d3.scaleLinear<string>()
      .domain([0, 0.5, 1])
      .range(['#4caf50', '#ff9800', '#f44336']);

    // Draw heatmap cells
    g.selectAll('.heatmap-cell')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => xScale(d.time) || 0)
      .attr('y', d => yScale(d.day) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .append('title')
      .text(d => `${d.day} ${d.time}: ${d.value < 0.4 ? 'Low' : d.value < 0.7 ? 'Medium' : 'High'} Risk`);

    // Add x-axis (time slots)
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'middle');

    // Add y-axis (days)
    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Weekly Deployment Risk Calendar');

  }, [svgRef, data, width, height]);

  return (
    <svg ref={setSvgRef} />
  );
};

export default CalendarHeatmap;
