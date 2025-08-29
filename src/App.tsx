import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import Component from "./components/chart-line-multiple"
// import { TestStatusTable } from "./components/TestStatusTable"
import { SuiteSection } from "./components/SuiteSection"
import { SUITE_COLORS } from "./lib/constants"
import { ThemeToggle } from "./components/ThemeToggle"
import { extractPassingSeries, formatDay, getRunsByKind, extractTestMatrix, type TestKind } from "./lib/data"
import type { TestReportDto } from "./testReportDto"
import { fetchSampleReport } from "./mock/testReport.sample"
import { useEffect, useMemo, useState } from "react"

const CHART_CONFIG = {
  smokeTests: { label: "Smoke", color: SUITE_COLORS.smokeTests },
  uiUatTests: { label: "UI UAT", color: SUITE_COLORS.uiUatTests },
  pricingOverride: { label: "Pricing Override", color: SUITE_COLORS.pricingOverride },
}

// colors moved to lib/constants

const EMPTY_REPORT: TestReportDto = { smokeTests: {}, uiUatTests: {}, pricingOverride: {} }

function getChartData(report: TestReportDto) {
  const byKind = extractPassingSeries(report)
  // Collect all unique run dates
  const allDates = Array.from(new Set([
    ...byKind.smokeTests.map((p) => p.start),
    ...byKind.uiUatTests.map((p) => p.start),
    ...byKind.pricingOverride.map((p) => p.start),
  ])).sort((a, b) => a - b)
  // Build data points for each date
  return allDates.map((date) => {
    const smoke = byKind.smokeTests.find((p) => p.start === date)
    const uat = byKind.uiUatTests.find((p) => p.start === date)
    const pricing = byKind.pricingOverride.find((p) => p.start === date)
    return {
      date,
      smokeTests: smoke?.passPercent ?? null,
      uiUatTests: uat?.passPercent ?? null,
      pricingOverride: pricing?.passPercent ?? null,
    }
  })
}

function getDurationChartData(report: TestReportDto) {
  const kinds: (keyof TestReportDto)[] = ["smokeTests", "uiUatTests", "pricingOverride"]
  const allDatesSet = new Set<number>()
  const byKind: Record<string, Record<number, number>> = {
    smokeTests: {},
    uiUatTests: {},
    pricingOverride: {},
  }
  for (const k of kinds) {
    const group = report[k]
    for (const key of Object.keys(group)) {
      const r = group[key]
      const start = Date.parse(r.stats.start)
      if (!isFinite(start)) continue
      allDatesSet.add(start)
      // Prefer summing test durations (ms) for variation; fallback to stats.duration (sec)
      let totalMs = 0
      try {
        for (const res of r.results as any[]) {
          for (const t of res.tests as any[]) {
            // durations in ms in sample mock
            totalMs += Number(t.duration) || 0
          }
        }
      } catch { }
      let minutes = totalMs > 0 ? totalMs / 60000 : (Number(r.stats.duration) || 0) / 60
      byKind[k][start] = minutes
    }
  }
  const allDates = Array.from(allDatesSet).sort((a, b) => a - b)
  return allDates.map((date) => ({
    date,
    smokeTests: byKind.smokeTests[date] ?? null,
    uiUatTests: byKind.uiUatTests[date] ?? null,
    pricingOverride: byKind.pricingOverride[date] ?? null,
  }))
}

function App() {
  const [data, setData] = useState<TestReportDto | null>(null)
  useEffect(() => {
    let mounted = true
    fetchSampleReport().then((r) => {
      if (mounted) setData(r)
    })
    return () => { mounted = false }
  }, [])
  const report = data ?? EMPTY_REPORT
  const chartData = getChartData(report)
  const durationChartData = getDurationChartData(report)
  const runsByKind = useMemo(() => getRunsByKind(report), [report])
  const matrixByKind = useMemo(() => extractTestMatrix(report), [report])
  // Removed per-suite latest-fail filter; covered by table quick filters

  if (!data) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-slate-300 border-t-slate-500" />
          <div className="text-sm">Loading test report…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">E2E Quality Dashboard</CardTitle>
              <CardDescription>Trends, stability by suite, and per-test pass history</CardDescription>
            </div>
            <ThemeToggle />
          </div>
        </CardHeader>
        <CardContent>
          <Component
            data={chartData}
            config={CHART_CONFIG}
            xKey="date"
            yDomain={[0, 100]}
            xLabelFormatter={formatDay}
            xTickSplitFormatter={(x) => {
              const d = new Date(x)
              const day = `${d.toLocaleString(undefined, { day: '2-digit' })} ${d.toLocaleString(undefined, { month: 'short' })}`
              const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
              return [day, time]
            }}
            height={250}
          />
        </CardContent>
        <CardContent>
          <CardDescription className="pb-5">Tests duration</CardDescription>
          <Component
            data={durationChartData}
            config={CHART_CONFIG}
            xKey="date"
            xLabelFormatter={formatDay}
            xTickSplitFormatter={(x) => {
              const d = new Date(x)
              const day = `${d.toLocaleString(undefined, { day: '2-digit' })} ${d.toLocaleString(undefined, { month: 'short' })}`
              const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
              return [day, time]
            }}
            // slightly smaller height, full width via container
            height={220}
            yTickFormatter={(y) => {
              if (y == null) return ''
              const totalMin = Math.max(0, Number(y))
              const h = Math.floor(totalMin / 60)
              const m = Math.round(totalMin % 60)
              if (h > 0) return `${h}h ${m}m`
              return `${m}m`
            }}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["smokeTests", "uiUatTests", "pricingOverride"] as TestKind[]).map((k) => {
          const runs = runsByKind[k]
          const last = runs[runs.length - 1]
          const color = k === "smokeTests" ? "text-emerald-600" : k === "uiUatTests" ? "text-blue-600" : "text-amber-600"
          const label = k === "smokeTests" ? "Smoke" : k === "uiUatTests" ? "UI UAT" : "Pricing Override"
          const now = Date.now()
          const MS_PER_DAY = 24 * 60 * 60 * 1000
          const windowAvg = (days: number) => {
            const from = now - days * MS_PER_DAY
            let p = 0, t = 0, c = 0
            for (const r of runs) {
              if (r.start >= from) { p += r.passes; t += r.total; c++ }
            }
            const pct = t > 0 ? Math.round((p / t) * 100) : null
            return { pct, count: c }
          }
          const avg3 = windowAvg(3)
          const avg7 = windowAvg(7)
          const avg14 = windowAvg(14)
          const avg30 = windowAvg(30)
          const totals = runs.reduce(
            (acc, r) => {
              acc.passes += r.passes
              acc.total += r.total
              return acc
            },
            { passes: 0, total: 0 },
          )
          const overallPercent = totals.total > 0 ? Math.round((totals.passes / totals.total) * 100) : 0
          return (
            <Card key={`stat-${k}`}>
              <CardHeader className="pb-2">
                <CardDescription>{label} pass rate</CardDescription>
                <CardTitle className={`text-3xl ${color}`}>{last ? `${last.passPercent}%` : "-"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-slate-500 space-y-1">
                <div className="text-slate-400">{last ? `Tests date: ${formatDay(last.start)}` : "No runs yet"}</div>
                <div>{last ? `From ${last.passes}/${last.total} tests` : ""}</div>
                <div className="text-slate-500">{runs.length ? `Overall: ${overallPercent}% across ${runs.length} runs` : ""}</div>
                <div className="mt-2 space-y-0.5">
                  {avg3.pct !== null && <div>Last 3d: {avg3.pct}% ({avg3.count} runs)</div>}
                  {avg7.pct !== null && <div>Last 7d: {avg7.pct}% ({avg7.count} runs)</div>}
                  {avg14.pct !== null && <div>Last 14d: {avg14.pct}% ({avg14.count} runs)</div>}
                  {avg30.pct !== null && <div>Last 30d: {avg30.pct}% ({avg30.count} runs)</div>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>


      {/* Per-suite type details */}
      <div className="grid grid-cols-1 gap-6">
        {(["smokeTests", "uiUatTests", "pricingOverride"] as TestKind[]).map((kind) => (
          <SuiteSection key={kind} kind={kind} runs={runsByKind[kind]} matrix={matrixByKind[kind]} colorHex={SUITE_COLORS[kind]} />
        ))}
      </div>
    </div>
  )
}

export default App









