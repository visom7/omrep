import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CsvExportSheet } from '../../components/CsvExportSheet'
import '../../i18n'

// Mock BottomSheet to render children directly when open
vi.mock('../../components/BottomSheet', () => ({
  BottomSheet: ({ isOpen, children, title }: { isOpen: boolean; children: React.ReactNode; title?: string }) =>
    isOpen ? (
      <div role="dialog">
        {title && <p>{title}</p>}
        {children}
      </div>
    ) : null,
}))

describe('CsvExportSheet', () => {
  it('renders within BottomSheet when open', async () => {
    await act(async () => {
      render(
        <CsvExportSheet
          isOpen={true}
          onClose={vi.fn()}
          accessToken="test-token"
        />
      )
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Exportar CSV')).toBeInTheDocument()
  })

  it('shows range segmented options (4, 8, 12 sem, Todo)', async () => {
    await act(async () => {
      render(
        <CsvExportSheet
          isOpen={true}
          onClose={vi.fn()}
          accessToken="test-token"
        />
      )
    })
    expect(screen.getByText('4 sem')).toBeInTheDocument()
    expect(screen.getByText('8 sem')).toBeInTheDocument()
    expect(screen.getByText('12 sem')).toBeInTheDocument()
    expect(screen.getByText('Todo')).toBeInTheDocument()
  })

  it('download button is present', async () => {
    await act(async () => {
      render(
        <CsvExportSheet
          isOpen={true}
          onClose={vi.fn()}
          accessToken="test-token"
        />
      )
    })
    expect(screen.getByText('Descargar .csv')).toBeInTheDocument()
  })
})
