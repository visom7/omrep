/**
 * Minimal fetch wrapper that attaches the JWT Bearer header.
 * The accessToken is passed in from the caller (not stored globally here)
 * to keep the auth state in React context only.
 */

interface ApiClientOptions {
  getAccessToken: () => string | null
}

let _getAccessToken: () => string | null = () => null

export function configureApiClient(options: ApiClientOptions) {
  _getAccessToken = options.getAccessToken
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = _getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(path, { ...options, headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ title: response.statusText }))
    throw new ApiError(response.status, error.title ?? response.statusText, error)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  return response.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
