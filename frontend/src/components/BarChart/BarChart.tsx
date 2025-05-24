import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';

interface BarChartProps {
  data: {
    name: string;
    value: number;
  }[];
  width: number;
  height: number;
  color?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, width, height, color = '#2196f3' }) => {
  const [svgRef, setSvgRef] = useState<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef || !data || data.length === 0) return;

    // Clear previous content
    d3.select(svgRef).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 60, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef)
      .attr('width', width)
      .attr('height', height);

    // Create container group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 1])
      .nice()
      .range([innerHeight, 0]);

    // Draw bars
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.name) || 0)
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.value))
      .attr('fill', color)
      .attr('rx', 4)
      .attr('ry', 4)
      .append('title')
      .text(d => `${d.name}: ${d.value}`);

    // Add x-axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em');

    // Add y-axis
    g.append('g')
      .call(d3.axisLeft(yScale));

  }, [svgRef, data, width, height, color]);

  return (
    <svg ref={setSvgRef} />
  );
};

export default BarChart;
