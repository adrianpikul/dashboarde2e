interface TestStats {
    suites: number
    tests: number;
    passes: number
    pending: number;
    start: string;
    duration: number
    testsRegistered: number
    passPercent: number
    pendingPercent: number;
    other: number
    hasOther: boolean
    skipped: number
    hasSkipped: boolean
}

interface TestError {
    message?: string
    estack?: string
    diff?: string | null
}

interface Test {
    title: string;
    fullTitle: string;
    timedOut: boolean | null
    duration: number
    state: string
    speed: string | null
    pass: boolean
    fail: boolean
    pending: boolean
    context: string | null
    code: string
    err: TestError
    uuid: string
    parentUUID: string
    isHook: boolean
    skipped: boolean
}

interface Suite {
    uuid: string
    title: string
    fullFile: string
    file: string
    beforeHooks: any[]
    afterHooks: any[]
    tests: Test[]
    suites: Suite[]
    passes: string[]
    failures: string[]
    pending: string[]
    skipped: string[]
    duration: number;
    root: boolean
    rootEmpty: boolean
    _timeout: number
}

interface Result {
    uuid: string
    title: string
    fullFile: string
    file: string
    beforeHooks: any[]
    afterHooks: any[]
    tests: Test[]
    suites: Suite[]
    passes: string[]
    failures: string[]
    pending: string[]
    skipped: string[]
    duration: number;
    root: boolean
    rootEmpty: boolean
    _timeout: number
}

export interface TestResponse {
    stats: TestStats
    results: Result[]
}