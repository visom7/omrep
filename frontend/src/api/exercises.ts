import { apiFetch } from './client'

export interface ExerciseOption {
  id: string
  name: string
  movementPattern: string
  isBasic: boolean
  isCustom: boolean
}

export interface CreateExercisePayload {
  name: string
  movementPattern: string
  isBasic: boolean
}

export const exercisesApi = {
  list: () => apiFetch<ExerciseOption[]>('/api/exercises'),

  create: (data: CreateExercisePayload) =>
    apiFetch<ExerciseOption>('/api/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: CreateExercisePayload) =>
    apiFetch<ExerciseOption>(`/api/exercises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/exercises/${id}`, { method: 'DELETE' }),
}
