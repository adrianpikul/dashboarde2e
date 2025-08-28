import type { TestResponse } from "./testResponseDto"

export type TestReportDto = {
    smokeTests: TestResponse[],
    uiUatTests: TestResponse[],
    pricingOverride: TestResponse[],
}