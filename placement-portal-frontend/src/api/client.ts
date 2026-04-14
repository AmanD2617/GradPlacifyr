import { API_BASE } from '../config'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
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
