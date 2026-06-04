import React from 'react';
import type { ResumeData } from '@/types/resume';

interface Template8DisplayProps {
  data: ResumeData;
}

const Template8Display: React.FC<Template8DisplayProps> = ({ data }) => {
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

  const sanitizeLine = (line: string) => {
    try {
      return String(line).replace(/^\s*>+\s*/, '');
    } catch (e) {
      return line;
    }
  };

  return (
    <div className="w-[210mm] bg-white" style={{ minHeight: '297mm', fontFamily: 'Calibri, sans-serif', color: '#222' }}>
      <div style={{ padding: '40px' }}>
        {/* Header */}
        <header style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '2px solid #222' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#004b87', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
            {(personal.firstName || '').toUpperCase()} {(personal.middleName || '').toUpperCase()} {(personal.lastName || '').toUpperCase()}
          </h1>
          <div style={{ fontSize: 11, color: '#666', margin: 0, display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {personal.mobileNumber && <span>{personal.mobileNumber}</span>}
            {personal.email && <span>{personal.email}</span>}
            {personal.address && <span>{personal.address}</span>}
            {/* {personal.websiteURL && <span>{personal.websiteURL}</span>} */}
          </div>
        </header>

        {/* Summary/Profile */}
        {personal.aboutCareerObjective && (
          <section style={{ marginBottom: 20, display: 'flex', gap: '30px', alignItems: 'flex-start', paddingBottom: 20, borderBottom: '1px solid #ccc' }}>
            <div style={{ width: '110px', flexShrink: 0 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px', paddingTop: 2 }}>
                Summary
              </h2>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, lineHeight: 1.6, color: '#444', margin: 0 }}>
                {htmlToText(personal.aboutCareerObjective)}
              </p>
            </div>
          </section>
        )}

        {/* Work Experience */}
        {experience.workExperiences.some(exp => exp.enabled) && experience.workExperiences.some(w => w.enabled) && (
          <section style={{ marginBottom: 20, display: 'flex', gap: '20px', paddingBottom: 20, borderBottom: '1px solid #ccc' }}>
            <div style={{ width: '90px', flexShrink: 0 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px', paddingTop: 2, whiteSpace: 'normal', lineHeight: 1.2 }}>
                Work Experience
              </h2>
            </div>
            <div style={{ flex: 1 }}>
              {experience.workExperiences.filter(w => w.enabled).map((w, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#222' }}>{w.jobTitle}</div>
                    <div style={{ fontSize: 9, color: '#666' }}>{w.startDate} - {w.currentlyWorking ? 'Present' : w.endDate}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#444', fontWeight: 500, marginBottom: 6 }}>{w.companyName}</div>
                  {w.description && (
                    <div style={{ fontSize: 10, color: '#444', margin: '0', lineHeight: 1.5 }}>
                      {htmlToText(w.description).split('\n').map((line, idx) => (
                        line.trim() && (
                          <div key={idx} style={{ marginBottom: 4 }}>
                            • {line.trim()}
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && projects.some(p => p.enabled && p.projectTitle) && (
          <section style={{ marginBottom: 20, display: 'flex', gap: '30px', paddingBottom: 20, borderBottom: '1px solid #ccc' }}>
            <div style={{ width: '110px', flexShrink: 0 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px', paddingTop: 2 }}>Projects</h2>
            </div>
            <div style={{ flex: 1 }}>
              {projects.filter(p => p.enabled && p.projectTitle).map((p, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 10, fontWeight: 700 }}>{p.projectTitle}</div>
                    <div style={{ fontSize: 9, color: '#666' }}>{p.startDate} - {p.currentlyWorking ? 'Present' : p.endDate}</div>
                  </div>
                  {p.description && (
                    <div style={{ fontSize: 10, color: '#444', marginTop: 6 }}>
                      <ul style={{ paddingLeft: 18, marginTop: 6 }}>
                        {htmlToText(p.description).split(/\n|\r\n/).filter(Boolean).map((line, idx) => (
                          <li key={idx} style={{ marginBottom: 6 }}>{sanitizeLine(line)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {p.rolesResponsibilities && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>Roles & Responsibilities</div>
                      <ul style={{ paddingLeft: 18 }}>
                        {htmlToText(p.rolesResponsibilities).split(/\n|\r\n/).filter(Boolean).map((line, idx) => (
                          <li key={idx} style={{ marginBottom: 6 }}>{sanitizeLine(line)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.higherEducation.some(edu => edu.enabled) && (
          <section style={{ marginBottom: 20, display: 'flex', gap: '30px', paddingBottom: 20, borderBottom: '1px solid #ccc' }}>
            <div style={{ width: '110px', flexShrink: 0 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px', paddingTop: 2 }}>
                Education
              </h2>
            </div>
            <div style={{ flex: 1 }}>
              {education.higherEducation.filter(edu => edu.enabled).map((edu, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#222' }}>{edu.degree}</div>
                    <div style={{ fontSize: 9, color: '#666' }}>{edu.startYear} - {edu.currentlyPursuing ? 'Present' : edu.endYear}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#444' }}>{edu.instituteName}</div>
                  
                </div>
              ))}
              {/* Pre University */}
              {education.preUniversityEnabled && education.preUniversity.instituteName && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#222' }}>{education.preUniversity.boardType ? 'Pre University' : 'Pre University'}</div>
                    <div style={{ fontSize: 9, color: '#666' }}>{education.preUniversity.yearOfPassing}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#444' }}>{education.preUniversity.instituteName}</div>
                </div>
              )}

              {/* SSLC */}
              {education.sslcEnabled && education.sslc.instituteName && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#222' }}>SSLC</div>
                    <div style={{ fontSize: 9, color: '#666' }}>{education.sslc.yearOfPassing}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#444' }}>{education.sslc.instituteName}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Key Skills */}
        {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
          <section style={{ marginBottom: 20, display: 'flex', gap: '30px', paddingBottom: 20, borderBottom: '1px solid #ccc' }}>
            <div style={{ width: '110px', flexShrink: 0 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px', paddingTop: 2 }}>
                Key Skills
              </h2>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#444' }}>
                    • {s.skillName}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && certifications.some(c => c.enabled) && (
          <section style={{ marginBottom: 20, display: 'flex', gap: '30px', paddingBottom: 0 }}>
            <div style={{ width: '110px', flexShrink: 0 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px', paddingTop: 2 }}>
                Certifications
              </h2>
            </div>
            <div style={{ flex: 1 }}>
              {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
                <div key={i} style={{ fontSize: 10, color: '#444', marginBottom: 6 }}>
                  • {c.certificateTitle}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Template8Display;
