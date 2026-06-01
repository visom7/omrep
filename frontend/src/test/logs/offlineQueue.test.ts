import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOfflineQueue,
  enqueueOfflineLog,
  clearOfflineQueue,
  flushOfflineQueue,
} from '../../api/logs'
import { vi } from 'vitest'

const mockLog = {
  date: '2026-05-01T10:00:00Z',
  exerciseId: 'exercise-123',
  setType: 'WORKING' as const,
  weightKg: 100,
  reps: 5,
  completed: true,
}

describe('offline log queue', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('starts with empty queue', () => {
    expect(getOfflineQueue()).toEqual([])
  })

  it('enqueues a log when offline', () => {
    enqueueOfflineLog(mockLog)
    expect(getOfflineQueue()).toHaveLength(1)
    expect(getOfflineQueue()[0]).toEqual(mockLog)
  })

  it('can enqueue multiple logs', () => {
    enqueueOfflineLog(mockLog)
    enqueueOfflineLog({ ...mockLog, weightKg: 110 })
    expect(getOfflineQueue()).toHaveLength(2)
  })

  it('clearOfflineQueue removes all logs', () => {
    enqueueOfflineLog(mockLog)
    enqueueOfflineLog(mockLog)
    clearOfflineQueue()
    expect(getOfflineQueue()).toHaveLength(0)
  })

  it('flushOfflineQueue sends all queued logs and clears queue on success', async () => {
    // Mock the fetch to succeed
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 'log-1', ...mockLog }),
    } as Response)

    enqueueOfflineLog(mockLog)
    enqueueOfflineLog({ ...mockLog, weightKg: 110 })

    const synced = await flushOfflineQueue()

    expect(synced).toBe(2)
    expect(getOfflineQueue()).toHaveLength(0)
  })

  it('flushOfflineQueue keeps failed logs in queue', async () => {
    // First call succeeds, second fails
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'log-1' }),
      } as Response)
      .mockRejectedValueOnce(new Error('Network error'))

    enqueueOfflineLog(mockLog)
    enqueueOfflineLog({ ...mockLog, weightKg: 110 })

    const synced = await flushOfflineQueue()

    expect(synced).toBe(1)
    // One log still in queue
    expect(getOfflineQueue()).toHaveLength(1)
  })
})
