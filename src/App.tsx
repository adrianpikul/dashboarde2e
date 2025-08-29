import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import Component from "./components/chart-line-multiple"
import { TestStatusTable } from "./components/TestStatusTable"
import { ThemeToggle } from "./components/ThemeToggle"
import { extractPassingSeries, formatDay, getRunsByKind, extractTestMatrix, type TestKind, type TestMatrix } from "./lib/data"
import { buildMatrixCsv, downloadCsv } from "./lib/export"
import type { TestReportDto } from "./testReportDto"
import { fetchSampleReport } from "./mock/testReport.sample"
import { useEffect, useMemo, useState } from "react"
import { Button } from "./components/ui/button"

const CHART_CONFIG = {
  smokeTests: { label: "Smoke", color: "hsl(var(--chart-2))" },
  uiUatTests: { label: "UI UAT", color: "hsl(var(--chart-3))" },
  pricingOverride: { label: "Pricing Override", color: "hsl(var(--chart-4))" },
}

const SUITE_COLORS: Record<"smokeTests" | "uiUatTests" | "pricingOverride", string> = {
  smokeTests: "#10b981", // matches top chart fallback order
  uiUatTests: "#3b82f6",
  pricingOverride: "#f59e0b",
}

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
            height={380}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["smokeTests", "uiUatTests", "pricingOverride"] as TestKind[]).map((k) => {
          const runs = runsByKind[k]
          const last = runs[runs.length - 1]
          const color = k === "smokeTests" ? "text-emerald-600" : k === "uiUatTests" ? "text-blue-600" : "text-amber-600"
          const label = k === "smokeTests" ? "Smoke" : k === "uiUatTests" ? "UI UAT" : "Pricing Override"
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
              </CardContent>
            </Card>
          )
        })}
      </div>


      {/* Per-suite type details */}
      <div className="grid grid-cols-1 gap-6">
        {(["smokeTests", "uiUatTests", "pricingOverride"] as TestKind[]).map((kind) => {
          const runs = runsByKind[kind]
          const matrix = matrixByKind[kind]
          const filteredMatrix: TestMatrix = matrix
          const title = kind === "smokeTests" ? "Smoke Tests" : kind === "uiUatTests" ? "UI UAT Tests" : "Pricing Override"
          const latest = runs[runs.length - 1]
          return (
            <Card key={kind}>
              <CardHeader>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                      {runs.length} runs. Latest: {runs.length ? formatDay(latest.start) : "-"}
                      {runs.length ? ` ${latest.passes}/${latest.total} passed (${latest.passPercent}%)` : ""}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <TestStatusTable
                  title={`Test name`}
                  runs={runs}
                  matrix={filteredMatrix}
                  suiteId={kind}
                  lineColor={SUITE_COLORS[kind]}
                  actions={
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          const csv = buildMatrixCsv(title, runs, matrix)
                          const ts = runs.length
                            ? new Date(runs[runs.length - 1].start).toISOString().slice(0, 19).replace(/[:T]/g, "-")
                            : ""
                          downloadCsv(`${title.replace(/\s+/g, "_")}-${ts}.csv`, csv)
                        }}
                      >
                        Export CSV
                      </Button>
                    </>
                  }
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default App









