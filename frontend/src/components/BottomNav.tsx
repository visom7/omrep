import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

interface NavItem {
  to: string
  labelKey: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/blocks',   labelKey: 'nav.blocks',   icon: '▤' },
  { to: '/session',  labelKey: 'session.today', icon: '◉' },
  { to: '/progress', labelKey: 'nav.progress',  icon: '↗' },
  { to: '/settings', labelKey: 'nav.settings',  icon: '⚙' },
]

export function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav className={styles.nav} aria-label="Navigation principal">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ''}`
          }
        >
          <span className={styles.icon} aria-hidden="true">{item.icon}</span>
          <span className={styles.label}>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
