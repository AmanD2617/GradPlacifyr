import { apiFetch } from './client'

export type Role = 'student' | 'admin' | 'recruiter' | 'hod' | 'tpo'

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
  // token is still returned in the body for backwards-compat API clients,
  // but the frontend now relies on the HttpOnly cookie — not this field.
  token?: string
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

export async function logout(): Promise<void> {
  await apiFetch<{ message: string }>('/auth/logout', { method: 'POST' })
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export async function register(
  email: string,
  password: string,
  role: Role,
  name?: string,
  phone?: string,
  enrollmentNumber?: string
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role, name, phone, enrollmentNumber }),
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
  phone?: string,
  verificationToken?: string   // OTP proof required by backend
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/google/complete', {
    method: 'POST',
    body: JSON.stringify({ googleId, email, name, phone, verificationToken }),
  })
}

// ═══════════ OTP ═══════════

export async function sendOtp(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export interface VerifyOtpResponse {
  verified: boolean
  verificationToken: string  // Short-lived JWT proving OTP was verified
}

export async function verifyOtp(email: string, code: string): Promise<VerifyOtpResponse> {
  return apiFetch<VerifyOtpResponse>('/auth/verify-otp', {
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
