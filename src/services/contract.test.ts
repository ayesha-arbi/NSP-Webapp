import { describe, it, expect } from "vitest"
import { verifyCertificateOnChain } from "./contract"

describe("contract service", () => {
  it("returns valid simulation result for standard credential IDs", async () => {
    const result = await verifyCertificateOnChain("NSP-004821")
    expect(result.isValid).toBe(true)
    expect(result.onChain).toBe(false) // fallback simulation
    expect(typeof result.issuedAt).toBe("number")
    expect(result.dataHash).toMatch(/^0x[a-f0-9]{64}$/i)
  })

  it("identifies tampered credential simulation (NSP-T prefix)", async () => {
    const result = await verifyCertificateOnChain("NSP-T001")
    expect(result.isValid).toBe(false)
  })

  it("identifies revoked credential simulation (NSP-R prefix)", async () => {
    const result = await verifyCertificateOnChain("NSP-R001")
    expect(result.isValid).toBe(false)
  })

  it("identifies missing credential simulation (NSP-X prefix)", async () => {
    const result = await verifyCertificateOnChain("NSP-X001")
    expect(result.isValid).toBe(false)
  })
})
