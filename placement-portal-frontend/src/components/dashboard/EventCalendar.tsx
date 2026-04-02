import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  X,
  Calendar,
  Clock,
  Building2,
  Search,
  Bell,
} from 'lucide-react'
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type CalendarEvent,
  type CreateEventPayload,
} from '../../api/events'
import './EventCalendar.css'

interface EventCalendarProps {
  /** If true, user can create / edit / delete events */
  canManage?: boolean
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
}

// ─── Main Component ─────────────────────────────────────────────────────────

const EventCalendar = ({ canManage = false }: EventCalendarProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  // Form fields
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formCompany, setFormCompany] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchEvents = useCallback(async () => {
    try {
      const data = await getEvents()
      setEvents(data)
    } catch {
      // silently fail — events section is supplementary
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // ── Calendar grid helpers ──

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = []

    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    return cells
  }, [year, month])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const key = ev.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    return map
  }, [events])

  const todayKey = toDateKey(new Date())

  // ── Navigation ──

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const prevYear = () => setViewDate(new Date(year - 1, month, 1))
  const nextYear = () => setViewDate(new Date(year + 1, month, 1))

  // ── Form helpers ──

  function openCreateForm(dateStr?: string) {
    setEditingEvent(null)
    setFormTitle('')
    setFormDesc('')
    setFormDate(dateStr || toDateKey(new Date()))
    setFormTime('')
    setFormCompany('')
    setFormError('')
    setShowForm(true)
  }

  function openEditForm(ev: CalendarEvent) {
    setEditingEvent(ev)
    setFormTitle(ev.title)
    setFormDesc(ev.description)
    setFormDate(ev.date)
    setFormTime(ev.time)
    setFormCompany(ev.company)
    setFormError('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim() || !formDate) {
      setFormError('Title and date are required')
      return
    }

    const payload: CreateEventPayload = {
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      date: formDate,
      time: formTime.trim() || undefined,
      company: formCompany.trim() || undefined,
    }

    setSaving(true)
    setFormError('')

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, payload)
      } else {
        await createEvent(payload)
      }
      setShowForm(false)
      await fetchEvents()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteEvent(id)
      await fetchEvents()
      if (selectedDate) {
        const remaining = events.filter((e) => e.date === selectedDate && e.id !== id)
        if (!remaining.length) setSelectedDate(null)
      }
    } catch {
      // fail silently
    }
  }

  // ── Events for selected date ──

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) || [] : []

  // ── Upcoming events list (next 5) ──

  const upcomingEvents = useMemo(() => {
    const today = toDateKey(new Date())
    return events.filter((e) => e.date >= today).slice(0, 5)
  }, [events])

  // ── Display events (selected date takes priority, else upcoming) ──

  const displayEvents = selectedDate ? selectedEvents : upcomingEvents

  // ── Render ──

  return (
    <div className="ecal-wrapper">
      <div className="ecal-root">
        {/* ═══ LEFT — Calendar Grid ═══ */}
        <div className="ecal-calendar">
          {/* Year navigation row */}
          <div className="ecal-year-row">
            <button type="button" className="ecal-year-btn ecal-year-prev" onClick={prevYear}>
              {year - 1}
            </button>
            <h3 className="ecal-month-label">
              {MONTHS[month].toUpperCase()}, {year}
            </h3>
            <button type="button" className="ecal-year-btn ecal-year-next" onClick={nextYear}>
              {year + 1}
            </button>
          </div>

          {/* Month arrows */}
          <div className="ecal-month-nav">
            <button type="button" className="ecal-nav-btn" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="ecal-nav-btn" onClick={nextMonth} aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day name headers */}
          <div className="ecal-day-names">
            {DAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Calendar date grid */}
          <div className="ecal-grid">
            {calendarDays.map((day, idx) => {
              if (day === null) return <span key={`e-${idx}`} className="ecal-cell ecal-empty" />
              const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`
              const hasEvents = eventsByDate.has(dateKey)
              const isToday = dateKey === todayKey
              const isSelected = dateKey === selectedDate

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={[
                    'ecal-cell',
                    isToday && 'ecal-today',
                    isSelected && 'ecal-selected',
                    hasEvents && 'ecal-has-events',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                >
                  {day}
                  {hasEvents && <span className="ecal-dot" />}
                </button>
              )
            })}
          </div>

          {/* Bottom action buttons (reference-style) */}
          <div className="ecal-bottom-bar">
            {canManage ? (
              <>
                <button type="button" className="ecal-action-btn" onClick={() => openCreateForm()}>
                  <Plus size={14} /> Add Event
                </button>
                <button
                  type="button"
                  className="ecal-action-btn"
                  onClick={() => setSelectedDate(todayKey)}
                >
                  <Search size={14} /> See Planned Events
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="ecal-action-btn"
                  onClick={() => setSelectedDate(todayKey)}
                >
                  <Search size={14} /> See Planned Events
                </button>
                <button
                  type="button"
                  className="ecal-action-btn"
                  onClick={() => {
                    /* scroll to upcoming */
                    setSelectedDate(null)
                  }}
                >
                  <Bell size={14} /> Upcoming
                </button>
              </>
            )}
          </div>
        </div>

        {/* ═══ RIGHT — Events Side Panel ═══ */}
        <div className="ecal-sidebar">
          <div className="ecal-sidebar-header">
            <h4 className="ecal-sidebar-title">EVENTS</h4>
            {selectedDate && (
              <button type="button" className="ecal-close-sel" onClick={() => setSelectedDate(null)}>
                <X size={14} />
              </button>
            )}
          </div>

          {selectedDate && (
            <p className="ecal-sidebar-subtitle">
              {formatEventDate(selectedDate)}, {new Date(selectedDate + 'T00:00:00').getFullYear()}
            </p>
          )}

          <div className="ecal-sidebar-body">
            {loading ? (
              <div className="ecal-empty-state">
                <div className="ecal-loader" />
                <p>Loading events...</p>
              </div>
            ) : displayEvents.length === 0 ? (
              <div className="ecal-empty-state">
                <Calendar size={32} strokeWidth={1.2} />
                <p>{selectedDate ? 'No events on this date' : 'No upcoming events'}</p>
              </div>
            ) : (
              <ul className="ecal-event-list">
                {displayEvents.map((ev) => (
                  <li key={ev.id} className="ecal-event-item">
                    <div className="ecal-event-info">
                      <strong>{ev.title}</strong>
                      <div className="ecal-event-details">
                        {ev.time && (
                          <span className="ecal-event-meta">
                            <Clock size={11} /> {ev.time}
                          </span>
                        )}
                        {ev.company && (
                          <span className="ecal-event-meta">
                            <Building2 size={11} /> {ev.company}
                          </span>
                        )}
                        {!selectedDate && (
                          <span className="ecal-event-meta">
                            <Calendar size={11} /> {formatEventDate(ev.date)}
                          </span>
                        )}
                      </div>
                      {ev.description && <p className="ecal-event-desc">{ev.description}</p>}
                    </div>
                    <div className="ecal-event-accent" />
                    {canManage && (
                      <div className="ecal-event-actions">
                        <button type="button" onClick={() => openEditForm(ev)} title="Edit">
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          className="ecal-delete-btn"
                          onClick={() => handleDelete(ev.id)}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {canManage && selectedDate && (
              <button type="button" className="ecal-add-date-btn" onClick={() => openCreateForm(selectedDate)}>
                <Plus size={13} /> Add event on this date
              </button>
            )}
          </div>

          {canManage && (
            <div className="ecal-sidebar-footer">
              <button type="button" className="ecal-edit-link" onClick={() => openCreateForm()}>
                EDIT
              </button>
              <span className="ecal-edit-dot" />
            </div>
          )}
        </div>
      </div>

      {/* ═══ Create / Edit Modal ═══ */}
      {showForm && (
        <div className="ecal-modal-overlay" onClick={() => setShowForm(false)}>
          <form
            className="ecal-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="ecal-modal-head">
              <h3>{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <label>
              Title *
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Campus Drive — TCS"
                required
              />
            </label>

            <div className="ecal-form-row">
              <label>
                Date *
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </label>
            </div>

            <label>
              Company
              <input
                type="text"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="e.g. Infosys, Wipro"
              />
            </label>

            <label>
              Description
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
                placeholder="Details about the event..."
              />
            </label>

            {formError && <p className="ecal-form-error">{formError}</p>}

            <button type="submit" className="ecal-submit-btn" disabled={saving}>
              {saving ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default EventCalendar
