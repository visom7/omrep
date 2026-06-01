import { useForm, useFieldArray } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { blocksApi, CreateBlockRequest, Week } from '../../api/blocks'

interface FormData {
  name: string
  weeks: Week[]
}

export function BlockEditorPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { blockId } = useParams<{ blockId?: string }>()
  const isEditing = !!blockId

  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { name: '', weeks: [] },
  })

  const { fields: weekFields, append: appendWeek } = useFieldArray({ control, name: 'weeks' })

  const createMutation = useMutation({
    mutationFn: (data: CreateBlockRequest) => blocksApi.create(data),
    onSuccess: (block) => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      navigate(`/blocks/${block.id}`)
    },
  })

  const onSubmit = async (data: FormData) => {
    const weeks: Week[] = data.weeks.map((w, i) => ({
      number: i + 1,
      days: w.days ?? [],
    }))
    await createMutation.mutateAsync({ name: data.name, weeks })
  }

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>
        {isEditing ? t('block.edit') : t('block.new')}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <label style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {t('block.name')}
          </label>
          <input
            type="text"
            {...register('name', { required: true })}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {weekFields.map((field, index) => (
            <div key={field.id} style={{
              padding: 'var(--space-md)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                {t('week.label')} {index + 1}
              </p>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendWeek({ number: weekFields.length + 1, days: [] })}
            style={{
              height: 'var(--tap-target)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            + {t('week.label')}
          </button>
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
          {t('app.save')}
        </button>
      </form>
    </div>
  )
}
