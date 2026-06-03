import { useEffect, useRef, useState, ReactNode } from 'react'
import styles from './BottomSheet.module.css'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isOn, setIsOn] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOn(true)
        })
      })
    }
  }, [isOpen])

  const handleClose = () => {
    setIsOn(false)
    closeTimerRef.current = setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 220)
  }

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  if (!isOpen && !isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOn ? styles.backdropOn : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        className={`${styles.sheet} ${isOn ? styles.sheetOn : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.sheetHandle} />
        {(title !== undefined) && (
          <div className={styles.sheetHeader}>
            <span className={styles.sheetTitle}>{title}</span>
            <button
              className={styles.sheetClose}
              onClick={handleClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        )}
        <div className={styles.sheetBody}>
          {children}
        </div>
      </div>
    </>
  )
}
