import React, { useState } from 'react';

export default function PingChart({ heartbeats = [], monitorType = 'http' }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const isDiskOrHost = ['disk', 'cpu', 'memory'].includes(monitorType);
  const unit = isDiskOrHost ? '%' : 'ms';
  const yAxisTitle = isDiskOrHost ? 'Usage (%)' : 'Resp Time (ms)';

  // Process data points
  const points = heartbeats.slice(-30);
  if (points.length < 2) {
    return (
      <div className="w-full h-44 flex items-center justify-center text-muted-foreground bg-card rounded-xl border border-border">
        Collecting telemetry metrics...
      </div>
    );
  }

  const pings = points.map(p => (p.status === 'down' ? 0 : p.ping || 0));
  const maxVal = Math.max(isDiskOrHost ? 100 : 50, Math.ceil((Math.max(...pings, 10) * 1.25) / 10) * 10);
  const minVal = 0;

  // Chart dimensions in SVG viewBox
  const width = 800;
  const height = 180;
  const padLeft = 45;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 25;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const getX = (idx) => padLeft + (idx / (points.length - 1)) * chartWidth;
  const getY = (val) => padTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;

  // Build path strings for line and area
  const coords = points.map((p, i) => ({
    x: getX(i),
    y: getY(p.status === 'down' ? 0 : p.ping || 0),
    point: p
  }));

  const linePath = coords.reduce((acc, curr, i) => {
    return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${padTop + chartHeight} L ${coords[0].x} ${padTop + chartHeight} Z`;

  // Find consecutive down intervals to render red translucent bands
  const downBands = [];
  let bandStart = null;
  points.forEach((p, i) => {
    if (p.status === 'down') {
      if (bandStart === null) bandStart = i;
    } else {
      if (bandStart !== null) {
        downBands.push({ start: bandStart, end: i - 1 });
        bandStart = null;
      }
    }
  });
  if (bandStart !== null) {
    downBands.push({ start: bandStart, end: points.length - 1 });
  }

  // Y-axis grid levels (4 horizontal lines)
  const yTicks = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal];

  // X-axis timestamps (sample 5 timestamps)
  const xLabels = [0, Math.floor(points.length * 0.25), Math.floor(points.length * 0.5), Math.floor(points.length * 0.75), points.length - 1]
    .map(idx => ({
      x: getX(idx),
      time: points[idx]?.time ? new Date(points[idx].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
    }));

  return (
    <div className="relative w-full bg-card rounded-xl border border-border p-4 shadow-sm select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-44 overflow-visible select-none"
      >
        <defs>
          <linearGradient id="darkmatterPingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#20c997" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#20c997" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y-axis gridlines & labels */}
        {yTicks.map((val, idx) => {
          const y = getY(val);
          return (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="oklch(0.2520 0 0)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <text
                x={padLeft - 8}
                y={y + 3}
                fill="oklch(0.6268 0 0)"
                fontSize="10"
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Y-axis label */}
        <text
          x={-(height / 2)}
          y="12"
          transform="rotate(-90)"
          fill="oklch(0.6268 0 0)"
          fontSize="9"
          textAnchor="middle"
          letterSpacing="0.5"
          fontFamily="JetBrains Mono, monospace"
        >
          {yAxisTitle}
        </text>

        {/* Down Shading Red Bands */}
        {downBands.map((band, idx) => {
          const x1 = getX(band.start) - (chartWidth / points.length) * 0.5;
          const x2 = getX(band.end) + (chartWidth / points.length) * 0.5;
          return (
            <rect
              key={idx}
              x={Math.max(padLeft, x1)}
              y={padTop}
              width={Math.min(width - padRight, x2) - Math.max(padLeft, x1)}
              height={chartHeight}
              fill="#ef4444"
              fillOpacity="0.22"
              stroke="#ef4444"
              strokeOpacity="0.4"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Gradient fill area */}
        <path d={areaPath} fill="url(#darkmatterPingGradient)" />

        {/* Green / Teal Ping Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#20c997"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X-axis labels */}
        {xLabels.map((lbl, idx) => (
          <text
            key={idx}
            x={lbl.x}
            y={height - 5}
            fill="oklch(0.6268 0 0)"
            fontSize="10"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
          >
            {lbl.time}
          </text>
        ))}

        {/* Interactive points */}
        {coords.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={hoveredPoint === i ? 4 : 2}
            fill={pt.point.status === 'down' ? '#ef4444' : '#20c997'}
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHoveredPoint(i)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredPoint !== null && coords[hoveredPoint] && (
        <div
          className="absolute z-10 px-3 py-1.5 text-xs bg-popover border border-border text-foreground rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-8 font-mono"
          style={{
            left: `${(coords[hoveredPoint].x / width) * 100}%`,
            top: '30px'
          }}
        >
          <div className="font-semibold text-emerald-400">
            {coords[hoveredPoint].point.status === 'up'
              ? `${coords[hoveredPoint].point.ping} ${unit}`
              : 'DOWN (Error)'}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {new Date(coords[hoveredPoint].point.time).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
