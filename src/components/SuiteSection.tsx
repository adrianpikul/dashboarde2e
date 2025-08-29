import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import type { RunInfo, TestMatrix, TestKind } from "../lib/data"
import { formatDay } from "../lib/data"
import { TestStatusTable } from "./TestStatusTable"
import { Button } from "./ui/button"
import { buildMatrixCsv, downloadCsv } from "../lib/export"

export type SuiteSectionProps = {
  kind: TestKind
  runs: RunInfo[]
  matrix: TestMatrix
  colorHex: string
}

export function SuiteSection({ kind, runs, matrix, colorHex }: SuiteSectionProps) {
  const title = kind === "smokeTests" ? "Smoke Tests" : kind === "uiUatTests" ? "UI UAT Tests" : "Pricing Override"
  const latest = runs[runs.length - 1]
  const filteredMatrix = matrix

  return (
    <Card>
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
          lineColor={colorHex}
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
}

