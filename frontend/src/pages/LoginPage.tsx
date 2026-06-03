import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../api/client'
import styles from './AuthPage.module.css'

interface LoginFormData {
  email: string
  password: string
}

interface TokenResponse {
  accessToken: string
  refreshToken: string
}

// Mark SVG: two accent plates + bar stub geometry
function Mark() {
  return (
    <svg
      className={styles.brandMark}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      {/* Left sleeve */}
      <rect x="2" y="16" width="6" height="8" rx="1.5" fill="currentColor" opacity=".6" />
      {/* Left collar plate */}
      <rect x="9" y="13" width="4" height="14" rx="1.5" fill="currentColor" opacity=".85" />
      {/* Bar */}
      <rect x="14" y="18" width="12" height="4" rx="1" fill="currentColor" />
      {/* Right collar plate */}
      <rect x="27" y="13" width="4" height="14" rx="1.5" fill="currentColor" opacity=".85" />
      {/* Right sleeve */}
      <rect x="32" y="16" width="6" height="8" rx="1.5" fill="currentColor" opacity=".6" />
    </svg>
  )
}

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    try {
      const tokens = await apiFetch<TokenResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      login(tokens.accessToken, tokens.refreshToken)
      navigate('/blocks')
    } catch {
      setError('root', { message: t('auth.loginError') })
    }
  }

  return (
    <div className={styles.container}>
      {/* Brand block */}
      <div className={styles.brand}>
        <Mark />
        <h1 className={styles.title}>{t('brand.name')}</h1>
        <p className={styles.tagline}>{t('brand.tagline')}</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <h2 className={styles.heading}>{t('auth.login')}</h2>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-email">{t('auth.email')}</label>
          <input
            id="login-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            {...register('email', { required: true })}
          />
          {errors.email && <span className={styles.error}>{t('app.error')}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-password">{t('auth.password')}</label>
          <input
            id="login-password"
            className={styles.input}
            type="password"
            autoComplete="current-password"
            {...register('password', { required: true })}
          />
          {errors.password && <span className={styles.error}>{t('app.error')}</span>}
        </div>

        {errors.root && (
          <p className={styles.error}>{errors.root.message}</p>
        )}

        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('app.loading') : t('auth.loginButton')}
        </button>

        <p className={styles.link}>
          {t('auth.noAccount')}{' '}
          <Link to="/register">{t('auth.register')}</Link>
        </p>
      </form>

      <p className={styles.footer}>{t('brand.loginFooter')}</p>
    </div>
  )
}
