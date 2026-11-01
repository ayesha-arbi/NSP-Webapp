import { describe, expect, it } from "vitest"

describe("test environment", () => {
  it("provides isolated browser storage", () => {
    expect(window.sessionStorage).toBeDefined()
    expect(window.sessionStorage.length).toBe(0)
  })
})
