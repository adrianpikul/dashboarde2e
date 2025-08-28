import { useMemo } from "react"
import type { RunInfo, TestMatrix } from "../lib/data"

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
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-md overflow-hidden text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap">{title}</th>
            {headers.map((r) => (
              <th
                key={r.key}
                className="px-2 py-2 text-xs font-medium text-slate-500 text-center whitespace-nowrap"
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
              </th>
            ))}
            <th className="px-3 py-2 text-right font-semibold text-slate-700">Pass Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.testTitle} className="border-t border-gray-200">
              <td className="px-3 py-2 text-slate-800 whitespace-nowrap font-medium sticky left-0 bg-white">
                {row.testTitle}
              </td>
              {row.cells.map((p, i) => (
                <td key={i} className="px-2 py-2 text-center">
                  {p === undefined ? (
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">—</span>
                  ) : p ? (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 px-2 py-0.5 text-xs">pass</span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 px-2 py-0.5 text-xs">fail</span>
                  )}
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                <span
                  className={
                    "font-medium " + (row.passRate > 90 ? "text-emerald-600" : row.passRate > 70 ? "text-amber-600" : "text-red-600")
                  }
                >
                  {row.passRate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
