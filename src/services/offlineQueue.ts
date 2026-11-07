// Offline queue for assessment creation (+ optional evidence photo).

// Requires: pnpm add idb-keyval or npm i idb-keyval

import { get, set } from "idb-keyval"

import { api, ApiError, uploadAssessmentPhoto } from "./api"

import { authStore } from "./authStore"

const KEY = "nsp_offline_queue"

const MAX_ATTEMPTS = 5

export interface QueueItem {
  clientRequestId: string // generated once per logical assessment, reused on every retry

  ownerUserId: string // only replay for the user who queued it

  candidateId: string

  score: number

  grade: string

  photo?: Blob

  assessmentId?: string

  stage: "create" | "photo" | "done"

  attempts: number

  error?: string // permanent failure, shown to the user
}

const load = async () => (await get<QueueItem[]>(KEY)) ?? []

const save = (q: QueueItem[]) => set(KEY, q)

export async function enqueueAssessment(
  d: { candidateId: string score: number grade: string photo?: Blob },

  clientRequestId: string,
) {
  const owner = authStore.getState().user?.id

  if (!owner) throw new Error("Not signed in")

  const q = await load()

  // Re-saving the same logical assessment offline updates it instead of duplicating it.

  // (Same clientRequestId + changed values: confirm backend behaviour before relying on this.)

  const existing = q.find((i) => i.clientRequestId === clientRequestId)

  if (existing) {
    existing.score = d.score

    existing.grade = d.grade

    if (d.photo) existing.photo = d.photo
  } else {
    q.push({
      ...d,

      clientRequestId,

      ownerUserId: owner,

      stage: "create",

      attempts: 0,
    })
  }

  await save(q)

  void flushQueue()
}

/** Items the current user still has waiting (for a "N pending sync" badge). */

export async function pendingItems() {
  const me = authStore.getState().user?.id

  return (await load()).filter(
    (i) => i.ownerUserId === me && i.stage !== "done",
  )
}

export type FlushResult = "done" | "paused-offline" | "paused-auth" | "paused-rate"

let running = false

export async function flushQueue(): Promise<FlushResult> {
  const me = authStore.getState().user?.id

  if (!me || running) return "done"

  running = true

  try {
    const q = await load()

    for (const item of q) {
      if (item.ownerUserId !== me || item.stage === "done" || item.error)
        continue

      try {
        if (item.stage === "create") {
          // 201 (new) and 200 (replayed) are both "saved"

          const { assessment } = await api.createAssessment({
            candidateId: item.candidateId,

            score: item.score,

            grade: item.grade,

            clientRequestId: item.clientRequestId,
          })

          item.assessmentId = assessment.assessmentId

          item.stage = item.photo ? "photo" : "done"

          await save(q)
        }

        if (item.stage === "photo" && item.assessmentId && item.photo) {
          try {
            await uploadAssessmentPhoto(item.assessmentId, item.photo)
          } catch (e) {
            // 409 = already has media from an earlier attempt: treat as done

            if (!(e instanceof ApiError && e.status === 409)) throw e
          }

          item.stage = "done"

          item.photo = undefined

          await save(q)
        }
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.status === 0 || e.status >= 500) return "paused-offline"

          if (e.status === 401) return "paused-auth" // call flushQueue() again after re-login

          if (e.status === 429) return "paused-rate"

          item.error = e.message // permanent 4xx

          await save(q)

          continue
        }

        // S3 PUT failure etc. Retry a few times, then surface it.

        item.attempts += 1

        if (item.attempts >= MAX_ATTEMPTS) item.error = (e as Error).message

        await save(q)

        if (!item.error) return "paused-offline"
      }
    }

    await save((await load()).filter((i) => i.stage !== "done"))

    return "done"
  } finally {
    running = false
  }
}

/** Call once at app start. Returns a cleanup function. */

export function startQueueSync() {
  const onOnline = () => void flushQueue()

  window.addEventListener("online", onOnline)

  void flushQueue()

  return () => window.removeEventListener("online", onOnline)
}
