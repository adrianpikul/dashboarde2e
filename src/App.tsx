import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { LineChart, type Series } from "./components/charts/LineChart"
import { StackedBar } from "./components/charts/StackedBar"
import { TestStatusTable } from "./components/TestStatusTable"
import { extractPassingSeries, formatDay, getRunsByKind, extractTestMatrix, type TestKind } from "./lib/data"
import { buildMatrixCsv, downloadCsv } from "./lib/export"
import type { TestReportDto } from "./testReportDto"
import { sampleReport } from "./mock/testReport.sample"
import { useMemo, useState } from "react"

const COLORS = {
  smokeTests: "#16a34a",
  uiUatTests: "#2563eb",
  pricingOverride: "#f59e0b",
}

function usePassingSeries(report: TestReportDto) {
  return useMemo(() => {
    const byKind = extractPassingSeries(report)
    const series: Series[] = [
      {
        id: "smokeTests",
        label: "Smoke",
        color: COLORS.smokeTests,
        points: byKind.smokeTests.map((p) => ({ x: p.start, y: p.passPercent, runKey: p.runKey })),
      },
      {
        id: "uiUatTests",
        label: "UI UAT",
        color: COLORS.uiUatTests,
        points: byKind.uiUatTests.map((p) => ({ x: p.start, y: p.passPercent, runKey: p.runKey })),
      },
      {
        id: "pricingOverride",
        label: "Pricing Override",
        color: COLORS.pricingOverride,
        points: byKind.pricingOverride.map((p) => ({ x: p.start, y: p.passPercent, runKey: p.runKey })),
      },
    ]
    return series
  }, [report])
}

function App() {
  const [data] = useState<TestReportDto>(sampleReport)
  const series = usePassingSeries(data)
  const runsByKind = useMemo(() => getRunsByKind(data), [data])
  const matrixByKind = useMemo(() => extractTestMatrix(data), [data])

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["smokeTests", "uiUatTests", "pricingOverride"] as TestKind[]).map((k) => {
          const runs = runsByKind[k]
          const last = runs[runs.length - 1]
          const color = k === "smokeTests" ? "text-emerald-600" : k === "uiUatTests" ? "text-blue-600" : "text-amber-600"
          const label = k === "smokeTests" ? "Smoke" : k === "uiUatTests" ? "UI UAT" : "Pricing Override"
          return (
            <Card key={`stat-${k}`}>
              <CardHeader className="pb-2">
                <CardDescription>{label} pass rate</CardDescription>
                <CardTitle className={`text-3xl ${color}`}>{last ? `${last.passPercent}%` : "-"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-slate-500">{last ? `From ${last.passes}/${last.total} tests` : "No runs yet"}</CardContent>
            </Card>
          )
        })}
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-2xl">E2E Quality Dashboard</CardTitle>
            <CardDescription>Trends, stability by suite, and per-test pass history</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <LineChart
              width={1100}
              height={380}
              yDomain={[0, 100]}
              series={series}
              xLabelFormatter={(x) => formatDay(x)}
              yLabelFormatter={(y) => `${y}%`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-suite type details */}
      <div className="grid grid-cols-1 gap-6">
        {(["smokeTests", "uiUatTests", "pricingOverride"] as TestKind[]).map((kind) => {
          const runs = runsByKind[kind]
          const matrix = matrixByKind[kind]
          const title =
            kind === "smokeTests" ? "Smoke Tests" : kind === "uiUatTests" ? "UI UAT Tests" : "Pricing Override"
          const latest = runs[runs.length - 1]
          return (
            <Card key={kind}>
              <CardHeader>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                      {runs.length} runs • Latest: {runs.length ? formatDay(latest.start) : "-"}
                      {runs.length ? ` • ${latest.passes}/${latest.total} passed (${latest.passPercent}%)` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex items-center rounded-md bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-700"
                      onClick={() => {
                        const csv = buildMatrixCsv(title, runs, matrix)
                        const ts = runs.length ? new Date(runs[runs.length - 1].start).toISOString().slice(0, 19).replace(/[:T]/g, "-") : ""
                        downloadCsv(`${title.replace(/\s+/g, "_")}-${ts}.csv`, csv)
                      }}
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <StackedBar
                    width={1100}
                    height={200}
                    data={runs.map((r) => ({
                      key: r.key,
                      start: r.start,
                      total: r.total,
                      passed: r.passes,
                      failed: r.fails,
                    }))}
                    xLabel={(d) => new Date(d.start).toLocaleDateString()}
                  />
                </div>

                <TestStatusTable title={`${title} — Test Results by Run`} runs={runs} matrix={matrix} />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default App
