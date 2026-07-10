import React, { useState } from 'react';
import { Clock } from 'lucide-react';

const SENSOR_METADATA = {
  ph: { 
    label: 'Kadar Keasaman (pH)', 
    unit: '', 
    minIdeal: 7.5, 
    maxIdeal: 8.5, 
    apiKey: 'ph' 
  },
  tds: { 
    label: 'Total Dissolved Solids (TDS)', 
    unit: 'ppm', 
    minIdeal: 800, 
    maxIdeal: 1000, 
    apiKey: 'tds' 
  },
  do: { 
    label: 'Dissolved Oxygen (DO)', 
    unit: 'mg/L', 
    minIdeal: 5.0, 
    maxIdeal: 8.0, 
    apiKey: 'dissolved_oxygen' 
  },
  suhu: { 
    label: 'Suhu Air', 
    unit: '°C', 
    minIdeal: 24.0, 
    maxIdeal: 28.0, 
    apiKey: 'water_temperature' 
  },
  arus: { 
    label: 'Kecepatan Arus', 
    unit: 'm/s', 
    minIdeal: 0.1, 
    maxIdeal: 0.3, 
    apiKey: 'flow_rate' 
  },
  turbidity: { 
    label: 'Kekeruhan (Turbidity)', 
    unit: 'NTU', 
    minIdeal: 0.0, 
    maxIdeal: 5.0, 
    apiKey: 'turbidity' 
  },
};

export const SensorChart = ({ historyData = [], selectedMetric, onChangeMetric }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const meta = SENSOR_METADATA[selectedMetric] || SENSOR_METADATA.ph;
  const apiKey = meta.apiKey;

  // Extract values, fallback to 0 if history is empty
  const values = historyData.map((d) => d[apiKey] !== undefined ? Number(d[apiKey]) : 0);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 10;

  // Pad the chart scale
  const range = maxVal - minVal;
  const padding = range === 0 ? 1 : range * 0.15;
  const chartMin = Math.max(0, minVal - padding);
  const chartMax = maxVal + padding;

  // Chart dimensions
  const width = 500;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  // Format time label
  const formatTimeLabel = (isoString) => {
    try {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  // Map data to SVG coordinates
  const points = historyData.map((d, i) => {
    const rawVal = d[apiKey] !== undefined ? Number(d[apiKey]) : 0;
    const x = paddingLeft + (historyData.length > 1 ? (i / (historyData.length - 1)) * graphWidth : graphWidth / 2);
    const y =
      paddingTop +
      graphHeight -
      (chartMax - chartMin > 0 ? ((rawVal - chartMin) / (chartMax - chartMin)) * graphHeight : graphHeight / 2);
    return { x, y, value: rawVal, time: formatTimeLabel(d.time || d._time) };
  });

  // Construct SVG Line Path
  const linePath = points.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, '');

  // Construct SVG Area Path under the line
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z` 
    : '';

  // Grid line values
  const gridLines = [0, 0.33, 0.66, 1].map((ratio) => {
    const yVal = chartMin + ratio * (chartMax - chartMin);
    const yPos = paddingTop + graphHeight - ratio * graphHeight;
    return { val: yVal, y: yPos };
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col space-y-4 shadow-sm" id="sensor-history-chart">
      {/* Chart Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3" id="chart-header">
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center h-10 w-10 bg-gradient-to-br from-[#0D9D1B]/10 to-[#0D9D1B]/5 rounded-xl border border-[#0D9D1B]/20 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] overflow-hidden group shrink-0">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
            <svg className="w-5.5 h-5.5 text-[#0D9D1B] relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path className="animate-[pulseWave_2.5s_linear_infinite]" strokeDasharray="40" strokeDashoffset="40" d="M3 12h3l2.5-6 3.5 12 2-9 2.5 5 2.5-2h3" />
            </svg>
            <style>{`
              @keyframes pulseWave {
                0% { stroke-dashoffset: 40; }
                50% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -40; }
              }
            `}</style>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Grafik Riwayat Telemetri</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Analisis kondisi kualitas air 24 jam terakhir</p>
          </div>
        </div>

        {/* Tab-like metric selector */}
        <div className="flex flex-wrap gap-0.5 bg-slate-50 p-1 rounded-xl border border-slate-100/80" id="chart-metrics-tabs">
          {Object.keys(SENSOR_METADATA).map((type) => (
            <button
              key={type}
              id={`tab-metric-${type}`}
              onClick={() => onChangeMetric(type)}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedMetric === type
                  ? 'bg-[#0D9D1B] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Container */}
      {historyData.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center bg-slate-50/50 border border-dashed border-slate-200/80 rounded-2xl text-slate-400 text-xs font-medium italic">
          Belum ada data historis 24 jam untuk node ini
        </div>
      ) : (
        <div className="relative w-full overflow-hidden" id="chart-canvas-container">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible font-sans select-none"
          >
            {/* Gradient definition for graph area */}
            <defs>
              <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9D1B" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#0D9D1B" stopOpacity={0.00} />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines & Y axis text */}
            {gridLines.map((line, i) => (
              <g key={i} className="opacity-70">
                <line
                  x1={paddingLeft}
                  y1={line.y}
                  x2={width - paddingRight}
                  y2={line.y}
                  stroke="#F1F5F9"
                  strokeWidth={1}
                />
                <text
                  x={paddingLeft - 8}
                  y={line.y + 3}
                  fill="#94A3B8"
                  fontSize={8}
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {line.val.toFixed(selectedMetric === 'tds' ? 0 : 2)}
                </text>
              </g>
            ))}

            {/* Draw ideal range boundary shade */}
            {meta.minIdeal < chartMax && meta.maxIdeal > chartMin && (
              <rect
                x={paddingLeft}
                y={Math.max(paddingTop, paddingTop + graphHeight - ((meta.maxIdeal - chartMin) / (chartMax - chartMin)) * graphHeight)}
                width={graphWidth}
                height={Math.min(
                  graphHeight,
                  ((meta.maxIdeal - meta.minIdeal) / (chartMax - chartMin)) * graphHeight
                )}
                fill="rgba(13, 157, 27, 0.015)"
                stroke="rgba(13, 157, 27, 0.08)"
                strokeWidth={0.75}
                strokeDasharray="2 2"
              />
            )}

            {/* Vertical Hairline Tracker (on Hover) */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <line
                x1={points[hoveredIndex].x}
                y1={paddingTop}
                x2={points[hoveredIndex].x}
                y2={height - paddingBottom}
                stroke="#0D9D1B"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.4}
              />
            )}

            {/* Area Path Gradient Fill */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#chart-area-grad)"
              />
            )}

            {/* Line Path */}
            <path
              d={linePath}
              fill="none"
              stroke="#0D9D1B"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Points */}
            {points.map((p, i) => (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <circle cx={p.x} cy={p.y} r={10} fill="transparent" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredIndex === i ? 4.5 : 2.5}
                  fill={hoveredIndex === i ? '#0D9D1B' : '#FFFFFF'}
                  stroke="#0D9D1B"
                  strokeWidth={hoveredIndex === i ? 2 : 1.5}
                  className="transition-all duration-150"
                />
              </g>
            ))}

            {/* X Axis line */}
            <line
              x1={paddingLeft}
              y1={height - paddingBottom}
              x2={width - paddingRight}
              y2={height - paddingBottom}
              stroke="#E2E8F0"
              strokeWidth={1}
            />

            {/* X Axis Labels */}
            {points.map((p, i) => {
              const shouldShowLabel = 
                i === 0 || 
                i === points.length - 1 || 
                (points.length > 2 && i === Math.floor(points.length / 2)) ||
                (points.length > 5 && i === Math.floor(points.length / 4)) ||
                (points.length > 5 && i === Math.floor(3 * points.length / 4));
              
              if (!shouldShowLabel) return null;
              
              return (
                <text
                  key={i}
                  x={p.x}
                  y={height - paddingBottom + 16}
                  fill="#94A3B8"
                  fontSize={8}
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {p.time}
                </text>
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <div
              className="absolute bg-slate-900/95 text-white text-[10px] rounded-xl px-3 py-1.5 shadow-xl pointer-events-none transition-all duration-100 border border-slate-800 flex flex-col gap-0.5"
              style={{
                left: `${(points[hoveredIndex].x / width) * 100}%`,
                top: `${(points[hoveredIndex].y / height) * 100 - 20}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="font-mono text-[8px] text-slate-400 flex items-center space-x-1 font-bold">
                <Clock className="h-2.5 w-2.5 text-slate-500" />
                <span>Pukul {points[hoveredIndex].time}</span>
              </div>
              <div className="font-mono font-bold text-xs text-emerald-400 flex items-center gap-0.5">
                {points[hoveredIndex].value.toFixed(selectedMetric === 'tds' ? 0 : 2)}
                <span className="text-[9px] font-bold text-slate-300">{meta.unit}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
