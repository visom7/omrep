import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Read the real CSS source as text. (Vite's `?raw` import returns an empty stub under
// vitest's CSS handling, so we read straight from disk.) __dirname is provided by
// vitest's module transform at runtime and typed via @types/node.
const css = readFileSync(resolve(__dirname, '../../styles/tokens.css'), 'utf-8')

describe('tokens.css', () => {
  it('contains --color-on-accent (new token name)', () => {
    expect(css).toContain('--color-on-accent')
  })

  it('contains --color-border-strong (new token name)', () => {
    expect(css).toContain('--color-border-strong')
  })

  it('does NOT contain --color-border-focus (renamed away)', () => {
    expect(css).not.toContain('--color-border-focus')
  })

  it('does NOT contain --color-text-on-accent (renamed away)', () => {
    expect(css).not.toContain('--color-text-on-accent')
  })

  it('contains [data-theme="light"] block', () => {
    expect(css).toContain('[data-theme="light"]')
  })
})
