import type { RunInfo, TestMatrix } from "./data"

export function buildMatrixCsv(suiteTitle: string, runs: RunInfo[], matrix: TestMatrix): string {
  const header = [suiteTitle, ...runs.map((r) => new Date(r.start).toISOString())]
  const lines = [header.join(",")]
  const tests = Object.keys(matrix).sort()
  for (const t of tests) {
    const statuses = matrix[t]
    const byRun: Record<string, boolean | undefined> = {}
    for (const s of statuses) byRun[s.runKey] = s.pass
    const row = [escapeCsv(t), ...runs.map((r) => (byRun[r.key] === undefined ? "" : byRun[r.key] ? "pass" : "fail"))]
    lines.push(row.join(","))
  }
  return lines.join("\n")
}

function escapeCsv(v: string): string {
  if (v.includes(",") || v.includes("\n") || v.includes('"')) {
    return '"' + v.replace(/"/g, '""') + '"'
  }
  return v
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

