import { useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'theme'

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.dataset.theme = 'light'
  } else {
    // Dark is default — remove the attribute
    delete document.documentElement.dataset.theme
  }
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage not available
  }
  return 'dark'
}

// Apply the persisted theme as early as possible (called from main.tsx before the
// first render) so a saved "light" choice survives a reload instead of flashing
// the default dark theme until Settings mounts.
export function initTheme() {
  applyTheme(readStoredTheme())
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  // Apply theme on mount and when changed
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // ignore
    }
    setThemeState(newTheme)
    applyTheme(newTheme)
  }

  return { theme, setTheme }
}
