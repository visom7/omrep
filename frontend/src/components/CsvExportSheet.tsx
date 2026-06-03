import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from './BottomSheet'

interface CsvExportSheetProps {
  isOpen: boolean
  onClose: () => void
  accessToken: string | null
  blockId?: string | null
}

type RangeOption = 4 | 8 | 12 | 'all'
type BlockScope = 'current' | 'all'

export function CsvExportSheet({ isOpen, onClose, accessToken, blockId }: CsvExportSheetProps) {
  const { t } = useTranslation()
  const [range, setRange] = useState<RangeOption>(12)
  const [blockScope, setBlockScope] = useState<BlockScope>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleDownload = async () => {
    if (!accessToken) return
    setIsLoading(true)
    setError(false)

    try {
      const to = new Date()
      const from = new Date()

      if (range !== 'all') {
        from.setDate(from.getDate() - range * 7)
      } else {
        from.setFullYear(from.getFullYear() - 10) // effectively "all"
      }

      const params = new URLSearchParams({
        from: from.toISOString().split('T')[0]!,
        to: to.toISOString().split('T')[0]!,
      })

      if (blockScope === 'current' && blockId) {
        params.set('blockId', blockId)
      }

      const response = await fetch(`/api/export/logs.csv?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-${params.get('from')}-${params.get('to')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const rangeOptions: RangeOption[] = [4, 8, 12, 'all']

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('export.title')}>
      <div>
        {/* Range segmented */}
        <p style={{ fontFamily: 'var(--font-num)', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
          {t('export.range')}
        </p>
        <div style={{ display: 'flex', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 4, gap: 4, marginBottom: 14 }}>
          {rangeOptions.map((opt) => (
            <button
              key={String(opt)}
              type="button"
              onClick={() => setRange(opt)}
              style={{
                flex: 1, cursor: 'pointer', border: 0,
                borderRadius: 'calc(var(--radius-md) - 4px)', padding: 9,
                fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)',
                fontWeight: 600,
                background: range === opt ? 'var(--color-surface)' : 'none',
                color: range === opt ? 'var(--color-text)' : 'var(--color-text-muted)',
                boxShadow: range === opt ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {opt === 'all' ? t('export.rangeAll') : t('export.rangeWeeks', { n: opt })}
            </button>
          ))}
        </div>

        {/* Block scope */}
        <p style={{ fontFamily: 'var(--font-num)', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
          {t('export.block')}
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['current', 'all'] as BlockScope[]).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setBlockScope(scope)}
              style={{
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${blockScope === scope ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                background: blockScope === scope ? 'color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))' : 'var(--color-surface)',
                color: blockScope === scope ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
              }}
            >
              {scope === 'current' ? t('export.blockCurrent') : t('export.blockAll')}
            </button>
          ))}
        </div>

        {/* Format note */}
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          {t('export.formatNote')}
        </p>

        {/* Error message */}
        {error && (
          <p style={{ fontSize: 12, color: 'var(--color-danger, #e23b3b)', marginBottom: 12 }}>
            {t('export.error')}
          </p>
        )}

        {/* Download button */}
        <button
          type="button"
          disabled={isLoading || !accessToken}
          onClick={handleDownload}
          style={{
            width: '100%', cursor: 'pointer', border: 0,
            borderRadius: 'var(--radius-md)', background: 'var(--color-accent)',
            color: 'var(--color-on-accent)', fontFamily: 'var(--font-sans)',
            fontWeight: 700, fontSize: 14, padding: 13,
            opacity: (isLoading || !accessToken) ? 0.5 : 1,
          }}
        >
          {isLoading ? t('app.loading') : t('export.download')}
        </button>
      </div>
    </BottomSheet>
  )
}
