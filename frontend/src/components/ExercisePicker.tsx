import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

export interface ExerciseOption {
  id: string
  name: string
  movementPattern: string
  isBasic: boolean
  isCustom: boolean
}

interface ExercisePickerProps {
  onSelect: (exercise: ExerciseOption) => void
  selectedId?: string
}

export function ExercisePicker({ onSelect, selectedId }: ExercisePickerProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => apiFetch<ExerciseOption[]>('/api/exercises'),
  })

  const filtered = useMemo(() => {
    if (!search) return exercises
    const q = search.toLowerCase()
    return exercises.filter((e) => e.name.toLowerCase().includes(q))
  }, [exercises, search])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      <input
        type="search"
        placeholder={t('exercise.name')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          height: 'var(--tap-target)',
          padding: '0 var(--space-md)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text)',
          fontSize: 'var(--text-base)',
        }}
      />
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
      }}>
        {filtered.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => onSelect(exercise)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              minHeight: 'var(--tap-target)',
              padding: '0 var(--space-md)',
              background: selectedId === exercise.id ? 'var(--color-surface-raised)' : 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span>{exercise.name}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {exercise.movementPattern}
              {exercise.isCustom && ` · ${t('exercise.custom')}`}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p style={{ padding: 'var(--space-md)', color: 'var(--color-text-muted)' }}>
            {t('app.loading')}
          </p>
        )}
      </div>
    </div>
  )
}
