import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CsvExportButtonProps {
  accessToken: string | null
}

/**
 * CSV export button that streams the response via fetch (to set Authorization header)
 * and triggers a browser download via Blob + URL.createObjectURL.
 */
export function CsvExportButton({ accessToken }: CsvExportButtonProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [from, setFrom] = useState(getDefaultFrom())
  const [to, setTo] = useState(getDefaultTo())

  const handleExport = async () => {
    if (!accessToken) return
    setIsLoading(true)

    try {
      const params = new URLSearchParams({ from, to })
      const response = await fetch(`/api/export/logs.csv?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-${from}-${to}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', flex: 1 }}>
          <label style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
            {t('export.dateFrom')}
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{
              height: 'var(--tap-target)',
              padding: '0 var(--space-sm)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', flex: 1 }}>
          <label style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
            {t('export.dateTo')}
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{
              height: 'var(--tap-target)',
              padding: '0 var(--space-sm)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
            }}
          />
        </div>
      </div>
      <button
        onClick={handleExport}
        disabled={isLoading}
        style={{
          height: 'var(--tap-target)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text)',
          fontWeight: 'var(--weight-medium)',
          cursor: 'pointer',
        }}
      >
        {isLoading ? t('app.loading') : t('export.csv')}
      </button>
    </div>
  )
}

function getDefaultFrom(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return d.toISOString().split('T')[0]!
}

function getDefaultTo(): string {
  return new Date().toISOString().split('T')[0]!
}
