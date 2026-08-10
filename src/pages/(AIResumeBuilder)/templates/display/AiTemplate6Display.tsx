import React from 'react';
import type { ResumeData } from '@/types/resume';
import { normalizeProfileUrl } from '../linkUtils';

const htmlToLines = (s?: string) => {
  if (!s) return [] as string[];
  const text = String(s).replace(/<\/p>|<\/li>/gi, '\n').replace(/<br\s*\/?>(?:\s*)/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  return text.split(/\n|\r\n/).map(l => l.trim()).filter(Boolean);
};

const fmtDate = (s?: string) => {
  if (!s) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = String(s).match(/^(\d{4})-(\d{2})/);
  if (m) { const mm = parseInt(m[2], 10); return mm >= 1 && mm <= 12 ? `${months[mm - 1]} ${m[1]}` : m[1]; }
  return String(s);
};
const fmtYear = (s?: string) => { if (!s) return ''; const m = String(s).match(/(\d{4})/); return m ? m[1] : String(s); };
const fmtResult = (result?: string, format?: string) => {
  if (!result) return '';
  if (!format) return result;
  return format.toLowerCase() === 'percentage' ? `${result}%` : `${format}: ${result}`;
};

interface Props { data: ResumeData; primaryColor?: string; }

const AiTemplate6Display: React.FC<Props> = ({ data, primaryColor = '#4338ca' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const contactParts = [personal.email, personal.mobileNumber, personal.address].filter(Boolean);
  const linkedin = normalizeProfileUrl(skillsLinks?.links?.linkedinProfile);
  const github = normalizeProfileUrl(skillsLinks?.links?.githubProfile);
  const portfolio = normalizeProfileUrl(skillsLinks?.links?.portfolioUrl);
  const languages: string[] = (personal as any).languagesKnown || [];
  const contactNodes: React.ReactNode[] = [
    ...contactParts.map((c, i) => <React.Fragment key={`c-${i}`}>{c}</React.Fragment>),
    linkedin && <a key="li" href={linkedin} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{linkedin}</a>,
    github && <a key="gh" href={github} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{github}</a>,
    portfolio && <a key="pf" href={portfolio} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{portfolio}</a>,
  ].filter(Boolean);

  const sectionTitle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: primaryColor, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 4 };

  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: "Calibri, sans-serif", background: '#fff' }}>
      {/* Top accent bar */}
      <div style={{ height: 6, backgroundColor: primaryColor }} />

      <div style={{ padding: '20px 40px 24px' }}>
        {/* Header centered */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', letterSpacing: 2, margin: 0 }}>
            {(personal.firstName || '').toUpperCase()} {((personal.middleName || '') + ' ').toUpperCase()}{(personal.lastName || '').toUpperCase()}
          </h1>
          {experience.jobRole && <p style={{ fontSize: 10, color: '#666', margin: '3px 0 0', letterSpacing: 1 }}>{experience.jobRole}</p>}
          <div style={{ height: 1, backgroundColor: '#ddd', marginTop: 8, marginBottom: 4 }} />
          <p style={{ fontSize: 8, color: '#666', margin: '2px 0 0' }}>
            {contactNodes.map((node, i) => (
              <React.Fragment key={i}>
                {i > 0 && '  •  '}
                {node}
              </React.Fragment>
            ))}
          </p>
        </div>

        {/* Two column */}
        <div style={{ display: 'flex', marginTop: 10, gap: 0 }}>
          {/* Left — 65% */}
          <div style={{ flex: 65, paddingRight: 16 }}>
            {personal.aboutCareerObjective && (
              <div style={{ marginBottom: 12 }}>
                <p style={sectionTitle}>Profile</p>
                <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                <p style={{ fontSize: 9, color: '#333', lineHeight: 1.5, margin: 0, textAlign: 'justify' }}>{htmlToLines(personal.aboutCareerObjective).join(' ')}</p>
              </div>
            )}

            {experience.workExperiences.some(w => w.enabled) && (
              <div style={{ marginBottom: 12 }}>
                <p style={sectionTitle}>Experience</p>
                <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <strong style={{ fontSize: 10 }}>{w.jobTitle}</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, color: primaryColor }}>{w.companyName}</span>
                      <span style={{ fontSize: 8, color: '#777' }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</span>
                    </div>
                    <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: 9, color: '#333' }}>
                      {htmlToLines(w.description).map((line, j) => <li key={j} style={{ marginBottom: 1, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {projects.some(p => p.enabled) && (
              <div style={{ marginBottom: 12 }}>
                <p style={sectionTitle}>Projects</p>
                <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                {projects.filter(p => p.enabled).map((p: any, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <strong style={{ fontSize: 10 }}>{p.projectTitle}</strong>
                      {(p.startDate || p.endDate || p.currentlyWorking) && <span style={{ fontSize: 9, color: '#555' }}>{fmtDate(p.startDate)}{(p.currentlyWorking || p.endDate) ? ` – ${p.currentlyWorking ? 'Present' : fmtDate(p.endDate)}` : ''}</span>}
                    </div>
                    <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: 9, color: '#333' }}>
                      {htmlToLines(p.description).map((line, j) => <li key={j} style={{ marginBottom: 1, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
                      {htmlToLines(p.rolesResponsibilities).map((line, j) => <li key={j} style={{ marginBottom: 1, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — 35% */}
          <div style={{ flex: 35, paddingLeft: 12, borderLeft: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: 14 }}>
              <p style={sectionTitle}>Education</p>
              <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
              {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, margin: 0 }}>{edu.degree}</p>
                  <p style={{ fontSize: 8, color: '#555', margin: 0 }}>{edu.instituteName}</p>
                  <p style={{ fontSize: 7, color: '#777', margin: 0 }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</p>
                  {edu.result && <p style={{ fontSize: 7, color: '#777', margin: 0 }}>{fmtResult(edu.result, edu.resultFormat)}</p>}
                </div>
              ))}
              {education.preUniversityEnabled && education.preUniversity?.instituteName && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, margin: 0 }}>Pre University</p>
                  <p style={{ fontSize: 8, color: '#555', margin: 0 }}>{education.preUniversity.instituteName}</p>
                  <p style={{ fontSize: 7, color: '#777', margin: 0 }}>{fmtYear(education.preUniversity.yearOfPassing)}</p>
                  {education.preUniversity.result && <p style={{ fontSize: 7, color: '#777', margin: 0 }}>{fmtResult(education.preUniversity.result, education.preUniversity.resultFormat)}</p>}
                </div>
              )}
              {education.sslcEnabled && education.sslc?.instituteName && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, margin: 0 }}>SSLC</p>
                  <p style={{ fontSize: 8, color: '#555', margin: 0 }}>{education.sslc.instituteName}</p>
                  <p style={{ fontSize: 7, color: '#777', margin: 0 }}>{fmtYear(education.sslc.yearOfPassing)}</p>
                  {education.sslc.result && <p style={{ fontSize: 7, color: '#777', margin: 0 }}>{fmtResult(education.sslc.result, education.sslc.resultFormat)}</p>}
                </div>
              )}
            </div>

            {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
              <div style={{ marginBottom: 14 }}>
                <p style={sectionTitle}>Skills</p>
                <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
                  <p key={i} style={{ fontSize: 8, color: '#333', margin: '0 0 2px' }}>• {s.skillName}</p>
                ))}
              </div>
            )}

            {certifications.some(c => c.enabled && c.certificateTitle) && (
              <div style={{ marginBottom: 14 }}>
                <p style={sectionTitle}>Certifications</p>
                <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
                  <p key={i} style={{ fontSize: 8, color: '#333', margin: '0 0 2px' }}>• {c.certificateTitle}</p>
                ))}
              </div>
            )}
            {languages.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={sectionTitle}>Languages</p>
                <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                {languages.map((l, i) => <p key={i} style={{ fontSize: 8, color: '#333', margin: '0 0 2px' }}>• {l}</p>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTemplate6Display;
