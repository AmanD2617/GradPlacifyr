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

function getHeaders(includeJson = false) {
  const headers: Record<string, string> = {}
  if (includeJson) headers['Content-Type'] = 'application/json'
  return headers
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    let message = 'Request failed'
    if (typeof data === 'string') {
      message = data
    } else if (data && typeof (data as any).error === 'string') {
      message = (data as any).error
    } else if (data && typeof (data as any).error === 'object' && typeof (data as any).error.message === 'string') {
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

  const res = await fetch(`${API_BASE}/student/upload-resume`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
    body: formData,
  })

  return handleResponse<UploadResumeResponse>(res)
}

/** Get current resume info */
export async function getMyResume(): Promise<ResumeInfo> {
  const res = await fetch(`${API_BASE}/student/my-resume`, {
    credentials: 'include',
    headers: getHeaders(),
  })
  return handleResponse<ResumeInfo>(res)
}

/** Delete stored resume */
export async function deleteMyResume(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/student/my-resume`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getHeaders(true),
  })
  return handleResponse<{ message: string }>(res)
}

/** Send resume to AI for parsing (in-memory, no storage) */
export async function parseResume(file: File): Promise<ParsedResumeProfile> {
  const formData = new FormData()
  formData.append('resume', file)

  const res = await fetch(`${API_BASE}/student/parse-resume`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
    body: formData,
  })

  return handleResponse<ParsedResumeProfile>(res)
}
