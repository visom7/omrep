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
      <h1 className={styles.title}>Training Planner</h1>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <h2 className={styles.heading}>{t('auth.login')}</h2>

        <div className={styles.field}>
          <label className={styles.label}>{t('auth.email')}</label>
          <input
            className={styles.input}
            type="email"
            autoComplete="email"
            {...register('email', { required: true })}
          />
          {errors.email && <span className={styles.error}>{t('app.error')}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('auth.password')}</label>
          <input
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
    </div>
  )
}
