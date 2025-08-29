import { useMemo, useState, useEffect, useRef, type ReactNode } from "react"
import type { RunInfo, TestMatrix } from "../lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { formatDay } from "../lib/data"
import { LineChart, type Series } from "./charts/LineChart"

export type TestStatusTableProps = {
  title: string
  runs: RunInfo[]
  matrix: TestMatrix
  actions?: ReactNode
  suiteId?: "smokeTests" | "uiUatTests" | "pricingOverride"
  lineColor?: string
}

export function TestStatusTable({ title, runs, matrix, actions, suiteId = "smokeTests", lineColor }: TestStatusTableProps) {
  const [filter, setFilter] = useState("")
  const [sortMode, setSortMode] = useState<"none" | "asc" | "desc">("none")
  const [showFlakyOnly, setShowFlakyOnly] = useState(false)
  const [showLatestFailures, setShowLatestFailures] = useState(false)
  const [showNewFailures, setShowNewFailures] = useState(false)
  const [showRecovered, setShowRecovered] = useState(false)
  const [fromDate, setFromDate] = useState("") // YYYY-MM-DD
  const [toDate, setToDate] = useState("") // YYYY-MM-DD
  const [showDateMenu, setShowDateMenu] = useState(false)
  const dateMenuRef = useRef<HTMLDivElement | null>(null)
  const dateButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!showDateMenu) return
    const onDown = (e: MouseEvent) => {
      const menuEl = dateMenuRef.current
      const btnEl = dateButtonRef.current
      const target = e.target as Node | null
      if (!menuEl || !target) return
      if (menuEl.contains(target)) return
      if (btnEl && btnEl.contains(target)) return
      setShowDateMenu(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowDateMenu(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [showDateMenu])

  // newest first for display
  const headers = useMemo(() => [...runs].sort((a, b) => b.start - a.start), [runs])
  const filteredHeaders = useMemo(() => {
    const fromTs = fromDate ? new Date(fromDate).getTime() : -Infinity
    const toTs = toDate ? new Date(toDate + "T23:59:59.999").getTime() : Infinity
    return headers.filter((h) => h.start >= fromTs && h.start <= toTs)
  }, [headers, fromDate, toDate])

  const rows = useMemo(() => {
    return Object.keys(matrix)
      .sort()
      .map((testTitle) => {
        const statuses = matrix[testTitle]
        const byRun: Record<string, boolean | undefined> = {}
        for (const s of statuses) byRun[s.runKey] = s.pass
        const total = filteredHeaders.length
        let passed = 0
        const cells = filteredHeaders.map((r) => {
          const p = byRun[r.key]
          if (p === true) passed++
          return p
        })
        const passRate = Math.round((passed / Math.max(1, total)) * 100)
        // Improved flaky detection: detect flips across consecutive runs.
        // Build chronological sequence for the filtered range and check for any adjacent flip.
        const chronological = [...filteredHeaders]
          .sort((a, b) => a.start - b.start)
          .map((r) => byRun[r.key])
          .filter((v) => v !== undefined) as boolean[]
        let hasFlip = false
        for (let i = 0; i < chronological.length - 1; i++) {
          if (chronological[i] !== chronological[i + 1]) { hasFlip = true; break }
        }
        const isFlaky = hasFlip
        // Latest/new/recovered flags
        const latest = chronological.length ? chronological[chronological.length - 1] : undefined
        const prev = chronological.length > 1 ? chronological[chronological.length - 2] : undefined
        const latestFail = latest === false
        const newFailure = latest === false && prev === true
        const recovered = latest === true && prev === false
        return { testTitle, cells, passRate, isFlaky, history: chronological, latestFail, newFailure, recovered }
      })
  }, [matrix, filteredHeaders])

  const displayRows = useMemo(() => {
    let list = !filter.trim()
      ? rows.slice()
      : rows.filter((r) => r.testTitle.toLowerCase().includes(filter.trim().toLowerCase()))
    if (showFlakyOnly) list = list.filter((r) => r.isFlaky)
    if (showLatestFailures) list = list.filter((r) => r.latestFail)
    if (showNewFailures) list = list.filter((r) => r.newFailure)
    if (showRecovered) list = list.filter((r) => r.recovered)
    if (sortMode === "asc") list.sort((a, b) => a.passRate - b.passRate)
    if (sortMode === "desc") list.sort((a, b) => b.passRate - a.passRate)
    return list
  }, [rows, filter, sortMode, showFlakyOnly, showLatestFailures, showNewFailures, showRecovered])

  // Suite trend series (matches the top chart behavior but for this suite only)
  const suiteSeries: Series[] = useMemo(() => {
    const allowed = new Set(filteredHeaders.map((h) => h.key))
    const pts = runs
      .filter((r) => allowed.has(r.key))
      .sort((a, b) => a.start - b.start)
      .map((r) => ({ x: r.start, y: r.passPercent, runKey: r.key }))
    return [{ id: suiteId, label: title, points: pts }]
  }, [runs, filteredHeaders, title, suiteId])

  return (
    <div className="overflow-x-auto border rounded-md bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-2 p-2 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tests…"
            className="w-64 px-3 py-1.5 text-sm rounded-md bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            className="px-2 py-1.5 text-sm rounded-md bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-slate-700 dark:text-slate-200 focus:outline-none"
            title="Sort by pass rate"
          >
            <option value="none">No Sort</option>
            <option value="asc">Pass Rate Asc</option>
            <option value="desc">Pass Rate Desc</option>
          </select>
          <div className="relative">
            <button
              ref={dateButtonRef}
              onClick={() => setShowDateMenu((v) => !v)}
              className="px-2 py-1.5 text-sm rounded-md bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
              title="Filter by date range"
            >
              Date Range
            </button>
            {showDateMenu && (
              <div ref={dateMenuRef} className="absolute z-20 mt-1 w-80 p-3 rounded-md border bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 shadow-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    title="From date"
                    className="flex-1 px-2 py-1.5 text-sm rounded-md bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    title="To date"
                    className="flex-1 px-2 py-1.5 text-sm rounded-md bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => { setFromDate(""); setToDate("") }}
                    className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-neutral-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowDateMenu(false)}
                    className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-neutral-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowFlakyOnly((v) => !v)}
            className={
              "px-2 py-1.5 text-sm rounded-md border " +
              (showFlakyOnly
                ? "border-amber-600 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20"
                : "bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-neutral-800")
            }
            title="Show only flaky tests"
          >
            Flaky Only
          </button>
          {/* Quick filter chips */}
          <button
            onClick={() => setShowLatestFailures((v) => !v)}
            className={
              "px-2 py-1.5 text-sm rounded-md border " +
              (showLatestFailures
                ? "border-red-600 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20"
                : "bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-neutral-800")
            }
            title="Show tests failing in the latest run"
          >
            Latest Failures
          </button>
          <button
            onClick={() => setShowNewFailures((v) => !v)}
            className={
              "px-2 py-1.5 text-sm rounded-md border " +
              (showNewFailures
                ? "border-amber-600 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20"
                : "bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-neutral-800")
            }
            title="Show tests that flipped from pass to fail"
          >
            New Failures
          </button>
          <button
            onClick={() => setShowRecovered((v) => !v)}
            className={
              "px-2 py-1.5 text-sm rounded-md border " +
              (showRecovered
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                : "bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-neutral-800")
            }
            title="Show tests that recovered from a failure in the last run"
          >
            Recovered
          </button>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
          {suiteSeries[0].points.length > 0 && (
            <div className="px-2 pt-2">
          <LineChart
            height={160}
            yDomain={[0, 100]}
            series={suiteSeries}
            colors={lineColor ? { [suiteId]: lineColor } : undefined}
            xLabelFormatter={(x) => formatDay(x)}
            yLabelFormatter={(y) => `${y}%`}
            tooltipLabelFormatter={(x) => {
              const d = new Date(x)
              const day = `${d.toLocaleString(undefined, { day: '2-digit' })} ${d.toLocaleString(undefined, { month: 'short' })}`
              const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
              return (
                <div>
                  <div className="font-semibold">Run: {day} {time}</div>
                </div>
              )
            }}
            tooltipValueFormatter={(value, _seriesId, x) => {
              const run = runs.find(r => r.start === x)
              const detail = run ? `${run.passes}/${run.total} passed` : ''
              return (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Pass rate</span>
                  <span className="font-mono font-medium">{value ?? 0}%</span>
                  {detail && <span className="text-muted-foreground">• {detail}</span>}
                </div>
              )
            }}
            xTickSplitFormatter={(x) => {
              const d = new Date(x)
              const day = `${d.toLocaleString(undefined, { day: '2-digit' })} ${d.toLocaleString(undefined, { month: 'short' })}`
              const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
              return [day, time]
            }}
          />
            </div>
          )}
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-white dark:bg-neutral-900">
          <TableRow>
            <TableHead className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 w-[350px] min-w-[350px] max-w-[350px] whitespace-normal break-words">
              {title}
            </TableHead>
            <TableHead className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap min-w-24">
              Pass Rate
            </TableHead>
            {filteredHeaders.map((r) => (
              <TableHead
                key={r.key}
                className="px-2 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 text-center"
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
          </TableRow>
        </TableHeader>
        <TableBody className="[&_td]:border-b [&_td]:border-gray-200 dark:[&_td]:border-neutral-800">
          {displayRows.map((row) => (
            <TableRow key={row.testTitle} className="border-0">
              <TableCell className="px-3 py-2 text-slate-800 dark:text-slate-100 whitespace-normal break-words font-medium sticky left-0 z-10 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 w-[350px] min-w-[350px] max-w-[350px]">
                {row.isFlaky && (
                  <span className="relative group inline-flex items-center mr-2">
                    <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-600/20 dark:ring-amber-700/40 px-1.5 py-0.5 text-[10px] font-semibold">
                      flaky
                    </span>
                    <div className="pointer-events-none absolute left-0 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-md p-2 shadow-lg">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Last {row.history.length} runs</div>
                      <div className="flex items-end gap-0.5">
                        {row.history.map((p: boolean, i: number) => (
                          <span key={i} className={(p ? "bg-emerald-500" : "bg-red-500") + " block w-2 h-3 rounded-sm"} />
                        ))}
                      </div>
                    </div>
                  </span>
                )}
                {row.testTitle}
              </TableCell>
              <TableCell className="px-3 py-2 text-right whitespace-nowrap">
                <span
                  className={
                    "font-medium " +
                    (row.passRate > 90
                      ? "text-emerald-400"
                      : row.passRate > 70
                        ? "text-amber-400"
                        : "text-red-400")
                  }
                >
                  {row.passRate}%
                </span>
              </TableCell>
              {row.cells.map((p, i) => (
                <TableCell key={i} className="px-2 py-2 text-center">
                  {p === undefined ? (
                    <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 ring-1 ring-inset ring-gray-300/50 dark:ring-neutral-700/50 px-2 py-0.5 text-xs">–</span>
                  ) : (
                    <a
                      href={`https://www.test.com/${encodeURIComponent(row.testTitle)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="peer inline-flex items-center gap-1"
                      title={`Open report for ${row.testTitle}`}
                    >
                      {p ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-700/40 px-2 py-0.5 text-xs">pass</span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-600/20 dark:ring-red-700/40 px-2 py-0.5 text-xs">fail</span>
                      )}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3.5 h-3.5 opacity-0 peer-hover:opacity-100 transition-opacity text-slate-400"
                      >
                        <path d="M11 3a1 1 0 100 2h2.586L8.293 10.293a1 1 0 001.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z" />
                      </svg>
                    </a>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}



