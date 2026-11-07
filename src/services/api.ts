import { getDeviceFingerprint } from "./fingerprint"
// API Client for National Skills Passport Backend

export interface User {
  id: string

  email: string

  role: "TRADE_TESTER" | "CENTER_SUPERINTENDENT" | "SUPER_ADMIN"

  hubLocationId: number

  name?: string
}

export interface LoginResponse {
  success: boolean

  message: string

  mfaRequired?: boolean

  enrollmentRequired?: boolean

  enrollmentToken?: string

  user?: User
}

export interface MfaResponse {
  success: boolean

  message: string

  accessToken?: string

  refreshToken?: string

  tokenType?: string

  expiresIn?: number

  user?: User
}

export interface AuthSessionResponse extends MfaResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface RefreshResponse {
  success: boolean
  message: string
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface RevokeResponse {
  success: boolean
  message: string
}

// ============================================================
// GUIDE #7 MFA ENROLLMENT & SUPER ADMIN TYPES
// ============================================================

export interface MfaEnrollStartResponse {
  success: boolean
  message: string
  secret: string
  otpauthUrl: string
}

export interface MfaEnrollConfirmResponse {
  success: boolean
  message: string
}

export interface UserStats {
  total: number
  superAdmins: number
  centerSuperintendents: number
  tradeTesters: number
  activeMfa: number
  pendingMfa: number
  adminLocked: number
}

export interface DashboardStats {
  users: UserStats
  sessions: { activeCount: number }
  candidates: { totalEnrolled: number verifiedCnic: number }
  assessments: {
    totalAssessed: number
    submitted: number
    approved: number
    rejected: number
  }
  ledger: {
    totalCredentials: number
    pendingApproval: number
    approved: number
    mintedOnChain: number
    queuePending?: number
    queueFailed?: number
  }
}

export interface HubUser {
  userId: string
  id?: string
  email: string
  name?: string
  role: "TRADE_TESTER" | "CENTER_SUPERINTENDENT" | "SUPER_ADMIN"
  hubLocationId?: number
  hubName?: string
  isMfaActive?: boolean
  mfaEnrollmentPending?: boolean
  adminLocked?: boolean
  isLocked?: boolean
  mfaEnabled?: boolean
  failedLoginAttempts?: number
  lockedUntil?: string | null
  createdAt?: string
  lastLoginAt?: string
  tokenVersion?: number
}

export interface UserSession {
  sessionId: string
  ipAddress: string
  deviceFingerprint: string
  createdAt: string
  expiresAt: string
}

export interface HubUserDetail {
  user: HubUser
  sessions: UserSession[]
  recentAuditEvents: Array<{
    logId: number
    eventType: string
    ipAddress: string
    createdAt: string
    details: any
  }>
}

export interface CreateHubUserPayload {
  email: string
  password?: string
  name?: string
  role: "TRADE_TESTER" | "CENTER_SUPERINTENDENT" | "SUPER_ADMIN"
  hubLocationId?: number
}

export interface CreateHubUserResponse {
  success: boolean
  message: string
  data: HubUser
  mfaEnrollment: {
    secret: string
    otpauthUrl: string
  }
}

export interface LockUserResponse {
  success: boolean
  data: {
    message: string
    user: Partial<HubUser>
  }
}

export interface ResetUserMfaResponse {
  success: boolean
  message?: string
  data?: {
    message: string
    user: Partial<HubUser>
  }
  mfaEnrollment?: {
    secret: string
    otpauthUrl: string
  }
  enrollment?: {
    secret: string
    otpauthUrl: string
  }
}

export interface ActiveSession {
  sessionId: string
  userId: string
  email: string
  role: "TRADE_TESTER" | "CENTER_SUPERINTENDENT" | "SUPER_ADMIN"
  hubLocationId: number
  ipAddress: string
  deviceFingerprint: string
  createdAt: string
  expiresAt: string
}

export interface AuditLogEntry {
  logId: number
  eventType: string
  userId: string
  email: string
  ipAddress: string
  createdAt: string
  details?: Record<string, any>
}

// ============================================================
// CAPSTONE (POST-GUIDE #7) TYPES
// ============================================================

export type StepUpScope = "APPROVE_ASSESSMENT" | "REVOKE_CREDENTIAL" | "REGISTER_HUB_KEY" | "CHANGE_ROLE" | "RESET_MFA" | string & {}

export interface StepUpTokenResponse {
  success: boolean
  message: string
  stepUpToken: string
  scope: string
  expiresIn: number
}

export interface UserProfile {
  user_id: string
  email: string
  name: string
  role: string
  hub_id: number
  is_mfa_active: boolean
  mfa_enrollment_pending: boolean
  admin_locked: boolean
  last_login: string | null
  created_at: string
}

export interface UserSessionItem {
  session_id: string
  device_fingerprint: string
  ip_address: string
  created_at: string
  last_active: string
  expires_at: string
  is_current: boolean
}

export interface DeviceHealth {
  deviceId: string
  hubLocationId: number
  deviceName: string
  edrStatus: "compliant" | "non_compliant" | "unknown"
  isOnline: boolean
  lastHeartbeatAt: string | null
  revoked: boolean
}

export interface AuthorizedDevice {
  id?: string
  deviceId: string
  hubLocationId: number
  deviceName: string
  deviceFingerprint: string
  deviceCredential?: string
  isLocked?: boolean
  revoked?: boolean
  createdAt?: string
  lastHeartbeatAt?: string | null
}

export interface RegisterDevicePayload {
  hubLocationId: number
  deviceName: string
  deviceFingerprint: string
  deviceCredential: string
}

export interface GenerateBackupCodesResponse {
  success: boolean
  message: string
  backupCodes: string[]
}

export interface BackupCodesStatusResponse {
  success: boolean
  totalCodes: number
  unusedCodes: number
  usedCodes: number
}

export interface HealthResponse {
  status: string

  timestamp: string
}

export interface EnrolCandidatePayload {
  fullName: string

  fatherName: string

  dob: string

  cnic: string

  photoS3Uri: string

  tradeCategory: string
}

export interface CandidateRecord {
  id: string

  candidateId?: string

  fullName: string

  fatherName: string

  dob: string

  cnic?: string

  tradeCategory: string

  hubLocationId?: number

  createdAt?: string
}

export type AssessmentStatus = "DRAFT" | "SUBMITTED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "MINTED" | string & {}

export type MintingStatus = "QUEUED" | "BROADCASTED" | "MINTED" | "FAILED" | null

export interface Assessment {
  assessmentId: string

  candidateId: string

  candidateName?: string

  tradeCategory?: string

  score: number

  grade: string

  status: AssessmentStatus

  rejectionReason?: string

  testerUserId?: string

  createdAt: string

  submittedAt?: string

  testingHubId?: number

  superintendentUserId?: string

  approvedAt?: string

  credentialId?: string

  mintingStatus?: MintingStatus

  txHash?: string | null

  rootHash?: string | null
}

export interface CreateAssessmentPayload {
  candidateId: string

  score: number

  grade: string

  clientRequestId: string
}

export interface UpdateAssessmentPayload {
  score: number

  grade: string
}

export interface UploadUrlResponse {
  success: boolean

  uploadUrl: string

  key: string

  s3Uri: string

  expiresIn: number
}

// ============================================================
// GUIDE #5 LEDGER & BLOCKCHAIN MINTING TYPES
// ============================================================

export interface CredentialSubjectPayload {
  skillName: string
  issuer: string
  awardLevel?: string
  practicalScore?: number
  theoryScore?: number
  [key: string]: any
}

export interface IssueCredentialPayload {
  candidateId: string
  credentialSubject: CredentialSubjectPayload
}

export interface IssueCredentialResponse {
  success: boolean
  message: string
  data: {
    credential_id: string
    candidate_id: string
    created_by: string
    credential_subject: any
    root_hash: string
    issued_at: string
    status: "PENDING_APPROVAL" | string
  }
}

export interface ApproveCredentialPayload {
  credentialId: string
}

export interface ApproveCredentialResponse {
  success: boolean
  message: string
  data: {
    id: number
    credential_id: string
    payload?: {
      credentialId: string
      rootHash: string
      w3cCredential?: any
    }
    status: MintingStatus | string
    tx_hash: string | null
    attempt_count: number
    created_at: string
  }
}

export interface LedgerStatusData {
  credential_id: string
  credential_status: string
  issued_at: string
  approved_at?: string | null
  minting_status: MintingStatus
  tx_hash: string | null
  attempt_count: number
}

export interface LedgerStatusResponse {
  success: boolean
  data: LedgerStatusData
}

export interface VerifyCredentialResponse {
  success: boolean
  verified: boolean
  data?: {
    credentialId: string
    issuedAt: string
    onChainHash: string
  }
  message?: string
}

export interface VerificationResult {
  verified: boolean
  credentialId?: string
  issuedAt?: string
  onChainHash?: string
  errorMessage?: string
}

export class ApiError extends Error {
  status: number

  data: any

  constructor(message: string, status: number, data?: any) {
    super(message)

    this.name = "ApiError"

    this.status = status

    this.data = data
  }
}

export const isNetworkError = (err: unknown) =>
  err instanceof ApiError && err.status === 0

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"

let authToken: string | null = null

let onAuthExpiredCallback: (() => void) | null = null

export function setApiAuthToken(token: string | null) {
  authToken = token
}

export function onAuthExpired(cb: () => void) {
  onAuthExpiredCallback = cb
}

// ── Refresh queue (prevents parallel refresh storms) ──
let _refreshPromise: Promise<{
  accessToken: string
  refreshToken: string
}> | null = null

async function request<T>(
  endpoint: string,
  options: RequestInit = {},

  retryAuth = true,
): Promise<T> {
  const baseUrl = (API_BASE_URL || "").replace(/\/$/, "")
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  const url = baseUrl ? `${baseUrl}${path}` : path

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  }

  // Attach Device Fingerprint (FR-AUTH-04)
  try {
    if (!headers["x-device-fingerprint"]) {
      const fingerprint = await getDeviceFingerprint()
      if (fingerprint) {
        headers["x-device-fingerprint"] = fingerprint
      }
    }
  } catch {}

  // Attach Device Credential (B3)
  try {
    const cred =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("nsp_device_credential")
        : null
    if (cred && !headers["x-device-credential"]) {
      headers["x-device-credential"] = cred
    }
  } catch {}

  if (authToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${authToken}`
  }

  let response: Response

  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch (err: any) {
    throw new ApiError(
      err?.message ||
        "Network error: unable to connect to NSP Backend API server.",
      0,
    )
  }

  let data: any = {}

  const contentType = response.headers.get("content-type")

  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json()
    } catch {
      data = {}
    }
  }

  // Guide #7 §1.4: Real-time token invalidation (token_version)
  // When an admin locks a user or resets their credentials, backend increments token_version.
  // Subsequent calls return 401 with "Session is no longer valid. Please authenticate again."
  // When caught, immediately clear local authentication state and do not retry refresh.
  const isInvalidSession =
    response.status === 401 &&
    typeof data?.message === "string" &&
    (data.message.toLowerCase().includes("session is no longer valid") ||
      data.message.toLowerCase().includes("token_version") ||
      data.message.toLowerCase().includes("account locked"))

  if (isInvalidSession) {
    onAuthExpiredCallback?.()
    throw new ApiError(data.message, 401, data)
  }

  // Capstone B2: Refresh token reuse detection
  // Backend returns 401 with specific messages when a stolen refresh token is replayed.
  const isTokenReuse =
    response.status === 401 &&
    typeof data?.message === "string" &&
    (data.message.includes("Invalid or expired refresh token") ||
      data.message.includes("Session has been revoked"))

  if (isTokenReuse) {
    onAuthExpiredCallback?.()
    if (typeof window !== "undefined") {
      window.location.href = "/login?reason=session_revoked"
    }
    throw new ApiError(data.message, 401, data)
  }

  // If 401 Unauthorized mid-session, attempt token refresh
  const isAuthEndpoint = endpoint.startsWith("/api/auth/")

  if (response.status === 401 && !isAuthEndpoint && retryAuth) {
    if (!_refreshPromise) {
      _refreshPromise = (async () => {
        const { authStore } = await import("./authStore")
        const refreshToken = authStore.getState().refreshToken

        if (!refreshToken) {
          throw new ApiError("Refresh token is required", 400)
        }

        const refreshed = await api.refresh(refreshToken)
        if (
          typeof refreshed.accessToken !== "string" ||
          !refreshed.accessToken ||
          typeof refreshed.refreshToken !== "string" ||
          !refreshed.refreshToken
        ) {
          throw new ApiError("Invalid refresh response", 401, refreshed)
        }

        authStore.setTokens(refreshed.accessToken, refreshed.refreshToken)
        return {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        }
      })()
        .catch((error) => {
          onAuthExpiredCallback?.()
          throw error
        })
        .finally(() => {
          _refreshPromise = null
        })
    }

    const tokens = await _refreshPromise
    const retryHeaders = {
      ...(options.headers as Record<string, string> ?? {}),
      Authorization: `Bearer ${tokens.accessToken}`,
    }
    return request<T>(endpoint, { ...options, headers: retryHeaders }, false)
  }

  if (response.status === 401 && !isAuthEndpoint && !retryAuth) {
    onAuthExpiredCallback?.()
  }

  if (!response.ok) {
    let errorMsg =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`

    if (response.status === 429) {
      errorMsg =
        "Rate limit exceeded (60 requests/minute). Please slow down and try again shortly."
    } else if (response.status === 403) {
      errorMsg =
        data?.message ||
        "Permission denied: Action requires authorized hub permissions."
    } else if (response.status === 409) {
      errorMsg =
        data?.message ||
        "Conflict: Revoked credentials cannot be approved or record already processed."
    }

    throw new ApiError(errorMsg, response.status, data)
  }

  return data as T
}

const pick = (r: any, ...keys: string[]) => {
  for (const k of keys) if (r?.[k] !== undefined && r?.[k] !== null) return r[k]

  return undefined
}

export function normalizeAssessment(r: any): Assessment {
  return {
    assessmentId: pick(r, "assessmentId", "assessment_id", "id"),

    candidateId: pick(r, "candidateId", "candidate_id"),

    candidateName: pick(r, "candidateName", "candidate_name"),

    tradeCategory: pick(r, "tradeCategory", "trade_category"),

    testingHubId: pick(r, "testingHubId", "testing_hub_id"),

    score: Number(r?.score),

    grade: r?.grade,

    status: r?.status,

    rejectionReason: pick(r, "rejectionReason", "rejection_reason"),

    testerUserId: pick(r, "testerUserId", "tester_user_id"),

    superintendentUserId: pick(
      r,
      "superintendentUserId",
      "superintendent_user_id",
    ),

    createdAt: pick(r, "createdAt", "created_at"),

    submittedAt: pick(r, "submittedAt", "submitted_at"),

    approvedAt: pick(r, "approvedAt", "approved_at"),

    credentialId: pick(r, "credentialId", "credential_id"),

    mintingStatus: pick(r, "mintingStatus", "minting_status"),

    txHash: pick(r, "txHash", "tx_hash"),

    rootHash: pick(r, "rootHash", "root_hash"),
  }
}

function normalizeCandidate(
  r: any,
  fallback: EnrolCandidatePayload,
): CandidateRecord {
  const id = pick(r, "id", "candidateId", "candidate_id")

  return {
    id,

    candidateId: id,

    fullName: pick(r, "fullName", "full_name") ?? fallback.fullName,

    fatherName: pick(r, "fatherName", "father_name") ?? fallback.fatherName,

    dob: pick(r, "dob", "date_of_birth") ?? fallback.dob,

    cnic: fallback.cnic, // raw CNIC is never stored server-side; keep only for this form session

    tradeCategory:
      pick(r, "tradeCategory", "trade_category") ?? fallback.tradeCategory,

    hubLocationId: pick(
      r,
      "hubLocationId",
      "hub_location_id",
      "testing_hub_id",
    ),

    createdAt: pick(r, "createdAt", "created_at"),
  }
}

type WithAssessment = {
  success: boolean
  message: string
  assessment: Assessment
}

const one = (r: any): WithAssessment => ({
  ...r,

  assessment: r?.assessment
    ? normalizeAssessment(r.assessment)
    : undefined as any,
})

const many = (r: any): { success: boolean assessments: Assessment[] } => ({
  ...r,

  assessments: (r?.assessments ?? []).map(normalizeAssessment),
})

export const api = {
  // Generic HTTP methods
  async get<T = any,>(endpoint: string, options?: RequestInit): Promise<{
    data: T
    status: number
  }> {
    const data = await request<T>(endpoint, { ...options, method: "GET" })
    return { data, status: 200 }
  },

  async post<T = any,>(
    endpoint: string,
    body?: any,
    options?: RequestInit,
  ): Promise<{ data: T status: number }> {
    const data = await request<T>(endpoint, {
      ...options,
      method: "POST",
      body:
        body !== undefined
          ? typeof body === "string"
            ? body
            : JSON.stringify(body)
          : undefined,
    })
    return { data, status: 200 }
  },

  async patch<T = any,>(
    endpoint: string,
    body?: any,
    options?: RequestInit,
  ): Promise<{ data: T status: number }> {
    const data = await request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body:
        body !== undefined
          ? typeof body === "string"
            ? body
            : JSON.stringify(body)
          : undefined,
    })
    return { data, status: 200 }
  },

  async delete<T = any,>(endpoint: string, options?: RequestInit): Promise<{
    data: T
    status: number
  }> {
    const data = await request<T>(endpoint, { ...options, method: "DELETE" })
    return { data, status: 200 }
  },

  async put<T = any,>(
    endpoint: string,
    body?: any,
    options?: RequestInit,
  ): Promise<{ data: T status: number }> {
    const data = await request<T>(endpoint, {
      ...options,
      method: "PUT",
      body:
        body !== undefined
          ? typeof body === "string"
            ? body
            : JSON.stringify(body)
          : undefined,
    })
    return { data, status: 200 }
  },

  // 1. Health Check

  async checkHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/health")
  },

  // 2. Auth Endpoints

  async login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>("/api/auth/login", {
      method: "POST",

      body: JSON.stringify({ email, password }),
    })
  },

  async verifyMfa(email: string, mfaCode: string): Promise<MfaResponse> {
    return request<MfaResponse>("/api/auth/verify-mfa", {
      method: "POST",

      body: JSON.stringify({ email, mfaCode, code: mfaCode, otp: mfaCode }),
    })
  },

  // Token refresh (rotating)
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    return request<RefreshResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
  },

  // Session revocation (logout)
  async revoke(refreshToken: string): Promise<RevokeResponse> {
    return request<RevokeResponse>("/api/auth/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
  },

  // Backup codes lifecycle
  async generateBackupCodes(): Promise<GenerateBackupCodesResponse> {
    return request<GenerateBackupCodesResponse>(
      "/api/auth/backup-codes/generate",
      { method: "POST" },
    )
  },

  async backupCodesStatus(): Promise<BackupCodesStatusResponse> {
    return request<BackupCodesStatusResponse>("/api/auth/backup-codes/status", {
      method: "GET",
    })
  },

  async verifyBackupCode(
    email: string,
    password: string,
    backupCode: string,
  ): Promise<AuthSessionResponse> {
    return request<AuthSessionResponse>("/api/auth/verify-backup-code", {
      method: "POST",
      body: JSON.stringify({ email, password, backupCode }),
    })
  },

  // 3. Candidate Enrolment
  async enrolCandidate(payload: EnrolCandidatePayload): Promise<{
    success: boolean
    message: string
    candidate: CandidateRecord
  }> {
    const r = await request<any>("/api/candidates", {
      method: "POST",

      body: JSON.stringify(payload),
    })

    return {
      ...r,
      candidate: r?.candidate
        ? normalizeCandidate(r.candidate, payload)
        : undefined,
    }
  },

  async candidatePhotoUploadUrl(): Promise<UploadUrlResponse> {
    return request<UploadUrlResponse>("/api/candidates/photo-upload-url", {
      method: "POST",
    })
  },

  // 4. Assessments Workflow

  async createAssessment(
    payload: CreateAssessmentPayload,
  ): Promise<WithAssessment & { replayed?: boolean }> {
    // 201 (new) and 200 (replayed: true) both mean "saved". Never retry on either.

    return one(
      await request<any>("/api/assessments", {
        method: "POST",

        body: JSON.stringify(payload),
      }),
    )
  },

  async listAssessments(): Promise<{
    success: boolean
    assessments: Assessment[]
  }> {
    return many(await request<any>("/api/assessments", { method: "GET" }))
  },

  async getAssessment(id: string): Promise<WithAssessment> {
    return one(await request<any>(`/api/assessments/${id}`, { method: "GET" }))
  },

  async updateAssessment(
    id: string,
    payload: UpdateAssessmentPayload,
  ): Promise<WithAssessment> {
    return one(
      await request<any>(`/api/assessments/${id}`, {
        method: "PATCH",

        body: JSON.stringify(payload),
      }),
    )
  },

  async submitAssessment(id: string): Promise<WithAssessment> {
    return one(
      await request<any>(`/api/assessments/${id}/submit`, { method: "POST" }),
    )
  },

  // 5. Assessment evidence media (DRAFT only, max one photo)

  async assessmentPhotoUploadUrl(id: string): Promise<UploadUrlResponse> {
    return request<UploadUrlResponse>(
      `/api/assessments/${id}/photo-upload-url`,
      { method: "POST" },
    )
  },

  async attachMedia(id: string, mediaS3Uri: string): Promise<any> {
    return request<any>(`/api/assessments/${id}/media`, {
      method: "POST",

      body: JSON.stringify({ mediaS3Uri }),
    })
  },

  async listMedia(id: string): Promise<any> {
    return request<any>(`/api/assessments/${id}/media`, { method: "GET" })
  },

  // 6. Superintendent approval workflow (role CENTER_SUPERINTENDENT, hub-scoped server-side)

  async getQueue(): Promise<{ success: boolean assessments: Assessment[] }> {
    return many(await request<any>("/api/assessments/queue", { method: "GET" }))
  },

  async approveAssessment(
    id: string,
    stepUpToken?: string,
  ): Promise<WithAssessment> {
    const headers: Record<string, string> = {}
    if (stepUpToken) {
      headers["x-step-up-token"] = stepUpToken
    }
    return one(
      await request<any>(`/api/assessments/${id}/approve`, {
        method: "POST",
        headers: stepUpToken ? headers : undefined,
      }),
    )
  },

  /** Server rejects then auto-returns the record to DRAFT with rejection_reason set. */

  async rejectAssessment(
    id: string,
    rejectionReason: string,
  ): Promise<WithAssessment> {
    return one(
      await request<any>(`/api/assessments/${id}/reject`, {
        method: "POST",

        body: JSON.stringify({ rejectionReason }),
      }),
    )
  },

  // 7. Blockchain Minting & Ledger Module (Guide #5)

  /**
   * Issue a Credential (POST /api/ledger/issue)
   * Allowed Roles: TRADE_TESTER only. Hub-scoped server-side.
   * Compiles W3C VC, calculates root SHA-256, stores pending approval.
   */
  async issueCredential(
    payload: IssueCredentialPayload,
  ): Promise<IssueCredentialResponse> {
    return request<IssueCredentialResponse>("/api/ledger/issue", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  /**
   * Approve Credential & Queue for Minting (POST /api/ledger/approve)
   * Allowed Roles: CENTER_SUPERINTENDENT or SUPER_ADMIN.
   * Hub-scoped for superintendents; super admin approves across all hubs.
   * Idempotent & safe for retries.
   */
  async approveCredential(
    credentialId: string,
  ): Promise<ApproveCredentialResponse> {
    return request<ApproveCredentialResponse>("/api/ledger/approve", {
      method: "POST",
      body: JSON.stringify({ credentialId }),
    })
  },

  /**
   * Check Credential & Minting Status (GET /api/ledger/:credentialId)
   * Allowed Roles: TRADE_TESTER, CENTER_SUPERINTENDENT, SUPER_ADMIN.
   * Returns current minting status (QUEUED, BROADCASTED, MINTED, FAILED) and tx_hash.
   */
  async getLedgerStatus(credentialId: string): Promise<LedgerStatusResponse> {
    return request<LedgerStatusResponse>(
      `/api/ledger/${encodeURIComponent(credentialId)}`,
      { method: "GET" },
    )
  },

  /**
   * Public On-Chain Verification API (GET /api/ledger/verify/:credentialId)
   * Zero authentication required. Queries Polygon Amoy smart contract on-chain.
   */

  async revokeSession(): Promise<any> {
    let refreshToken: string | null = null
    try {
      if (typeof localStorage !== "undefined") {
        refreshToken = localStorage.getItem("refreshToken")
      }
      if (!refreshToken && typeof sessionStorage !== "undefined") {
        const raw = sessionStorage.getItem("nsp_session")
        if (raw) refreshToken = JSON.parse(raw).refreshToken
      }
    } catch {}
    return request<any>("/api/auth/revoke", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
  },

  async getBackupCodeStatus(): Promise<{
    success: boolean
    totalCodes: number
    unusedCodes: number
    usedCodes: number
  }> {
    return request<any>("/api/auth/backup-codes/status", { method: "GET" })
  },

  createCandidate(payload: EnrolCandidatePayload) {
    return this.enrolCandidate(payload)
  },

  getCredentialStatus(credentialId: string): Promise<LedgerStatusResponse> {
    return this.getLedgerStatus(credentialId)
  },

  verifyPublicCredential(
    credentialId: string,
  ): Promise<VerifyCredentialResponse> {
    return this.verifyCredential(credentialId)
  },

  async verifyCredential(
    credentialId: string,
  ): Promise<VerifyCredentialResponse> {
    return request<VerifyCredentialResponse>(
      `/api/ledger/verify/${encodeURIComponent(credentialId)}`,
      { method: "GET" },
    )
  },

  // 8. Guide #7: MFA Enrollment Lifecycle
  async startMfaEnrollment(
    enrollmentToken: string,
  ): Promise<MfaEnrollStartResponse> {
    return request<MfaEnrollStartResponse>("/api/auth/mfa/enroll/start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${enrollmentToken}`,
      },
      body: JSON.stringify({ enrollmentToken }),
    })
  },

  async confirmMfaEnrollment(
    enrollmentToken: string,
    mfaCode: string,
  ): Promise<MfaEnrollConfirmResponse> {
    return request<MfaEnrollConfirmResponse>("/api/auth/mfa/enroll/confirm", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${enrollmentToken}`,
      },
      body: JSON.stringify({ enrollmentToken, mfaCode, code: mfaCode }),
    })
  },

  // ============================================================
  // CAPSTONE B1: Step-Up MFA
  // ============================================================

  async requestStepUp(
    scope: StepUpScope,
    mfaCode?: string,
    backupCode?: string,
  ): Promise<StepUpTokenResponse> {
    return request<StepUpTokenResponse>("/api/auth/step-up", {
      method: "POST",
      body: JSON.stringify({
        scope,
        ...(mfaCode ? { mfaCode } : { backupCode }),
      }),
    })
  },

  /** Approve assessment with step-up token header */
  async approveAssessmentWithStepUp(
    id: string,
    stepUpToken: string,
  ): Promise<WithAssessment> {
    return one(
      await request<any>(`/api/assessments/${id}/approve`, {
        method: "POST",
        headers: { "x-step-up-token": stepUpToken },
      }),
    )
  },

  // ============================================================
  // CAPSTONE B2: Profile & Self-Service Password
  // ============================================================

  async getProfile(): Promise<{ success: boolean profile: UserProfile }> {
    return request<{ success: boolean profile: UserProfile }>(
      "/api/auth/profile",
      { method: "GET" },
    )
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<{
    success: boolean
    message: string
  }> {
    return request<{ success: boolean message: string }>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },

  async getActiveSessions(): Promise<{
    success: boolean
    count: number
    sessions: UserSessionItem[]
  }> {
    return request<{
      success: boolean
      count: number
      sessions: UserSessionItem[]
    }>("/api/auth/sessions", { method: "GET" })
  },

  async getSessions(): Promise<{
    success: boolean
    count: number
    sessions: UserSessionItem[]
  }> {
    return this.getActiveSessions()
  },

  // ============================================================
  // CAPSTONE B3: Device Management (Super Admin)
  // ============================================================

  async registerDevice(payload: RegisterDevicePayload): Promise<{
    success: boolean
    message: string
    device: AuthorizedDevice
  }> {
    return request<{
      success: boolean
      message: string
      device: AuthorizedDevice
    }>("/api/super-admin/devices", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async listDevices(hubLocationId?: number): Promise<{
    success: boolean
    devices: AuthorizedDevice[]
  }> {
    const qs = hubLocationId != null ? `?hubLocationId=${hubLocationId}` : ""
    return request<{ success: boolean devices: AuthorizedDevice[] }>(
      `/api/super-admin/devices${qs}`,
      { method: "GET" },
    )
  },

  async getDeviceHealth(): Promise<{
    success: boolean
    devices: DeviceHealth[]
  }> {
    return request<{ success: boolean devices: DeviceHealth[] }>(
      "/api/super-admin/devices/health",
      { method: "GET" },
    )
  },

  async setHubLockdown(hubLocationId: number, isLocked: boolean): Promise<{
    success: boolean
    message: string
  }> {
    return request<{ success: boolean message: string }>(
      "/api/super-admin/devices/lockdown",
      { method: "POST", body: JSON.stringify({ hubLocationId, isLocked }) },
    )
  },

  async revokeDevice(deviceId: string): Promise<{
    success: boolean
    message: string
  }> {
    return request<{ success: boolean message: string }>(
      `/api/super-admin/devices/${encodeURIComponent(deviceId)}/revoke`,
      { method: "POST" },
    )
  },

  async sendDeviceHeartbeat(
    deviceCredential: string,
    deviceFingerprint: string,
    edrStatus: "compliant" | "non_compliant" | "unknown" = "compliant",
  ): Promise<{ success: boolean }> {
    return request<{ success: boolean }>("/api/auth/device/heartbeat", {
      method: "POST",
      headers: {
        "x-device-credential": deviceCredential,
        "x-device-fingerprint": deviceFingerprint,
      },
      body: JSON.stringify({ edrStatus }),
    })
  },

  // 9. Guide #7: Super Admin Engine
  superAdmin: {
    getDashboard(): Promise<DashboardStats> {
      return superAdminApi.getDashboard()
    },
    getUsers(params?: {
      role?: string
      search?: string
      limit?: number
      offset?: number
    }) {
      return superAdminApi.getUsers(params)
    },
    getUserDetails(userId: string) {
      return superAdminApi.getUserDetails(userId)
    },
    createUser(payload: CreateHubUserPayload) {
      return superAdminApi.createUser(payload)
    },
    lockUser(userId: string) {
      return superAdminApi.lockUser(userId)
    },
    unlockUser(userId: string) {
      return superAdminApi.unlockUser(userId)
    },
    resetUserMfa(userId: string) {
      return superAdminApi.resetUserMfa(userId)
    },
    getSessions(limit?: number) {
      return superAdminApi.getSessions(limit)
    },
    revokeSession(sessionId: string) {
      return superAdminApi.revokeSession(sessionId)
    },
    getAuditLogs(limit?: number) {
      return superAdminApi.getAuditLogs(limit)
    },
    // Capstone B3: Device Management
    registerDevice(payload: RegisterDevicePayload) {
      return api.registerDevice(payload)
    },
    listDevices(hubLocationId?: number) {
      return api.listDevices(hubLocationId)
    },
    getDeviceHealth() {
      return api.getDeviceHealth()
    },
    setHubLockdown(hubLocationId: number, isLocked: boolean) {
      return api.setHubLockdown(hubLocationId, isLocked)
    },
    revokeDevice(deviceId: string) {
      return api.revokeDevice(deviceId)
    },
  },
}

/**
 * Verifier DApp UI Implementation Recipe (Guide #5 §5.4)
 * Public on-chain verification without authentication barrier.
 */
export async function verifyNspCredential(
  credentialId: string,
): Promise<VerificationResult> {
  try {
    const res = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/api/ledger/verify/${encodeURIComponent(credentialId)}`,
    )
    const json = await res.json().catch(() => ({}))

    if (res.status === 200 && json.verified) {
      return {
        verified: true,
        credentialId: json.data?.credentialId || credentialId,
        issuedAt: json.data?.issuedAt,
        onChainHash: json.data?.onChainHash,
      }
    } else {
      return {
        verified: false,
        errorMessage:
          json.message || "Credential not found, revoked, or invalid on-chain.",
      }
    }
  } catch (err: any) {
    return {
      verified: false,
      errorMessage:
        err?.message || "Network error connecting to the verification node.",
    }
  }
}

// Photo helpers browser -> S3 directly.

// S3 signature requires Content-Type image/jpeg exactly, so convert everything else.

export async function toJpeg(file: Blob, quality = 0.85): Promise<Blob> {
  if (file.type === "image/jpeg") return file

  let bmp: ImageBitmap

  try {
    bmp = await createImageBitmap(file)
  } catch {
    throw new Error(
      "This image format is not supported by the browser. Please choose a JPG or PNG photo.",
    )
  }

  const canvas = document.createElement("canvas")

  canvas.width = bmp.width

  canvas.height = bmp.height

  canvas.getContext("2d")!.drawImage(bmp, 0, 0)

  return new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("JPEG conversion failed"))),
      "image/jpeg",
      quality,
    ),
  )
}

// Raw body, no FormData. Call immediately after requesting the URL (5 min expiry).

export async function putToS3(uploadUrl: string, jpeg: Blob): Promise<void> {
  let res: Response

  try {
    res = await fetch(uploadUrl, {
      method: "PUT",

      headers: { "Content-Type": "image/jpeg" },

      body: jpeg,
    })
  } catch {
    throw new Error(
      "Photo upload failed: could not reach storage (offline, or the S3 bucket CORS rule is missing for this origin).",
    )
  }

  if (!res.ok) {
    throw new Error(
      `Photo upload failed (S3 ${res.status}). Check the image type and bucket permissions.`,
    )
  }
}

// Returns the s3Uri to send as `photoS3Uri` in api.enrolCandidate.

export async function uploadCandidatePhoto(file: Blob): Promise<string> {
  const jpeg = await toJpeg(file)

  const { uploadUrl, s3Uri } = await api.candidatePhotoUploadUrl()

  await putToS3(uploadUrl, jpeg)

  return s3Uri
}

// Uploads the evidence photo and attaches it to the (DRAFT) assessment.

export async function uploadAssessmentPhoto(assessmentId: string, file: Blob) {
  const jpeg = await toJpeg(file)

  const { uploadUrl, s3Uri } = await api.assessmentPhotoUploadUrl(assessmentId)

  await putToS3(uploadUrl, jpeg)

  return api.attachMedia(assessmentId, s3Uri)
}

export const ApiService = api

// ============================================================
// GUIDE #7 SUPER ADMIN API SERVICE
// ============================================================

export const superAdminApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const res = await request<any>("/api/super-admin/dashboard", {
      method: "GET",
    })
    return res.data?.stats || res.data || res
  },

  getUsers: async (params?: {
    role?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{
    users: HubUser[]
    pagination: { limit: number offset: number total: number }
  }> => {
    const query = new URLSearchParams()
    if (params?.role) query.set("role", params.role)
    if (params?.search) query.set("search", params.search)
    if (params?.limit != null) query.set("limit", String(params.limit))
    if (params?.offset != null) query.set("offset", String(params.offset))
    const qs = query.toString() ? `?${query.toString()}` : ""
    const res = await request<any>(`/api/super-admin/users${qs}`, {
      method: "GET",
    })
    return res.data || res
  },

  getUserDetails: async (userId: string): Promise<HubUserDetail> => {
    const res = await request<any>(
      `/api/super-admin/users/${encodeURIComponent(userId)}`,
      {
        method: "GET",
      },
    )
    return res.data || res
  },

  createUser: async (
    payload: CreateHubUserPayload,
  ): Promise<CreateHubUserResponse> => {
    return request<CreateHubUserResponse>("/api/super-admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  lockUser: async (
    userId: string,
    reason?: string,
  ): Promise<LockUserResponse> => {
    return request<LockUserResponse>(
      `/api/super-admin/users/${encodeURIComponent(userId)}/lock`,
      {
        method: "POST",
        body: reason ? JSON.stringify({ reason }) : undefined,
      },
    )
  },

  unlockUser: async (userId: string): Promise<LockUserResponse> => {
    return request<LockUserResponse>(
      `/api/super-admin/users/${encodeURIComponent(userId)}/unlock`,
      {
        method: "POST",
      },
    )
  },

  resetUserMfa: async (
    userId: string,
    reason?: string,
  ): Promise<ResetUserMfaResponse> => {
    return request<ResetUserMfaResponse>(
      `/api/super-admin/users/${encodeURIComponent(userId)}/reset-mfa`,
      {
        method: "POST",
        body: reason ? JSON.stringify({ reason }) : undefined,
      },
    )
  },

  getSessions: async (limit = 50): Promise<ActiveSession[]> => {
    const res = await request<any>(`/api/super-admin/sessions?limit=${limit}`, {
      method: "GET",
    })
    return res.data || res
  },

  revokeSession: async (sessionId: string): Promise<{
    success: boolean
    data: { message: string }
  }> => {
    return request<any>(
      `/api/super-admin/sessions/${encodeURIComponent(sessionId)}/revoke`,
      {
        method: "POST",
      },
    )
  },

  getAuditLogs: async (limit = 50): Promise<AuditLogEntry[]> => {
    const res = await request<any>(
      `/api/super-admin/audit-logs?limit=${limit}`,
      { method: "GET" },
    )
    return res.data || res
  },

  // Capstone B3: Device Management
  registerDevice: async (payload: RegisterDevicePayload) => {
    return request<{
      success: boolean
      message: string
      device: AuthorizedDevice
    }>("/api/super-admin/devices", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  listDevices: async (hubLocationId?: number) => {
    const qs = hubLocationId != null ? `?hubLocationId=${hubLocationId}` : ""
    return request<{ success: boolean devices: AuthorizedDevice[] }>(
      `/api/super-admin/devices${qs}`,
      { method: "GET" },
    )
  },

  getDeviceHealth: async (): Promise<DeviceHealth[]> => {
    const res = await request<any>("/api/super-admin/devices/health", {
      method: "GET",
    })
    return res.devices || res.data?.devices || []
  },

  setHubLockdown: async (hubLocationId: number, isLocked: boolean) => {
    return request<{ success: boolean message: string }>(
      "/api/super-admin/devices/lockdown",
      { method: "POST", body: JSON.stringify({ hubLocationId, isLocked }) },
    )
  },

  revokeDevice: async (deviceId: string) => {
    return request<{ success: boolean message: string }>(
      `/api/super-admin/devices/${encodeURIComponent(deviceId)}/revoke`,
      { method: "POST" },
    )
  },
}

// ============================================================
// Step-Up MFA, Profile & Device Management API Extensions (Section 7)
// ============================================================

export const enhancedApi = {
  // B1: Step-Up Token Request
  async requestStepUp(
    scope: string,
    mfaCode?: string,
    backupCode?: string,
  ): Promise<string> {
    const res = await api.post<{ success: boolean stepUpToken: string }>(
      "/api/auth/step-up",
      {
        scope,
        ...(mfaCode ? { mfaCode } : { backupCode }),
      },
    )
    return res.data.stepUpToken
  },

  // B2: Profile & Password
  async getProfile() {
    const res = await api.get("/api/auth/profile")
    return res.data.profile
  },

  async updatePassword(currentPassword: string, newPassword: string) {
    const res = await api.patch("/api/auth/profile", {
      currentPassword,
      newPassword,
    })
    return res.data
  },

  async getSessions() {
    const res = await api.get("/api/auth/sessions")
    return res.data.sessions
  },

  // B3: Device Management (Super Admin)
  async getDeviceHealth(): Promise<DeviceHealth[]> {
    const res = await api.get("/api/super-admin/devices/health")
    return res.data.devices
  },

  async setHubLockdown(hubLocationId: number, isLocked: boolean) {
    const res = await api.post("/api/super-admin/devices/lockdown", {
      hubLocationId,
      isLocked,
    })
    return res.data
  },

  async revokeDevice(deviceId: string) {
    const res = await api.post(`/api/super-admin/devices/${deviceId}/revoke`)
    return res.data
  },
}
