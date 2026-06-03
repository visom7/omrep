import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../api/client'
import styles from './AuthPage.module.css'

interface RegisterFormData {
  email: string
  password: string
  displayName: string
}

interface TokenResponse {
  accessToken: string
  refreshToken: string
}

export function RegisterPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>()

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const tokens = await apiFetch<TokenResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      login(tokens.accessToken, tokens.refreshToken)
      navigate('/blocks')
    } catch {
      setError('root', { message: t('app.error') })
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <h2 className={styles.heading}>{t('auth.register')}</h2>
        <p className={styles.subtitle}>{t('auth.registerSubtitle')}</p>

        <div className={styles.field}>
          <label className={styles.label}>{t('settings.displayName')}</label>
          <input
            className={styles.input}
            type="text"
            autoComplete="name"
            placeholder={t('auth.displayNamePlaceholder')}
            {...register('displayName', { required: true })}
          />
          {errors.displayName && <span className={styles.error}>{t('app.error')}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('auth.email')}</label>
          <input
            className={styles.input}
            type="email"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            {...register('email', { required: true })}
          />
          {errors.email && <span className={styles.error}>{t('app.error')}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('auth.password')}</label>
          <input
            className={styles.input}
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.passwordHint')}
            {...register('password', { required: true, minLength: 8 })}
          />
          {errors.password && <span className={styles.error}>{t('app.error')}</span>}
        </div>

        {errors.root && (
          <p className={styles.error}>{errors.root.message}</p>
        )}

        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('app.loading') : t('auth.registerButton')}
        </button>

        <p className={styles.link}>
          {t('auth.haveAccount')}{' '}
          <Link to="/login">{t('auth.login')}</Link>
        </p>
      </form>
    </div>
  )
}
