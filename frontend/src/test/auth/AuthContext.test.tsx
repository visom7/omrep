import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { AuthProvider, useAuth } from '../../auth/AuthContext'

// Minimal JWT access token for testing (not cryptographically valid)
function makeTestToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: userId, exp: 9999999999 }))
  return `${header}.${payload}.fake-signature`
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.accessToken).toBeNull()
    expect(result.current.userId).toBeNull()
  })

  it('login sets authenticated state and stores refresh token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const testToken = makeTestToken('user-123')

    act(() => {
      result.current.login(testToken, 'user-123:refresh-uuid')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.accessToken).toBe(testToken)
    expect(result.current.userId).toBe('user-123')
    expect(localStorage.getItem('training_planner_refresh')).toBe('user-123:refresh-uuid')
  })

  it('logout clears state and removes refresh token from storage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const testToken = makeTestToken('user-456')

    act(() => {
      result.current.login(testToken, 'user-456:refresh-uuid')
    })
    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.accessToken).toBeNull()
    expect(localStorage.getItem('training_planner_refresh')).toBeNull()
  })

  it('throws when used outside AuthProvider', () => {
    // renderHook without wrapper should throw
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside AuthProvider')
  })
})
