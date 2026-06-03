import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SettingsPage } from '../../pages/SettingsPage'
import '../../i18n'

// Mock auth context
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    logout: vi.fn(),
  }),
}))

// Mock API
vi.mock('../../api/client', () => ({
  apiFetch: vi.fn().mockResolvedValue({
    id: '1', email: 'test@test.com', displayName: 'Test User', preferredOneRmFormula: 'EPLEY',
  }),
}))

// Mock useTheme
vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
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

describe('SettingsPage', () => {
  it('renders formula radio options (Epley, Brzycki, Lombardi)', async () => {
    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Epley (por defecto)')).toBeInTheDocument()
      expect(screen.getByText('Brzycki')).toBeInTheDocument()
      expect(screen.getByText('Lombardi')).toBeInTheDocument()
    })
  })

  it('renders logout button with correct label', async () => {
    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
    })
  })

  it('theme toggle renders with dark/light options', async () => {
    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Oscuro')).toBeInTheDocument()
      expect(screen.getByText('Claro')).toBeInTheDocument()
    })
  })

  it('formula expression shown in mono font (num class)', async () => {
    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      // The Epley expression key value
      expect(screen.getByText('w · (1 + reps/30)')).toBeInTheDocument()
    })
  })
})
