import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../../hooks/useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    // Clear localStorage and reset documentElement
    localStorage.removeItem('theme')
    delete document.documentElement.dataset.theme
  })

  afterEach(() => {
    localStorage.removeItem('theme')
    delete document.documentElement.dataset.theme
  })

  it('default theme is "dark"', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('setTheme("light") sets data-theme on documentElement', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('light')
    })

    expect(result.current.theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('setTheme("dark") removes/clears data-theme on documentElement', () => {
    // First set light
    document.documentElement.dataset.theme = 'light'

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme('light')
    })

    expect(localStorage.getItem('theme')).toBe('light')

    act(() => {
      result.current.setTheme('dark')
    })

    expect(localStorage.getItem('theme')).toBe('dark')
  })
})
