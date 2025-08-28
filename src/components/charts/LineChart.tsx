import { useMemo, useState } from "react"

type SeriesPoint = { x: number; y: number; label?: string; runKey?: string }
export type Series = {
  id: string
  label?: string
  color: string
  points: SeriesPoint[]
}

export type LineChartProps = {
  width?: number
  height?: number
  padding?: { top: number; right: number; bottom: number; left: number }
  yDomain?: [number, number]
  xTicks?: number
  yTicks?: number
  series: Series[]
  xLabelFormatter?: (x: number) => string
  yLabelFormatter?: (y: number) => string
}

export function LineChart({
  width = 900,
  height = 360,
  padding = { top: 24, right: 24, bottom: 36, left: 48 },
  yDomain,
  xTicks = 6,
  yTicks = 5,
  series,
  xLabelFormatter = (x) => new Date(x).toLocaleDateString(),
  yLabelFormatter = (y) => `${y}%`,
}: LineChartProps) {
  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    let xs: number[] = []
    let ys: number[] = []
    for (const s of series) {
      xs.push(...s.points.map((p) => p.x))
      ys.push(...s.points.map((p) => p.y))
    }
    const xMin = Math.min(...xs)
    const xMax = Math.max(...xs)
    const [yyMin, yyMax] = yDomain ?? [Math.min(...ys), Math.max(...ys)]
    return { xMin, xMax, yMin: yyMin, yMax: yyMax }
  }, [series, yDomain])

  const W = width
  const H = height
  const innerW = W - padding.left - padding.right
  const innerH = H - padding.top - padding.bottom

  const xScale = (x: number) =>
    padding.left + ((x - xMin) / Math.max(1, xMax - xMin)) * innerW
  const yScale = (y: number) =>
    padding.top + (1 - (y - yMin) / Math.max(1, yMax - yMin)) * innerH

  const buildPath = (pts: SeriesPoint[]) => {
    if (!pts.length) return ""
    const d = pts
      .sort((a, b) => a.x - b.x)
      .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.x)},${yScale(p.y)}`)
      .join(" ")
    return d
  }

  const xTickValues = useMemo(() => {
    if (xMax === xMin) return [xMin]
    const step = (xMax - xMin) / Math.max(1, xTicks - 1)
    return Array.from({ length: xTicks }, (_, i) => Math.round(xMin + i * step))
  }, [xMin, xMax, xTicks])

  const yTickValues = useMemo(() => {
    const min = yMin
    const max = yMax
    const step = (max - min) / Math.max(1, yTicks - 1)
    return Array.from({ length: yTicks }, (_, i) => min + i * step)
  }, [yMin, yMax, yTicks])

  const [hover, setHover] = useState<null | { x: number; y: number; text: string }>(null)

  return (
    <svg width={W} height={H} role="img" aria-label="Passing rate over time">
      <rect x={0} y={0} width={W} height={H} fill="transparent" />
      {/* Axes */}
      <g>
        {/* Y grid + labels */}
        {yTickValues.map((v, i) => {
          const y = yScale(v)
          return (
            <g key={`y-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={W - padding.right}
                y2={y}
                stroke="#e5e7eb"
                opacity={0.5}
              />
              <text
                x={padding.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={12}
                fill="#6b7280"
              >
                {yLabelFormatter(Number(v.toFixed(0)))}
              </text>
            </g>
          )
        })}
        {/* X ticks + labels */}
        {xTickValues.map((v, i) => {
          const x = xScale(v)
          return (
            <g key={`x-${i}`}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={H - padding.bottom}
                stroke="#f3f4f6"
              />
              <text
                x={x}
                y={H - padding.bottom + 18}
                textAnchor="middle"
                dominantBaseline="hanging"
                fontSize={12}
                fill="#6b7280"
              >
                {xLabelFormatter(v)}
              </text>
            </g>
          )
        })}
      </g>

      {/* Series lines */}
      {series.map((s) => (
        <g key={s.id}>
          <path d={buildPath(s.points)} fill="none" stroke={s.color} strokeWidth={2} />
          {s.points.map((p, i) => (
            <g key={i}>
              <circle
                cx={xScale(p.x)}
                cy={yScale(p.y)}
                r={4}
                fill={s.color}
                onMouseEnter={() =>
                  setHover({
                    x: xScale(p.x),
                    y: yScale(p.y),
                    text: `${s.label ?? s.id} | ${xLabelFormatter(p.x)} | ${yLabelFormatter(p.y)}${p.runKey ? `\n${p.runKey}` : ""}`,
                  })
                }
                onMouseLeave={() => setHover(null)}
              >
                <title>
                  {(s.label ?? s.id) + " | " + xLabelFormatter(p.x) + " | " + yLabelFormatter(p.y) + (p.runKey ? `\n${p.runKey}` : "")}
                </title>
              </circle>
            </g>
          ))}
        </g>
      ))}

      {/* Legend */}
      <g transform={`translate(${padding.left}, ${padding.top - 8})`}>
        {series.map((s, i) => (
          <g key={s.id} transform={`translate(${i * 160}, 0)`}>
            <rect x={0} y={-12} width={12} height={12} fill={s.color} rx={2} />
            <text x={18} y={-6} dominantBaseline="hanging" fontSize={12} fill="#374151">
              {s.label ?? s.id}
            </text>
          </g>
        ))}
      </g>

      {/* Tooltip */}
      {hover && (
        <g transform={`translate(${hover.x + 8}, ${hover.y - 8})`}>
          <rect x={0} y={-28} rx={4} ry={4} width={220} height={28} fill="#111827" opacity={0.9} />
          <text x={8} y={-10} fontSize={11} fill="#f9fafb">
            {hover.text}
          </text>
        </g>
      )}
    </svg>
  )
}
