import React from 'react';
import type { ResumeData } from '@/types/resume';

interface Template9DisplayProps {
  data: ResumeData;
}

const Template9Display: React.FC<Template9DisplayProps> = ({ data }) => {
  const { personal, education, experience, projects, skillsLinks, certifications } = data;

  const htmlToText = (s?: string) => {
    if (!s) return '';
    try {
      return String(s)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim();
    } catch (e) {
      return s || '';
    }
  };

  const sanitizeLine = (line?: string) => {
    if (!line) return '';
    try {
      return String(line).replace(/^\s*>+\s*/, '');
    } catch (e) {
      return line || '';
    }
  };

  return (
    <div className="w-[210mm] bg-white" style={{ minHeight: '297mm', fontFamily: 'Georgia, serif', color: '#222' }}>
      <div style={{ display: 'flex', padding: 36, gap: 24 }}>
        {/* Left Sidebar */}
        <aside style={{ width: '32%', boxSizing: 'border-box', paddingRight: 12 }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            {personal.profilePhotoUrl && (
              <img src={personal.profilePhotoUrl} alt="photo" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '9999px', border: '6px solid rgba(0,0,0,0.03)' }} />
            )}
            <h1 style={{ fontSize: 18, margin: '12px 0 4px 0', color: '#004b87', lineHeight: 1, textTransform: 'uppercase' }}>{(personal.firstName || '').toUpperCase()} {(personal.middleName || '').toUpperCase()} {(personal.lastName || '').toUpperCase()}</h1>
            <div style={{ fontSize: 12, color: '#666' }}>{experience.jobRole || ''}</div>
          </div>

          <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 11, color: '#004b87', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Contact</h3>
                <div style={{ width: 26, height: 3, background: '#d0d0d0', borderRadius: 2 }} />
              </div>
            <div style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>
              {personal.mobileNumber && <div>{personal.mobileNumber}</div>}
              {personal.email && <div>{personal.email}</div>}
              {personal.address && <div>{personal.address}</div>}
            </div>
          </div>

          {personal.aboutCareerObjective && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 11, color: '#004b87', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>About Me</h3>
                <div style={{ width: 26, height: 3, background: '#d0d0d0', borderRadius: 2 }} />
              </div>
              <p style={{ fontSize: 11, color: '#444', lineHeight: 1.5 }}>{htmlToText(personal.aboutCareerObjective)}</p>
            </div>
          )}

          {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 11, color: '#004b87', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Skills</h3>
                <div style={{ width: 26, height: 3, background: '#d0d0d0', borderRadius: 2 }} />
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, color: '#444', fontSize: 11 }}>
                {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{s.skillName}</li>
                ))}
              </ul>
            </div>
          )}

          {personal.languagesKnown && personal.languagesKnown.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h3 style={{ fontSize: 11, color: '#004b87', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Language</h3>
                <div style={{ width: 26, height: 3, background: '#d0d0d0', borderRadius: 2 }} />
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, color: '#444', fontSize: 11 }}>
                {personal.languagesKnown.map((l, idx) => (
                  <li key={idx} style={{ marginBottom: 6 }}>{l}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Right Content */}
        <main style={{ width: '68%', boxSizing: 'border-box', paddingLeft: 12 }}>
          {/* Education */}
          {education.higherEducation.some(edu => edu.enabled) && (
            <section style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <h2 style={{ fontSize: 13, color: '#222', margin: 0 }}>Education</h2>
                <div style={{ width: 26, height: 3, background: '#d0d0d0', borderRadius: 2 }} />
              </div>
              {education.higherEducation.filter(edu => edu.enabled).map((edu, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{edu.degree}</div>
                    <div style={{ fontSize: 10, color: '#666' }}>{edu.startYear} - {edu.currentlyPursuing ? 'Present' : edu.endYear}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#444' }}>{edu.instituteName}</div>
               
                </div>
              ))}
              {/* Pre University */}
              {education.preUniversityEnabled && education.preUniversity.instituteName && (
                <div style={{ marginTop: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>Pre University</div>
                    <div style={{ fontSize: 10, color: '#666' }}>{education.preUniversity.yearOfPassing}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#444' }}>{education.preUniversity.instituteName}</div>
                </div>
              )}

              {/* SSLC */}
              {education.sslcEnabled && education.sslc.instituteName && (
                <div style={{ marginTop: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>SSLC</div>
                    <div style={{ fontSize: 10, color: '#666' }}>{education.sslc.yearOfPassing}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#444' }}>{education.sslc.instituteName}</div>
                </div>
              )}
            </section>
          )}

          {/* Experience */}
          {experience.workExperiences.some(exp => exp.enabled) && (
            <section style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <h2 style={{ fontSize: 13, color: '#222', margin: 0 }}>Experience</h2>
                <div style={{ width: 26, height: 3, background: '#d0d0d0', borderRadius: 2 }} />
              </div>
              {experience.workExperiences.filter(w => w.enabled).map((w, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{w.jobTitle}</div>
                    <div style={{ fontSize: 10, color: '#666' }}>{w.startDate} - {w.currentlyWorking ? 'Present' : w.endDate}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#444', marginBottom: 6 }}>{w.companyName}</div>
                  {w.description && (
                    <div style={{ fontSize: 11, color: '#444', lineHeight: 1.5 }}>
                      {htmlToText(w.description).split('\n').map((line, idx) => (
                        line.trim() && <div key={idx}>• {line.trim()}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && projects.some(p => p.enabled && p.projectTitle) && (
            <section style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <h2 style={{ fontSize: 13, color: '#222', margin: 0 }}>Projects</h2>
                <div style={{ width: 26, height: 3, background: '#d0d0d0', borderRadius: 2 }} />
              </div>
              {projects.filter(p => p.enabled && p.projectTitle).map((p, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{p.projectTitle}</div>
                    <div style={{ fontSize: 10, color: '#666' }}>{p.startDate} - {p.currentlyWorking ? 'Present' : p.endDate}</div>
                  </div>
                  {p.description && (
                    <div style={{ fontSize: 11, color: '#444', lineHeight: 1.5, marginTop: 6 }}>
                      {htmlToText(p.description).split(/\n|\r\n/).filter(Boolean).map((line, idx) => (
                        <div key={idx}>• {sanitizeLine(line)}</div>
                      ))}
                    </div>
                  )}

                  {p.rolesResponsibilities && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Roles & Responsibilities</div>
                      <ul style={{ paddingLeft: 16, margin: 0 }}>
                        {htmlToText(p.rolesResponsibilities).split(/\n|\r\n/).filter(Boolean).map((line, idx) => (
                          <li key={idx} style={{ marginBottom: 6 }}>{sanitizeLine(line)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* References / Certifications */}
          {certifications.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <h2 style={{ fontSize: 13, color: '#222', margin: 0 }}>Certifications</h2>
                <div style={{ width: 26, height: 3, background: '#d0d0d0', borderRadius: 2 }} />
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, color: '#444', fontSize: 11 }}>
                {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{c.certificateTitle}</li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Template9Display;
