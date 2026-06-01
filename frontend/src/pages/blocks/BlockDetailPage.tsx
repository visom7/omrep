import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { blocksApi } from '../../api/blocks'

export function BlockDetailPage() {
  const { t } = useTranslation()
  const { blockId } = useParams<{ blockId: string }>()

  const { data: block, isLoading } = useQuery({
    queryKey: ['block', blockId],
    queryFn: () => blocksApi.get(blockId!),
    enabled: !!blockId,
  })

  if (isLoading) return <p style={{ padding: 'var(--space-md)', color: 'var(--color-text-muted)' }}>{t('app.loading')}</p>
  if (!block) return null

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>{block.name}</h2>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {block.weeks.map((week) => (
          <li key={week.number}>
            <Link
              to={`/blocks/${blockId}/weeks/${week.number}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
                textDecoration: 'none',
                minHeight: 'var(--tap-target)',
              }}
            >
              <span>{t('week.label')} {week.number}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{week.days.length} {t('day.label').toLowerCase()}s →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
