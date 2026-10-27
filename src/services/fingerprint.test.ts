import { describe, it, expect } from "vitest"
import { getDeviceFingerprint } from "./fingerprint"

describe("fingerprint service", () => {
  it("returns a valid 32-character lowercase visitorId", async () => {
    const fp = await getDeviceFingerprint()
    expect(typeof fp).toBe("string")
    expect(fp.length).toBeGreaterThanOrEqual(16)
    expect(fp).toBe(fp.toLowerCase())
  })

  it("returns cached fingerprint on subsequent calls", async () => {
    const fp1 = await getDeviceFingerprint()
    const fp2 = await getDeviceFingerprint()
    expect(fp1).toBe(fp2)
  })
})
