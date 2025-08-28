import type { TestResponse } from "./testResponseDto"

// Key is in format 2025-07-01_02-10-04_branchName_githash
type TestTypeResult = Record<string, TestResponse>

export type TestReportDto = {
    smokeTests: TestTypeResult,
    uiUatTests: TestTypeResult,
    pricingOverride: TestTypeResult,
}

