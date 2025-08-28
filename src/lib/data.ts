import type { TestReportDto } from "../testReportDto"

export type TestKind = "smokeTests" | "uiUatTests" | "pricingOverride"

export type PassingPoint = {
  kind: TestKind
  runKey: string
  start: number // epoch ms
  passPercent: number // 0-100
}

export function extractPassingSeries(report: TestReportDto): Record<TestKind, PassingPoint[]> {
  const kinds: TestKind[] = ["smokeTests", "uiUatTests", "pricingOverride"]
  const out: Record<TestKind, PassingPoint[]> = {
    smokeTests: [],
    uiUatTests: [],
    pricingOverride: [],
  }
  for (const k of kinds) {
    const group = report[k]
    for (const key of Object.keys(group)) {
      const item = group[key]
      const startMs = Date.parse(item.stats.start)
      if (!isFinite(startMs)) continue
      out[k].push({ kind: k, runKey: key, start: startMs, passPercent: item.stats.passPercent })
    }
    out[k].sort((a, b) => a.start - b.start)
  }
  return out
}

export function formatDay(x: number): string {
  const d = new Date(x)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export type RunInfo = {
  key: string
  start: number
  total: number
  passes: number
  fails: number
  passPercent: number
}

export function getRunsByKind(report: TestReportDto): Record<TestKind, RunInfo[]> {
  const kinds: TestKind[] = ["smokeTests", "uiUatTests", "pricingOverride"]
  const out: Record<TestKind, RunInfo[]> = {
    smokeTests: [],
    uiUatTests: [],
    pricingOverride: [],
  }
  for (const k of kinds) {
    const group = report[k]
    const runs: RunInfo[] = Object.keys(group).map((key) => {
      const r = group[key]
      return {
        key,
        start: Date.parse(r.stats.start),
        total: r.stats.tests,
        passes: r.stats.passes,
        fails: Math.max(0, r.stats.tests - r.stats.passes),
        passPercent: r.stats.passPercent,
      }
    })
    runs.sort((a, b) => a.start - b.start)
    out[k] = runs
  }
  return out
}

export type TestRunStatus = { runKey: string; start: number; pass: boolean }
export type TestMatrix = Record<string, TestRunStatus[]>

export function extractTestMatrix(report: TestReportDto): Record<TestKind, TestMatrix> {
  const kinds: TestKind[] = ["smokeTests", "uiUatTests", "pricingOverride"]
  const out: Record<TestKind, TestMatrix> = {
    smokeTests: {},
    uiUatTests: {},
    pricingOverride: {},
  }
  for (const k of kinds) {
    const group = report[k]
    const matrix: TestMatrix = {}
    for (const runKey of Object.keys(group)) {
      const r = group[runKey]
      const start = Date.parse(r.stats.start)
      for (const res of r.results) {
        for (const t of res.tests) {
          const arr = (matrix[t.title] ??= [])
          arr.push({ runKey, start, pass: !!t.pass })
        }
      }
    }
    // sort each test's statuses by start time
    for (const title of Object.keys(matrix)) {
      matrix[title].sort((a, b) => a.start - b.start)
    }
    out[k] = matrix
  }
  return out
}
