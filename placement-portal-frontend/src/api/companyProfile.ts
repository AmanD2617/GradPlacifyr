import { apiFetch } from './client'
import { API_BASE } from '../config'

// ═══════════ Types ═══════════

export interface CompanyProfileData {
  companyName: string
  about: string
  website: string
  industry: string
  location: string
  logoUrl: string | null
}

export interface CompanyUserData {
  id: number
  name: string
  email: string
  phone: string
  role: string
  profileImage: string | null
}

export interface CompanyProfileResponse {
  user: CompanyUserData
  profile: CompanyProfileData
}

// ═══════════ API calls ═══════════

export async function getCompanyProfile(): Promise<CompanyProfileResponse> {
  return apiFetch<CompanyProfileResponse>('/company-profile/me')
}

export async function updateCompanyProfile(data: {
  name?: string
  phone?: string
  companyName?: string
  about?: string
  website?: string
  industry?: string
  location?: string
}): Promise<CompanyProfileResponse> {
  return apiFetch<CompanyProfileResponse>('/company-profile/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function uploadCompanyLogo(file: File): Promise<{ logoUrl: string }> {
  const formData = new FormData()
  formData.append('logo', file)

  const res = await fetch(`${API_BASE}/company-profile/logo`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      typeof data === 'string'
        ? data
        : data?.error?.message || data?.error || 'Logo upload failed'
    throw new Error(message)
  }

  return data as { logoUrl: string }
}
