import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { ExercisePicker, ExerciseOption } from '../components/ExercisePicker'
import { CsvExportSheet } from '../components/CsvExportSheet'
import styles from './ProgressPage.module.css'

interface WeeklyOneRmTotal {
  week: string
  totalOneRm: number
}

interface WeeklyVolume {
  week: string
  totalVolume: number
}

type Mode = 'oneRm' | 'volume'

function getDateRange(weeksBack = 12) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - weeksBack * 7)
  return {
    from: from.toISOString().split('T')[0]!,
    to: to.toISOString().split('T')[0]!,
  }
}

export function ProgressPage() {
  const { t } = useTranslation()
  const { accessToken } = useAuth()
  const [mode, setMode] = useState<Mode>('oneRm')
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const { from, to } = getDateRange(12)

  const { data: oneRmData = [], isLoading: oneRmLoading } = useQuery({
    queryKey: ['progress', 'one-rm', from, to],
    queryFn: () => apiFetch<WeeklyOneRmTotal[]>(
      `/api/progress/one-rm-total?from=${from}&to=${to}&bucket=week`
    ),
    enabled: mode === 'oneRm',
  })

  const { data: volumeData = [], isLoading: volumeLoading } = useQuery({
    queryKey: ['progress', 'volume', selectedExercise?.id, from, to],
    queryFn: () => apiFetch<WeeklyVolume[]>(
      `/api/progress/volume?exerciseId=${selectedExercise!.id}&from=${from}&to=${to}&bucket=week`
    ),
    enabled: mode === 'volume' && !!selectedExercise,
  })

  const isLoading = mode === 'oneRm' ? oneRmLoading : volumeLoading

  const chartData = mode === 'oneRm'
    ? oneRmData.map((d) => ({ week: d.week, value: d.totalOneRm }))
    : volumeData.map((d) => ({ week: d.week, value: d.totalVolume }))

  // Total hero number — latest week's totalOneRm
  const latestTotal = oneRmData.length > 0
    ? oneRmData[oneRmData.length - 1]!.totalOneRm
    : 0
  const prevTotal = oneRmData.length > 1
    ? oneRmData[0]!.totalOneRm
    : latestTotal
  const delta = latestTotal - prevTotal

  return (
    <div className={styles.screen}>
      {/* Page header */}
      <div className={styles.phead}>
        <div>
          <p className={styles.pheadKick}>{t('nav.progress')}</p>
          <h1 className={styles.pheadH1}>{t('nav.progress')}</h1>
        </div>
      </div>

      {/* Total card */}
      <div className={styles.totalCard}>
        <p style={{ fontFamily: 'var(--font-num)', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
          {t('progress.totalLabel')}
        </p>
        <div className={styles.totalCardBig}>
          <span className={styles.num} style={{ fontSize: 'var(--text-hero)', lineHeight: '.9', letterSpacing: '-0.03em' }}>
            {latestTotal}<i>kg</i>
          </span>
        </div>
        {delta !== 0 && (
          <p className={styles.totalCardDelta}>
            {delta > 0 ? '▲ ' : '▼ '}
            {t('progress.deltaInBlock', { kg: delta > 0 ? `+${delta}` : delta })}
          </p>
        )}
        {/* 3-up split: SQUAT / BENCH / DEADLIFT */}
        <div className={styles.totalCardSplit}>
          <div data-pat="SQUAT">
            <span>{t('progress.abbrevSquat').toUpperCase()}</span>
            <br />
            <b>—</b>
          </div>
          <div data-pat="BENCH">
            <span>{t('progress.abbrevBench').toUpperCase()}</span>
            <br />
            <b>—</b>
          </div>
          <div data-pat="DEADLIFT">
            <span>{t('progress.abbrevDeadlift').toUpperCase()}</span>
            <br />
            <b>—</b>
          </div>
        </div>
      </div>

      {/* Segmented control */}
      <div className={styles.segmented}>
        <button
          type="button"
          className={`${styles.segmentedBtn} ${mode === 'oneRm' ? styles.segmentedBtnOn : ''}`}
          onClick={() => setMode('oneRm')}
        >
          {t('progress.modeTotal')}
        </button>
        <button
          type="button"
          className={`${styles.segmentedBtn} ${mode === 'volume' ? styles.segmentedBtnOn : ''}`}
          onClick={() => setMode('volume')}
        >
          {t('progress.modeVolume')}
        </button>
      </div>

      {/* Exercise selector — only in volume mode */}
      {mode === 'volume' && (
        <div style={{ marginBottom: 14 }}>
          <ExercisePicker
            onSelect={(ex) => setSelectedExercise(ex)}
            selectedId={selectedExercise?.id}
          />
        </div>
      )}

      {/* Chart card */}
      <div className={styles.chartCard}>
        {isLoading ? (
          <p className={styles.loading}>{t('app.loading')}</p>
        ) : chartData.length === 0 ? (
          <p className={styles.empty}>{t('progress.noData')}</p>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-num)' }}
                  tickLine={false}
                />
                <YAxis
                  width={36}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-num)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-num)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-accent)', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className={styles.chartCaption}>
          {mode === 'oneRm'
            ? t('progress.captionTotal')
            : t('progress.captionVolume', { exercise: selectedExercise?.name ?? '—' })}
        </p>
      </div>

      {/* Export button */}
      <button
        type="button"
        className={styles.exportBtn}
        onClick={() => setExportOpen(true)}
        data-testid="export-btn"
      >
        {t('export.csv')} ↓
      </button>

      {/* CSV Export Sheet */}
      <CsvExportSheet
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        accessToken={accessToken}
      />
    </div>
  )
}
