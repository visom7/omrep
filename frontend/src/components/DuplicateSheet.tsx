import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { BottomSheet } from './BottomSheet'
import { blocksApi, DuplicateBlockRequest } from '../api/blocks'

interface DuplicateSheetProps {
  blockId: string
  blockName: string
  onClose: () => void
}

type ProgressionOption = 'none' | 'kg' | 'rep'

const radioStyle: React.CSSProperties = {
  width: 22, height: 22, borderRadius: '50%',
  border: '2px solid var(--color-border-strong)',
  flexShrink: 0, position: 'relative',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all var(--transition-fast)',
}

export function DuplicateSheet({ blockId, blockName, onClose }: DuplicateSheetProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<ProgressionOption>('none')
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const options: { id: ProgressionOption; label: string; desc: string }[] = [
    { id: 'none', label: t('duplicate.optNone'), desc: t('duplicate.optNoneDesc') },
    { id: 'kg',   label: t('duplicate.optKg'),   desc: t('duplicate.optKgDesc') },
    { id: 'rep',  label: t('duplicate.optRep'),  desc: t('duplicate.optRepDesc') },
  ]

  const handleDuplicate = async () => {
    setIsLoading(true)
    const req: DuplicateBlockRequest =
      selected === 'none'
        ? { progressionType: null, progressionValue: null }
        : selected === 'kg'
        ? { progressionType: 'WEIGHT', progressionValue: 2.5 }
        : { progressionType: 'REPS', progressionValue: 1 }

    try {
      await blocksApi.duplicate(blockId, req)
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      setIsDone(true)
      setTimeout(() => onClose(), 1500)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <BottomSheet isOpen title={t('duplicate.title')} onClose={onClose}>
      {isDone ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            border: '3px solid var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: 'var(--color-accent)',
          }}>
            ✓
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', textAlign: 'center' }}>
            {t('duplicate.doneText', { name: blockName })}
          </p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 20 }}>
            {t('duplicate.subtitle', { name: blockName })}
          </p>
          {/* Options */}
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              style={{
                width: '100%', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 13,
                padding: '14px var(--pad)', background: 'var(--color-surface)',
                border: `1px solid ${selected === opt.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)', marginBottom: 9,
                transition: 'border-color var(--transition-fast)',
              }}
            >
              {/* Radio indicator */}
              <div style={{
                ...radioStyle,
                borderColor: selected === opt.id ? 'var(--color-accent)' : 'var(--color-border-strong)',
              }}>
                {selected === opt.id && (
                  <div style={{
                    position: 'absolute', inset: 4, borderRadius: '50%',
                    background: 'var(--color-accent)',
                  }} />
                )}
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'var(--text-base)' }}>
                  {opt.label}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  {opt.desc}
                </p>
              </div>
            </button>
          ))}
          {/* Action */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleDuplicate}
            style={{
              width: '100%', cursor: 'pointer', border: 0,
              borderRadius: 'var(--radius-md)', background: 'var(--color-accent)',
              color: 'var(--color-on-accent)', fontFamily: 'var(--font-sans)',
              fontWeight: 700, fontSize: 14, padding: 13, marginTop: 8,
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {t('duplicate.action')}
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
