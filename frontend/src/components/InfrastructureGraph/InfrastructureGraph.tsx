import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useTheme } from '@mui/material/styles';

interface Node {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface InfrastructureGraphProps {
  data: GraphData;
  width: number;
  height: number;
  onNodeClick?: (nodeId: string) => void;
}

const InfrastructureGraph: React.FC<InfrastructureGraphProps> = ({ 
  data, 
  width, 
  height,
  onNodeClick 
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const theme = useTheme();
  const [simulation, setSimulation] = useState<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);

  // Get color based on node status
  const getNodeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return theme.palette.success.main;
      case 'degraded':
        return theme.palette.warning.light;
      case 'warning':
        return theme.palette.warning.main;
      case 'critical':
        return theme.palette.error.main;
      case 'maintenance':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Get icon based on node type
  const getNodeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'server':
        return '\uf233'; // fa-server
      case 'database':
        return '\uf1c0'; // fa-database
      case 'application':
        return '\uf085'; // fa-cogs
      case 'service':
        return '\uf013'; // fa-cog
      case 'network':
        return '\uf6ff'; // fa-network-wired
      default:
        return '\uf111'; // fa-circle
    }
  };

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create container group
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Process links data to use node objects instead of IDs
    const nodeMap = new Map(data.nodes.map(node => [node.id, node]));
    const links = data.links.map(link => ({
      source: nodeMap.get(link.source) || link.source,
      target: nodeMap.get(link.target) || link.target,
      value: link.value
    }));

    // Create force simulation
    const sim = d3.forceSimulation(data.nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    setSimulation(sim);

    // Create links
    const link = g.append('g')
      .attr('stroke', theme.palette.grey[400])
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value));

    // Create node containers
    const node = g.append('g')
      .selectAll('.node')
      .data(data.nodes)
      .join('g')
      .attr('class', 'node')
      .call(drag(sim) as any)
      .on('click', (event, d) => {
        if (onNodeClick) {
          event.stopPropagation();
          onNodeClick(d.id);
        }
      });

    // Add node circles
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => getNodeColor(d.status))
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 2);

    // Add node icons
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', 'FontAwesome')
      .attr('font-size', '14px')
      .attr('fill', theme.palette.background.paper)
      .text(d => getNodeIcon(d.type));

    // Add node labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', 35)
      .attr('fill', theme.palette.text.primary)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(d => d.name)
      .each(function(d) {
        const text = d3.select(this);
        const words = d.name.split(/\s+/);
        
        if (words.length > 1) {
          text.text(null);
          
          words.forEach((word, i) => {
            text.append('tspan')
              .attr('x', 0)
              .attr('y', 35 + i * 12)
              .text(word);
          });
        }
      });

    // Update positions on simulation tick
    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node.attr('transform', d => `translate(${(d as any).x},${(d as any).y})`);
    });

    // Drag behavior
    function drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // Initial zoom to fit
    const bounds = (g.node() as SVGGElement).getBBox();
    const fullWidth = bounds.width;
    const fullHeight = bounds.height;
    const scale = 0.95 / Math.max(fullWidth / width, fullHeight / height);
    const translateX = width / 2 - scale * (bounds.x + fullWidth / 2);
    const translateY = height / 2 - scale * (bounds.y + fullHeight / 2);
    
    svg.call(
      zoom.transform as any, 
      d3.zoomIdentity.translate(translateX, translateY).scale(scale)
    );

    // Cleanup
    return () => {
      if (simulation) {
        simulation.stop();
      }
    };
  }, [data, width, height, theme, onNodeClick]);

  return (
    <svg ref={svgRef} width={width} height={height} />
  );
};

export default InfrastructureGraph;
