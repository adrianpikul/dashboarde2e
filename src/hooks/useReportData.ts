import { useEffect, useMemo, useState } from "react"
import type { TestReportDto } from "../testReportDto"
import { extractPassingSeries, extractTestMatrix, getRunsByKind } from "../lib/data"
import { fetchSampleReport } from "../mock/testReport.sample"

export function useReportData() {
  const [report, setReport] = useState<TestReportDto | null>(null)

  useEffect(() => {
    let mounted = true
    fetchSampleReport().then((r) => {
      if (mounted) setReport(r)
    })
    return () => { mounted = false }
  }, [])

  const runsByKind = useMemo(() => (report ? getRunsByKind(report) : null), [report])
  const matrixByKind = useMemo(() => (report ? extractTestMatrix(report) : null), [report])

  const chartData = useMemo(() => {
    if (!report) return [] as Array<any>
    const byKind = extractPassingSeries(report)
    const allDates = Array.from(new Set([
      ...byKind.smokeTests.map((p) => p.start),
      ...byKind.uiUatTests.map((p) => p.start),
      ...byKind.pricingOverride.map((p) => p.start),
    ])).sort((a, b) => a - b)
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
  }, [report])

  return {
    loading: !report,
    report,
    chartData,
    runsByKind,
    matrixByKind,
  }
}

