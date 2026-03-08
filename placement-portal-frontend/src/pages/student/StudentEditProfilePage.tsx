import { useEffect, useState, type FormEvent } from 'react'
import { getMyProfile, updateMyProfile, type StudentProfile } from '../../api/profile'
import type { ParsedResumeProfile } from '../../api/resume'
import '../shared/WorkPages.css'

const emptyProfile: StudentProfile = {
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

const StudentEditProfilePage = () => {
  const [profile, setProfile] = useState<StudentProfile>(emptyProfile)
  const [editing, setEditing] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [resumeSuggestions, setResumeSuggestions] = useState<ParsedResumeProfile | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)

  useEffect(() => {
    getMyProfile()
      .then((p) => setProfile(p))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load profile'
        setError(msg)
      })
      .finally(() => setLoading(false))

    const stored = localStorage.getItem('parsed_resume_profile')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ParsedResumeProfile
        setResumeSuggestions(parsed)
      } catch {
        // ignore corrupted storage
      }
    }
    setLoadingSuggestions(false)
  }, [])

  const onChangeNumber =
    (field: keyof StudentProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setProfile((prev) => ({
        ...prev,
        [field]: value === '' ? null : Number(value),
      }))
    }

  const onChangeText =
    (field: keyof StudentProfile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      setProfile((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      setSaving(true)
      const updated = await updateMyProfile(profile)
      setProfile(updated)
      setMessage('Profile updated successfully.')
      setEditing(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="work-page">
      <article className="work-card">
        <h1>Academic & Skills Profile</h1>
        <p>Maintain complete details that TPO and companies use to check your eligibility.</p>
        <div className="work-row">
          <button
            type="button"
            className="work-btn secondary"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? 'View Mode' : 'Edit Mode'}
          </button>
        </div>
        {!loadingSuggestions && resumeSuggestions && (
          <p className="work-muted" style={{ marginTop: '0.5rem' }}>
            We found AI-based suggestions from your latest resume upload. Use the{" "}
            <strong>&quot;Apply AI Suggestions&quot;</strong> buttons in the form to merge them into your profile.
          </p>
        )}
      </article>

      <article className="work-card">
        {error && <p className="work-error">{error}</p>}
        {message && <p className="work-success">{message}</p>}

        {loading ? (
          <p className="work-muted">Loading profile…</p>
        ) : !editing ? (
          <div className="work-grid-2">
            <div>
              <h2>Academics</h2>
              <p>10th: {profile.tenthPercentage ?? '—'}%</p>
              <p>12th: {profile.twelfthPercentage ?? '—'}%</p>
              <p>Backlogs: {profile.backlogs ?? 0}</p>
              <p>Graduation Year: {profile.graduationYear ?? '—'}</p>
            </div>
            <div>
              <h2>Skills</h2>
              <p>
                <strong>Programming:</strong> {profile.programmingLanguages || '—'}
              </p>
              <p>
                <strong>Frameworks:</strong> {profile.frameworks || '—'}
              </p>
              <p>
                <strong>Tools:</strong> {profile.tools || '—'}
              </p>
              <p>
                <strong>Certifications:</strong> {profile.certifications || '—'}
              </p>
            </div>
          </div>
        ) : (
          <form className="work-form" onSubmit={submit}>
            <div className="work-grid-2">
              <label>
                10th Percentage
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={profile.tenthPercentage ?? ''}
                  onChange={onChangeNumber('tenthPercentage')}
                />
              </label>
              <label>
                12th Percentage
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={profile.twelfthPercentage ?? ''}
                  onChange={onChangeNumber('twelfthPercentage')}
                />
              </label>
            </div>

            <div className="work-grid-2">
              <label>
                Active Backlogs
                <input
                  type="number"
                  min={0}
                  value={profile.backlogs ?? ''}
                  onChange={onChangeNumber('backlogs')}
                />
              </label>
              <label>
                Graduation Year
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={profile.graduationYear ?? ''}
                  onChange={onChangeNumber('graduationYear')}
                />
              </label>
            </div>

            <div className="work-grid-2">
              <label>
                Programming Languages
                <textarea
                  placeholder="e.g. C, C++, Java, Python, JavaScript"
                  value={profile.programmingLanguages}
                  onChange={onChangeText('programmingLanguages')}
                />
                {resumeSuggestions?.programmingLanguages?.length ? (
                  <button
                    type="button"
                    className="work-chip-btn"
                    onClick={() =>
                      setProfile((prev) => ({
                        ...prev,
                        programmingLanguages: [
                          prev.programmingLanguages,
                          resumeSuggestions.programmingLanguages.join(', '),
                        ]
                          .filter(Boolean)
                          .join(', '),
                      }))
                    }
                  >
                    Apply AI Suggestions
                  </button>
                ) : null}
              </label>
              <label>
                Frameworks
                <textarea
                  placeholder="e.g. React, Node.js, Spring Boot"
                  value={profile.frameworks}
                  onChange={onChangeText('frameworks')}
                />
                {resumeSuggestions?.frameworks?.length ? (
                  <button
                    type="button"
                    className="work-chip-btn"
                    onClick={() =>
                      setProfile((prev) => ({
                        ...prev,
                        frameworks: [
                          prev.frameworks,
                          resumeSuggestions.frameworks.join(', '),
                        ]
                          .filter(Boolean)
                          .join(', '),
                      }))
                    }
                  >
                    Apply AI Suggestions
                  </button>
                ) : null}
              </label>
            </div>

            <div className="work-grid-2">
              <label>
                Tools
                <textarea
                  placeholder="e.g. Git, Docker, VS Code"
                  value={profile.tools}
                  onChange={onChangeText('tools')}
                />
                {resumeSuggestions?.tools?.length ? (
                  <button
                    type="button"
                    className="work-chip-btn"
                    onClick={() =>
                      setProfile((prev) => ({
                        ...prev,
                        tools: [prev.tools, resumeSuggestions.tools.join(', ')]
                          .filter(Boolean)
                          .join(', '),
                      }))
                    }
                  >
                    Apply AI Suggestions
                  </button>
                ) : null}
              </label>
              <label>
                Certifications
                <textarea
                  placeholder="List important certifications with platform and year"
                  value={profile.certifications}
                  onChange={onChangeText('certifications')}
                />
                {resumeSuggestions?.certifications?.length ? (
                  <button
                    type="button"
                    className="work-chip-btn"
                    onClick={() =>
                      setProfile((prev) => ({
                        ...prev,
                        certifications: [
                          prev.certifications,
                          resumeSuggestions.certifications.join(', '),
                        ]
                          .filter(Boolean)
                          .join(', '),
                      }))
                    }
                  >
                    Apply AI Suggestions
                  </button>
                ) : null}
              </label>
            </div>

            <label>
              Internship Experience
              <textarea
                placeholder="Company, role, duration, key contributions…"
                value={profile.internshipExperience}
                onChange={onChangeText('internshipExperience')}
              />
              {resumeSuggestions?.internshipExperience ? (
                <button
                  type="button"
                  className="work-chip-btn"
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      internshipExperience: [
                        prev.internshipExperience,
                        resumeSuggestions.internshipExperience,
                      ]
                        .filter(Boolean)
                        .join('\n'),
                    }))
                  }
                >
                  Apply AI Suggestions
                </button>
              ) : null}
            </label>

            <label>
              Achievements
              <textarea
                placeholder="Hackathons, contests, scholarships, leadership roles…"
                value={profile.achievements}
                onChange={onChangeText('achievements')}
              />
              {resumeSuggestions?.achievements?.length ? (
                <button
                  type="button"
                  className="work-chip-btn"
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      achievements: [
                        prev.achievements,
                        resumeSuggestions.achievements.join('\n'),
                      ]
                        .filter(Boolean)
                        .join('\n'),
                    }))
                  }
                >
                  Apply AI Suggestions
                </button>
              ) : null}
            </label>

            <div className="work-grid-3">
              <label>
                GitHub URL
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={profile.githubUrl}
                  onChange={onChangeText('githubUrl')}
                />
              </label>
              <label>
                LinkedIn URL
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/in/username"
                  value={profile.linkedinUrl}
                  onChange={onChangeText('linkedinUrl')}
                />
              </label>
              <label>
                Portfolio URL
                <input
                  type="url"
                  placeholder="https://your-portfolio.com"
                  value={profile.portfolioUrl}
                  onChange={onChangeText('portfolioUrl')}
                />
              </label>
            </div>

            <button className="work-btn" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        )}
      </article>
    </section>
  )
}

export default StudentEditProfilePage
