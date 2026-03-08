import { apiFetch } from './client'

export interface Job {
  id: number
  title: string
  company: string
  ctc: string | null
  location: string | null
  status: string
  created_at: string
  description?: string
  requirements?: string
  deadline?: string
  employmentType?: string
}

export async function getJobs(): Promise<Job[]> {
  return apiFetch<Job[]>('/jobs')
}

export interface NewJobInput {
  title: string
  company: string
  ctc?: string
  location?: string
  description?: string
  requirements?: string
}

export interface UpdateJobInput extends NewJobInput {
  status?: string
}

export async function createJob(input: NewJobInput): Promise<Job> {
  return apiFetch<Job>('/jobs', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateJob(id: number, input: UpdateJobInput): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteJob(id: number): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/jobs/${id}`, {
    method: 'DELETE',
  })
}
