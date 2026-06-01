import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from '../../components/BottomNav'
import '../../i18n'

describe('BottomNav', () => {
  it('renders all four navigation tabs with Spanish labels', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    )

    expect(screen.getByText('Bloques')).toBeInTheDocument()
    expect(screen.getByText('Progreso')).toBeInTheDocument()
    expect(screen.getByText('Ajustes')).toBeInTheDocument()
  })

  it('navigation links have correct hrefs', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    )

    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/blocks')
    expect(hrefs).toContain('/progress')
    expect(hrefs).toContain('/settings')
  })

  it('active route gets active class', () => {
    render(
      <MemoryRouter initialEntries={['/blocks']}>
        <BottomNav />
      </MemoryRouter>
    )

    const blocksLink = screen.getByText('Bloques').closest('a')
    expect(blocksLink?.className).toContain('active')
  })
})
