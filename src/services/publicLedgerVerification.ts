/** Public Guide #5 verifier endpoint. This route must remain unauthenticated. */

export interface PublicVerificationResponse {
  success?: boolean

  verified?: boolean

  message?: string

  data?: {
    credentialId?: string

    issuedAt?: string

    onChainHash?: string
  }
}

export interface PublicVerificationResult {
  verified: boolean

  credentialId: string

  issuedAt?: string

  onChainHash?: string

  errorMessage?: string
}

// Override at build time with VITE_NSP_API_BASE_URL if your API has another base URL.

const API_BASE_URL = (
  import.meta.env.VITE_NSP_API_BASE_URL || "https://api.nsp.gov.pk/api"
)

  .replace(/\/$/, "")

export async function verifyNspCredential(
  credentialId: string,
): Promise<PublicVerificationResult> {
  const id = credentialId.trim()

  if (!id) {
    throw new Error("Enter a credential ID.")
  }

  let response: Response

  try {
    response = await fetch(
      `${API_BASE_URL}/ledger/verify/${encodeURIComponent(id)}`,

      {
        method: "GET",

        headers: { Accept: "application/json" },

        // Intentionally no Authorization header: Guide #5 says this endpoint is public.

        credentials: "omit",
      },
    )
  } catch {
    throw new Error("Network error connecting to the verification service.")
  }

  let json: PublicVerificationResponse

  try {
    json = ((await response.json()) as PublicVerificationResponse)
  } catch {
    throw new Error("The verification service returned an unreadable response.")
  }

  if (response.status === 200 && json.verified === true && json.data) {
    return {
      verified: true,

      credentialId: json.data.credentialId || id,

      issuedAt: json.data.issuedAt,

      onChainHash: json.data.onChainHash,
    }
  }

  if (response.status === 404 || json.verified === false) {
    return {
      verified: false,

      credentialId: json.data?.credentialId || id,

      errorMessage:
        json.message || "Credential not found, revoked, or invalid on-chain.",
    }
  }

  throw new Error(
    json.message ||
      `Verification service error (${response.status}). Try again later.`,
  )
}
