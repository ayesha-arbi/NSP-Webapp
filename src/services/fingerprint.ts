import FingerprintJS from "@fingerprintjs/fingerprintjs"

let cachedVisitorId: string | null = null
let fpPromise: Promise<string> | null = null

/**
 * Returns a stable, deterministic hardware/browser fingerprint (visitorId).
 * Safe for offline or restricted environments with a fallback.
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (cachedVisitorId) {
    return cachedVisitorId
  }

  if (typeof window === "undefined") {
    // Deterministic fallback for non-browser/test environments
    cachedVisitorId = "00000000000000000000000000000000"
    return cachedVisitorId
  }

  if (!fpPromise) {
    fpPromise = (async () => {
      try {
        const fp = await FingerprintJS.load()
        const result = await fp.get()
        const visitorId = result.visitorId.toLowerCase().trim()
        cachedVisitorId = visitorId
        return visitorId
      } catch (error) {
        console.warn(
          "[Fingerprint] Failed to generate client fingerprint; using fallback",
          error,
        )
        const userAgent =
          typeof navigator !== "undefined" ? navigator.userAgent : ""
        const screenRes =
          typeof screen !== "undefined"
            ? `${screen.width}x${screen.height}`
            : "1920x1080"
        const lang =
          typeof navigator !== "undefined" ? navigator.language : "en-US"
        const fallbackRaw = `${userAgent}|${screenRes}|${lang}`
        try {
          const fallbackId = btoa(fallbackRaw).substring(0, 32).toLowerCase()
          cachedVisitorId = fallbackId
          return fallbackId
        } catch {
          const fallbackId = "00000000000000000000000000000000"
          cachedVisitorId = fallbackId
          return fallbackId
        }
      }
    })()
  }

  return fpPromise
}
