import { useEffect, useRef, useState, type FormEvent } from 'react'
import { getMyProfile, updateMyProfile, type StudentProfile as Profile } from '../../api/profile'
import type { ParsedResumeProfile } from '../../api/resume'
import { uploadAvatar, deleteAvatar } from '../../api/upload'
import { useAuth } from '../../context/AuthContext'
import type { StudentProject } from '../../api/profile'
import { Pencil, X, Save, Sparkles, Github, Linkedin, Globe, Camera, Trash2, Plus, ExternalLink, FolderGit2 } from 'lucide-react'
import './StudentProfile.css'

const API_ORIGIN = 'http://localhost:3000'

const emptyProfile: Profile = {
  tenthPercentage: null,
  twelfthPercentage: null,
  backlogs: null,
  graduationYear: null,
  programmingLanguages: '',
  frameworks: '',
  tools: '',
  certifications: '',
  projects: [],
  internshipExperience: '',
  achievements: '',
  githubUrl: '',
  linkedinUrl: '',
  portfolioUrl: '',
}

const StudentProfile = () => {
  const { user, updateProfileImage } = useAuth()
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [snapshot, setSnapshot] = useState<Profile>(emptyProfile)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [resumeSuggestions, setResumeSuggestions] = useState<ParsedResumeProfile | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        setProfile(p)
        setSnapshot(p)
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load profile'
        setError(msg)
      })
      .finally(() => setLoading(false))

    const stored = localStorage.getItem('parsed_resume_profile')
    if (stored) {
      try {
        setResumeSuggestions(JSON.parse(stored) as ParsedResumeProfile)
      } catch { /* ignore */ }
    }
  }, [])

  const startEditing = () => {
    setSnapshot({ ...profile })
    setEditing(true)
    setMessage(null)
    setError(null)
  }

  const cancelEditing = () => {
    setProfile({ ...snapshot })
    setEditing(false)
    setError(null)
  }

  const onChangeNumber =
    (field: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setProfile((prev) => ({ ...prev, [field]: value === '' ? null : Number(value) }))
    }

  const onChangeText =
    (field: keyof Profile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setProfile((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      setSaving(true)
      const updated = await updateMyProfile(profile)
      setProfile(updated)
      setSnapshot(updated)
      setMessage('Profile updated successfully!')
      setEditing(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  // AI suggestion applier helper
  const applySuggestion = (field: keyof Profile, value: string | string[], separator = ', ') => {
    const merged = Array.isArray(value) ? value.join(separator) : value
    setProfile((prev) => {
      const existing = String(prev[field] || '')
      return { ...prev, [field]: [existing, merged].filter(Boolean).join(separator) }
    })
  }

  // ── Project helpers ──
  const addProject = () => {
    setProfile((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', techStack: '', link: '' }],
    }))
  }

  const removeProject = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }))
  }

  const updateProject = (index: number, field: keyof StudentProject, value: string) => {
    setProfile((prev) => ({
      ...prev,
      projects: prev.projects.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }))
  }

  const getProjectLink = (project: StudentProject): string => {
    return project.link || project.githubLink || ''
  }

  // ── Image upload handlers ──
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show instant preview
    setImagePreview(URL.createObjectURL(file))

    try {
      setUploadingImage(true)
      setError(null)
      const res = await uploadAvatar(file)
      updateProfileImage(res.profileImage)
      setImagePreview(null)
      setMessage('Profile image updated!')
    } catch (err: unknown) {
      setImagePreview(null)
      const msg = err instanceof Error ? err.message : 'Image upload failed'
      setError(msg)
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = async () => {
    try {
      setUploadingImage(true)
      setError(null)
      await deleteAvatar()
      updateProfileImage(null)
      setMessage('Profile image removed.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove image'
      setError(msg)
    } finally {
      setUploadingImage(false)
    }
  }

  const currentImageUrl = imagePreview
    || (user?.profileImage ? `${API_ORIGIN}${user.profileImage}` : null)

  const initials = (() => {
    if (!user?.name) return '?'
    const parts = user.name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  })()

  // ── Render helpers ──

  const viewField = (label: string, value: string | number | null, placeholder?: string) => (
    <div className="up-field">
      <span className="up-field-label">{label}</span>
      <strong className="up-field-value">{value ?? placeholder ?? '—'}</strong>
    </div>
  )

  const editNumber = (label: string, field: keyof Profile, opts?: { min?: number; max?: number; step?: number }) => (
    <label className="up-edit-label">
      <span>{label}</span>
      <input
        type="number"
        className="up-edit-input"
        min={opts?.min ?? 0}
        max={opts?.max}
        step={opts?.step}
        value={(profile[field] as number | null) ?? ''}
        onChange={onChangeNumber(field)}
      />
    </label>
  )

  const editText = (label: string, field: keyof Profile, opts?: { placeholder?: string; multiline?: boolean; aiField?: keyof ParsedResumeProfile }) => (
    <label className="up-edit-label">
      <span>{label}</span>
      {opts?.multiline ? (
        <textarea
          className="up-edit-textarea"
          placeholder={opts?.placeholder}
          value={String(profile[field] || '')}
          onChange={onChangeText(field)}
          rows={3}
        />
      ) : (
        <input
          type={field.includes('Url') ? 'url' : 'text'}
          className="up-edit-input"
          placeholder={opts?.placeholder}
          value={String(profile[field] || '')}
          onChange={onChangeText(field)}
        />
      )}
      {opts?.aiField && resumeSuggestions && (() => {
        const val = resumeSuggestions[opts.aiField!]
        if (!val || (Array.isArray(val) && !val.length)) return null
        return (
          <button
            type="button"
            className="up-ai-btn"
            onClick={() => applySuggestion(field, val as string | string[])}
          >
            <Sparkles size={13} /> Apply AI Suggestions
          </button>
        )
      })()}
    </label>
  )

  return (
    <div className="up-root">
      <div className="up-card">
        {/* ── Header ── */}
        <div className="up-header">
          <div>
            <h1 className="up-title">My Profile</h1>
            <p className="up-subtitle">
              {editing
                ? 'Update your academic record, skills, and links. Save when done.'
                : 'Overview of your academic record, skills, and important links used for placements.'}
            </p>
          </div>
          {!loading && !editing && (
            <button type="button" className="up-pencil-btn" onClick={startEditing} title="Edit Profile">
              <Pencil size={16} />
            </button>
          )}
          {editing && (
            <button type="button" className="up-pencil-btn up-close-btn" onClick={cancelEditing} title="Cancel editing">
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Profile Image ── */}
        <div className="up-avatar-section">
          <div className="up-avatar-wrapper">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt="Profile"
                className="up-avatar-img"
              />
            ) : (
              <div className="up-avatar-placeholder">
                {initials}
              </div>
            )}

            {/* Upload overlay */}
            <button
              type="button"
              className="up-avatar-overlay"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              title="Change photo"
            >
              <Camera size={20} />
              <span>{uploadingImage ? 'Uploading...' : 'Change'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageSelect}
              className="up-avatar-file-input"
            />
          </div>

          {user?.profileImage && !uploadingImage && (
            <button
              type="button"
              className="up-avatar-remove-btn"
              onClick={handleRemoveImage}
              title="Remove photo"
            >
              <Trash2 size={14} /> Remove
            </button>
          )}

          <div className="up-avatar-name">
            <h2>{user?.name || 'Student'}</h2>
            <span>{user?.email}</span>
          </div>
        </div>

        {/* ── Messages ── */}
        {error && <p className="up-msg up-msg-error">{error}</p>}
        {message && <p className="up-msg up-msg-success">{message}</p>}

        {loading ? (
          <p className="up-muted">Loading profile...</p>
        ) : !editing ? (
          /* ═══════════ VIEW MODE ═══════════ */
          <>
            {/* Academic Info */}
            <section className="up-section">
              <h2 className="up-section-title">Academic Information</h2>
              <div className="up-grid">
                {viewField('Name', user?.name ?? 'Student')}
                {viewField('10th Percentage', profile.tenthPercentage ? `${profile.tenthPercentage}%` : null)}
                {viewField('12th Percentage', profile.twelfthPercentage ? `${profile.twelfthPercentage}%` : null)}
                {viewField('Active Backlogs', profile.backlogs ?? 0)}
                {viewField('Graduation Year', profile.graduationYear)}
              </div>
            </section>

            {/* Skills */}
            <section className="up-section">
              <h2 className="up-section-title">Skills & Technologies</h2>
              <div className="up-grid">
                {viewField('Programming Languages', profile.programmingLanguages || null, 'Not specified')}
                {viewField('Frameworks', profile.frameworks || null, 'Not specified')}
                {viewField('Tools', profile.tools || null, 'Not specified')}
                {viewField('Certifications', profile.certifications || null, 'Not specified')}
              </div>
            </section>

            {/* Experience & Achievements */}
            <section className="up-section">
              <h2 className="up-section-title">Experience & Achievements</h2>
              <div className="up-grid up-grid-wide">
                {viewField('Internship Experience', profile.internshipExperience || null, 'Not specified')}
                {viewField('Achievements', profile.achievements || null, 'Not specified')}
              </div>
            </section>

            {/* Projects */}
            <section className="up-section">
              <h2 className="up-section-title">Projects</h2>
              {profile.projects.length === 0 ? (
                <p className="up-muted">No projects added yet.</p>
              ) : (
                <div className="up-projects-list">
                  {profile.projects.map((project, idx) => (
                    <div key={idx} className="up-project-card">
                      <div className="up-project-card-header">
                        <FolderGit2 size={18} className="up-project-icon" />
                        <h3 className="up-project-title">{project.title || 'Untitled Project'}</h3>
                      </div>
                      {project.description && (
                        <p className="up-project-desc">{project.description}</p>
                      )}
                      {project.techStack && (
                        <div className="up-project-tech">
                          {project.techStack.split(',').map((t, i) => (
                            <span key={i} className="up-project-tech-tag">{t.trim()}</span>
                          ))}
                        </div>
                      )}
                      {getProjectLink(project) && (
                        <a
                          href={getProjectLink(project)}
                          target="_blank"
                          rel="noreferrer"
                          className="up-project-link"
                        >
                          <ExternalLink size={13} />
                          <span>{getProjectLink(project).replace(/^https?:\/\//, '').slice(0, 50)}</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Links */}
            {(profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl) && (
              <section className="up-section">
                <h2 className="up-section-title">External Links</h2>
                <div className="up-links">
                  {profile.githubUrl && (
                    <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="up-link-pill">
                      <Github size={14} /> GitHub
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="up-link-pill">
                      <Linkedin size={14} /> LinkedIn
                    </a>
                  )}
                  {profile.portfolioUrl && (
                    <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="up-link-pill">
                      <Globe size={14} /> Portfolio
                    </a>
                  )}
                </div>
              </section>
            )}
          </>
        ) : (
          /* ═══════════ EDIT MODE ═══════════ */
          <form className="up-form" onSubmit={submit}>
            {resumeSuggestions && (
              <p className="up-ai-notice">
                <Sparkles size={14} />
                AI suggestions from your resume are available. Look for the
                <strong> &quot;Apply AI Suggestions&quot;</strong> buttons below.
              </p>
            )}

            <section className="up-section">
              <h2 className="up-section-title">Academic Information</h2>
              <div className="up-edit-grid">
                {editNumber('10th Percentage', 'tenthPercentage', { max: 100, step: 0.1 })}
                {editNumber('12th Percentage', 'twelfthPercentage', { max: 100, step: 0.1 })}
                {editNumber('Active Backlogs', 'backlogs')}
                {editNumber('Graduation Year', 'graduationYear', { min: 2000, max: 2100 })}
              </div>
            </section>

            <section className="up-section">
              <h2 className="up-section-title">Skills & Technologies</h2>
              <div className="up-edit-grid">
                {editText('Programming Languages', 'programmingLanguages', { placeholder: 'e.g. C, C++, Java, Python, JavaScript', multiline: true, aiField: 'programmingLanguages' })}
                {editText('Frameworks', 'frameworks', { placeholder: 'e.g. React, Node.js, Spring Boot', multiline: true, aiField: 'frameworks' })}
                {editText('Tools', 'tools', { placeholder: 'e.g. Git, Docker, VS Code', multiline: true, aiField: 'tools' })}
                {editText('Certifications', 'certifications', { placeholder: 'Certifications with platform and year', multiline: true, aiField: 'certifications' })}
              </div>
            </section>

            <section className="up-section">
              <h2 className="up-section-title">Experience & Achievements</h2>
              <div className="up-edit-grid up-edit-grid-wide">
                {editText('Internship Experience', 'internshipExperience', { placeholder: 'Company, role, duration, key contributions...', multiline: true, aiField: 'internshipExperience' })}
                {editText('Achievements', 'achievements', { placeholder: 'Hackathons, contests, scholarships, leadership roles...', multiline: true, aiField: 'achievements' })}
              </div>
            </section>

            <section className="up-section">
              <h2 className="up-section-title">Projects</h2>
              <div className="up-projects-edit-list">
                {profile.projects.map((project, idx) => (
                  <div key={idx} className="up-project-edit-card">
                    <div className="up-project-edit-header">
                      <span className="up-project-edit-number">Project {idx + 1}</span>
                      <button
                        type="button"
                        className="up-project-remove-btn"
                        onClick={() => removeProject(idx)}
                        title="Remove project"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                    <div className="up-project-edit-fields">
                      <label className="up-edit-label">
                        <span>Title <span className="up-required">*</span></span>
                        <input
                          type="text"
                          className="up-edit-input"
                          placeholder="e.g. Placement Portal"
                          value={project.title}
                          onChange={(e) => updateProject(idx, 'title', e.target.value)}
                          required
                        />
                      </label>
                      <label className="up-edit-label">
                        <span>Tech Stack</span>
                        <input
                          type="text"
                          className="up-edit-input"
                          placeholder="e.g. React, Node.js, PostgreSQL"
                          value={project.techStack}
                          onChange={(e) => updateProject(idx, 'techStack', e.target.value)}
                        />
                      </label>
                      <label className="up-edit-label up-edit-label-full">
                        <span>Description</span>
                        <textarea
                          className="up-edit-textarea"
                          placeholder="Brief description of what the project does..."
                          value={project.description}
                          onChange={(e) => updateProject(idx, 'description', e.target.value)}
                          rows={2}
                        />
                      </label>
                      <label className="up-edit-label up-edit-label-full">
                        <span>Project Link</span>
                        <input
                          type="url"
                          className="up-edit-input"
                          placeholder="https://github.com/username/project"
                          value={project.link || project.githubLink || ''}
                          onChange={(e) => updateProject(idx, 'link', e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="up-add-project-btn" onClick={addProject}>
                <Plus size={15} /> Add Project
              </button>
            </section>

            <section className="up-section">
              <h2 className="up-section-title">External Links</h2>
              <div className="up-edit-grid up-edit-grid-3">
                {editText('GitHub URL', 'githubUrl', { placeholder: 'https://github.com/username' })}
                {editText('LinkedIn URL', 'linkedinUrl', { placeholder: 'https://linkedin.com/in/username' })}
                {editText('Portfolio URL', 'portfolioUrl', { placeholder: 'https://your-portfolio.com' })}
              </div>
            </section>

            <div className="up-form-actions">
              <button type="submit" className="up-btn up-btn-save" disabled={saving}>
                <Save size={15} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" className="up-btn up-btn-cancel" onClick={cancelEditing}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default StudentProfile
