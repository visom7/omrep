import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { blocksApi, CreateBlockRequest, Week, ExerciseEntry, SetGroup } from '../../api/blocks'
import { BottomSheet } from '../../components/BottomSheet'
import { ExercisePicker, ExerciseOption } from '../../components/ExercisePicker'

interface FormData {
  name: string
  weeks: Week[]
}

// Shared button / input styles
const btnAccentStyle: React.CSSProperties = {
  cursor: 'pointer', border: 0, borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14,
  padding: '10px 18px', background: 'var(--color-accent)',
  color: 'var(--color-on-accent)', whiteSpace: 'nowrap',
}
const addBtnStyle: React.CSSProperties = {
  width: '100%', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  padding: 12, marginTop: 9, borderRadius: 'var(--radius-md)',
  border: '1px dashed var(--color-border-strong)', background: 'none',
  color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)', fontWeight: 600,
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  padding: '13px var(--pad)', color: 'var(--color-text)',
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)',
}

export function BlockEditorPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { blockId } = useParams<{ blockId?: string }>()
  const isEditing = !!blockId

  // State for day-level drill-down
  const [editingDay, setEditingDay] = useState<{ weekIndex: number; dayIndex: number } | null>(null)
  const [showExercisePicker, setShowExercisePicker] = useState(false)

  const { register, control, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { name: '', weeks: [] },
  })

  const { fields: weekFields, append: appendWeek } = useFieldArray({ control, name: 'weeks' })

  const createMutation = useMutation({
    mutationFn: (data: CreateBlockRequest) => blocksApi.create(data),
    onSuccess: (block) => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      navigate(`/blocks/${block.id}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateBlockRequest }) =>
      blocksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      navigate('/blocks')
    },
  })

  const onSubmit = async (data: FormData) => {
    const weeks: Week[] = data.weeks.map((w, i) => ({
      number: i + 1,
      days: w.days ?? [],
    }))
    if (isEditing) {
      await updateMutation.mutateAsync({ id: blockId!, data: { name: data.name, weeks } })
    } else {
      await createMutation.mutateAsync({ name: data.name, weeks })
    }
  }

  const weeks = watch('weeks')

  const handleAddDay = (weekIndex: number) => {
    const current = weeks[weekIndex]?.days ?? []
    const newDay = { order: current.length + 1, label: '', entries: [] }
    setValue(`weeks.${weekIndex}.days`, [...current, newDay])
  }

  const handleAddExercise = (exercise: ExerciseOption) => {
    if (!editingDay) return
    const { weekIndex, dayIndex } = editingDay
    const current = weeks[weekIndex]?.days[dayIndex]?.entries ?? []
    const newEntry: ExerciseEntry = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      movementPattern: exercise.movementPattern,
      order: current.length + 1,
      setGroups: [],
    }
    setValue(`weeks.${weekIndex}.days.${dayIndex}.entries`, [...current, newEntry])
    setShowExercisePicker(false)
  }

  const handleAddSetGroup = (weekIndex: number, dayIndex: number, entryIndex: number, type: 'WARMUP' | 'WORKING') => {
    const current = weeks[weekIndex]?.days[dayIndex]?.entries[entryIndex]?.setGroups ?? []
    const newSg: SetGroup = { id: crypto.randomUUID(), type, weightKg: 60, reps: 5, sets: 1, targetRpe: null }
    setValue(`weeks.${weekIndex}.days.${dayIndex}.entries.${entryIndex}.setGroups`, [...current, newSg])
  }

  // If we are in day editing mode
  if (editingDay !== null) {
    const { weekIndex, dayIndex } = editingDay
    const day = weeks[weekIndex]?.days[dayIndex]
    if (!day) {
      setEditingDay(null)
      return null
    }
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '0 var(--pad)' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--color-border)', marginBottom: 16 }}>
          <button
            type="button"
            style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => setEditingDay(null)}
          >
            ← {t('week.label')} {weekIndex + 1}
          </button>
          <span style={{ fontFamily: 'var(--font-num)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {t('week.label').toUpperCase()} {weekIndex + 1}
          </span>
        </div>

        {/* Day name */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            style={inputStyle}
            placeholder={t('editor.dayNameLabel')}
            value={day.label}
            onChange={(e) => setValue(`weeks.${weekIndex}.days.${dayIndex}.label`, e.target.value)}
          />
        </div>

        {/* Exercise entries */}
        {(day.entries ?? []).map((entry, entryIndex) => (
          <div key={entryIndex} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px var(--pad)', marginBottom: 9 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)', borderLeft: `3px solid var(--color-border-strong)`, paddingLeft: 9, marginBottom: 12 }}>
              {entry.exerciseName}
            </p>
            {/* Set groups */}
            {(entry.setGroups ?? []).map((sg) => (
              <div key={sg.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-num)', fontSize: 9, fontWeight: 700, letterSpacing: '.08em',
                  padding: '3px 6px', borderRadius: 4,
                  background: sg.type === 'WORKING' ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-text-muted) 22%, transparent)',
                  color: sg.type === 'WORKING' ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
                }}>
                  {sg.type === 'WORKING' ? t('editor.typeWorking').toUpperCase() : t('editor.typeWarmup').toUpperCase().slice(0, 3)}
                </span>
                <span style={{ flex: 1, fontFamily: 'var(--font-num)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  {sg.sets}×{sg.reps} @ {sg.weightKg}kg{sg.targetRpe ? ` RPE ${sg.targetRpe}` : ''}
                </span>
              </div>
            ))}
            {/* Add warmup / working set buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" style={{ ...addBtnStyle, flex: 1, marginTop: 0, fontSize: 12 }} onClick={() => handleAddSetGroup(weekIndex, dayIndex, entryIndex, 'WARMUP')}>
                + {t('editor.addWarmup')}
              </button>
              <button type="button" style={{ ...addBtnStyle, flex: 1, marginTop: 0, fontSize: 12 }} onClick={() => handleAddSetGroup(weekIndex, dayIndex, entryIndex, 'WORKING')}>
                + {t('editor.addWorkingSet')}
              </button>
            </div>
          </div>
        ))}

        {(day.entries ?? []).length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--pad) 0' }}>
            {t('editor.noExercises')}
          </p>
        )}

        {/* Add exercise */}
        <button type="button" style={addBtnStyle} onClick={() => setShowExercisePicker(true)}>
          + {t('editor.addExercise')}
        </button>

        {/* Exercise picker sheet */}
        <BottomSheet
          isOpen={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          title={t('exercise.addTitle')}
        >
          <ExercisePicker onSelect={handleAddExercise} />
        </BottomSheet>
      </div>
    )
  }

  // Block-level editor
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px var(--pad)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <button
          type="button"
          style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={() => navigate('/blocks')}
        >
          ← {t('nav.blocks')}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit(onSubmit)}
          style={{ ...btnAccentStyle, opacity: isSubmitting ? 0.5 : 1 }}
        >
          {t('editor.save')}
        </button>
      </div>

      <div style={{ padding: '20px var(--pad)', flex: 1, overflowY: 'auto' }}>
        {/* Block name */}
        <input
          type="text"
          {...register('name', { required: true })}
          placeholder={t('editor.blockNamePlaceholder')}
          style={{ ...inputStyle, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)', marginBottom: 24, border: 'none', borderBottom: '2px solid var(--color-border)', borderRadius: 0, padding: '8px 0' }}
        />

        {/* Weeks */}
        {weekFields.map((field, weekIndex) => {
          const weekDays = weeks[weekIndex]?.days ?? []
          return (
            <div key={field.id} style={{ marginBottom: 24 }}>
              {/* Week header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontFamily: 'var(--font-num)', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                {t('week.label').toUpperCase()} {weekIndex + 1}
                <span style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              </div>
              {/* Day cards */}
              {weekDays.map((day, dayIndex) => (
                <button
                  key={dayIndex}
                  type="button"
                  onClick={() => setEditingDay({ weekIndex, dayIndex })}
                  style={{
                    width: '100%', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px var(--pad)', marginBottom: 9,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    {day.label || `${t('day.label')} ${dayIndex + 1}`}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>›</span>
                </button>
              ))}
              {/* Add day */}
              <button type="button" style={addBtnStyle} onClick={() => handleAddDay(weekIndex)}>
                + {t('editor.addDay')}
              </button>
            </div>
          )
        })}

        {/* Add week */}
        <button
          type="button"
          style={addBtnStyle}
          onClick={() => appendWeek({ number: weekFields.length + 1, days: [] })}
        >
          + {t('editor.addWeek')}
        </button>
      </div>
    </div>
  )
}
