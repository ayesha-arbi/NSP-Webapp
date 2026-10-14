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

  user?: User
}

export interface MfaResponse {
  success: boolean

  message: string

  accessToken?: string

  tokenType?: string

  expiresIn?: string

  user?: User
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

export type AssessmentStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "MINTED" | string & {}

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

async function request<T>(
  endpoint: string,

  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",

    ...(options.headers as Record<string, string> || {}),
  }

  if (authToken) {
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

  // If 401 Unauthorized mid-session, token has expired

  if (
    response.status === 401 &&
    endpoint !== "/api/auth/login" &&
    endpoint !== "/api/auth/verify-mfa"
  ) {
    if (onAuthExpiredCallback) {
      onAuthExpiredCallback()
    }
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
        "Permission denied: Action requires Trade Tester permissions."
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

      body: JSON.stringify({ email, mfaCode }),
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

  async approveAssessment(id: string): Promise<WithAssessment> {
    return one(
      await request<any>(`/api/assessments/${id}/approve`, { method: "POST" }),
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
