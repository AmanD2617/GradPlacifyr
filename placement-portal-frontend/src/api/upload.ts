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

export async function uploadAvatar(file: File): Promise<UploadAvatarResponse> {
  const formData = new FormData()
  formData.append('avatar', file)

  const res = await fetch(`${API_BASE}/upload/avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      typeof data === 'string'
        ? data
        : data?.error?.message || data?.error || 'Upload failed'
    throw new Error(message)
  }

  return data as UploadAvatarResponse
}

export async function deleteAvatar(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/upload/avatar`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      typeof data === 'string'
        ? data
        : data?.error?.message || data?.error || 'Delete failed'
    throw new Error(message)
  }

  return data as { message: string }
}
