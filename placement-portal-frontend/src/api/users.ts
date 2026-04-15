import { apiFetch } from './client'

export interface PortalUser {
  id: number
  name: string | null
  email: string
  role: 'student' | 'admin' | 'recruiter' | 'hod' | 'tpo'
  createdAt: string
}

export interface PaginatedUsers {
  data: PortalUser[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function getUsers(
  role?: string,
  q?: string,
  page = 1,
  limit = 50
): Promise<PortalUser[]> {
  const params = new URLSearchParams()
  if (role)  params.set('role', role)
  if (q)     params.set('q', q)
  params.set('page',  String(page))
  params.set('limit', String(limit))

  const res = await apiFetch<PaginatedUsers>(`/users?${params.toString()}`)
  // The backend now returns { data, pagination } — extract the array for callers
  // that expect a flat list (existing admin pages).
  return res.data ?? (res as unknown as PortalUser[])
}

export async function getUsersPaginated(
  role?: string,
  q?: string,
  page = 1,
  limit = 50
): Promise<PaginatedUsers> {
  const params = new URLSearchParams()
  if (role)  params.set('role', role)
  if (q)     params.set('q', q)
  params.set('page',  String(page))
  params.set('limit', String(limit))

  return apiFetch<PaginatedUsers>(`/users?${params.toString()}`)
}

export async function getTpoAccounts(): Promise<PortalUser[]> {
  return apiFetch<PortalUser[]>('/users/tpo')
}

export interface CreateTpoPayload {
  name: string
  email: string
  phone: string
  password: string
}

export async function createTpoAccount(payload: CreateTpoPayload): Promise<{ message: string; user: PortalUser }> {
  return apiFetch('/users/create-tpo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
