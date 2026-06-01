import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { blocksApi, Block, SetGroup } from '../../api/blocks'
import { logsApi, enqueueOfflineLog, flushOfflineQueue } from '../../api/logs'
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

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>{t('session.today')}</h2>

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

      {/* Day list */}
      {selectedBlock && (
        <div className={styles.dayList}>
          {selectedBlock.weeks.map((week) => (
            <div key={week.number}>
              <p className={styles.weekLabel}>{t('week.label')} {week.number}</p>
              {week.days.map((day) => (
                <button
                  key={day.order}
                  className={styles.dayItem}
                  onClick={() => setSelectedDayOrder(day.order)}
                >
                  <span>{day.label || `${t('day.label')} ${day.order}`}</span>
                  <span className={styles.dayMeta}>
                    {day.entries.length} ejercicios →
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {blocks.length === 0 && (
        <p className={styles.empty}>{t('session.noBlocks')}</p>
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
      .map((sg) => ({ ...sg, exerciseName: e.exerciseName, exerciseId: e.exerciseId }))
  )
  const warmupSets: EnrichedSetGroup[] = day.entries.flatMap((e) =>
    e.setGroups
      .filter((sg) => sg.type === 'WARMUP')
      .map((sg) => ({ ...sg, exerciseName: e.exerciseName, exerciseId: e.exerciseId }))
  )

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

  return (
    <div className={styles.dayView}>
      <button className={styles.backBtn} onClick={onBack}>
        ← {t('day.label')}
      </button>
      <h3 className={styles.dayTitle}>{day.label}</h3>

      {!isOnline && (
        <div className={styles.offlineBanner}>{t('app.offline')}</div>
      )}

      {/* Warmup sets — collapsed by default */}
      {warmupSets.length > 0 && (
        <section className={styles.warmupSection}>
          <button
            className={styles.warmupToggle}
            onClick={() => setWarmupExpanded((v) => !v)}
          >
            {t('set.warmup')} ({warmupSets.length}) {warmupExpanded ? '▲' : '▼'}
          </button>
          {warmupExpanded && (
            <div className={styles.warmupList}>
              {warmupSets.map((sg) => (
                <div key={sg.id} className={styles.warmupRow}>
                  <span className={styles.exerciseName}>{sg.exerciseName}</span>
                  <span className={styles.setInfo}>
                    {sg.sets}×<span className={styles.mono}>{sg.reps}</span>{' '}
                    @ <span className={styles.mono}>{sg.weightKg}kg</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Working sets — the main in-gym display */}
      <section className={styles.workingSection}>
        {workingSets.map((sg) =>
          loggedSets[sg.id] ? (
            <div key={sg.id} className={`${styles.workingRow} ${styles.workingRowDone}`}>
              <div className={styles.workingInfo}>
                <span className={styles.exerciseName}>{sg.exerciseName}</span>
                <span className={styles.setInfo}>
                  {sg.sets}×<span className={styles.mono}>{sg.reps}</span>{' '}
                  @ <span className={styles.mono}>{sg.weightKg}kg</span>
                </span>
              </div>
              <span className={styles.logged}>✓</span>
            </div>
          ) : editingSgId === sg.id ? (
            <div key={sg.id} className={styles.workingRow}>
              <LogForm
                sg={sg}
                onSubmit={(w, r, rpe) => logSet(sg, w, r, rpe)}
                onCancel={() => setEditingSgId(null)}
              />
            </div>
          ) : (
            <button
              key={sg.id}
              className={styles.workingRow}
              onClick={() => setEditingSgId(sg.id)}
            >
              <div className={styles.workingInfo}>
                <span className={styles.exerciseName}>{sg.exerciseName}</span>
                <span className={styles.setInfo}>
                  {sg.sets}×<span className={styles.mono}>{sg.reps}</span>{' '}
                  @ <span className={styles.mono}>{sg.weightKg}kg</span>
                  {sg.targetRpe && <span className={styles.rpe}> RPE {sg.targetRpe}</span>}
                </span>
              </div>
              <span className={styles.logBtnLabel}>Tap</span>
            </button>
          )
        )}
      </section>
    </div>
  )
}

// --------------------------------------------------------------------------
// LogForm — inline edit for a set before logging
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
  const [rpe, setRpe] = useState(sg.targetRpe?.toString() ?? '')

  return (
    <div className={styles.logForm}>
      <div className={styles.logRow}>
        <label className={styles.logLabel}>{t('set.weight')}</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
          className={styles.logInput}
          step="0.5"
        />
      </div>
      <div className={styles.logRow}>
        <label className={styles.logLabel}>{t('set.reps')}</label>
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(parseInt(e.target.value) || 0)}
          className={styles.logInput}
        />
      </div>
      <div className={styles.logRow}>
        <label className={styles.logLabel}>{t('set.rpe')}</label>
        <input
          type="number"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          className={styles.logInput}
          step="0.5"
          min="1"
          max="10"
        />
      </div>
      <div className={styles.logActions}>
        <button onClick={onCancel} className={styles.cancelBtn}>
          {t('app.cancel')}
        </button>
        <button
          onClick={() => onSubmit(weight, reps, rpe ? parseFloat(rpe) : undefined)}
          className={styles.confirmBtn}
        >
          {t('session.logSet')}
        </button>
      </div>
    </div>
  )
}
