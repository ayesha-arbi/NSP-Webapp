// API Client for National Skills Passport Backend

export interface User {
  id: string;
  email: string;
  role: 'TRADE_TESTER' | 'CENTER_SUPERINTENDENT' | 'SUPER_ADMIN';
  hubLocationId: number;
  name?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  mfaRequired?: boolean;
  user?: User;
}

export interface MfaResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  tokenType?: string;
  expiresIn?: string;
  user?: User;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface EnrolCandidatePayload {
  fullName: string;
  fatherName: string;
  dob: string;
  cnic: string;
  photoS3Uri: string;
  tradeCategory: string;
}

export interface CandidateRecord {
  id: string;
  candidateId?: string;
  fullName: string;
  fatherName: string;
  dob: string;
  cnic?: string;
  tradeCategory: string;
  hubLocationId?: number;
  createdAt?: string;
}

export interface Assessment {
  assessmentId: string;
  candidateId: string;
  candidateName?: string;
  tradeCategory?: string;
  score: number;
  grade: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'MINTED';
  rejectionReason?: string;
  testerUserId?: string;
  createdAt: string;
  submittedAt?: string;
}

export interface CreateAssessmentPayload {
  candidateId: string;
  score: number;
  grade: string;
}

export interface UpdateAssessmentPayload {
  score: number;
  grade: string;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

let authToken: string | null = null;
let onAuthExpiredCallback: (() => void) | null = null;

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

export function onAuthExpired(cb: () => void) {
  onAuthExpiredCallback = cb;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      err?.message || 'Network error: unable to connect to NSP Backend API server.',
      0
    );
  }

  // If 401 Unauthorized mid-session, token has expired
  if (response.status === 401 && endpoint !== '/api/auth/login' && endpoint !== '/api/auth/verify-mfa') {
    if (onAuthExpiredCallback) {
      onAuthExpiredCallback();
    }
  }

  let data: any = {};
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    let errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
    if (response.status === 429) {
      errorMsg = 'Rate limit exceeded (60 requests/minute). Please slow down and try again shortly.';
    } else if (response.status === 403) {
      errorMsg = data?.message || 'Permission denied: Action requires Trade Tester permissions.';
    }
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

export const api = {
  // 1. Health Check
  async checkHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/health');
  },

  // 2. Auth Endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async verifyMfa(email: string, mfaCode: string): Promise<MfaResponse> {
    return request<MfaResponse>('/api/auth/verify-mfa', {
      method: 'POST',
      body: JSON.stringify({ email, mfaCode }),
    });
  },

  // 3. Candidate Enrolment
  async enrolCandidate(payload: EnrolCandidatePayload): Promise<{ success: boolean; message: string; candidate: CandidateRecord }> {
    return request<{ success: boolean; message: string; candidate: CandidateRecord }>('/api/candidates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 4. Assessments Workflow
  async createAssessment(payload: CreateAssessmentPayload): Promise<{ success: boolean; message: string; assessment: Assessment }> {
    return request<{ success: boolean; message: string; assessment: Assessment }>('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listAssessments(): Promise<{ success: boolean; assessments: Assessment[] }> {
    return request<{ success: boolean; assessments: Assessment[] }>('/api/assessments', {
      method: 'GET',
    });
  },

  async getAssessment(id: string): Promise<{ success: boolean; assessment: Assessment }> {
    return request<{ success: boolean; assessment: Assessment }>(`/api/assessments/${id}`, {
      method: 'GET',
    });
  },

  async updateAssessment(id: string, payload: UpdateAssessmentPayload): Promise<{ success: boolean; message: string; assessment: Assessment }> {
    return request<{ success: boolean; message: string; assessment: Assessment }>(`/api/assessments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async submitAssessment(id: string): Promise<{ success: boolean; message: string; assessment: Assessment }> {
    return request<{ success: boolean; message: string; assessment: Assessment }>(`/api/assessments/${id}/submit`, {
      method: 'POST',
    });
  },
};
