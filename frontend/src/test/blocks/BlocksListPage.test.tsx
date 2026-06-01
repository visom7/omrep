import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlocksListPage } from '../../pages/blocks/BlocksListPage'
import '../../i18n'

// Mock the blocks API
vi.mock('../../api/blocks', () => ({
  blocksApi: {
    list: vi.fn(),
    delete: vi.fn(),
  },
}))

import { blocksApi } from '../../api/blocks'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('BlocksListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    vi.mocked(blocksApi.list).mockReturnValue(new Promise(() => {})) // never resolves

    renderWithProviders(<BlocksListPage />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('renders block names when loaded', async () => {
    vi.mocked(blocksApi.list).mockResolvedValue([
      { id: '1', name: 'Bloque Fuerza', order: 1, createdAt: '', weekCount: 4 },
      { id: '2', name: 'Bloque Volumen', order: 2, createdAt: '', weekCount: 3 },
    ])

    renderWithProviders(<BlocksListPage />)

    await waitFor(() => {
      expect(screen.getByText('Bloque Fuerza')).toBeInTheDocument()
      expect(screen.getByText('Bloque Volumen')).toBeInTheDocument()
    })
  })

  it('shows "Nuevo bloque" button', async () => {
    vi.mocked(blocksApi.list).mockResolvedValue([])

    renderWithProviders(<BlocksListPage />)

    await waitFor(() => {
      expect(screen.getByText('Nuevo bloque')).toBeInTheDocument()
    })
  })
})
