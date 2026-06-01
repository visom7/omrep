import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { AuthContext } from '../../auth/AuthContext'
import '../../i18n'

// Mock AuthContext value
function makeAuthContext(isAuthenticated: boolean) {
  return {
    accessToken: isAuthenticated ? 'test-token' : null,
    userId: isAuthenticated ? 'user-123' : null,
    isAuthenticated,
    login: () => {},
    logout: () => {},
  }
}

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    render(
      <AuthContext.Provider value={makeAuthContext(true)}>
        <MemoryRouter initialEntries={['/blocks']}>
          <Routes>
            <Route
              path="/blocks"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    render(
      <AuthContext.Provider value={makeAuthContext(false)}>
        <MemoryRouter initialEntries={['/blocks']}>
          <Routes>
            <Route
              path="/blocks"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders nothing extra when redirecting', () => {
    render(
      <AuthContext.Provider value={makeAuthContext(false)}>
        <MemoryRouter initialEntries={['/settings']}>
          <Routes>
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <div>Settings Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    )

    expect(screen.queryByText('Settings Content')).not.toBeInTheDocument()
  })
})
