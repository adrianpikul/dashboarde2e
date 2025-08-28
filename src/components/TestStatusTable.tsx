import { useMemo } from "react"
import type { RunInfo, TestMatrix } from "../lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

export type TestStatusTableProps = {
  title: string
  runs: RunInfo[]
  matrix: TestMatrix
}

export function TestStatusTable({ title, runs, matrix }: TestStatusTableProps) {
  const headers = runs
  const rows = useMemo(() => {
    return Object.keys(matrix)
      .sort()
      .map((testTitle) => {
        const statuses = matrix[testTitle]
        const byRun: Record<string, boolean | undefined> = {}
        for (const s of statuses) byRun[s.runKey] = s.pass
        const total = headers.length
        let passed = 0
        const cells = headers.map((r) => {
          const p = byRun[r.key]
          if (p) passed++
          return p
        })
        const passRate = Math.round((passed / Math.max(1, total)) * 100)
        return { testTitle, cells, passRate }
      })
  }, [matrix, headers])

  return (
    <div className="overflow-x-auto border rounded-md bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-gray-50 dark:bg-neutral-900/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/60">
          <TableRow>
            <TableHead className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-64">
              {title}
            </TableHead>
            {headers.map((r) => (
              <TableHead
                key={r.key}
                className="px-2 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 text-center whitespace-nowrap"
                title={r.key}
              >
                {new Date(r.start).toLocaleString(undefined, {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </TableHead>
            ))}
            <TableHead className="px-3 py-2 text-right font-semibold text-slate-700">Pass Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.testTitle}>
              <TableCell className="px-3 py-2 text-slate-800 dark:text-slate-100 whitespace-nowrap font-medium sticky left-0 bg-white dark:bg-neutral-900">
                {row.testTitle}
              </TableCell>
              {row.cells.map((p, i) => (
                <TableCell key={i} className="px-2 py-2 text-center">
                  {p === undefined ? (
                    <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 ring-1 ring-inset ring-gray-300/50 dark:ring-neutral-700/50 px-2 py-0.5 text-xs">—</span>
                  ) : p ? (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-700/40 px-2 py-0.5 text-xs">pass</span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-600/20 dark:ring-red-700/40 px-2 py-0.5 text-xs">fail</span>
                  )}
                </TableCell>
              ))}
              <TableCell className="px-3 py-2 text-right">
                <span
                  className={
                    "font-medium " + (row.passRate > 90 ? "text-emerald-600" : row.passRate > 70 ? "text-amber-600" : "text-red-600")
                  }
                >
                  {row.passRate}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
