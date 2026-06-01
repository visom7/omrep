import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { apiFetch } from '../api/client'
import { ExercisePicker, ExerciseOption } from '../components/ExercisePicker'

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
  const [mode, setMode] = useState<Mode>('oneRm')
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null)
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

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>
        {t('nav.progress')}
      </h2>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        <button
          onClick={() => setMode('oneRm')}
          style={{
            flex: 1,
            height: 'var(--tap-target)',
            background: mode === 'oneRm' ? 'var(--color-accent)' : 'var(--color-surface)',
            color: mode === 'oneRm' ? 'var(--color-text-on-accent)' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--weight-medium)',
            cursor: 'pointer',
          }}
        >
          {t('progress.totalBasics')}
        </button>
        <button
          onClick={() => setMode('volume')}
          style={{
            flex: 1,
            height: 'var(--tap-target)',
            background: mode === 'volume' ? 'var(--color-accent)' : 'var(--color-surface)',
            color: mode === 'volume' ? 'var(--color-text-on-accent)' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--weight-medium)',
            cursor: 'pointer',
          }}
        >
          {t('progress.volume')}
        </button>
      </div>

      {/* Exercise selector — only in volume mode */}
      {mode === 'volume' && (
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)' }}>
            {t('progress.selectExercise')}
          </p>
          <ExercisePicker
            onSelect={(ex) => setSelectedExercise(ex)}
            selectedId={selectedExercise?.id}
          />
        </div>
      )}

      {/* Chart */}
      {isLoading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>{t('app.loading')}</p>
      ) : chartData.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>{t('progress.noData')}</p>
      ) : (
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
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

      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-sm)' }}>
        {t('progress.weekly')} — {from} / {to}
      </p>
    </div>
  )
}
