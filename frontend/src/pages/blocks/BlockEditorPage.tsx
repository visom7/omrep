import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

  // State for duplicate week sheet
  const [duplicatingWeekIndex, setDuplicatingWeekIndex] = useState<number | null>(null)
  const [weekDelta, setWeekDelta] = useState<string>('0')

  const { register, control, handleSubmit, watch, setValue, reset, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { name: '', weeks: [] },
  })

  const { fields: weekFields, append: appendWeek, replace: replaceWeeks } = useFieldArray({ control, name: 'weeks' })

  // Load existing block when editing
  const { data: existingBlock, isLoading: isBlockLoading } = useQuery({
    queryKey: ['block', blockId],
    queryFn: () => blocksApi.get(blockId!),
    enabled: isEditing,
  })

  useEffect(() => {
    if (existingBlock) {
      reset({ name: existingBlock.name, weeks: existingBlock.weeks })
    }
  }, [existingBlock, reset])

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
      queryClient.invalidateQueries({ queryKey: ['block', blockId] })
      navigate(`/blocks/${blockId}`)
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

  const handleConfirmDuplicateWeek = () => {
    if (duplicatingWeekIndex === null) return
    const delta = parseFloat(weekDelta) || 0
    const sourceWeek = weeks[duplicatingWeekIndex]

    // Deep copy the week with new UUIDs on all set groups
    const copiedDays = (sourceWeek.days ?? []).map((day) => ({
      ...day,
      entries: (day.entries ?? []).map((entry) => ({
        ...entry,
        setGroups: (entry.setGroups ?? []).map((sg) => ({
          ...sg,
          id: crypto.randomUUID(),
          weightKg: sg.type === 'WORKING'
            ? Math.max(0, sg.weightKg + delta)
            : sg.weightKg,
        })),
      })),
    }))

    const newWeek: Week = {
      number: duplicatingWeekIndex + 2, // will be renumbered
      days: copiedDays,
    }

    // Insert after source week and renumber
    const allWeeks = [...weeks]
    allWeeks.splice(duplicatingWeekIndex + 1, 0, newWeek)
    const renumbered = allWeeks.map((w, i) => ({ ...w, number: i + 1 }))

    replaceWeeks(renumbered)
    setDuplicatingWeekIndex(null)
    setWeekDelta('0')
  }

  // Helpers for set group editing
  const handleUpdateSetGroup = (
    weekIndex: number, dayIndex: number, entryIndex: number, sgIndex: number,
    field: keyof SetGroup, value: unknown,
  ) => {
    const current = weeks[weekIndex]?.days[dayIndex]?.entries[entryIndex]?.setGroups ?? []
    const updated = current.map((sg, i) => i === sgIndex ? { ...sg, [field]: value } : sg)
    setValue(`weeks.${weekIndex}.days.${dayIndex}.entries.${entryIndex}.setGroups`, updated)
  }

  const handleRemoveSetGroup = (weekIndex: number, dayIndex: number, entryIndex: number, sgIndex: number) => {
    const current = weeks[weekIndex]?.days[dayIndex]?.entries[entryIndex]?.setGroups ?? []
    setValue(`weeks.${weekIndex}.days.${dayIndex}.entries.${entryIndex}.setGroups`, current.filter((_, i) => i !== sgIndex))
  }

  const handleRemoveEntry = (weekIndex: number, dayIndex: number, entryIndex: number) => {
    const current = weeks[weekIndex]?.days[dayIndex]?.entries ?? []
    setValue(`weeks.${weekIndex}.days.${dayIndex}.entries`, current.filter((_, i) => i !== entryIndex))
  }

  // Shared stepper styles
  const stepperNumInputStyle: React.CSSProperties = {
    width: 52, textAlign: 'center', background: 'var(--color-surface)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)', fontFamily: 'var(--font-num)', fontSize: 13,
    padding: '4px 2px', MozAppearance: 'textfield',
  }
  const weightInputStyle: React.CSSProperties = {
    width: 72, textAlign: 'center', background: 'var(--color-surface)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)', fontFamily: 'var(--font-num)', fontSize: 13,
    padding: '4px 2px', MozAppearance: 'textfield',
  }
  const stepperBtnStyle: React.CSSProperties = {
    width: 28, height: 28, cursor: 'pointer', flexShrink: 0,
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--color-surface-raised)', color: 'var(--color-text)',
    fontFamily: 'var(--font-num)', fontSize: 16, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
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
          <button
            type="button"
            style={{ ...btnAccentStyle, fontSize: 13, padding: '8px 14px' }}
            onClick={() => setEditingDay(null)}
          >
            {t('editor.saveDay')}
          </button>
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
            {/* Entry header with remove button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)', borderLeft: `3px solid var(--color-border-strong)`, paddingLeft: 9, margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.exerciseName}
              </p>
              <button
                type="button"
                aria-label={t('editor.removeEntry')}
                onClick={() => handleRemoveEntry(weekIndex, dayIndex, entryIndex)}
                style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 16, padding: '2px 6px', flexShrink: 0 }}
              >
                ×
              </button>
            </div>
            {/* Set groups — editable */}
            {(entry.setGroups ?? []).map((sg, sgIndex) => (
              <div key={sg.id} style={{ padding: '9px 8px', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                {/* Type badge row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-num)', fontSize: 9, fontWeight: 700, letterSpacing: '.08em',
                    padding: '3px 6px', borderRadius: 4,
                    background: sg.type === 'WORKING' ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-text-muted) 22%, transparent)',
                    color: sg.type === 'WORKING' ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
                  }}>
                    {sg.type === 'WORKING' ? t('editor.typeWorking').toUpperCase() : t('editor.typeWarmup').toUpperCase().slice(0, 3)}
                  </span>
                  <button
                    type="button"
                    aria-label={t('editor.removeSetGroup')}
                    onClick={() => handleRemoveSetGroup(weekIndex, dayIndex, entryIndex, sgIndex)}
                    style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 16, padding: '2px 4px' }}
                  >
                    ×
                  </button>
                </div>
                {/* Editable fields row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {/* Sets stepper */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-num)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '.06em' }}>{t('editor.sets').toUpperCase()}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <button type="button" style={stepperBtnStyle} onClick={() => handleUpdateSetGroup(weekIndex, dayIndex, entryIndex, sgIndex, 'sets', Math.max(1, sg.sets - 1))}>−</button>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={sg.sets}
                        aria-label={t('editor.sets')}
                        style={stepperNumInputStyle}
                        onChange={(e) => handleUpdateSetGroup(weekIndex, dayIndex, entryIndex, sgIndex, 'sets', Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <button type="button" style={stepperBtnStyle} onClick={() => handleUpdateSetGroup(weekIndex, dayIndex, entryIndex, sgIndex, 'sets', sg.sets + 1)}>+</button>
                    </div>
                  </div>
                  {/* Reps stepper */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-num)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '.06em' }}>{t('editor.reps').toUpperCase()}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <button type="button" style={stepperBtnStyle} onClick={() => handleUpdateSetGroup(weekIndex, dayIndex, entryIndex, sgIndex, 'reps', Math.max(1, sg.reps - 1))}>−</button>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={sg.reps}
                        aria-label={t('editor.reps')}
                        style={stepperNumInputStyle}
                        onChange={(e) => handleUpdateSetGroup(weekIndex, dayIndex, entryIndex, sgIndex, 'reps', Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <button type="button" style={stepperBtnStyle} onClick={() => handleUpdateSetGroup(weekIndex, dayIndex, entryIndex, sgIndex, 'reps', sg.reps + 1)}>+</button>
                    </div>
                  </div>
                  {/* Weight input */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-num)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '.06em' }}>{t('editor.weightKg').toUpperCase()}</span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={sg.weightKg}
                      aria-label={t('editor.weightKg')}
                      style={weightInputStyle}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        handleUpdateSetGroup(weekIndex, dayIndex, entryIndex, sgIndex, 'weightKg', isNaN(val) ? 0 : Math.max(0, val))
                      }}
                    />
                  </div>
                  {/* RPE input (optional) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-num)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '.06em' }}>{t('editor.targetRpe').toUpperCase()}</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      step={1}
                      value={sg.targetRpe ?? ''}
                      aria-label={t('editor.targetRpe')}
                      placeholder="—"
                      style={stepperNumInputStyle}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        handleUpdateSetGroup(weekIndex, dayIndex, entryIndex, sgIndex, 'targetRpe', e.target.value === '' ? null : (isNaN(val) ? null : Math.min(10, Math.max(1, val))))
                      }}
                    />
                  </div>
                </div>
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

  // Show loading state while fetching existing block
  if (isEditing && isBlockLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>{t('app.loading')}</p>
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
                <button
                  type="button"
                  aria-label={t('editor.duplicateWeek')}
                  onClick={() => { setDuplicatingWeekIndex(weekIndex); setWeekDelta('0') }}
                  style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'var(--font-num)', fontSize: 10, padding: '3px 8px', fontWeight: 700, letterSpacing: '.04em', whiteSpace: 'nowrap' }}
                >
                  {t('editor.duplicateWeek')}
                </button>
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

      {/* Duplicate week sheet */}
      <BottomSheet
        isOpen={duplicatingWeekIndex !== null}
        onClose={() => setDuplicatingWeekIndex(null)}
        title={t('editor.duplicateWeek')}
      >
        <div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 16 }}>
            {t('editor.duplicateWeekHint')}
          </p>
          <label style={{ display: 'block', fontFamily: 'var(--font-num)', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
            {t('editor.weekDeltaKg')}
          </label>
          <input
            type="number"
            step={0.5}
            value={weekDelta}
            aria-label={t('editor.weekDeltaKg')}
            placeholder="0"
            onChange={(e) => setWeekDelta(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16 }}
          />
          <button
            type="button"
            onClick={handleConfirmDuplicateWeek}
            style={{ ...btnAccentStyle, width: '100%', justifyContent: 'center', display: 'flex' }}
          >
            {t('app.confirm')}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
