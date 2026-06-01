import { apiFetch } from './client'

export interface CreateLogRequest {
  date: string  // ISO-8601 instant
  blockId?: string
  setGroupId?: string
  exerciseId: string
  setType: 'WARMUP' | 'WORKING'
  weightKg: number
  reps: number
  rpe?: number
  completed: boolean
}

export interface WorkoutLog {
  id: string
  userId: string
  date: string
  blockId: string | null
  setGroupId: string | null
  exerciseId: string
  exerciseName: string
  movementPattern: string
  isBasic: boolean
  setType: 'WARMUP' | 'WORKING'
  weightKg: number
  reps: number
  rpe: number | null
  completed: boolean
  estimatedOneRmKg: number
}

const OFFLINE_QUEUE_KEY = 'offline_logs'

export const logsApi = {
  create: (data: CreateLogRequest) =>
    apiFetch<WorkoutLog>('/api/logs', { method: 'POST', body: JSON.stringify(data) }),

  query: (params: { from?: string; to?: string; blockId?: string } = {}) => {
    const qs = new URLSearchParams()
    if (params.from) qs.set('from', params.from)
    if (params.to) qs.set('to', params.to)
    if (params.blockId) qs.set('blockId', params.blockId)
    return apiFetch<WorkoutLog[]>(`/api/logs${qs.toString() ? '?' + qs : ''}`)
  },
}

/** Get all queued offline logs */
export function getOfflineQueue(): CreateLogRequest[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    return raw ? (JSON.parse(raw) as CreateLogRequest[]) : []
  } catch {
    return []
  }
}

/** Add a log to the offline queue */
export function enqueueOfflineLog(log: CreateLogRequest): void {
  const queue = getOfflineQueue()
  queue.push(log)
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

/** Remove all queued logs (after successful sync) */
export function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
}

/** Flush the offline queue — retries each POST. Returns count synced. */
export async function flushOfflineQueue(): Promise<number> {
  const queue = getOfflineQueue()
  if (queue.length === 0) return 0

  let synced = 0
  const failed: CreateLogRequest[] = []

  for (const log of queue) {
    try {
      await logsApi.create(log)
      synced++
    } catch {
      failed.push(log)
    }
  }

  if (failed.length > 0) {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed))
  } else {
    clearOfflineQueue()
  }

  return synced
}
