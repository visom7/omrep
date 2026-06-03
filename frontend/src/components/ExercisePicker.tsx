import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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

const PATTERNS = ['SQUAT', 'BENCH', 'DEADLIFT', 'PRESS', 'ROW', 'ACCESSORY'] as const
type Pattern = typeof PATTERNS[number]

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '13px var(--pad)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  outline: 'none',
  marginBottom: 12,
}

const addBtnStyle: React.CSSProperties = {
  width: '100%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: 12,
  marginBottom: 12,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-strong)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
}

const pickItemStyle: React.CSSProperties = {
  width: '100%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px var(--pad)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  textAlign: 'left',
  marginBottom: 8,
}

export function ExercisePicker({ onSelect, selectedId }: ExercisePickerProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createPattern, setCreatePattern] = useState<Pattern>('SQUAT')
  const [createIsBasic, setCreateIsBasic] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => apiFetch<ExerciseOption[]>('/api/exercises'),
  })

  const filtered = useMemo(() => {
    if (!search) return exercises
    const q = search.toLowerCase()
    return exercises.filter((e) => e.name.toLowerCase().includes(q))
  }, [exercises, search])

  const handleCreate = async () => {
    if (!createName.trim()) return
    setIsCreating(true)
    try {
      const newEx = await apiFetch<ExerciseOption>('/api/exercises', {
        method: 'POST',
        body: JSON.stringify({
          name: createName.trim(),
          movementPattern: createPattern,
          isBasic: createIsBasic,
        }),
      })
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
      onSelect(newEx)
      setShowCreate(false)
    } catch {
      // ignore
    } finally {
      setIsCreating(false)
    }
  }

  if (showCreate) {
    return (
      <div>
        <button
          type="button"
          style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--color-text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-sm)' }}
          onClick={() => setShowCreate(false)}
        >
          ← {t('exercise.backToCatalog')}
        </button>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-black)', fontSize: 19, marginBottom: 16 }}>
          {t('exercise.createTitle')}
        </p>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            style={inputStyle}
            placeholder={t('exercise.namePlaceholder')}
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />
        </div>
        {/* Pattern grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {PATTERNS.map((p) => (
            <button
              key={p}
              type="button"
              data-pat={p}
              onClick={() => setCreatePattern(p)}
              style={{
                padding: '9px 6px',
                border: `1px solid ${createPattern === p ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                background: createPattern === p ? 'color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))' : 'var(--color-surface)',
                cursor: 'pointer',
                fontFamily: 'var(--font-num)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.06em',
                color: createPattern === p ? 'var(--color-text)' : 'var(--color-text-muted)',
              }}
            >
              {t(`exercise.pattern.${p}` as const)}
            </button>
          ))}
        </div>
        {/* Basic switch */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{t('exercise.isBasic')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={createIsBasic}
            onClick={() => setCreateIsBasic((v) => !v)}
            style={{
              width: 42, height: 25, borderRadius: 999,
              background: createIsBasic ? 'var(--color-accent)' : 'var(--color-surface-raised)',
              border: `1px solid ${createIsBasic ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
              cursor: 'pointer', position: 'relative', transition: 'background var(--transition-fast)',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: createIsBasic ? 19 : 2,
              width: 19, height: 19, borderRadius: '50%',
              background: createIsBasic ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
              transition: 'left var(--transition-fast)',
            }} />
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          {createIsBasic ? t('exercise.basicHint') : ''}
        </p>
        <button
          type="button"
          disabled={isCreating}
          onClick={handleCreate}
          style={{
            width: '100%', cursor: 'pointer', border: 0,
            borderRadius: 'var(--radius-md)', background: 'var(--color-accent)',
            color: 'var(--color-on-accent)', fontFamily: 'var(--font-sans)',
            fontWeight: 700, fontSize: 14, padding: 13, opacity: isCreating ? 0.5 : 1,
          }}
        >
          {t('exercise.createAdd')}
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Search */}
      <input
        type="search"
        style={inputStyle}
        placeholder={t('exercise.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {/* Add custom button */}
      <button type="button" style={addBtnStyle} onClick={() => setShowCreate(true)}>
        + {t('exercise.createCustom')}
      </button>
      {/* List */}
      <div>
        {filtered.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            onClick={() => onSelect(exercise)}
            data-pat={exercise.movementPattern}
            style={{
              ...pickItemStyle,
              background: selectedId === exercise.id ? 'var(--color-surface-raised)' : 'var(--color-surface)',
            }}
          >
            <div>
              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {exercise.name}
              </p>
              <p style={{
                fontFamily: 'var(--font-num)', fontSize: 10, fontWeight: 700,
                letterSpacing: '.06em', color: 'var(--pat, var(--color-text-muted))',
              }}>
                {t(`exercise.pattern.${exercise.movementPattern}` as const)}
                {exercise.isCustom && ` · ${t('exercise.customTag')}`}
              </p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p style={{ padding: 'var(--pad)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {t('exercise.noResults')}
          </p>
        )}
      </div>
    </div>
  )
}
