import { API_BASE } from '../config'

export interface ParsedResumeProfile {
  programmingLanguages: string[]
  frameworks: string[]
  tools: string[]
  certifications: string[]
  internshipExperience: string
  projects: string[]
  achievements: string[]
}

export interface ResumeInfo {
  resumeUrl: string | null
  originalName: string | null
}

export interface UploadResumeResponse {
  message: string
  resumeUrl: string
  originalName: string
}

/** Shared fetch helper for multipart form data. */
async function fetchForm<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: 'include', // send HttpOnly cookie
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

/** Upload a PDF resume (persists to disk) */
export async function uploadResume(file: File): Promise<UploadResumeResponse> {
  const formData = new FormData()
  formData.append('resume', file)

  return fetchForm<UploadResumeResponse>(`${API_BASE}/student/upload-resume`, {
    method: 'POST',
    body: formData,
  })
}

/** Get current resume info */
export async function getMyResume(): Promise<ResumeInfo> {
  return fetchForm<ResumeInfo>(`${API_BASE}/student/my-resume`, { method: 'GET' })
}

/** Delete stored resume */
export async function deleteMyResume(): Promise<{ message: string }> {
  return fetchForm<{ message: string }>(`${API_BASE}/student/my-resume`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Send resume to AI for parsing (in-memory, no storage) */
export async function parseResume(file: File): Promise<ParsedResumeProfile> {
  const formData = new FormData()
  formData.append('resume', file)

  return fetchForm<ParsedResumeProfile>(`${API_BASE}/student/parse-resume`, {
    method: 'POST',
    body: formData,
  })
}
