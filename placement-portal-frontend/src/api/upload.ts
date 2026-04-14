import { API_BASE } from '../config'

export interface UploadAvatarResponse {
  message: string
  profileImage: string
  user: {
    id: number
    email: string
    name: string
    role: string
    profile_image: string
  }
}

/** Shared fetch helper for multipart form data (no Content-Type — browser sets it with boundary). */
async function fetchForm<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: 'include', // send HttpOnly cookie
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      typeof data === 'string'
        ? data
        : (data as any)?.error?.message || (data as any)?.error || 'Upload failed'
    throw new Error(message)
  }

  return data as T
}

export async function uploadAvatar(file: File): Promise<UploadAvatarResponse> {
  const formData = new FormData()
  formData.append('avatar', file)

  return fetchForm<UploadAvatarResponse>(`${API_BASE}/upload/avatar`, {
    method: 'POST',
    body: formData,
  })
}

export async function deleteAvatar(): Promise<{ message: string }> {
  return fetchForm<{ message: string }>(`${API_BASE}/upload/avatar`, {
    method: 'DELETE',
  })
}
