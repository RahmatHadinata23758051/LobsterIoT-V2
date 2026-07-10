import React, { useState } from 'react';
import { Activity, Clock } from 'lucide-react';

const SENSOR_METADATA = {
  ph: {
    label: 'Kadar Keasaman (pH)',
    unit: '',
    minIdeal: 7.5,
    maxIdeal: 8.5,
    apiKey: 'ph',
    minRange: 2.0,
  },
  tds: {
    label: 'Total Dissolved Solids (TDS)',
    unit: 'ppm',
    minIdeal: 800,
    maxIdeal: 1000,
    apiKey: 'tds',
    minRange: 200,
  },
  do: {
    label: 'Dissolved Oxygen (DO)',
    unit: 'mg/L',
    minIdeal: 5.0,
    maxIdeal: 8.0,
    apiKey: 'dissolved_oxygen',
    minRange: 4.0,
  },
  suhu: {
    label: 'Suhu Air',
    unit: '°C',
    minIdeal: 24.0,
    maxIdeal: 28.0,
    apiKey: 'water_temperature',
    minRange: 5.0,
  },
  arus: {
    label: 'Kecepatan Arus',
    unit: 'm/s',
    minIdeal: 0.1,
    maxIdeal: 0.3,
    apiKey: 'flow_rate',
    minRange: 0.4,
  },
  turbidity: {
    label: 'Kekeruhan (Turbidity)',
    unit: 'NTU',
    minIdeal: 0.0,
    maxIdeal: 5.0,
    apiKey: 'turbidity',
    minRange: 5.0,
  },
};

const TIME_RANGE_LABELS = {
  '30m': '30 Menit',
  '1h': '1 Jam',
  '3h': '3 Jam',
  '6h': '6 Jam',
  '12h': '12 Jam',
  '24h': '24 Jam',
};

export const SensorChart = ({
  historyData = [],
  selectedMetric,
  onChangeMetric,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');

  const meta = SENSOR_METADATA[selectedMetric] || SENSOR_METADATA.ph;
  const apiKey = meta.apiKey;

  const getFilteredData = () => {
    if (historyData.length === 0) return [];

    let limitPoints = 289;

    if (timeRange === '30m') limitPoints = 7;
    else if (timeRange === '1h') limitPoints = 13;
    else if (timeRange === '3h') limitPoints = 37;
    else if (timeRange === '6h') limitPoints = 73;
    else if (timeRange === '12h') limitPoints = 145;

    return historyData.slice(-limitPoints);
  };

  const filteredHistory = getFilteredData();

  const values = filteredHistory.map((data) =>
    data[apiKey] !== undefined ? Number(data[apiKey]) : 0,
  );

  const minVal =
    values.length > 0 ? Math.min(...values) : meta.minIdeal - 1;

  const maxVal =
    values.length > 0 ? Math.max(...values) : meta.maxIdeal + 1;

  const range = maxVal - minVal;
  const chartPadding = range === 0 ? 1 : range * 0.25;

  let chartMin = Math.max(0, minVal - chartPadding);
  let chartMax = maxVal + chartPadding;

  const currentRange = chartMax - chartMin;

  if (currentRange < meta.minRange) {
    const difference = meta.minRange - currentRange;

    chartMin = Math.max(0, chartMin - difference / 2);
    chartMax += difference / 2;
  }

  const width = 760;
  const height = 280;

  const paddingLeft = 58;
  const paddingRight = 22;
  const paddingTop = 36;
  const paddingBottom = 48;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  const chartBaseline = height - paddingBottom;

  const formatTimeLabel = (isoString) => {
    try {
      if (!isoString) return '';

      const date = new Date(isoString);

      return date
        .toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
        .replace('.', ':');
    } catch {
      return isoString;
    }
  };

  const formatTooltipDate = (isoString) => {
    try {
      if (!isoString) return '';

      const date = new Date(isoString);

      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ];

      const day = date.getDate();
      const month = months[date.getMonth()];

      const time = date
        .toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
        .replace('.', ':');

      return `${day} ${month}, ${time}`;
    } catch {
      return isoString;
    }
  };

  const points = filteredHistory.map((data, index) => {
    const rawValue =
      data[apiKey] !== undefined ? Number(data[apiKey]) : 0;

    const x =
      paddingLeft +
      (filteredHistory.length > 1
        ? (index / (filteredHistory.length - 1)) * graphWidth
        : graphWidth / 2);

    const y =
      paddingTop +
      graphHeight -
      (chartMax - chartMin > 0
        ? ((rawValue - chartMin) / (chartMax - chartMin)) *
        graphHeight
        : graphHeight / 2);

    return {
      x,
      y,
      value: rawValue,
      rawTime: data.time || data._time,
    };
  });

  const getBezierPath = (chartPoints) => {
    if (chartPoints.length < 2) return '';

    let path = `M ${chartPoints[0].x} ${chartPoints[0].y}`;

    for (let index = 0; index < chartPoints.length - 1; index += 1) {
      const pointBefore =
        index > 0 ? chartPoints[index - 1] : chartPoints[0];

      const currentPoint = chartPoints[index];
      const nextPoint = chartPoints[index + 1];

      const pointAfter =
        index < chartPoints.length - 2
          ? chartPoints[index + 2]
          : nextPoint;

      const controlPointOneX =
        currentPoint.x + (nextPoint.x - pointBefore.x) * 0.2;

      const controlPointOneY =
        currentPoint.y + (nextPoint.y - pointBefore.y) * 0.2;

      const controlPointTwoX =
        nextPoint.x - (pointAfter.x - currentPoint.x) * 0.2;

      const controlPointTwoY =
        nextPoint.y - (pointAfter.y - currentPoint.y) * 0.2;

      path += `
        C
        ${controlPointOneX} ${controlPointOneY},
        ${controlPointTwoX} ${controlPointTwoY},
        ${nextPoint.x} ${nextPoint.y}
      `;
    }

    return path;
  };

  const linePath =
    points.length > 1
      ? getBezierPath(points)
      : points.length === 1
        ? `M ${points[0].x} ${points[0].y}`
        : '';

  const areaPath =
    points.length > 1
      ? `
        ${linePath}
        L ${points[points.length - 1].x} ${chartBaseline}
        L ${points[0].x} ${chartBaseline}
        Z
      `
      : '';

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = chartMin + ratio * (chartMax - chartMin);
    const y = paddingTop + graphHeight - ratio * graphHeight;

    return {
      value,
      y,
    };
  });

  const getXTicks = () => {
    if (points.length === 0) return [];

    let step = 1;

    if (timeRange === '3h') step = 3;
    else if (timeRange === '6h') step = 6;
    else if (timeRange === '12h') step = 12;
    else if (timeRange === '24h') step = 24;

    const ticks = [];

    for (let index = 0; index < points.length; index += step) {
      ticks.push({
        x: points[index].x,
        label: formatTimeLabel(points[index].rawTime),
      });
    }

    const latestIndex = points.length - 1;

    if (points.length > 1 && latestIndex % step !== 0) {
      ticks.push({
        x: points[latestIndex].x,
        label: formatTimeLabel(points[latestIndex].rawTime),
      });
    }

    return ticks;
  };

  const xTicks = getXTicks();

  const formatYAxisTick = (value) => {
    if (selectedMetric === 'tds') {
      return Math.round(value);
    }

    if (selectedMetric === 'arus') {
      return value.toFixed(2);
    }

    return value.toFixed(1);
  };

  const getYAxisLabel = () => {
    if (selectedMetric === 'suhu') return 'Suhu Air (°C)';
    if (selectedMetric === 'arus') return 'Kecepatan Arus (m/s)';
    if (selectedMetric === 'do') return 'Dissolved Oxygen (mg/L)';
    if (selectedMetric === 'tds') return 'TDS (ppm)';
    if (selectedMetric === 'ph') return 'pH Air';

    return meta.label;
  };

  // Capture horizontal mouse moves to slice track the nearest data point
  const handleMouseMove = (event) => {
    if (points.length === 0) return;
    const svg = event.currentTarget.ownerSVGElement || event.currentTarget;
    const rect = svg.getBoundingClientRect();
    
    // Scale client X to SVG view box space (width = 760)
    const mouseX = ((event.clientX - rect.left) / rect.width) * width;
    
    let nearestIdx = 0;
    let minDist = Infinity;
    
    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = idx;
      }
    });
    
    setHoveredIndex(nearestIdx);
  };

  return (
    <section
      id="sensor-history-chart"
      className="
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200
        bg-white
        shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_32px_rgba(15,23,42,0.04)]
      "
    >
      <div
        id="chart-header"
        className="
          flex
          flex-col
          gap-5
          border-b
          border-slate-100
          px-5
          py-5
          sm:px-6
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-emerald-100
              bg-emerald-50
            "
          >
            <Activity
              className="h-[18px] w-[18px] text-[#1F8037]"
              strokeWidth={2}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className="
                  truncate
                  text-sm
                  font-semibold
                  tracking-[-0.01em]
                  text-slate-900
                  sm:text-[15px]
                "
              >
                {meta.label}
              </h3>

              <span
                className="
                  inline-flex
                  h-6
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-emerald-100
                  bg-emerald-50
                  px-2.5
                  text-[10px]
                  font-semibold
                  text-[#1F8037]
                "
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className="
                      absolute
                      inline-flex
                      h-full
                      w-full
                      animate-ping
                      rounded-full
                      bg-emerald-500
                      opacity-50
                    "
                  />

                  <span
                    className="
                      relative
                      inline-flex
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-emerald-500
                    "
                  />
                </span>

                Live
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Tren parameter kualitas air dengan interval pencatatan
              5 menit
            </p>
          </div>
        </div>

        <div
          id="chart-filters-panel"
          className="
            flex
            min-w-0
            flex-col
            gap-2.5
            sm:flex-row
            sm:items-center
          "
        >
          <div
            id="chart-metrics-tabs"
            className="
              flex
              max-w-full
              items-center
              gap-1
              overflow-x-auto
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-1
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {Object.keys(SENSOR_METADATA).map((type) => (
              <button
                key={type}
                id={`tab-metric-${type}`}
                type="button"
                onClick={() => {
                  onChangeMetric(type);
                  setHoveredIndex(null);
                }}
                className={`
                  shrink-0
                  rounded-lg
                  px-3
                  py-1.5
                  text-[10px]
                  font-semibold
                  tracking-wide
                  transition-all
                  duration-200
                  ${selectedMetric === type
                    ? `
                        bg-white
                        text-[#1F8037]
                        shadow-[0_1px_3px_rgba(15,23,42,0.10)]
                        ring-1
                        ring-slate-200/80
                      `
                    : `
                        text-slate-500
                        hover:bg-white/70
                        hover:text-slate-800
                      `
                  }
                `}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="relative shrink-0">
            <Clock
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                h-3.5
                w-3.5
                -translate-y-1/2
                text-slate-400
              "
              strokeWidth={2}
            />

            <select
              value={timeRange}
              aria-label="Pilih rentang waktu chart"
              onChange={(event) => {
                setTimeRange(event.target.value);
                setHoveredIndex(null);
              }}
              className="
                h-9
                w-full
                appearance-none
                rounded-xl
                border
                border-slate-200
                bg-white
                py-0
                pl-9
                pr-9
                text-[11px]
                font-semibold
                text-slate-700
                shadow-sm
                outline-none
                transition
                hover:border-slate-300
                focus:border-[#1F8037]
                focus:ring-2
                focus:ring-emerald-100
                sm:w-[116px]
              "
            >
              {Object.entries(TIME_RANGE_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>

            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                right-3
                top-1/2
                h-3.5
                w-3.5
                -translate-y-1/2
                text-slate-400
              "
            >
              <path
                d="m6 8 4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {filteredHistory.length === 0 ? (
          <div
            className="
              flex
              h-[280px]
              flex-col
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-slate-200
              bg-slate-50/60
              px-6
              text-center
            "
          >
            <div
              className="
                mb-3
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-slate-200
                bg-white
                shadow-sm
              "
            >
              <Clock
                className="h-4 w-4 text-slate-400"
                strokeWidth={2}
              />
            </div>

            <p className="text-sm font-medium text-slate-700">
              Belum ada data telemetri
            </p>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Data parameter node akan muncul di chart setelah
              pembacaan sensor tersedia.
            </p>
          </div>
        ) : (
          <div
            id="chart-canvas-container"
            className="
              relative
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-1
              pb-1
              pt-2
              sm:px-2
            "
          >
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="
                h-auto
                w-full
                select-none
                overflow-visible
                font-sans
              "
              role="img"
              aria-label={`Grafik ${meta.label} untuk ${TIME_RANGE_LABELS[timeRange]}`}
            >
              <defs>
                <linearGradient
                  id="sensor-area-gradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#1F8037"
                    stopOpacity="0.16"
                  />

                  <stop
                    offset="65%"
                    stopColor="#1F8037"
                    stopOpacity="0.045"
                  />

                  <stop
                    offset="100%"
                    stopColor="#1F8037"
                    stopOpacity="0"
                  />
                </linearGradient>

                <filter
                  id="latest-point-shadow"
                  x="-100%"
                  y="-100%"
                  width="300%"
                  height="300%"
                >
                  <feDropShadow
                    dx="0"
                    dy="1"
                    stdDeviation="1.5"
                    floodColor="#1F8037"
                    floodOpacity="0.28"
                  />
                </filter>
              </defs>

              <text
                x={paddingLeft}
                y={17}
                fill="#475569"
                fontSize="10"
                fontWeight="600"
              >
                {getYAxisLabel()}
              </text>

              {xTicks.map((tick, index) => (
                <line
                  key={`vertical-grid-${index}`}
                  x1={tick.x}
                  y1={paddingTop}
                  x2={tick.x}
                  y2={chartBaseline}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
              ))}

              {gridLines.map((line, index) => (
                <g key={`horizontal-grid-${index}`}>
                  <line
                    x1={paddingLeft}
                    y1={line.y}
                    x2={width - paddingRight}
                    y2={line.y}
                    stroke="#E9EEF3"
                    strokeWidth="1"
                  />

                  <text
                    x={paddingLeft - 12}
                    y={line.y + 3.5}
                    fill="#94A3B8"
                    fontSize="9"
                    fontWeight="500"
                    textAnchor="end"
                  >
                    {formatYAxisTick(line.value)}
                  </text>
                </g>
              ))}

              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#sensor-area-gradient)"
                />
              )}

              {hoveredIndex !== null &&
                points[hoveredIndex] && (
                  <line
                    x1={points[hoveredIndex].x}
                    y1={paddingTop}
                    x2={points[hoveredIndex].x}
                    y2={chartBaseline}
                    stroke="#94A3B8"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />
                )}

              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#1F8037"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Dynamic point highlight on hover (controlled by canvas-wide track event) */}
              {hoveredIndex !== null && points[hoveredIndex] && (
                <g>
                  <circle
                    cx={points[hoveredIndex].x}
                    cy={points[hoveredIndex].y}
                    r="7"
                    fill="#1F8037"
                    opacity="0.12"
                  />

                  <circle
                    cx={points[hoveredIndex].x}
                    cy={points[hoveredIndex].y}
                    r="4"
                    fill="#FFFFFF"
                    stroke="#1F8037"
                    strokeWidth="2.25"
                  />
                </g>
              )}

              {points.length > 0 && (
                <g filter="url(#latest-point-shadow)">
                  <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r="7.5"
                    fill="#1F8037"
                    opacity="0.12"
                  />

                  <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r="4.5"
                    fill="#FFFFFF"
                    stroke="#1F8037"
                    strokeWidth="2.5"
                  />

                  <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r="1.5"
                    fill="#1F8037"
                  />
                </g>
              )}

              <line
                x1={paddingLeft}
                y1={chartBaseline}
                x2={width - paddingRight}
                y2={chartBaseline}
                stroke="#CBD5E1"
                strokeWidth="1"
              />

              {xTicks.map((tick, index) => (
                <g key={`x-tick-${index}`}>
                  <line
                    x1={tick.x}
                    y1={chartBaseline}
                    x2={tick.x}
                    y2={chartBaseline + 5}
                    stroke="#CBD5E1"
                    strokeWidth="1"
                  />

                  <text
                    x={tick.x}
                    y={chartBaseline + 19}
                    fill="#64748B"
                    fontSize="9"
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}

              <text
                x={paddingLeft + graphWidth / 2}
                y={height - 7}
                fill="#94A3B8"
                fontSize="9"
                fontWeight="500"
                textAnchor="middle"
              >
                Waktu pengamatan
              </text>

              {/* Invisible tracking rect overlaid across the whole grid area to capture mouse move events horizontally */}
              <rect
                x={paddingLeft}
                y={paddingTop}
                width={graphWidth}
                height={graphHeight}
                fill="transparent"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-crosshair"
              />
            </svg>

            {hoveredIndex !== null &&
              points[hoveredIndex] && (
                <div
                  className="
                    pointer-events-none
                    absolute
                    z-50
                    min-w-[142px]
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    p-3
                    shadow-[0_12px_30px_rgba(15,23,42,0.12)]
                  "
                  style={{
                    left: `${(points[hoveredIndex].x / width) * 100
                      }%`,
                    top: `${(points[hoveredIndex].y / height) * 100
                      }%`,
                    transform:
                      'translate(-50%, calc(-100% - 14px))',
                  }}
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-1.5
                      text-[10px]
                      font-medium
                      text-slate-500
                    "
                  >
                    <span
                      className="
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-[#1F8037]
                      "
                    />

                    {formatTooltipDate(
                      points[hoveredIndex].rawTime,
                    )}
                  </div>

                  <div
                    className="
                      mt-2
                      flex
                      items-end
                      justify-between
                      gap-3
                    "
                  >
                    <span
                      className="
                        text-[10px]
                        font-medium
                        uppercase
                        tracking-wide
                        text-slate-400
                      "
                    >
                      {selectedMetric}
                    </span>

                    <span
                      className="
                        font-mono
                        text-sm
                        font-semibold
                        text-slate-900
                      "
                    >
                      {points[hoveredIndex].value.toFixed(
                        selectedMetric === 'tds' ? 0 : 2,
                      )}

                      {meta.unit && (
                        <span
                          className="
                            ml-1
                            text-[10px]
                            font-medium
                            text-slate-500
                          "
                        >
                          {meta.unit}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
          </div>
        )}

        {filteredHistory.length > 0 && (
          <div
            className="
              mt-3
              flex
              flex-col
              gap-2
              px-1
              text-[10px]
              text-slate-445
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <span>
              Menampilkan {filteredHistory.length} titik data •
              interval 5 menit
            </span>

            <span>
              Data terbaru berada di sisi kanan chart
            </span>
          </div>
        )}
      </div>
    </section>
  );
};