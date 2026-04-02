import { apiFetch } from './client'

export interface CalendarEvent {
  id: number
  title: string
  description: string
  date: string      // YYYY-MM-DD
  time: string
  company: string
  createdBy: { id: number; name: string; role: string } | null
  createdAt: string
}

export interface CreateEventPayload {
  title: string
  description?: string
  date: string
  time?: string
  company?: string
}

export async function getEvents(): Promise<CalendarEvent[]> {
  return apiFetch<CalendarEvent[]>('/events')
}

export async function createEvent(payload: CreateEventPayload): Promise<CalendarEvent> {
  return apiFetch<CalendarEvent>('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateEvent(id: number, payload: Partial<CreateEventPayload>): Promise<CalendarEvent> {
  return apiFetch<CalendarEvent>(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteEvent(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/events/${id}`, {
    method: 'DELETE',
  })
}
