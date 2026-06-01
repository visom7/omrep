import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'
import '../i18n'

describe('App', () => {
  it('redirects unauthenticated users to the login page', () => {
    render(<App />)

    // The login screen shows the password label and a link to register.
    expect(screen.getByText('Contraseña')).toBeInTheDocument()
    expect(screen.getByText('Crear cuenta')).toBeInTheDocument()
  })
})
