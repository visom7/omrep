import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AuthState {
  accessToken: string | null
  userId: string | null
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

// Exported so tests can provide mock values directly
export const AuthContext = createContext<AuthContextValue | null>(null)

const REFRESH_TOKEN_KEY = 'training_planner_refresh'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    accessToken: null,
    userId: null,
    isAuthenticated: false,
  }))

  const login = useCallback((accessToken: string, refreshToken: string) => {
    // Store refresh token in localStorage (MVP choice — httpOnly cookie requires server-side setup)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    // Parse userId from JWT payload (base64 decode the payload segment)
    const payload = JSON.parse(atob(accessToken.split('.')[1]!))
    setState({
      accessToken,
      userId: payload.sub as string,
      isAuthenticated: true,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    setState({ accessToken: null, userId: null, isAuthenticated: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}
