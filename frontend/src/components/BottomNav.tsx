import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

// Simple geometric SVG icons for the 4 nav tabs
function IconBolt() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M11 2L4 11h6l-1 7 7-9h-6l1-7z" fill="currentColor" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1.5" fill="currentColor" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" fill="currentColor" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" fill="currentColor" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" fill="currentColor" />
    </svg>
  )
}

function IconTrendUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <polyline points="3,14 8,9 12,12 17,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="13,5 17,5 17,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.22 3.22l1.42 1.42M15.36 15.36l1.42 1.42M3.22 16.78l1.42-1.42M15.36 4.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

interface NavItem {
  to: string
  labelKey: string
  Icon: () => ReactElement
}

const NAV_ITEMS: NavItem[] = [
  { to: '/session',  labelKey: 'session.today', Icon: IconBolt },
  { to: '/blocks',   labelKey: 'nav.blocks',    Icon: IconGrid },
  { to: '/progress', labelKey: 'nav.progress',  Icon: IconTrendUp },
  { to: '/settings', labelKey: 'nav.settings',  Icon: IconGear },
]

export function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav className={styles.bottomnav} aria-label={t('nav.aria')}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `${styles.navitem} ${isActive ? styles.navitemActive : ''}`
          }
        >
          <span className={styles.icon}><item.Icon /></span>
          <span className={styles.label}>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
