import type { TestReportDto } from "../testReportDto"

function makeKey(d: Date, branch: string, hash: string) {
  const z = (n: number) => String(n).padStart(2, "0")
  const iso = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}-${z(d.getMinutes())}-${z(d.getSeconds())}`
  return `${iso}_${branch}_${hash}`
}

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min))
}

export const sampleReport: TestReportDto = (() => {
  const now = new Date()
  const days = 32
  const smoke: TestReportDto["smokeTests"] = {}
  const uat: TestReportDto["uiUatTests"] = {}
  const pricing: TestReportDto["pricingOverride"] = {}

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    // Up to 2 runs per day per suite type
    const runsPerDay = randomBetween(1, 2)
    for (let r = 0; r < runsPerDay; r++) {
      const start = new Date(d.getTime() + r * 2 * 60 * 60 * 1000)
      const end = new Date(start.getTime() + 30 * 60 * 1000)

      const mkResp = (base: number, titles: string[]) => {
        const passPercent = Math.max(0, Math.min(100, base + randomBetween(-8, 8)))
        const tests = titles.map((t, idx) => {
          const uuid = `${Date.parse(start.toISOString())}-${idx}`
          const passed = Math.random() * 100 < passPercent
          return {
            title: t,
            fullTitle: t,
            timedOut: null,
            duration: randomBetween(100, 1200),
            state: passed ? "passed" : "failed",
            speed: null,
            pass: passed,
            fail: !passed,
            pending: false,
            context: null,
            code: "",
            err: {},
            uuid,
            parentUUID: "root",
            isHook: false,
            skipped: false,
          }
        })

        const passes = tests.filter((t) => t.pass).map((t) => t.uuid)
        const failures = tests.filter((t) => t.fail).map((t) => t.uuid)

        const result = {
          uuid: "root",
          title: "Root Suite",
          fullFile: "",
          file: "",
          beforeHooks: [],
          afterHooks: [],
          tests,
          suites: [],
          passes,
          failures,
          pending: [],
          skipped: [],
          duration: (end.getTime() - start.getTime()),
          root: true,
          rootEmpty: false,
          _timeout: 0,
        }

        return {
          stats: {
            suites: 1,
            tests: tests.length,
            passes: passes.length,
            pending: 0,
            start: start.toISOString(),
            end: end.toISOString(),
            duration: (end.getTime() - start.getTime()) / 1000,
            testsRegistered: tests.length,
            passPercent: Math.round((passes.length / Math.max(1, tests.length)) * 100),
            pendingPercent: 0,
            other: 0,
            hasOther: false,
            skipped: 0,
            hasSkipped: false,
          },
          results: [result],
        }
      }

      smoke[makeKey(start, "main", "aaaaaa")] = mkResp(92, [
        "Smoke: Login works",
        "Smoke: Checkout basic flow",
        "Smoke: Cart persists",
        "Smoke: Search returns results",
        "Smoke: Profile loads",
        "Smoke: Settings save",
        "Smoke: Logout",
        "Smoke: Pricing visible",
      ])
      uat[makeKey(start, "release", "bbbbbb")] = mkResp(85, [
        "UAT: Place order",
        "UAT: Apply coupon",
        "UAT: Remove item",
        "UAT: Update address",
        "UAT: Payment decline",
        "UAT: Payment success",
        "UAT: Email receipt",
        "UAT: Cancel order",
        "UAT: Return item",
      ])
      pricing[makeKey(start, "pricing", "cccccc")] = mkResp(70, [
        "Pricing: Override retail",
        "Pricing: Tiered pricing applies",
        "Pricing: Clearance flag",
        "Pricing: Member discount",
        "Pricing: Tax rounding",
        "Pricing: Bundle calc",
      ])
    }
  }

  return {
    smokeTests: smoke,
    uiUatTests: uat,
    pricingOverride: pricing,
  }
})()


// Simulate fetching the report from a server with a delay
export function fetchSampleReport(): Promise<TestReportDto> {
  return new Promise((resolve) => setTimeout(() => resolve(sampleReport), 1000))
}

