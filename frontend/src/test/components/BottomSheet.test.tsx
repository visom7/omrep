import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BottomSheet } from '../../components/BottomSheet'

describe('BottomSheet', () => {
  it('does not render when isOpen is false', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet isOpen={false} onClose={onClose} title="Test Sheet">
        <p>Content</p>
      </BottomSheet>
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders title and children when isOpen is true', async () => {
    const onClose = vi.fn()
    await act(async () => {
      render(
        <BottomSheet isOpen={true} onClose={onClose} title="Test Title">
          <p>Sheet content</p>
        </BottomSheet>
      )
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Sheet content')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn()
    vi.useFakeTimers()
    await act(async () => {
      render(
        <BottomSheet isOpen={true} onClose={onClose} title="Test">
          <p>Content</p>
        </BottomSheet>
      )
    })

    // The backdrop has aria-hidden="true" — query by its role
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement
    fireEvent.click(backdrop)

    // Wait for close animation timeout (220ms)
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('calls onClose when ✕ button is clicked', async () => {
    const onClose = vi.fn()
    vi.useFakeTimers()
    await act(async () => {
      render(
        <BottomSheet isOpen={true} onClose={onClose} title="Test">
          <p>Content</p>
        </BottomSheet>
      )
    })

    const closeBtn = screen.getByRole('button', { name: /cerrar/i })
    fireEvent.click(closeBtn)

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = vi.fn()
    vi.useFakeTimers()
    await act(async () => {
      render(
        <BottomSheet isOpen={true} onClose={onClose} title="Test">
          <p>Content</p>
        </BottomSheet>
      )
    })

    fireEvent.keyDown(document, { key: 'Escape' })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
