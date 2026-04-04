import { apiFetch } from './client'

export type Role = 'student' | 'admin' | 'recruiter' | 'hod'

export interface User {
  id: number
  email: string
  name: string
  role: Role
  profileImage?: string | null
  phone?: string | null
  status?: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterResponse {
  token?: string
  user?: User
  pending?: boolean
  message?: string
}

export interface GoogleAuthResponse {
  exists: boolean
  token?: string
  user?: User
  email?: string
  name?: string
  googleId?: string
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
  name?: string,
  phone?: string
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role, name, phone }),
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

// ═══════════ Google OAuth ═══════════

export async function googleAuth(credential: string): Promise<GoogleAuthResponse> {
  return apiFetch<GoogleAuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
}

export async function completeGoogleRegistration(
  googleId: string,
  email: string,
  name: string,
  phone?: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/google/complete', {
    method: 'POST',
    body: JSON.stringify({ googleId, email, name, phone }),
  })
}

// ═══════════ OTP ═══════════

export async function sendOtp(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyOtp(email: string, code: string): Promise<{ verified: boolean }> {
  return apiFetch<{ verified: boolean }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
}

// ═══════════ Company Approval ═══════════

export interface PendingCompany {
  id: number
  name: string
  email: string
  phone: string | null
  createdAt: string
}

export async function getPendingCompanies(): Promise<PendingCompany[]> {
  return apiFetch<PendingCompany[]>('/auth/pending-companies')
}

export async function approveCompany(userId: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/auth/approve-company/${userId}`, {
    method: 'POST',
  })
}

export async function rejectCompany(userId: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/auth/reject-company/${userId}`, {
    method: 'POST',
  })
}
