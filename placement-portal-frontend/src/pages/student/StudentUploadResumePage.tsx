import { useState, type MouseEvent, type ChangeEvent } from 'react'
import { generateResume, type GeneratedResume } from '../../api/ai'
import { parseResume, type ParsedResumeProfile } from '../../api/resume'
import '../shared/WorkPages.css'

const StudentUploadResumePage = () => {
  const [fileName, setFileName] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [linkedInUrl, setLinkedInUrl] = useState('')
  const [profileText, setProfileText] = useState('')
  const [aiResume, setAiResume] = useState<GeneratedResume | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parsedProfile, setParsedProfile] = useState<ParsedResumeProfile | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null
    setFile(nextFile)
    setFileName(nextFile ? nextFile.name : null)
    setMessage(null)
  }

  const handleUploadClick = () => {
    setMessage(fileName ? 'Resume attached (demo state).' : 'Please select a PDF file.')
  }

  const handleParseResume = async () => {
    setAiError(null)
    setMessage(null)
    setParsedProfile(null)
    if (!file) {
      setAiError('Select a PDF resume first.')
      return
    }
    try {
      setParsing(true)
      const result = await parseResume(file)
      setParsedProfile(result)
      localStorage.setItem('parsed_resume_profile', JSON.stringify(result))
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

    const safe = (value: string) => value ?? ''

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

      <article className="work-card">
        <div className="work-form">
          <h2>Upload Existing Resume</h2>
          <label>
            Select Resume (PDF)
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </label>
          {fileName && <p className="work-muted">Selected file: {fileName}</p>}
          <button
            className="work-btn"
            type="button"
            onClick={handleUploadClick}
          >
            Upload
          </button>
          <button
            className="work-btn secondary"
            type="button"
            disabled={parsing}
            onClick={handleParseResume}
          >
            {parsing ? 'Parsing resume…' : 'Let AI parse resume'}
          </button>
          {message && <p className="work-success">{message}</p>}
        </div>
      </article>

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
            {generating ? 'Generating resume…' : 'Generate AI Resume'}
          </button>
        </form>
      </article>

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
              <p>{parsedProfile.programmingLanguages.join(', ') || '—'}</p>
              <h3>Frameworks</h3>
              <p>{parsedProfile.frameworks.join(', ') || '—'}</p>
              <h3>Tools</h3>
              <p>{parsedProfile.tools.join(', ') || '—'}</p>
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
          <p>{parsedProfile.internshipExperience || '—'}</p>
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
                      <strong>{edu.degree}</strong> – {edu.institution} ({edu.year})
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
