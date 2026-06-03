import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../api/client'
import { useTheme } from '../hooks/useTheme'
import styles from './SettingsPage.module.css'

interface SettingsFormData {
  displayName: string
  preferredOneRmFormula: 'EPLEY' | 'BRZYCKI' | 'LOMBARDI'
}

interface UserResponse {
  id: string
  email: string
  displayName: string
  preferredOneRmFormula: string
}

type FormulaKey = 'EPLEY' | 'BRZYCKI' | 'LOMBARDI'

const FORMULAS: { key: FormulaKey; nameKey: string; exprKey: string }[] = [
  { key: 'EPLEY',    nameKey: 'settings.formulaEpley',    exprKey: 'settings.formulaEpleyExpr' },
  { key: 'BRZYCKI',  nameKey: 'settings.formulaBrzycki',  exprKey: 'settings.formulaBrzyckiExpr' },
  { key: 'LOMBARDI', nameKey: 'settings.formulaLombardi', exprKey: 'settings.formulaLombardiExpr' },
]

export function SettingsPage() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const { register, handleSubmit, watch, setValue, reset, formState: { isSubmitting } } = useForm<SettingsFormData>({
    defaultValues: { preferredOneRmFormula: 'EPLEY', displayName: '' },
  })

  const selectedFormula = watch('preferredOneRmFormula')

  // Fetch user profile
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<UserResponse>('/api/users/me'),
  })

  // Sync the fetched profile into the form once it loads, so the display name
  // and the preferred formula reflect the stored values (and aren't overwritten
  // with defaults on save).
  useEffect(() => {
    if (user) {
      const formula = (['EPLEY', 'BRZYCKI', 'LOMBARDI'] as const).includes(
        user.preferredOneRmFormula as FormulaKey
      )
        ? (user.preferredOneRmFormula as FormulaKey)
        : 'EPLEY'
      reset({ displayName: user.displayName, preferredOneRmFormula: formula })
    }
  }, [user, reset])

  const onSubmit = async (data: SettingsFormData) => {
    await apiFetch<UserResponse>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  const userInitial = user?.displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={styles.screen}>
      {/* Page header */}
      <div className={styles.phead}>
        <h1 className={styles.pheadH1}>{t('nav.settings')}</h1>
      </div>

      {/* Profile row */}
      <div className={styles.profile}>
        <div className={styles.profileAvatar}>{userInitial}</div>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)' }}>
            {user?.displayName ?? '—'}
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {user?.email ?? '—'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Account section */}
        <p className={styles.seclabel}>{t('settings.account')}</p>

        {/* Display name field */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>{t('settings.displayName')}</label>
          <input
            type="text"
            className={styles.input}
            {...register('displayName', { required: true })}
          />
        </div>

        {/* Formula radio list */}
        <p className={styles.seclabel}>{t('settings.formula')}</p>
        {FORMULAS.map((formula) => (
          <button
            key={formula.key}
            type="button"
            className={`${styles.formula} ${selectedFormula === formula.key ? styles.formulaOn : ''}`}
            onClick={() => setValue('preferredOneRmFormula', formula.key)}
          >
            {/* Radio indicator */}
            <div className={`${styles.radio} ${selectedFormula === formula.key ? styles.radioOn : ''}`} />
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'var(--text-base)' }}>
                {t(formula.nameKey)}
              </p>
              <p className="num" style={{ fontFamily: 'var(--font-num)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontStyle: 'normal' }}>
                {t(formula.exprKey)}
              </p>
            </div>
          </button>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`${styles.btn} ${styles.btnAccent}`}
          style={{ width: '100%', marginBottom: 24, opacity: isSubmitting ? 0.5 : 1 }}
        >
          {t('settings.save')}
        </button>
      </form>

      {/* Theme toggle */}
      <p className={styles.seclabel}>{t('settings.theme')}</p>
      <div className={styles.segmented} style={{ marginBottom: 24 }}>
        <button
          type="button"
          className={`${styles.segmentedBtn} ${theme === 'dark' ? styles.segmentedBtnOn : ''}`}
          onClick={() => setTheme('dark')}
        >
          {t('settings.themeDark')}
        </button>
        <button
          type="button"
          className={`${styles.segmentedBtn} ${theme === 'light' ? styles.segmentedBtnOn : ''}`}
          onClick={() => setTheme('light')}
        >
          {t('settings.themeLight')}
        </button>
      </div>

      {/* Logout */}
      <button
        type="button"
        className={`${styles.btn} ${styles.btnGhost} ${styles.btnDanger}`}
        style={{ width: '100%' }}
        onClick={logout}
      >
        {t('settings.logout')}
      </button>
    </div>
  )
}
