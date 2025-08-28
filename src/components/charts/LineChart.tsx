import { useEffect, useMemo, useRef, useState } from "react"

type SeriesPoint = { x: number; y: number; label?: string; runKey?: string }
export type Series = {
  id: string
  label?: string
  color?: string
  // Tailwind classes per element to avoid accidental fill on lines
  strokeClass?: string // applied to line path
  dotClass?: string // applied to point circles (fill)
  legendClass?: string // applied to legend swatch (rect fill)
  points: SeriesPoint[]
}

export type LineChartProps = {
  width?: number // if omitted, fills container width
  height?: number
  padding?: { top: number; right: number; bottom: number; left: number }
  yDomain?: [number, number]
  xTicks?: number
  yTicks?: number
  series: Series[]
  xLabelFormatter?: (x: number) => string
  yLabelFormatter?: (y: number) => string
  className?: string
}

export function LineChart({
  width,
  height = 360,
  padding = { top: 24, right: 24, bottom: 36, left: 48 },
  yDomain,
  xTicks = 6,
  yTicks = 5,
  series,
  xLabelFormatter = (x) => new Date(x).toLocaleDateString(),
  yLabelFormatter = (y) => `${y}%`,
  className,
}: LineChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  
  useEffect(() => {
    if (width !== undefined) return
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.floor(e.contentRect.width)
        if (w && w !== containerWidth) setContainerWidth(w)
      }
    })
    ro.observe(el)
    // initial
    setContainerWidth(Math.floor(el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [width, containerWidth])

  // next-themes handles theme changes; no manual observer needed

  const W = width ?? containerWidth ?? 600
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
    <div ref={containerRef} className={"w-full " + (className ?? "")}> 
    <svg width={W} height={H} role="img" aria-label="Passing rate over time">
      <rect x={0} y={0} width={W} height={H} className="fill-transparent" />
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
                className="stroke-slate-200 dark:stroke-slate-600 opacity-50 dark:opacity-60"
              />
              <text
                x={padding.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={12}
                className="fill-slate-500 dark:fill-slate-300"
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
                className="stroke-slate-100 dark:stroke-slate-700"
              />
              <text
                x={x}
                y={H - padding.bottom + 18}
                textAnchor="middle"
                dominantBaseline="hanging"
                fontSize={12}
                className="fill-slate-500 dark:fill-slate-300"
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
          {s.strokeClass ? (
            <path d={buildPath(s.points)} fill="none" strokeWidth={2} className={s.strokeClass} />
          ) : (
            <path d={buildPath(s.points)} fill="none" stroke={s.color ?? '#16a34a'} strokeWidth={2} />
          )}
          {s.points.map((p, i) => (
            <g key={i}>
              <circle
                cx={xScale(p.x)}
                cy={yScale(p.y)}
                r={4}
                className={s.dotClass}
                fill={s.dotClass ? undefined : s.color}
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

      {/* Legend (center-aligned square + text) */}
      <g transform={`translate(${padding.left}, ${padding.top - 16})`}>
        {series.map((s, i) => (
          <g key={s.id} transform={`translate(${i * 160}, 0)`}>
            {/* center the rect vertically at y=0 */}
            {s.legendClass ? (
              <rect x={0} y={-6} width={12} height={12} className={s.legendClass} rx={2} />
            ) : (
              <rect x={0} y={-6} width={12} height={12} fill={s.color ?? '#16a34a'} rx={2} />
            )}
            <text x={18} y={0} dominantBaseline="middle" fontSize={12} className="fill-slate-700 dark:fill-slate-200">
              {s.label ?? s.id}
            </text>
          </g>
        ))}
      </g>

      {/* Tooltip */}
      {hover && (
        <g transform={`translate(${hover.x + 8}, ${hover.y - 8})`}>
          <rect x={0} y={-28} rx={4} ry={4} width={220} height={28} className="fill-slate-900 opacity-90" />
          <text x={8} y={-10} fontSize={11} className="fill-slate-50">
            {hover.text}
          </text>
        </g>
      )}
    </svg>
    </div>
  )
}
