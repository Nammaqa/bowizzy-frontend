import React from 'react';
import type { ResumeData } from '@/types/resume';

interface Template7DisplayProps {
  data: ResumeData;
}

const Template7Display: React.FC<Template7DisplayProps> = ({ data }) => {
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
    <div className="w-[210mm] bg-white" style={{ minHeight: '297mm', fontFamily: 'Georgia, serif', color: '#222' }}>
      {/* Header - Full Width */}
      <header style={{ padding: '40px 40px 20px 40px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#004b87', margin: '0 0 4px 0', letterSpacing: '1px' }}>
          {(personal.firstName || '').toUpperCase()} {(personal.middleName || '').toUpperCase()} {(personal.lastName || '').toUpperCase()}
        </h1>
        <p style={{ fontSize: 14, color: '#444', margin: '0', letterSpacing: '0.5px', fontWeight: 500 }}>
          {experience.jobRole}
        </p>
      </header>

      {/* Two Column Layout */}
      <div style={{ display: 'flex', padding: '0 40px 40px 40px' }}>
        {/* Left Column */}
        <div style={{ width: '60%', paddingRight: '20px', boxSizing: 'border-box' }}>
          {/* Profile */}
          {personal.aboutCareerObjective && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #004b87' }}>
                Profile
              </h2>
              <p style={{ fontSize: 10, lineHeight: 1.5, color: '#444', margin: 0 }}>
                {htmlToText(personal.aboutCareerObjective)}
              </p>
            </section>
          )}

          {/* Education */}
          {education.higherEducation.some(edu => edu.enabled) && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #004b87' }}>
                Education
              </h2>
              {education.higherEducation.filter(edu => edu.enabled).map((edu, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#222' }}>{edu.instituteName}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{edu.degree}</div>
                  <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{edu.startYear} - {edu.currentlyPursuing ? 'Present' : edu.endYear}</div>
                 
                </div>
              ))}
              {/* Pre University */}
              {education.preUniversityEnabled && education.preUniversity.instituteName && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#222' }}>{education.preUniversity.instituteName}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>Pre University - {education.preUniversity.boardType}</div>
                  <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{education.preUniversity.yearOfPassing}</div>
                </div>
              )}

              {/* SSLC */}
              {education.sslcEnabled && education.sslc.instituteName && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#222' }}>{education.sslc.instituteName}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>SSLC - {education.sslc.boardType}</div>
                  <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{education.sslc.yearOfPassing}</div>
                </div>
              )}
            </section>
          )}

          {/* Experience */}
          {experience.workExperiences.some(exp => exp.enabled) && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #004b87' }}>
                Experience
              </h2>
              {experience.workExperiences.filter(w => w.enabled).map((w, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#222' }}>{w.jobTitle} | {w.companyName}</div>
                  <div style={{ fontSize: 9, color: '#999', marginBottom: 6, marginTop: 2 }}>{w.startDate} - {w.currentlyWorking ? 'Present' : w.endDate}</div>
                  {w.description && (
                    <p style={{ fontSize: 10, color: '#444', margin: 0, lineHeight: 1.5 }}>
                      {htmlToText(w.description).split('\n').map((line, idx) => (
                        <div key={idx}>{line}</div>
                      ))}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Right Column */}
        <div style={{ width: '40%', paddingLeft: '20px', boxSizing: 'border-box' }}>
          {/* Languages */}
          {personal.languagesKnown && personal.languagesKnown.length > 0 && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #004b87' }}>
                Languages
              </h2>
              <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
                {personal.languagesKnown.map((lang, i) => (
                  <li key={i} style={{ fontSize: 10, color: '#444', marginBottom: 6, lineHeight: 1.4 }}>
                    • {lang}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Skills */}
          {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #004b87' }}>
                Skills
              </h2>
              <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
                {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
                  <li key={i} style={{ fontSize: 10, color: '#444', marginBottom: 6, lineHeight: 1.4 }}>
                    • {s.skillName}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Contact */}
          <section style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 10, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #004b87' }}>
              Contact
            </h2>
            <div style={{ fontSize: 10, color: '#444', lineHeight: 1.6 }}>
              {personal.mobileNumber && <div>{personal.mobileNumber}</div>}
              {personal.email && <div>{personal.email}</div>}
              {personal.address && <div>{personal.address}</div>}
            </div>
          </section>

          {/* Projects (show after Contact on right column) */}
          {projects && projects.length > 0 && projects.some(p => p.enabled && p.projectTitle) && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #004b87' }}>
                Projects
              </h2>
              {projects.filter(p => p.enabled && p.projectTitle).map((p, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 10, fontWeight: 700 }}>{p.projectTitle}</div>
                    <div style={{ fontSize: 9, color: '#999' }}>{p.startDate} - {p.currentlyWorking ? 'Present' : p.endDate}</div>
                  </div>
                  {p.description && (
                    <div style={{ fontSize: 10, color: '#444', marginTop: 6 }}>
                      <ul style={{ marginTop: 6, paddingLeft: 18 }}>
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
            </section>
          )}

          {/* Certifications/Licenses */}
          {certifications.length > 0 && certifications.some(c => c.enabled) && (
            <section>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: '#004b87', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #004b87' }}>
                Licenses
              </h2>
              <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
                {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
                  <li key={i} style={{ fontSize: 10, color: '#444', marginBottom: 6, lineHeight: 1.4 }}>
                    • {c.certificateTitle}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Template7Display;
