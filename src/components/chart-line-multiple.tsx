"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

type Props = {
  data: any[]
  config: ChartConfig
  xKey: string
  yDomain?: [number, number]
  xLabelFormatter?: (x: number) => string
  height?: number
  // Optional two-line ticks: return [line1, line2]
  xTickSplitFormatter?: (x: number) => [string, string]
}

export default function Component({ data, config, xKey, yDomain, xLabelFormatter, height = 380, xTickSplitFormatter }: Props) {
  const seriesKeys = Object.keys(config)
  const fallbackPalette = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <ChartContainer config={config} style={{ height, width: "100%" }}>
      <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        {xTickSplitFormatter ? (
          <XAxis
            dataKey={xKey}
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
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value: number) => (xLabelFormatter ? xLabelFormatter(value) : new Date(value).toLocaleDateString())}
          />
        )}
        <YAxis domain={yDomain as any} width={32} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        {seriesKeys.map((key, idx) => {
          const c = config[key]
          const desired = (c as any)?.color as string | undefined
          const useFallback = !desired || /var\(/.test(desired)
          const stroke = useFallback ? fallbackPalette[idx % fallbackPalette.length] : desired
          return (
            <Line
              key={key}
              dataKey={key}
              type="monotone"
              stroke={stroke}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          )
        })}
      </LineChart>
    </ChartContainer>
  )
}
