import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlockEditorPage } from '../../pages/blocks/BlockEditorPage'
import '../../i18n'

vi.mock('../../api/blocks', () => ({
  blocksApi: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../../components/BottomSheet', () => ({
  BottomSheet: ({ children, isOpen, title }: { children: React.ReactNode; isOpen: boolean; title?: string }) =>
    isOpen ? <div data-testid="bottom-sheet" aria-label={title}>{children}</div> : null,
}))

vi.mock('../../components/ExercisePicker', () => ({
  ExercisePicker: () => <div data-testid="exercise-picker" />,
}))

import { blocksApi } from '../../api/blocks'

function renderEditor(path: string, _route?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/blocks/new" element={<BlockEditorPage />} />
          <Route path="/blocks/:blockId/edit" element={<BlockEditorPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('BlockEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state when fetching existing block', () => {
    vi.mocked(blocksApi.get).mockReturnValue(new Promise(() => {})) // never resolves

    renderEditor('/blocks/abc123/edit', '/blocks/:blockId/edit')

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('populates form with block data when editing existing block', async () => {
    vi.mocked(blocksApi.get).mockResolvedValue({
      id: 'abc123',
      userId: 'user1',
      name: 'Bloque Fuerza Test',
      order: 1,
      createdAt: '2026-01-01',
      weeks: [
        {
          number: 1,
          days: [],
        },
      ],
    })

    renderEditor('/blocks/abc123/edit', '/blocks/:blockId/edit')

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText(/Ej. Bloque Fuerza/i)
      expect((nameInput as HTMLInputElement).value).toBe('Bloque Fuerza Test')
    })
  })

  it('renders new block form without loading when creating', () => {
    renderEditor('/blocks/new', '/blocks/new')

    // No loading state for new block
    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument()
    // Has save button
    expect(screen.getByText('Guardar')).toBeInTheDocument()
  })

  it('shows editable weight input when editing a day with set groups', async () => {
    vi.mocked(blocksApi.get).mockResolvedValue({
      id: 'abc123',
      userId: 'user1',
      name: 'Test Block',
      order: 1,
      createdAt: '2026-01-01',
      weeks: [
        {
          number: 1,
          days: [
            {
              order: 1,
              label: 'Día A',
              entries: [
                {
                  exerciseId: 'e1',
                  exerciseName: 'Sentadilla',
                  movementPattern: 'SQUAT',
                  order: 1,
                  setGroups: [
                    { id: 'sg1', type: 'WORKING', weightKg: 100, reps: 5, sets: 3, targetRpe: null },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })

    renderEditor('/blocks/abc123/edit', '/blocks/:blockId/edit')

    // Wait for block to load, then click the day
    await waitFor(() => {
      expect(screen.getByText('Día A')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Día A'))

    await waitFor(() => {
      // Weight input should be visible with value 100
      const weightInput = screen.getByLabelText(/Peso/i)
      expect(weightInput).toBeInTheDocument()
      expect((weightInput as HTMLInputElement).value).toBe('100')
    })
  })

  it('remove set group button removes the set group', async () => {
    vi.mocked(blocksApi.get).mockResolvedValue({
      id: 'abc123',
      userId: 'user1',
      name: 'Test Block',
      order: 1,
      createdAt: '2026-01-01',
      weeks: [
        {
          number: 1,
          days: [
            {
              order: 1,
              label: 'Día A',
              entries: [
                {
                  exerciseId: 'e1',
                  exerciseName: 'Sentadilla',
                  movementPattern: 'SQUAT',
                  order: 1,
                  setGroups: [
                    { id: 'sg1', type: 'WORKING', weightKg: 100, reps: 5, sets: 3, targetRpe: null },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })

    renderEditor('/blocks/abc123/edit', '/blocks/:blockId/edit')

    await waitFor(() => {
      expect(screen.getByText('Día A')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Día A'))

    await waitFor(() => {
      expect(screen.getByLabelText(/Eliminar serie/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText(/Eliminar serie/i))

    await waitFor(() => {
      expect(screen.queryByLabelText(/Peso/i)).not.toBeInTheDocument()
    })
  })

  it('duplicate week button opens the sheet', async () => {
    vi.mocked(blocksApi.get).mockResolvedValue({
      id: 'abc123',
      userId: 'user1',
      name: 'Test Block',
      order: 1,
      createdAt: '2026-01-01',
      weeks: [
        { number: 1, days: [] },
      ],
    })

    renderEditor('/blocks/abc123/edit', '/blocks/:blockId/edit')

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Block')).toBeInTheDocument()
    })

    // Click the duplicate week button
    const dupBtn = screen.getByRole('button', { name: /duplicar semana/i })
    fireEvent.click(dupBtn)

    await waitFor(() => {
      // The BottomSheet should open with the delta input
      expect(screen.getByLabelText(/ajuste de peso/i)).toBeInTheDocument()
    })
  })

  it('duplicate week adds a new week to the form', async () => {
    vi.mocked(blocksApi.get).mockResolvedValue({
      id: 'abc123',
      userId: 'user1',
      name: 'Test Block',
      order: 1,
      createdAt: '2026-01-01',
      weeks: [
        {
          number: 1,
          days: [
            {
              order: 1,
              label: 'Día A',
              entries: [
                {
                  exerciseId: 'e1',
                  exerciseName: 'Sentadilla',
                  movementPattern: 'SQUAT',
                  order: 1,
                  setGroups: [
                    { id: 'sg-orig', type: 'WORKING' as const, weightKg: 100, reps: 5, sets: 3, targetRpe: null },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })

    renderEditor('/blocks/abc123/edit', '/blocks/:blockId/edit')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /duplicar semana/i })).toBeInTheDocument()
    })

    // Open duplicate week sheet
    fireEvent.click(screen.getByRole('button', { name: /duplicar semana/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/ajuste de peso/i)).toBeInTheDocument()
    })

    // Set delta to 2.5
    const deltaInput = screen.getByLabelText(/ajuste de peso/i)
    fireEvent.change(deltaInput, { target: { value: '2.5' } })

    // Confirm
    fireEvent.click(screen.getByText('Confirmar'))

    await waitFor(() => {
      // Now there should be SEMANA 1 and SEMANA 2
      expect(screen.getByText(/SEMANA 1/i)).toBeInTheDocument()
      expect(screen.getByText(/SEMANA 2/i)).toBeInTheDocument()
    })
  })

  it('saveDay button closes the day overlay', async () => {
    vi.mocked(blocksApi.get).mockResolvedValue({
      id: 'abc123',
      userId: 'user1',
      name: 'Test Block',
      order: 1,
      createdAt: '2026-01-01',
      weeks: [
        {
          number: 1,
          days: [
            { order: 1, label: 'Día A', entries: [] },
          ],
        },
      ],
    })

    renderEditor('/blocks/abc123/edit', '/blocks/:blockId/edit')

    await waitFor(() => {
      expect(screen.getByText('Día A')).toBeInTheDocument()
    })

    // Enter day editing mode
    fireEvent.click(screen.getByText('Día A'))

    await waitFor(() => {
      expect(screen.getByText('Guardar día')).toBeInTheDocument()
    })

    // Click "Guardar día" — should close overlay
    fireEvent.click(screen.getByText('Guardar día'))

    await waitFor(() => {
      // After closing, we should be back in block-level view with "Guardar" button
      expect(screen.getByText('Guardar')).toBeInTheDocument()
      expect(screen.queryByText('Guardar día')).not.toBeInTheDocument()
    })
  })
})
