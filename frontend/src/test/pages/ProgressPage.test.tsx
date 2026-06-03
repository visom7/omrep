import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProgressPage } from '../../pages/ProgressPage'
import '../../i18n'

// Mock apiFetch
vi.mock('../../api/client', () => ({
  apiFetch: vi.fn().mockResolvedValue([]),
}))

// Mock auth context
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    accessToken: 'test-token',
  }),
}))

// Mock recharts to avoid canvas issues in jsdom
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock ExercisePicker to simplify
vi.mock('../../components/ExercisePicker', () => ({
  ExercisePicker: (_props: { onSelect: (ex: unknown) => void }) => (
    <div data-testid="exercise-picker">picker</div>
  ),
}))

// Mock CsvExportSheet
vi.mock('../../components/CsvExportSheet', () => ({
  CsvExportSheet: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="csv-sheet">Export sheet</div> : null,
}))

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

describe('ProgressPage', () => {
  it('renders the segmented control with both mode labels', async () => {
    renderWithProviders(<ProgressPage />)

    await waitFor(() => {
      expect(screen.getByText('Total 1RM')).toBeInTheDocument()
      expect(screen.getByText('Volumen')).toBeInTheDocument()
    })
  })

  it('renders loading state while data is loading', async () => {
    const { apiFetch } = await import('../../api/client')
    vi.mocked(apiFetch).mockReturnValue(new Promise(() => {}))

    renderWithProviders(<ProgressPage />)

    await waitFor(() => {
      expect(screen.getByText('Cargando...')).toBeInTheDocument()
    })
  })

  it('chart renders when data is present', async () => {
    const { apiFetch } = await import('../../api/client')
    vi.mocked(apiFetch).mockResolvedValue([
      { week: '2026-W01', totalOneRm: 500 },
      { week: '2026-W02', totalOneRm: 510 },
    ])

    renderWithProviders(<ProgressPage />)

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  it('export button is visible', async () => {
    renderWithProviders(<ProgressPage />)

    await waitFor(() => {
      expect(screen.getByTestId('export-btn')).toBeInTheDocument()
    })
  })
})
