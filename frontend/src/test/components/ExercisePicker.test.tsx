import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExercisePicker, ExerciseOption } from '../../components/ExercisePicker'
import '../../i18n'

// Mock the exercises API module
vi.mock('../../api/exercises', () => ({
  exercisesApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { exercisesApi } from '../../api/exercises'

// Names are deliberately distinct from the movement-pattern translations
// (e.g. SQUAT → "Sentadilla", BENCH → "Banca") to avoid text-match collisions.
const mockExercises: ExerciseOption[] = [
  { id: '1', name: 'Sentadilla profunda', movementPattern: 'SQUAT', isBasic: true, isCustom: false },
  { id: '2', name: 'Press de banca', movementPattern: 'BENCH', isBasic: true, isCustom: false },
  { id: '3', name: 'Mi ejercicio custom', movementPattern: 'ACCESSORY', isBasic: false, isCustom: true },
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
  beforeEach(() => {
    vi.clearAllMocks()
    // mock confirm for delete tests
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('search input renders', () => {
    vi.mocked(exercisesApi.list).mockResolvedValue([])
    renderWithProviders(<ExercisePicker onSelect={vi.fn()} />)
    expect(screen.getByPlaceholderText(/buscar ejercicio/i)).toBeInTheDocument()
  })

  it('exercise names render after data load', async () => {
    vi.mocked(exercisesApi.list).mockResolvedValue(mockExercises)
    renderWithProviders(<ExercisePicker onSelect={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Sentadilla profunda')).toBeInTheDocument()
      expect(screen.getByText('Press de banca')).toBeInTheDocument()
    })
  })

  it('onSelect is called on item click', async () => {
    vi.mocked(exercisesApi.list).mockResolvedValue(mockExercises)
    const onSelect = vi.fn()
    renderWithProviders(<ExercisePicker onSelect={onSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Sentadilla profunda')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Sentadilla profunda').closest('button')!)
    expect(onSelect).toHaveBeenCalledWith(mockExercises[0])
  })

  it('custom tag shown for isCustom exercises', async () => {
    vi.mocked(exercisesApi.list).mockResolvedValue(mockExercises)
    renderWithProviders(<ExercisePicker onSelect={vi.fn()} />)

    await waitFor(() => {
      // The custom tag renders as " · personalizado" suffixed to the pattern label.
      expect(screen.getByText(/· personalizado/)).toBeInTheDocument()
    })
  })

  it('edit button appears only for custom exercises', async () => {
    vi.mocked(exercisesApi.list).mockResolvedValue(mockExercises)
    renderWithProviders(<ExercisePicker onSelect={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Mi ejercicio custom')).toBeInTheDocument()
    })

    // Edit and delete buttons appear for the custom exercise
    const editButtons = screen.getAllByRole('button', { name: /editar/i })
    expect(editButtons.length).toBe(1)

    // Global exercises (isCustom=false) don't have edit buttons
    // We only have one custom exercise in mockExercises
    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i })
    expect(deleteButtons.length).toBe(1)
  })

  it('edit button is hidden for global (non-custom) exercises', async () => {
    const globalOnly: ExerciseOption[] = [
      { id: '1', name: 'Bench Press Global', movementPattern: 'BENCH', isBasic: true, isCustom: false },
    ]
    vi.mocked(exercisesApi.list).mockResolvedValue(globalOnly)
    renderWithProviders(<ExercisePicker onSelect={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Bench Press Global')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument()
  })

  it('delete button calls exercisesApi.delete', async () => {
    vi.mocked(exercisesApi.list).mockResolvedValue(mockExercises)
    vi.mocked(exercisesApi.delete).mockResolvedValue(undefined)

    renderWithProviders(<ExercisePicker onSelect={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Mi ejercicio custom')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByRole('button', { name: /eliminar/i })
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(exercisesApi.delete).toHaveBeenCalledWith('3')
    })
  })
})
