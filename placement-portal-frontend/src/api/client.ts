import { API_BASE } from '../config'

/**
 * Central fetch wrapper.
 *
 * Auth is now handled via HttpOnly cookie (set by the backend on login).
 * credentials: 'include' ensures the browser sends the cookie on every
 * cross-origin request to the API server.
 *
 * The Authorization header fallback has been removed — tokens must not
 * be stored in localStorage (XSS-accessible storage).
 */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // send HttpOnly cookie automatically
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    let message = 'Request failed'

    if (typeof data === 'string') {
      message = data
    } else if (data && typeof (data as any).error === 'string') {
      message = (data as any).error
    } else if (
      data &&
      typeof (data as any).error === 'object' &&
      typeof (data as any).error.message === 'string'
    ) {
      message = (data as any).error.message
    }

    throw new Error(message)
  }

  return data as T
}
