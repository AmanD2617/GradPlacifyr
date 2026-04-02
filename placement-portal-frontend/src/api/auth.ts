import { apiFetch } from './client'

export type Role = 'student' | 'admin' | 'recruiter' | 'hod'

export interface User {
  id: number
  email: string
  name: string
  role: Role
  profileImage?: string | null
}

export interface LoginResponse {
  token: string
  user: User
}

export async function login(email: string, password: string, role: Role): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  })
}

export async function register(
  email: string,
  password: string,
  role: Role,
  name?: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role, name }),
  })
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/auth/reset-password/${token}`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}
