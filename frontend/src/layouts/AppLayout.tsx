import { Outlet } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { BottomNav } from '../components/BottomNav'
import { OfflineBanner } from '../components/OfflineBanner'
import styles from './AppLayout.module.css'

/**
 * Main app layout: top bar + content area + bottom navigation.
 * Used for all authenticated routes.
 */
export function AppLayout() {
  return (
    <div className={styles.layout}>
      <TopBar />
      <OfflineBanner />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
