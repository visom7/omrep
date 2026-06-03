import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RegisterPage } from '../../pages/RegisterPage'
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

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  )
}

describe('RegisterPage', () => {
  it('renders register heading', () => {
    renderRegisterPage()
    expect(screen.getByText('Crear cuenta')).toBeInTheDocument()
  })

  it('displayName field is present and appears first', () => {
    renderRegisterPage()
    const inputs = document.querySelectorAll('input')
    const displayNameInput = inputs[0]
    expect(displayNameInput).toBeTruthy()
    expect(displayNameInput?.type).toBe('text')
  })

  it('has link back to login', () => {
    renderRegisterPage()
    const loginLink = screen.getByRole('link', { name: /iniciar sesión/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.getAttribute('href')).toBe('/login')
  })
})
