import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../api/client'

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

export function SettingsPage() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<SettingsFormData>()

  const onSubmit = async (data: SettingsFormData) => {
    await apiFetch<UserResponse>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>
        {t('nav.settings')}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <label style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {t('settings.displayName')}
          </label>
          <input
            type="text"
            {...register('displayName', { required: true })}
            style={{
              height: 'var(--tap-target)',
              padding: '0 var(--space-md)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-base)',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <label style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {t('settings.formula')}
          </label>
          <select
            {...register('preferredOneRmFormula')}
            style={{
              height: 'var(--tap-target)',
              padding: '0 var(--space-md)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-base)',
            }}
          >
            <option value="EPLEY">{t('settings.formulaEpley')}</option>
            <option value="BRZYCKI">{t('settings.formulaBrzycki')}</option>
            <option value="LOMBARDI">{t('settings.formulaLombardi')}</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            height: 'var(--tap-target)',
            background: 'var(--color-accent)',
            color: 'var(--color-text-on-accent)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'var(--weight-bold)',
            cursor: 'pointer',
          }}
        >
          {t('settings.save')}
        </button>
      </form>

      <button
        onClick={logout}
        style={{
          marginTop: 'var(--space-xl)',
          height: 'var(--tap-target)',
          padding: '0 var(--space-md)',
          background: 'transparent',
          border: '1px solid var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-danger)',
          cursor: 'pointer',
        }}
      >
        {t('auth.login')} {/* will be logout key in full i18n */}
      </button>
    </div>
  )
}
