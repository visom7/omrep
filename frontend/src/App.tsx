import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { configureApiClient } from './api/client'
import { AppLayout } from './layouts/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SettingsPage } from './pages/SettingsPage'
import { BlocksListPage } from './pages/blocks/BlocksListPage'
import { BlockDetailPage } from './pages/blocks/BlockDetailPage'
import { BlockEditorPage } from './pages/blocks/BlockEditorPage'
import { SessionPage } from './pages/session/SessionPage'
import { ProgressPage } from './pages/ProgressPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

function AppRoutes() {
  const { isAuthenticated, accessToken } = useAuth()

  // Wire up the API client with the current access token
  configureApiClient({ getAccessToken: () => accessToken })

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Block planning (M3) */}
        <Route path="/blocks" element={<BlocksListPage />} />
        <Route path="/blocks/new" element={<BlockEditorPage />} />
        <Route path="/blocks/:blockId" element={<BlockDetailPage />} />
        <Route path="/blocks/:blockId/edit" element={<BlockEditorPage />} />

        {/* Other modules */}
        <Route path="/session" element={<SessionPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/blocks' : '/login'} replace />}
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
