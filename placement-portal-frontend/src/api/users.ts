import { apiFetch } from './client'

export interface PortalUser {
  id: number
  name: string | null
  email: string
  role: 'student' | 'admin' | 'recruiter' | 'hod' | 'tpo'
  createdAt: string
}

export async function getUsers(role?: string, q?: string): Promise<PortalUser[]> {
  const params = new URLSearchParams()
  if (role) params.set('role', role)
  if (q) params.set('q', q)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return apiFetch<PortalUser[]>(`/users${suffix}`)
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
