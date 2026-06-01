import { useNavigate, useLocation } from 'react-router-dom'
import styles from './TopBar.module.css'

interface TopBarProps {
  title?: string
  showBack?: boolean
}

export function TopBar({ title = 'Training Planner', showBack }: TopBarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const canGoBack = showBack ?? (location.key !== 'default')

  return (
    <header className={styles.bar}>
      {canGoBack && (
        <button
          className={styles.backButton}
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          ←
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
    </header>
  )
}
