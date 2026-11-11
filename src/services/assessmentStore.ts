import { get, set } from "idb-keyval"

export interface SavedAssessmentCriteria {
  id: number
  label?: string
  max?: number
  score: string
}

export interface SavedAssessmentData {
  candidateId: string
  candidateName?: string
  tradeCategory?: string
  testingHubId?: number
  assessmentId?: string
  criteria?: SavedAssessmentCriteria[]
  score: number
  grade: string
  status?: string
  credentialId?: string
  rootHash?: string | null
  submittedAt?: string
  updatedAt: string
}

const STORAGE_PREFIX = "nsp_assessment_cand_"
const STORAGE_ID_PREFIX = "nsp_assessment_asm_"
const STORAGE_LIST_KEY = "nsp_all_saved_assessments"
const IDB_KEY = "nsp_saved_assessments_idb"

function getLocalList(): SavedAssessmentData[] {
  try {
    const raw = localStorage.getItem(STORAGE_LIST_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

function setLocalList(list: SavedAssessmentData[]) {
  try {
    localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(list))
    // Asynchronously sync to IndexedDB
    void set(IDB_KEY, list)
  } catch {}
}

export const assessmentStore = {
  saveAssessmentLocal(data: SavedAssessmentData) {
    if (!data.candidateId && !data.assessmentId) return

    const normalizedData: SavedAssessmentData = {
      ...data,
      updatedAt: data.updatedAt || new Date().toISOString(),
    }

    try {
      if (data.candidateId) {
        localStorage.setItem(
          `${STORAGE_PREFIX}${data.candidateId}`,
          JSON.stringify(normalizedData),
        )
      }
      if (data.assessmentId) {
        localStorage.setItem(
          `${STORAGE_ID_PREFIX}${data.assessmentId}`,
          JSON.stringify(normalizedData),
        )
      }

      const list = getLocalList()
      const existingIdx = list.findIndex(
        (item) =>
          (data.candidateId && item.candidateId === data.candidateId) ||
          (data.assessmentId && item.assessmentId === data.assessmentId),
      )

      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...normalizedData }
      } else {
        list.push(normalizedData)
      }

      setLocalList(list)
    } catch (err) {
      console.warn("assessmentStore.saveAssessmentLocal error:", err)
    }
  },

  getAssessmentByCandidate(candidateId: string): SavedAssessmentData | null {
    if (!candidateId) return null
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${candidateId}`)
      if (raw) return JSON.parse(raw)
    } catch {}

    const list = getLocalList()
    return (
      list.find(
        (item) =>
          item.candidateId === candidateId ||
          String(item.candidateId) === String(candidateId),
      ) || null
    )
  },

  getAssessmentById(assessmentId: string): SavedAssessmentData | null {
    if (!assessmentId) return null
    try {
      const raw = localStorage.getItem(`${STORAGE_ID_PREFIX}${assessmentId}`)
      if (raw) return JSON.parse(raw)
    } catch {}

    const list = getLocalList()
    return (
      list.find(
        (item) =>
          item.assessmentId === assessmentId ||
          String(item.assessmentId) === String(assessmentId),
      ) || null
    )
  },

  getAllSavedAssessments(): SavedAssessmentData[] {
    return getLocalList()
  },

  getSubmittedAssessments(): SavedAssessmentData[] {
    const list = getLocalList()
    return list.filter((item) => {
      const s = (item.status || "").toUpperCase()
      return s === "SUBMITTED" || s === "PENDING_APPROVAL" || s === "IN_REVIEW"
    })
  },

  async hydrateFromIndexedDB(): Promise<void> {
    try {
      const fromIdb = await get<SavedAssessmentData[]>(IDB_KEY)
      if (Array.isArray(fromIdb) && fromIdb.length > 0) {
        const local = getLocalList()
        const map = new Map<string, SavedAssessmentData>()
        for (const item of fromIdb) {
          const key = item.candidateId || item.assessmentId
          if (key) map.set(key, item)
        }
        for (const item of local) {
          const key = item.candidateId || item.assessmentId
          if (key) map.set(key, item)
        }
        setLocalList(Array.from(map.values()))
      }
    } catch {}
  },
}

// Hydrate at load time
void assessmentStore.hydrateFromIndexedDB()
