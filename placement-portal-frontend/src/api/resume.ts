export interface ParsedResumeProfile {
  programmingLanguages: string[]
  frameworks: string[]
  tools: string[]
  certifications: string[]
  internshipExperience: string
  projects: string[]
  achievements: string[]
}

export async function parseResume(file: File): Promise<ParsedResumeProfile> {
  const token = localStorage.getItem('placement_token')
  const formData = new FormData()
  formData.append('resume', file)

  const res = await fetch('http://localhost:3000/api/student/parse-resume', {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    let message = 'Failed to parse resume'
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

  return data as ParsedResumeProfile
}
