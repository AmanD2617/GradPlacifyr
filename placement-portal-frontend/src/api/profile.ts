import { apiFetch } from './client'

export interface StudentProject {
  title: string
  description: string
  techStack: string
  githubLink?: string
  link?: string
}

export interface StudentProfile {
  tenthPercentage: number | null
  twelfthPercentage: number | null
  backlogs: number | null
  graduationYear: number | null
  programmingLanguages: string
  frameworks: string
  tools: string
  certifications: string
  projects: StudentProject[]
  internshipExperience: string
  achievements: string
  githubUrl: string
  linkedinUrl: string
  portfolioUrl: string
}

export async function getMyProfile(): Promise<StudentProfile> {
  return apiFetch<StudentProfile>('/profile/me')
}

export async function updateMyProfile(input: StudentProfile): Promise<StudentProfile> {
  return apiFetch<StudentProfile>('/profile/me', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

