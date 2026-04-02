const API_BASE = 'http://localhost:3000/api'

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
  const token = localStorage.getItem('placement_token')
  const formData = new FormData()
  formData.append('avatar', file)

  const res = await fetch(`${API_BASE}/upload/avatar`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
  const token = localStorage.getItem('placement_token')

  const res = await fetch(`${API_BASE}/upload/avatar`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
