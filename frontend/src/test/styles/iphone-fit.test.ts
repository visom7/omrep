/**
 * iphone-fit — CSS/HTML regression tests
 *
 * These tests read source files from disk to assert that the responsive fixes
 * for iPhone 375–430px viewports are present.  No browser / DOM needed.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ── helper ─────────────────────────────────────────────────────────────────
const root = resolve(__dirname, '../../..')  // frontend/

function readSrc(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf-8')
}

// ── t1 — viewport-fit=cover ─────────────────────────────────────────────────
describe('t1 — index.html viewport meta', () => {
  const html = readSrc('index.html')

  it('contains viewport-fit=cover', () => {
    expect(html).toContain('viewport-fit=cover')
  })

  it('still contains width=device-width and initial-scale=1.0', () => {
    expect(html).toContain('width=device-width')
    expect(html).toContain('initial-scale=1.0')
  })
})

// ── t2 — compact token breakpoint ───────────────────────────────────────────
describe('t2 — tokens.css compact breakpoint', () => {
  const css = readSrc('src/styles/tokens.css')

  it('has a @media (max-width: 389px) block', () => {
    expect(css).toContain('@media (max-width: 389px)')
  })

  it('overrides --pad inside the compact breakpoint', () => {
    // The block must redefine --pad
    const blockStart = css.indexOf('@media (max-width: 389px)')
    expect(blockStart).toBeGreaterThan(-1)
    const block = css.slice(blockStart, blockStart + 300)
    expect(block).toContain('--pad')
  })

  it('overrides --text-hero inside the compact breakpoint', () => {
    const blockStart = css.indexOf('@media (max-width: 389px)')
    const block = css.slice(blockStart, blockStart + 300)
    expect(block).toContain('--text-hero')
  })

  it('overrides --text-2xl inside the compact breakpoint', () => {
    const blockStart = css.indexOf('@media (max-width: 389px)')
    const block = css.slice(blockStart, blockStart + 300)
    expect(block).toContain('--text-2xl')
  })
})

// ── t3 — stepper grid narrowing ─────────────────────────────────────────────
describe('t3 — SessionPage.module.css stepper narrowing', () => {
  const css = readSrc('src/pages/session/SessionPage.module.css')

  it('has a @media (max-width: 389px) block', () => {
    expect(css).toContain('@media (max-width: 389px)')
  })

  it('reduces .logFormGrid gap inside the compact breakpoint', () => {
    const blockStart = css.indexOf('@media (max-width: 389px)')
    const block = css.slice(blockStart, blockStart + 400)
    // gap: 6px
    expect(block).toContain('gap: 6px')
  })

  it('reduces .stepperCtl padding inside the compact breakpoint', () => {
    const blockStart = css.indexOf('@media (max-width: 389px)')
    const block = css.slice(blockStart, blockStart + 400)
    expect(block).toContain('.stepperCtl')
  })

  it('sets .stepperValue min-width: 0 inside the compact breakpoint', () => {
    const blockStart = css.indexOf('@media (max-width: 389px)')
    const block = css.slice(blockStart, blockStart + 400)
    expect(block).toContain('min-width: 0')
  })
})

// ── t4 — Recharts YAxis margin fix ──────────────────────────────────────────
describe('t4 — ProgressPage.tsx YAxis / LineChart margin', () => {
  const tsx = readSrc('src/pages/ProgressPage.tsx')

  it('LineChart margin has left: 0 (not -16)', () => {
    expect(tsx).toContain('left: 0')
    expect(tsx).not.toContain('left: -16')
  })

  it('YAxis has an explicit width prop', () => {
    // width={36}
    expect(tsx).toMatch(/YAxis[^>]*width=\{/)
  })
})

// ── t5 — flex overflow truncation ───────────────────────────────────────────
describe('t5 — flex overflow truncation on name cells', () => {
  const sessionCss = readSrc('src/pages/session/SessionPage.module.css')
  const blocksCss  = readSrc('src/pages/blocks/BlocksListPage.module.css')

  it('.dayCardName has min-width: 0', () => {
    const classLine = sessionCss.split('\n').find(l => l.includes('.dayCardName'))
    expect(classLine).toBeDefined()
    expect(classLine).toContain('min-width: 0')
  })

  it('.dayCardName has text-overflow: ellipsis', () => {
    const classLine = sessionCss.split('\n').find(l => l.includes('.dayCardName'))
    expect(classLine).toContain('text-overflow: ellipsis')
  })

  it('.setRowEx has min-width: 0', () => {
    const classLine = sessionCss.split('\n').find(l => l.includes('.setRowEx'))
    expect(classLine).toBeDefined()
    expect(classLine).toContain('min-width: 0')
  })

  it('.setRowEx has text-overflow: ellipsis', () => {
    const classLine = sessionCss.split('\n').find(l => l.includes('.setRowEx'))
    expect(classLine).toContain('text-overflow: ellipsis')
  })

  it('.blockCardName has min-width: 0', () => {
    const classLine = blocksCss.split('\n').find(l => l.includes('.blockCardName'))
    expect(classLine).toBeDefined()
    expect(classLine).toContain('min-width: 0')
  })

  it('.blockCardName has text-overflow: ellipsis', () => {
    const classLine = blocksCss.split('\n').find(l => l.includes('.blockCardName'))
    expect(classLine).toContain('text-overflow: ellipsis')
  })
})
