import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { blocksApi, Block, SetGroup } from '../../api/blocks'
import { logsApi, enqueueOfflineLog, flushOfflineQueue } from '../../api/logs'
import { PlateBar } from '../../components/PlateBar'
import styles from './SessionPage.module.css'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface DayWithWeek {
  order: number
  label: string
  entries: Block['weeks'][0]['days'][0]['entries']
  weekNumber: number
}

interface EnrichedSetGroup extends SetGroup {
  exerciseName: string
  exerciseId: string
  isBasic?: boolean
  movementPattern?: string
}

// --------------------------------------------------------------------------
// SessionPage — block tabs + day picker
// --------------------------------------------------------------------------

export function SessionPage() {
  const { t } = useTranslation()
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [selectedDayOrder, setSelectedDayOrder] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      await flushOfflineQueue()
    }
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks'],
    queryFn: blocksApi.list,
  })

  const { data: selectedBlock } = useQuery({
    queryKey: ['block', selectedBlockId],
    queryFn: () => blocksApi.get(selectedBlockId!),
    enabled: !!selectedBlockId,
  })

  useEffect(() => {
    if (blocks.length > 0 && !selectedBlockId) {
      setSelectedBlockId(blocks[0]!.id)
    }
  }, [blocks, selectedBlockId])

  const allDays: DayWithWeek[] = selectedBlock?.weeks.flatMap((w) =>
    w.days.map((d) => ({ ...d, weekNumber: w.number }))
  ) ?? []

  const currentDay = allDays.find((d) => d.order === selectedDayOrder) ?? null

  if (selectedDayOrder !== null && currentDay && selectedBlock) {
    return (
      <DayView
        block={selectedBlock}
        day={currentDay}
        isOnline={isOnline}
        onBack={() => setSelectedDayOrder(null)}
      />
    )
  }

  // Determine today's date for display
  const today = new Date()
  const todayStr = today.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className={styles.screen}>
      {/* Page header */}
      <div className={styles.phead}>
        <div>
          <p className={styles.pheadKick}>{t('session.today')}</p>
          <h1 className={styles.pheadH1}>{todayStr}</h1>
        </div>
        {/* Streak chip (placeholder — streak count not in API yet) */}
        <div className={styles.streak}>
          🔥 0
        </div>
      </div>

      {/* Block selector — horizontal tabs */}
      {blocks.length > 0 && (
        <div className={styles.tabs}>
          {blocks.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setSelectedBlockId(b.id)
                setSelectedDayOrder(null)
              }}
              className={`${styles.tab} ${selectedBlockId === b.id ? styles.tabActive : ''}`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Day list grouped by week */}
      {selectedBlock && (
        <div>
          {selectedBlock.weeks.map((week) => {
            const dayCount = week.days.length
            return (
              <div key={week.number}>
                <div className={styles.weekHead}>
                  {t('week.label').toUpperCase()} {week.number}
                  <span className="rule" style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  <span>{t('blocks.daysCount', { count: dayCount })}</span>
                </div>
                {week.days.map((day) => {
                  const workingCount = day.entries.reduce(
                    (acc, e) => acc + e.setGroups.filter((sg) => sg.type === 'WORKING').length,
                    0
                  )
                  const exerciseCount = day.entries.length
                  // Determine dominant pattern from entries
                  const patterns = day.entries.map((e) => (e as unknown as { movementPattern?: string }).movementPattern).filter(Boolean)
                  const dominantPattern = patterns[0] as string | undefined

                  return (
                    <button
                      key={day.order}
                      className={styles.dayCard}
                      data-pat={dominantPattern}
                      onClick={() => setSelectedDayOrder(day.order)}
                    >
                      <div style={{ flex: 1 }}>
                        {dominantPattern && (
                          <p className={styles.dayCardTag}>{dominantPattern}</p>
                        )}
                        <p className={styles.dayCardName}>
                          {day.label || `${t('day.label')} ${day.order}`}
                        </p>
                        <p className={styles.dayCardMeta}>
                          {t('session.exercisesCount', { count: exerciseCount })} · {t('session.workingSetsCount', { count: workingCount })}
                        </p>
                      </div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>›</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {blocks.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)', padding: 'var(--pad) 0' }}>
          {t('session.noBlocks')}
        </p>
      )}
    </div>
  )
}

// --------------------------------------------------------------------------
// DayView — the in-gym screen
// --------------------------------------------------------------------------

interface DayViewProps {
  block: Block
  day: DayWithWeek
  isOnline: boolean
  onBack: () => void
}

function DayView({ block, day, isOnline, onBack }: DayViewProps) {
  const { t } = useTranslation()
  const [warmupExpanded, setWarmupExpanded] = useState(false)
  const [loggedSets, setLoggedSets] = useState<Record<string, boolean>>({})
  const [editingSgId, setEditingSgId] = useState<string | null>(null)

  const workingSets: EnrichedSetGroup[] = day.entries.flatMap((e) =>
    e.setGroups
      .filter((sg) => sg.type === 'WORKING')
      .map((sg) => ({
        ...sg,
        exerciseName: e.exerciseName,
        exerciseId: e.exerciseId,
        isBasic: (e as unknown as { isBasic?: boolean }).isBasic,
        movementPattern: (e as unknown as { movementPattern?: string }).movementPattern,
      }))
  )
  const warmupSets: EnrichedSetGroup[] = day.entries.flatMap((e) =>
    e.setGroups
      .filter((sg) => sg.type === 'WARMUP')
      .map((sg) => ({ ...sg, exerciseName: e.exerciseName, exerciseId: e.exerciseId }))
  )

  const doneCount = workingSets.filter((sg) => loggedSets[sg.id]).length
  const totalCount = workingSets.length

  const logSet = async (sg: EnrichedSetGroup, weight: number, reps: number, rpe?: number) => {
    const logReq = {
      date: new Date().toISOString(),
      blockId: block.id,
      setGroupId: sg.id,
      exerciseId: sg.exerciseId,
      setType: 'WORKING' as const,
      weightKg: weight,
      reps,
      rpe,
      completed: true,
    }

    if (!isOnline) {
      enqueueOfflineLog(logReq)
    } else {
      try {
        await logsApi.create(logReq)
      } catch {
        enqueueOfflineLog(logReq)
      }
    }
    setLoggedSets((prev) => ({ ...prev, [sg.id]: true }))
    setEditingSgId(null)
  }

  // Determine dominant pattern for the day
  const patterns = day.entries.map((e) => (e as unknown as { movementPattern?: string }).movementPattern).filter(Boolean)
  const dominantPattern = patterns[0] as string | undefined

  // Max weight seen (for 1RM strip)
  const maxWeight = workingSets.reduce((max, sg) => Math.max(max, sg.weightKg), 0)

  return (
    <div className={styles.screen}>
      <button className={styles.backbtn} onClick={onBack}>
        ← {t('day.label')}
      </button>

      {/* Page header */}
      <div className={styles.phead}>
        <div>
          <p
            className={styles.pheadKick}
            data-pat={dominantPattern}
          >
            {t('week.label').toUpperCase()} {day.weekNumber}
            {dominantPattern ? ` · ${dominantPattern}` : ''}
          </p>
          <h1 className={styles.pheadH1}>{day.label || `${t('day.label')} ${day.order}`}</h1>
        </div>
      </div>

      {/* Completion bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressBarFill}
          style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : '0%' }}
        />
        <span className={styles.progressBarLabel}>
          {t('session.setsProgress', { done: doneCount, total: totalCount })}
        </span>
      </div>

      {/* Warmup toggle */}
      {warmupSets.length > 0 && (
        <button
          className={styles.warmToggle}
          onClick={() => setWarmupExpanded((v) => !v)}
          style={{ marginBottom: 12 }}
        >
          <span>🔥 {t('set.warmup')} ({warmupSets.length})</span>
          <span>{warmupExpanded ? '▲' : '▼'}</span>
        </button>
      )}
      {warmupExpanded && (
        <div style={{ marginBottom: 12 }}>
          {warmupSets.map((sg) => (
            <div key={sg.id} className={styles.warmRow}>
              <span>{sg.exerciseName}</span>
              <span style={{ fontFamily: 'var(--font-num)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {sg.sets}×{sg.reps} @ {sg.weightKg}kg
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Working sets section */}
      <p className={styles.seclabel}>{t('session.workingSetsLabel')}</p>
      <div className={styles.sets}>
        {workingSets.map((sg) =>
          editingSgId === sg.id ? (
            <div key={sg.id} className={styles.logForm}>
              <LogForm
                sg={sg}
                onSubmit={(w, r, rpe) => logSet(sg, w, r, rpe)}
                onCancel={() => setEditingSgId(null)}
              />
            </div>
          ) : (
            <div
              key={sg.id}
              className={`${styles.setRow} ${loggedSets[sg.id] ? styles.setRowDone : ''}`}
              onClick={() => !loggedSets[sg.id] && setEditingSgId(sg.id)}
              style={{ cursor: loggedSets[sg.id] ? 'default' : 'pointer' }}
            >
              {/* Check circle */}
              <div className={`${styles.setRowCheck} ${loggedSets[sg.id] ? styles.setRowCheckOn : ''}`}>
                {loggedSets[sg.id] && <span style={{ fontSize: 12, color: 'var(--color-on-accent)' }}>✓</span>}
              </div>
              {/* Exercise name + meta */}
              <div style={{ flex: 1 }}>
                <div className={styles.setRowEx}>
                  {sg.isBasic && <span className={styles.basicDot} />}
                  {sg.exerciseName}
                </div>
                <div className={styles.setRowMeta}>
                  {sg.sets} {t('set.sets')} · {sg.targetRpe
                    ? t('session.targetRpe', { rpe: sg.targetRpe })
                    : t('session.noTarget')}
                </div>
              </div>
              {/* Weight + reps */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span className={styles.setRowReps}>{sg.reps} reps</span>
                <span className={styles.setRowKg}>{sg.weightKg}</span>
                <PlateBar kg={sg.weightKg} />
              </div>
            </div>
          )
        )}
      </div>

      {/* 1RM strip */}
      {maxWeight > 0 && (
        <div className={styles.oneRmStrip}>
          <span>{t('session.dayOneRm')}</span>
          <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, color: 'var(--color-accent)' }}>
            {maxWeight}<i style={{ fontSize: '.62em', opacity: .6, fontStyle: 'normal', marginLeft: 1 }}>kg</i>
          </span>
        </div>
      )}
    </div>
  )
}

// --------------------------------------------------------------------------
// LogForm — stepper-based inline log form
// --------------------------------------------------------------------------

interface LogFormProps {
  sg: EnrichedSetGroup
  onSubmit: (weight: number, reps: number, rpe?: number) => void
  onCancel: () => void
}

function LogForm({ sg, onSubmit, onCancel }: LogFormProps) {
  const { t } = useTranslation()
  const [weight, setWeight] = useState(sg.weightKg)
  const [reps, setReps] = useState(sg.reps)
  const [rpe, setRpe] = useState(sg.targetRpe ?? 7)

  // Epley 1RM estimate: w * (1 + reps/30)
  const estimated1RM = reps > 0 ? Math.round(weight * (1 + reps / 30)) : weight

  return (
    <div>
      <div className={styles.logFormGrid}>
        {/* Peso stepper */}
        <div className={styles.stepper}>
          <p className={styles.stepperLabel}>{t('set.weight')}</p>
          <div className={styles.stepperCtl}>
            <button type="button" onClick={() => setWeight((v) => Math.max(0, Math.round((v - 2.5) * 10) / 10))}>−</button>
            <span className={styles.stepperValue}>{weight}</span>
            <button type="button" onClick={() => setWeight((v) => Math.round((v + 2.5) * 10) / 10)}>+</button>
          </div>
        </div>
        {/* Reps stepper */}
        <div className={styles.stepper}>
          <p className={styles.stepperLabel}>{t('set.reps')}</p>
          <div className={styles.stepperCtl}>
            <button type="button" onClick={() => setReps((v) => Math.max(1, v - 1))}>−</button>
            <span className={styles.stepperValue}>{reps}</span>
            <button type="button" onClick={() => setReps((v) => v + 1)}>+</button>
          </div>
        </div>
        {/* RPE stepper */}
        <div className={styles.stepper}>
          <p className={styles.stepperLabel}>{t('set.rpe')}</p>
          <div className={styles.stepperCtl}>
            <button type="button" onClick={() => setRpe((v) => Math.max(5, Math.round((v - 0.5) * 10) / 10))}>−</button>
            <span className={styles.stepperValue}>{rpe}</span>
            <button type="button" onClick={() => setRpe((v) => Math.min(10, Math.round((v + 0.5) * 10) / 10))}>+</button>
          </div>
        </div>
      </div>
      {/* 1RM estimate */}
      <p className={styles.oneRmEstimate}>≈ 1RM: {estimated1RM}kg</p>
      {/* Actions */}
      <div className={styles.logActions}>
        <button
          type="button"
          onClick={onCancel}
          className={`${styles.btn} ${styles.btnGhost}`}
          style={{ flex: 1 }}
        >
          {t('app.cancel')}
        </button>
        <button
          type="button"
          onClick={() => onSubmit(weight, reps, rpe)}
          className={`${styles.btn} ${styles.btnAccent}`}
          style={{ flex: 1 }}
        >
          {t('session.logSet')}
        </button>
      </div>
    </div>
  )
}
