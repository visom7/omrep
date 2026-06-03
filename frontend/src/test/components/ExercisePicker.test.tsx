import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExercisePicker, ExerciseOption } from '../../components/ExercisePicker'
import '../../i18n'

// Mock apiFetch
vi.mock('../../api/client', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '../../api/client'

// Names are deliberately distinct from the movement-pattern translations
// (e.g. SQUAT → "Sentadilla", BENCH → "Banca") to avoid text-match collisions.
const mockExercises: ExerciseOption[] = [
  { id: '1', name: 'Sentadilla profunda', movementPattern: 'SQUAT', isBasic: true, isCustom: false },
  { id: '2', name: 'Press de banca', movementPattern: 'BENCH', isBasic: true, isCustom: false },
  { id: '3', name: 'Mi ejercicio', movementPattern: 'ACCESSORY', isBasic: false, isCustom: true },
]

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('ExercisePicker', () => {
  it('search input renders', () => {
    vi.mocked(apiFetch).mockResolvedValue([])
    renderWithProviders(<ExercisePicker onSelect={vi.fn()} />)
    expect(screen.getByPlaceholderText(/buscar ejercicio/i)).toBeInTheDocument()
  })

  it('exercise names render after data load', async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockExercises)
    renderWithProviders(<ExercisePicker onSelect={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Sentadilla profunda')).toBeInTheDocument()
      expect(screen.getByText('Press de banca')).toBeInTheDocument()
    })
  })

  it('onSelect is called on item click', async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockExercises)
    const onSelect = vi.fn()
    renderWithProviders(<ExercisePicker onSelect={onSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Sentadilla profunda')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Sentadilla profunda').closest('button')!)
    expect(onSelect).toHaveBeenCalledWith(mockExercises[0])
  })

  it('custom tag shown for isCustom exercises', async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockExercises)
    renderWithProviders(<ExercisePicker onSelect={vi.fn()} />)

    await waitFor(() => {
      // The custom tag renders as " · personalizado" suffixed to the pattern label.
      // The middle-dot prefix disambiguates it from the "Nuevo ejercicio personalizado"
      // add button, which also contains the word.
      expect(screen.getByText(/· personalizado/)).toBeInTheDocument()
    })
  })
})
