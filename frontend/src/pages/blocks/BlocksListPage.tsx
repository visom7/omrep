import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { blocksApi, BlockSummary } from '../../api/blocks'
import { DuplicateSheet } from '../../components/DuplicateSheet'
import styles from './BlocksListPage.module.css'

export function BlocksListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [openDuplicateFor, setOpenDuplicateFor] = useState<{ id: string; name: string } | null>(null)

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ['blocks'],
    queryFn: blocksApi.list,
  })

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <p className={styles.loading}>{t('app.loading')}</p>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      {/* Page header */}
      <div className={styles.phead}>
        <div>
          <p className={styles.pheadKick}>{t('blocks.subtitle')}</p>
          <h1 className={styles.pheadH1}>{t('nav.blocks')}</h1>
        </div>
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.iconBtnAccent}`}
          onClick={() => navigate('/blocks/new')}
          aria-label={t('block.new')}
        >
          +
        </button>
      </div>

      {blocks.length === 0 ? (
        <p className={styles.empty}>{t('session.noBlocks')}</p>
      ) : (
        <div>
          {blocks.map((block: BlockSummary) => {
            const isActive = block.order === 1 // treat first block as "active" for display purposes
            return (
              <div
                key={block.id}
                className={`${styles.blockCard} ${isActive ? styles.blockCardActive : ''}`}
              >
                {/* Left accent bar */}
                <div className={styles.blockCardBar} />
                {/* Body */}
                <div className={styles.blockCardBody}>
                  <div className={styles.blockCardTop}>
                    <span className={styles.blockCardName}>{block.name}</span>
                    {isActive && (
                      <span className={styles.badge}>{t('blocks.activeBadge')}</span>
                    )}
                  </div>
                  {/* Stats */}
                  <div className={styles.blockCardStats}>
                    <span>
                      <b>{block.weekCount}</b>
                      {' '}{t('blocks.weeksUnit')}
                    </span>
                  </div>
                  {/* Chip row */}
                  <div className={styles.chipRow}>
                    <button
                      type="button"
                      className={styles.chip}
                      onClick={() => setOpenDuplicateFor({ id: block.id, name: block.name })}
                    >
                      {t('block.duplicate')}
                    </button>
                    <button
                      type="button"
                      className={`${styles.chip} ${styles.chipOn}`}
                      onClick={() => navigate(`/blocks/${block.id}/edit`)}
                    >
                      {t('block.edit')}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Duplicate sheet */}
      {openDuplicateFor && (
        <DuplicateSheet
          blockId={openDuplicateFor.id}
          blockName={openDuplicateFor.name}
          onClose={() => {
            setOpenDuplicateFor(null)
            queryClient.invalidateQueries({ queryKey: ['blocks'] })
          }}
        />
      )}
    </div>
  )
}
