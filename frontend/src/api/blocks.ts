import { apiFetch } from './client'

export interface SetGroup {
  id: string
  type: 'WARMUP' | 'WORKING'
  weightKg: number
  reps: number
  sets: number
  targetRpe: number | null
}

export interface ExerciseEntry {
  exerciseId: string
  exerciseName: string
  movementPattern: string
  order: number
  setGroups: SetGroup[]
}

export interface Day {
  order: number
  label: string
  entries: ExerciseEntry[]
}

export interface Week {
  number: number
  days: Day[]
}

export interface Block {
  id: string
  userId: string
  name: string
  order: number
  createdAt: string
  weeks: Week[]
}

export interface BlockSummary {
  id: string
  name: string
  order: number
  createdAt: string
  weekCount: number
}

export interface CreateBlockRequest {
  name: string
  weeks: Week[]
}

export interface DuplicateBlockRequest {
  progressionType: 'WEIGHT' | 'REPS' | null
  progressionValue: number | null
}

export const blocksApi = {
  list: () => apiFetch<BlockSummary[]>('/api/blocks'),

  get: (id: string) => apiFetch<Block>(`/api/blocks/${id}`),

  create: (data: CreateBlockRequest) =>
    apiFetch<Block>('/api/blocks', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: CreateBlockRequest) =>
    apiFetch<Block>(`/api/blocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<void>(`/api/blocks/${id}`, { method: 'DELETE' }),

  duplicate: (id: string, req: DuplicateBlockRequest) =>
    apiFetch<Block>(`/api/blocks/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),
}
