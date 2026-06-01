import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function OfflineBanner() {
  const { t } = useTranslation()
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 'var(--topbar-height)',
        left: 0,
        right: 0,
        background: 'var(--color-danger)',
        color: '#fff',
        padding: 'var(--space-sm) var(--space-md)',
        fontSize: 'var(--text-sm)',
        textAlign: 'center',
        zIndex: 200,
      }}
    >
      {t('app.offline')}
    </div>
  )
}
