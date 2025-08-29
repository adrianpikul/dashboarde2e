"use client"

import { CartesianGrid, Line, LineChart as RLineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "../ui/chart"

export type Point = { x: number; y: number | null; runKey?: string }
export type Series = {
  id: string
  label: string
  points: Point[]
}

type Props = {
  height?: number
  yDomain?: [number, number]
  series: Series[]
  xLabelFormatter?: (x: number) => string
  yLabelFormatter?: (y: number) => string
  // Optional per-series stroke override
  colors?: Record<string, string>
  // Optional tooltip formatters
  tooltipLabelFormatter?: (x: number) => React.ReactNode
  tooltipValueFormatter?: (value: number | null, seriesId: string, x: number) => React.ReactNode
  // Optional split tick renderer for X axis (two-line labels)
  xTickSplitFormatter?: (x: number) => [string, string]
}

export function LineChart({ height = 300, yDomain, series, xLabelFormatter, yLabelFormatter, colors, tooltipLabelFormatter, tooltipValueFormatter, xTickSplitFormatter }: Props) {
  // Build a merged data array keyed by x across all series
  const xSet = new Set<number>()
  for (const s of series) for (const p of s.points) if (p && typeof p.x === 'number') xSet.add(p.x)
  const xs = Array.from(xSet).sort((a, b) => a - b)

  const bySeries: Record<string, Map<number, number | null>> = {}
  for (const s of series) {
    const map = new Map<number, number | null>()
    for (const p of s.points) map.set(p.x, p.y)
    bySeries[s.id] = map
  }

  const data = xs.map((x) => {
    const row: any = { x }
    for (const s of series) row[s.id] = bySeries[s.id].get(x) ?? null
    return row
  })

  // Build chart config with explicit hex colors to ensure strokes render
  const palette = ["#10b981", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"]
  const configEntries = series.map((s, i) => [s.id, { label: s.label, color: colors?.[s.id] ?? palette[i % palette.length] }]) as [string, { label: string; color: string }][]
  const config: ChartConfig = Object.fromEntries(configEntries)

  return (
    <ChartContainer style={{ height, width: "100%" }} config={config}>
      <RLineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        {xTickSplitFormatter ? (
          <XAxis
            dataKey="x"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={(props: any) => {
              const { x, y, payload } = props
              const [l1, l2] = xTickSplitFormatter(Number(payload.value))
              return (
                <text x={x} y={y} textAnchor="end" dy={16} className="fill-current">
                  <tspan x={x} dy={0}>{l1}</tspan>
                  <tspan x={x} dy={14}>{l2}</tspan>
                </text>
              )
            }}
          />
        ) : (
          <XAxis
            dataKey="x"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => (xLabelFormatter ? xLabelFormatter(v) : new Date(v).toLocaleDateString())}
          />
        )}
        <YAxis
          domain={yDomain as any}
          tickFormatter={(v: number) => (yLabelFormatter ? yLabelFormatter(v) : String(v))}
          width={32}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={tooltipLabelFormatter ? ((_, payload) => {
                const x = payload?.[0]?.payload?.x as number
                return tooltipLabelFormatter(x)
              }) : undefined}
              formatter={tooltipValueFormatter ? ((value: any, _name: any, item: any) => {
                const x = item?.payload?.x as number
                const seriesId = String(item?.dataKey || item?.name)
                return tooltipValueFormatter(value as number, seriesId, x)
              }) : undefined}
            />
          }
        />
        {series.map((s, i) => {
          const stroke = colors?.[s.id] ?? ((config[s.id] as any)?.color as string | undefined) ?? palette[i % palette.length]
          return (
            <Line key={s.id} type="monotone" dataKey={s.id} stroke={stroke} strokeWidth={2} dot={false} connectNulls />
          )
        })}
      </RLineChart>
    </ChartContainer>
  )
}
