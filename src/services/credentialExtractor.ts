/**
 * Utilities for extracting and normalizing credential IDs from QR code text or user input.
 * Supports URNs (urn:uuid:...), raw UUIDs, NSP certificate IDs (NSP-...),
 * verification URLs, and JSON-encoded Verifiable Credentials.
 */

export function extractCredentialId(rawText: string): string | null {
  const text = rawText.trim()
  if (!text) return null

  // 1. JSON parsing check
  if (
    (text.startsWith("{") && text.endsWith("}")) ||
    (text.startsWith("[") && text.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed === "object" && parsed !== null) {
        if (typeof parsed.credentialId === "string") {
          return extractCredentialId(parsed.credentialId)
        }
        if (typeof parsed.credential_id === "string") {
          return extractCredentialId(parsed.credential_id)
        }
        if (typeof parsed.id === "string") {
          return extractCredentialId(parsed.id)
        }
        if (
          parsed.credentialSubject &&
          typeof parsed.credentialSubject.id === "string"
        ) {
          return extractCredentialId(parsed.credentialSubject.id)
        }
      }
    } catch {
      // Ignore JSON parse errors and continue
    }
  }

  // 2. URL parsing check
  if (text.startsWith("http://") || text.startsWith("https://")) {
    try {
      const url = new URL(text)
      const queryParam =
        url.searchParams.get("credentialId") ||
        url.searchParams.get("credential_id") ||
        url.searchParams.get("id") ||
        url.searchParams.get("cid")
      if (queryParam) {
        const fromParam = extractCredentialId(queryParam)
        if (fromParam) return fromParam
      }

      // Check pathname segments
      const segments = url.pathname.split("/").filter(Boolean)
      for (let i = segments.length - 1; i >= 0; i--) {
        const decoded = decodeURIComponent(segments[i])
        const fromSegment = extractCredentialId(decoded)
        if (fromSegment) return fromSegment
      }
    } catch {
      // Ignore URL parse error and continue
    }
  }

  // 3. Exact or embedded canonical URN (urn:uuid:<uuid>)
  const urnMatch = text.match(
    /urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  )
  if (urnMatch) {
    return urnMatch[0].toLowerCase()
  }

  // 4. Standalone UUID format -> normalize to canonical URN per Guide #5
  const uuidMatch = text.match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  )
  if (uuidMatch) {
    return `urn:uuid:${uuidMatch[0].toLowerCase()}`
  }

  // 5. Standard NSP Credential ID (e.g. NSP-004821, NSP-T001, etc.)
  const nspMatch = text.match(/\bNSP-[A-Z0-9_-]+\b/i)
  if (nspMatch) {
    return nspMatch[0].toUpperCase()
  }

  // 6. Fallback: DID format (e.g. did:nsp:candidate:...)
  if (text.startsWith("did:")) {
    return text
  }

  // 7. General non-empty ID token without whitespace (at least 3 characters)
  if (/^[A-Za-z0-9_.:-]+$/.test(text) && text.length >= 3) {
    return text
  }

  return null
}
