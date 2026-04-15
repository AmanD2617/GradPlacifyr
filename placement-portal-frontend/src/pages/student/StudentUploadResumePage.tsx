import { useEffect, useState, type MouseEvent, type ChangeEvent } from 'react'
import { generateResume, type GeneratedResume } from '../../api/ai'
import {
  parseResume,
  uploadResume,
  getMyResume,
  deleteMyResume,
  type ParsedResumeProfile,
  type ResumeInfo,
} from '../../api/resume'
import { FileText, Upload, Trash2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { resolveFileUrl } from '../../config'
import '../shared/WorkPages.css'

const StudentUploadResumePage = () => {
  const [fileName, setFileName] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [linkedInUrl, setLinkedInUrl] = useState('')
  const [profileText, setProfileText] = useState('')
  const [aiResume, setAiResume] = useState<GeneratedResume | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parsedProfile, setParsedProfile] = useState<ParsedResumeProfile | null>(null)
  const [currentResume, setCurrentResume] = useState<ResumeInfo | null>(null)
  const [loadingResume, setLoadingResume] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // Fetch existing resume on mount
  useEffect(() => {
    getMyResume()
      .then((info) => setCurrentResume(info))
      .catch(() => setCurrentResume(null))
      .finally(() => setLoadingResume(false))
  }, [])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null
    setFile(nextFile)
    setFileName(nextFile ? nextFile.name : null)
    setMessage(null)
    setError(null)
  }

  const handleUploadClick = async () => {
    setError(null)
    setMessage(null)

    if (!file) {
      setError('Please select a PDF file first.')
      return
    }

    try {
      setUploading(true)
      const result = await uploadResume(file)
      setCurrentResume({
        resumeUrl: result.resumeUrl,
        originalName: result.originalName,
      })
      setMessage('Resume uploaded successfully!')
      setFile(null)
      setFileName(null)
      // Reset file input
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      if (input) input.value = ''
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Upload failed'
      setError(raw === 'Failed to fetch'
        ? 'Cannot reach server. Ensure the backend is running.'
        : raw)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteResume = async () => {
    setError(null)
    setMessage(null)
    try {
      setDeleting(true)
      await deleteMyResume()
      setCurrentResume(null)
      setMessage('Resume removed.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove resume'
      setError(msg)
    } finally {
      setDeleting(false)
    }
  }

  const handleParseResume = async () => {
    setAiError(null)
    setMessage(null)
    setError(null)
    setParsedProfile(null)
    if (!file) {
      setAiError('Select a PDF resume first.')
      return
    }
    try {
      setParsing(true)
      const result = await parseResume(file)
      setParsedProfile(result)
      sessionStorage.setItem('parsed_resume_profile', JSON.stringify(result))
      setMessage('AI has suggested skills and experience from your resume. Review them below and on the Edit Profile page.')
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Failed to parse resume.'
      const msg =
        raw === 'Failed to fetch'
          ? 'Cannot reach resume parser API. Ensure the backend server is running.'
          : raw
      setAiError(msg)
    } finally {
      setParsing(false)
    }
  }

  const handleGenerate = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setAiError(null)
    setMessage(null)
    setError(null)
    setAiResume(null)
    if (!linkedInUrl.trim() && !profileText.trim()) {
      setAiError('Provide a LinkedIn profile URL or a short profile summary.')
      return
    }
    try {
      setGenerating(true)
      const result = await generateResume({
        linkedInUrl: linkedInUrl.trim() || undefined,
        profileText: profileText.trim() || undefined,
        save: true,
      })
      setAiResume(result)
      setMessage('AI resume generated and saved to your profile.')
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Failed to generate resume.'
      const msg =
        raw === 'Failed to fetch'
          ? 'Cannot reach AI service. Ensure the backend server is running and has internet access.'
          : raw
      setAiError(msg)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPdf = () => {
    if (!aiResume) return
    const win = window.open('', '_blank')
    if (!win) return

    // Escape HTML entities to prevent XSS when writing API data to a new window
    const safe = (value: string): string => {
      const str = value ?? ''
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    }

    win.document.write('<html><head><title>AI Resume</title>')
    win.document.write(
      '<style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:24px;color:#111827;}h1,h2{margin:0 0 8px;}h2{margin-top:18px;font-size:18px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;}ul{margin:4px 0 10px 18px;padding:0;}li{margin-bottom:4px;}</style>'
    )
    win.document.write('</head><body>')
    win.document.write('<h1>Resume</h1>')
    win.document.write(`<p>${safe(aiResume.summary)}</p>`)

    if (aiResume.skills?.length) {
      win.document.write('<h2>Skills</h2><ul>')
      aiResume.skills.forEach((s) => {
        win.document.write(`<li>${safe(s)}</li>`)
      })
      win.document.write('</ul>')
    }

    if (aiResume.experience?.length) {
      win.document.write('<h2>Experience</h2>')
      aiResume.experience.forEach((exp) => {
        win.document.write(
          `<h3>${safe(exp.role)} @ ${safe(exp.company)}</h3><p><i>${safe(
            exp.duration
          )}</i></p><p>${safe(exp.description)}</p>`
        )
      })
    }

    if (aiResume.projects?.length) {
      win.document.write('<h2>Projects</h2>')
      aiResume.projects.forEach((p) => {
        win.document.write(`<h3>${safe(p.title)}</h3>`)
        win.document.write(`<p>${safe(p.description)}</p>`)
        if (p.techStack) {
          win.document.write(`<p><b>Tech:</b> ${safe(p.techStack)}</p>`)
        }
        if (p.githubLink) {
          win.document.write(`<p><b>GitHub:</b> ${safe(p.githubLink)}</p>`)
        }
      })
    }

    if (aiResume.education?.length) {
      win.document.write('<h2>Education</h2><ul>')
      aiResume.education.forEach((e) => {
        win.document.write(
          `<li><b>${safe(e.degree)}</b>, ${safe(e.institution)} (${safe(
            e.year
          )}) ${e.grade ? '- ' + safe(e.grade) : ''}</li>`
        )
      })
      win.document.write('</ul>')
    }

    win.document.write('</body></html>')
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <section className="work-page">
      <article className="work-card">
        <h1>Resume Center</h1>
        <p>Upload your PDF resume or let AI draft a placement-ready version from your profile.</p>
      </article>

      {/* ── Current Resume Status ── */}
      {!loadingResume && currentResume?.resumeUrl && (
        <article className="work-card">
          <div className="resume-status-card">
            <div className="resume-status-info">
              <CheckCircle2 size={20} className="resume-status-icon" />
              <div>
                <h3 className="resume-status-title">Resume Uploaded</h3>
                <p className="resume-status-filename">
                  <FileText size={14} />
                  {currentResume.originalName || 'resume.pdf'}
                </p>
              </div>
            </div>
            <div className="resume-status-actions">
              <a
                href={resolveFileUrl(currentResume.resumeUrl) || '#'}
                target="_blank"
                rel="noreferrer"
                className="work-btn secondary resume-view-btn"
              >
                <ExternalLink size={14} /> View / Download
              </a>
              <button
                type="button"
                className="resume-remove-btn"
                onClick={handleDeleteResume}
                disabled={deleting}
              >
                <Trash2 size={14} /> {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </article>
      )}

      {/* ── Upload Section ── */}
      <article className="work-card">
        <div className="work-form">
          <h2>{currentResume?.resumeUrl ? 'Replace Resume' : 'Upload Existing Resume'}</h2>
          <label>
            Select Resume (PDF)
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </label>
          {fileName && <p className="work-muted">Selected file: {fileName}</p>}

          {error && <p className="work-error">{error}</p>}
          {message && <p className="work-success">{message}</p>}

          <button
            className="work-btn"
            type="button"
            onClick={handleUploadClick}
            disabled={uploading || !file}
          >
            <Upload size={15} />
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            className="work-btn secondary"
            type="button"
            disabled={parsing || !file}
            onClick={handleParseResume}
          >
            {parsing ? 'Parsing resume...' : 'Let AI parse resume'}
          </button>
        </div>
      </article>

      {/* ── AI Resume Generator ── */}
      <article className="work-card">
        <form className="work-form">
          <h2>AI Resume Generator</h2>
          <p className="work-muted">
            Paste your LinkedIn profile link or a short summary of your academics, projects, and skills.
          </p>
          <label>
            LinkedIn Profile URL
            <input
              type="url"
              placeholder="https://www.linkedin.com/in/your-profile"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
            />
          </label>
          <label>
            Profile Summary / Highlights
            <textarea
              placeholder="Write a few lines about your academics, projects, internships, skills..."
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
            />
          </label>
          {aiError && <p className="work-error">{aiError}</p>}
          <button
            className="work-btn"
            type="button"
            disabled={generating}
            onClick={handleGenerate}
          >
            {generating ? 'Generating resume...' : 'Generate AI Resume'}
          </button>
        </form>
      </article>

      {/* ── Parsed Resume Suggestions ── */}
      {parsedProfile && (
        <article className="work-card">
          <h2>Parsed Resume Suggestions</h2>
          <p className="work-muted">
            These are AI-suggested fields from your resume. You can review and refine them on the
            <strong> Edit Profile</strong> page before saving.
          </p>
          <div className="work-grid-2">
            <div>
              <h3>Programming Languages</h3>
              <p>{parsedProfile.programmingLanguages.join(', ') || '\u2014'}</p>
              <h3>Frameworks</h3>
              <p>{parsedProfile.frameworks.join(', ') || '\u2014'}</p>
              <h3>Tools</h3>
              <p>{parsedProfile.tools.join(', ') || '\u2014'}</p>
            </div>
            <div>
              <h3>Certifications</h3>
              <ul>
                {parsedProfile.certifications.length === 0 ? (
                  <li className="work-muted">None detected</li>
                ) : (
                  parsedProfile.certifications.map((c) => <li key={c}>{c}</li>)
                )}
              </ul>
              <h3>Projects</h3>
              <ul>
                {parsedProfile.projects.length === 0 ? (
                  <li className="work-muted">None detected</li>
                ) : (
                  parsedProfile.projects.map((p) => <li key={p}>{p}</li>)
                )}
              </ul>
            </div>
          </div>
          <h3>Internship Experience</h3>
          <p>{parsedProfile.internshipExperience || '\u2014'}</p>
          <h3>Achievements</h3>
          <ul>
            {parsedProfile.achievements.length === 0 ? (
              <li className="work-muted">None detected</li>
            ) : (
              parsedProfile.achievements.map((a) => <li key={a}>{a}</li>)
            )}
          </ul>
        </article>
      )}

      {/* ── AI Resume Preview ── */}
      {aiResume && (
        <article className="work-card">
          <div className="work-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>AI Resume Preview</h2>
            <button
              type="button"
              className="work-btn secondary"
              onClick={handleDownloadPdf}
            >
              Download as PDF
            </button>
          </div>
          <p className="work-muted" style={{ marginTop: '0.5rem' }}>
            Review the generated content before using it for official submissions.
          </p>
          <div className="work-list">
            <div>
              <h3>Summary</h3>
              <p>{aiResume.summary}</p>
            </div>

            {aiResume.skills?.length > 0 && (
              <div>
                <h3>Skills</h3>
                <ul>
                  {aiResume.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiResume.experience?.length > 0 && (
              <div>
                <h3>Experience</h3>
                <ul>
                  {aiResume.experience.map((exp) => (
                    <li key={`${exp.company}-${exp.role}-${exp.duration}`}>
                      <strong>
                        {exp.role} @ {exp.company}
                      </strong>
                      <br />
                      <span className="work-muted">{exp.duration}</span>
                      <br />
                      <span>{exp.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiResume.projects?.length > 0 && (
              <div>
                <h3>Projects</h3>
                <ul>
                  {aiResume.projects.map((project) => (
                    <li key={project.title}>
                      <strong>{project.title}</strong>
                      <br />
                      <span>{project.description}</span>
                      {project.techStack && (
                        <>
                          <br />
                          <span className="work-muted">Tech: {project.techStack}</span>
                        </>
                      )}
                      {project.githubLink && (
                        <>
                          <br />
                          <a href={project.githubLink} target="_blank" rel="noreferrer">
                            View on GitHub
                          </a>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiResume.education?.length > 0 && (
              <div>
                <h3>Education</h3>
                <ul>
                  {aiResume.education.map((edu) => (
                    <li key={`${edu.degree}-${edu.institution}-${edu.year}`}>
                      <strong>{edu.degree}</strong> {'\u2013'} {edu.institution} ({edu.year})
                      {edu.grade && (
                        <>
                          <br />
                          <span className="work-muted">Grade: {edu.grade}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </article>
      )}
    </section>
  )
}

export default StudentUploadResumePage
