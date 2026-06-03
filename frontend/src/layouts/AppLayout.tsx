import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { OfflineBanner } from '../components/OfflineBanner'
import styles from './AppLayout.module.css'

/**
 * Main app layout: content area + bottom navigation.
 * Each screen renders its own page header (TOTAL design: no persistent top bar).
 */
export function AppLayout() {
  return (
    <div className={styles.layout}>
      <OfflineBanner />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
