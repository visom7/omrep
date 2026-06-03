import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../../pages/LoginPage'
import '../../i18n'

// Mock auth context
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock API
vi.mock('../../api/client', () => ({
  apiFetch: vi.fn().mockResolvedValue({ accessToken: 'tok', refreshToken: 'ref' }),
}))

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  it('renders TOTAL wordmark', () => {
    renderLoginPage()
    expect(screen.getByText('TOTAL')).toBeInTheDocument()
  })

  it('renders tagline', () => {
    renderLoginPage()
    expect(screen.getByText('Planifica · Levanta · Suma')).toBeInTheDocument()
  })

  it('email and password fields are present', () => {
    renderLoginPage()
    expect(screen.getByRole('textbox', { name: /correo/i })).toBeInTheDocument()
    // password input (not role textbox, check by type)
    const inputs = document.querySelectorAll('input')
    const passwordInput = Array.from(inputs).find((i) => i.type === 'password')
    expect(passwordInput).toBeTruthy()
  })

  it('submit button calls the API', async () => {
    const { apiFetch } = await import('../../api/client')
    renderLoginPage()

    const emailInput = screen.getByRole('textbox', { name: /correo/i })
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    const submitBtn = screen.getByRole('button', { name: /entrar/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalled()
    })
  })
})
