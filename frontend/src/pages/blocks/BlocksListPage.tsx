import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blocksApi, BlockSummary } from '../../api/blocks'
import styles from './BlocksListPage.module.css'

export function BlocksListPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['blocks'],
    queryFn: blocksApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blocksApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blocks'] }),
  })

  if (isLoading) {
    return <p className={styles.loading}>{t('app.loading')}</p>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('nav.blocks')}</h2>
        <Link to="/blocks/new" className={styles.newButton}>
          {t('block.new')}
        </Link>
      </div>

      {blocks.length === 0 ? (
        <p className={styles.empty}>{t('session.noBlocks')}</p>
      ) : (
        <ul className={styles.list}>
          {blocks.map((block: BlockSummary) => (
            <li key={block.id} className={styles.item}>
              <Link to={`/blocks/${block.id}`} className={styles.itemLink}>
                <span className={styles.itemName}>{block.name}</span>
                <span className={styles.itemMeta}>
                  {block.weekCount} {t('block.weeks')}
                </span>
              </Link>
              <button
                className={styles.deleteButton}
                onClick={() => {
                  if (confirm(t('app.confirm'))) {
                    deleteMutation.mutate(block.id)
                  }
                }}
                aria-label={t('block.delete')}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
