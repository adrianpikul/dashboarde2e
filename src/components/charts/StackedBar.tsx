import { useState } from "react"

export type StackedBarDatum = {
  key: string
  start: number
  total: number
  passed: number
  failed: number
}

export type StackedBarProps = {
  width?: number
  height?: number
  barWidth?: number
  gap?: number
  colorPassed?: string
  colorFailed?: string
  data: StackedBarDatum[]
  xLabel?: (d: StackedBarDatum) => string
}

export function StackedBar({
  width = 900,
  height = 180,
  barWidth = 22,
  gap = 10,
  colorPassed = "#16a34a",
  colorFailed = "#ef4444",
  data,
  xLabel = (d) => new Date(d.start).toLocaleDateString(),
}: StackedBarProps) {
  const W = width
  const H = height
  const pad = { top: 16, right: 16, bottom: 36, left: 40 }
  const innerH = H - pad.top - pad.bottom

  const xPos = (i: number) => pad.left + i * (barWidth + gap)

  const [hover, setHover] = useState<null | { x: number; y: number; text: string }>(null)

  return (
    <svg width={W} height={H} role="img" aria-label="Pass/fail per run">
      <rect x={0} y={0} width={W} height={H} fill="transparent" />
      {/* Y axis ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = pad.top + innerH - f * innerH
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#e5e7eb" />
            <text x={pad.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="#6b7280">
              {Math.round(f * 100)}%
            </text>
          </g>
        )
      })}

      {data.map((d, i) => {
        const x = xPos(i)
        const hPass = (d.passed / Math.max(1, d.total)) * innerH
        const hFail = (d.failed / Math.max(1, d.total)) * innerH
        const yFail = pad.top + innerH - hFail
        const yPass = yFail - hPass
        return (
          <g key={d.key}>
            {/* fail segment */}
            <rect
              x={x}
              y={yFail}
              width={barWidth}
              height={hFail}
              fill={colorFailed}
              rx={2}
              onMouseEnter={() => setHover({ x: x + barWidth, y: yFail, text: `${xLabel(d)}\n${d.key}\nFailed: ${d.failed}` })}
              onMouseLeave={() => setHover(null)}
            >
              <title>{`${xLabel(d)}\n${d.key}\nFailed: ${d.failed}`}</title>
            </rect>
            {/* pass segment */}
            <rect
              x={x}
              y={yPass}
              width={barWidth}
              height={hPass}
              fill={colorPassed}
              rx={2}
              onMouseEnter={() => setHover({ x: x + barWidth, y: yPass, text: `${xLabel(d)}\n${d.key}\nPassed: ${d.passed}` })}
              onMouseLeave={() => setHover(null)}
            >
              <title>{`${xLabel(d)}\n${d.key}\nPassed: ${d.passed}`}</title>
            </rect>
            {/* labels */}
            <text x={x + barWidth / 2} y={H - pad.bottom + 16} textAnchor="middle" fontSize={10} fill="#6b7280">
              {xLabel(d)}
            </text>
          </g>
        )
      })}

      {/* Tooltip */}
      {hover && (
        <g transform={`translate(${hover.x + 8}, ${hover.y - 8})`}>
          <rect x={0} y={-40} rx={4} ry={4} width={220} height={40} fill="#111827" opacity={0.9} />
          <text x={8} y={-24} fontSize={11} fill="#f9fafb">
            {hover.text.split("\n")[0]}
          </text>
          <text x={8} y={-12} fontSize={11} fill="#f9fafb">
            {hover.text.split("\n")[1]}
          </text>
          <text x={8} y={0} fontSize={11} fill="#f9fafb">
            {hover.text.split("\n")[2]}
          </text>
        </g>
      )}
    </svg>
  )
}
