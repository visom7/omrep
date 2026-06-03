import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PlateBar } from '../../components/PlateBar'

describe('PlateBar', () => {
  it('renders correct plates for 100kg (bar=20, per-side=40kg → 25+15)', () => {
    const { container } = render(<PlateBar kg={100} />)
    // per-side = (100-20)/2 = 40 → 25 + 15
    const spans = container.querySelectorAll('span')
    // 2 plates per side = 2 spans
    expect(spans.length).toBe(2)
    // First plate: 25kg (plate-25 red) height 12px
    expect(spans[0]!.style.height).toBe('12px')
    // Second plate: 15kg (plate-15 yellow) height 9px
    expect(spans[1]!.style.height).toBe('9px')
  })

  it('renders nothing for exactly 20kg (empty bar)', () => {
    const { container } = render(<PlateBar kg={20} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for 0kg', () => {
    const { container } = render(<PlateBar kg={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders correct number of spans for 60kg (bar=20, per-side=20 → one 20kg plate)', () => {
    const { container } = render(<PlateBar kg={60} />)
    // per-side = (60-20)/2 = 20 → one 20kg plate
    const spans = container.querySelectorAll('span')
    expect(spans.length).toBe(1)
    // 20kg plate height = 10px
    expect(spans[0]!.style.height).toBe('10px')
  })
})
