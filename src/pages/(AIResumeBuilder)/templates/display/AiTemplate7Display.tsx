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
const AiTemplate7Display: React.FC<Props> = ({ data, primaryColor = '#374151' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const contactParts = [personal.email, personal.mobileNumber, personal.address].filter(Boolean);
  const linkedin = normalizeProfileUrl(skillsLinks?.links?.linkedinProfile);
  const github = normalizeProfileUrl(skillsLinks?.links?.githubProfile);
  const portfolio = normalizeProfileUrl(skillsLinks?.links?.portfolioUrl);
  const languages: string[] = (personal as any).languagesKnown || [];
  const sectionStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' as const, color: primaryColor, marginTop: 16, marginBottom: 2 };
  const thinLine: React.CSSProperties = { height: 0.5, backgroundColor: '#d1d5db', width: '100%', marginBottom: 8 };
  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: "Calibri, sans-serif", background: '#fff', padding: '36px 44px' }}>
      {/* Header */}
      <div style={{ marginBottom: 6 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: primaryColor, margin: 0, letterSpacing: 0.5 }}>
          {personal.firstName} {personal.middleName || ''} {personal.lastName}
        </h1>
        {experience.jobRole && <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0', fontWeight: 500 }}>{experience.jobRole}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
          {contactParts.map((c, i) => <span key={i} style={{ fontSize: 8.5, color: '#6b7280' }}>{c}</span>)}
          {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 8.5, color: primaryColor, textDecoration: 'none' }}>{linkedin}</a>}
          {github && <a href={github} target="_blank" rel="noreferrer" style={{ fontSize: 8.5, color: primaryColor, textDecoration: 'none' }}>{github}</a>}
          {portfolio && <a href={portfolio} target="_blank" rel="noreferrer" style={{ fontSize: 8.5, color: primaryColor, textDecoration: 'none' }}>{portfolio}</a>}
        </div>
      </div>
      <div style={{ height: 1.5, backgroundColor: primaryColor, marginBottom: 10 }} />
      {/* Summary */}
      {personal.aboutCareerObjective && (
        <>
          <p style={sectionStyle}>Summary</p>
          <div style={thinLine} />
          <p style={{ fontSize: 9.5, color: '#374151', lineHeight: 1.6, margin: 0, textAlign: 'justify' }}>{htmlToLines(personal.aboutCareerObjective).join(' ')}</p>
        </>
      )}
      {/* Experience */}
      {experience.workExperiences.some(w => w.enabled) && (
        <>
          <p style={sectionStyle}>Experience</p>
          <div style={thinLine} />
          {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: 10.5, color: '#111827' }}>{w.jobTitle}</strong>
                <span style={{ fontSize: 8.5, color: '#9ca3af', fontWeight: 500 }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</span>
              </div>
              <p style={{ fontSize: 9.5, color: primaryColor, fontWeight: 600, margin: '1px 0 0' }}>{w.companyName}{w.location ? ` · ${w.location}` : ''}</p>
              <ul style={{ margin: '3px 0 0 16px', padding: 0, fontSize: 9, color: '#4b5563', lineHeight: 1.5 }}>
                {htmlToLines(w.description).map((line, j) => <li key={j} style={{ marginBottom: 1.5, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}
      {/* Projects */}
      {projects.some(p => p.enabled) && (
        <>
          <p style={sectionStyle}>Projects</p>
          <div style={thinLine} />
          {projects.filter(p => p.enabled).map((p: any, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: 10.5, color: '#111827' }}>{p.projectTitle}</strong>
                {(p.startDate || p.endDate || p.currentlyWorking) && <span style={{ fontSize: 9, color: '#6b7280' }}>{fmtDate(p.startDate)}{(p.currentlyWorking || p.endDate) ? ` – ${p.currentlyWorking ? 'Present' : fmtDate(p.endDate)}` : ''}</span>}
              </div>
              <ul style={{ margin: '3px 0 0 16px', padding: 0, fontSize: 9, color: '#4b5563', lineHeight: 1.5 }}>
                {htmlToLines(p.description).map((line, j) => <li key={j} style={{ marginBottom: 1.5, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
                {htmlToLines(p.rolesResponsibilities).map((line, j) => <li key={j} style={{ marginBottom: 1.5, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}
      {/* Education */}
      <p style={sectionStyle}>Education</p>
      <div style={thinLine} />
      {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 10, color: '#111827' }}>{edu.degree} — {edu.fieldOfStudy}</strong>
            <span style={{ fontSize: 8.5, color: '#9ca3af' }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</span>
          </div>
          <p style={{ fontSize: 9, color: '#6b7280', margin: 0 }}>{edu.instituteName}</p>
          {/* {edu.universityBoard && <p style={{ fontSize: 9, color: '#6b7280', margin: 0 }}>{edu.universityBoard}</p>} */}
          {edu.result && <p style={{ fontSize: 9, color: '#6b7280', margin: 0 }}>{fmtResult(edu.result, edu.resultFormat)}</p>}
        </div>
      ))}
      {education.preUniversityEnabled && education.preUniversity?.instituteName && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 10, color: '#111827' }}>Pre University (12th)</strong>
            <span style={{ fontSize: 8.5, color: '#9ca3af' }}>{fmtYear(education.preUniversity.yearOfPassing)}</span>
          </div>
          <p style={{ fontSize: 9, color: '#6b7280', margin: 0 }}>{education.preUniversity.instituteName}</p>
          {education.preUniversity.result && <p style={{ fontSize: 9, color: '#6b7280', margin: 0 }}>{fmtResult(education.preUniversity.result, education.preUniversity.resultFormat)}</p>}
        </div>
      )}
      {education.sslcEnabled && education.sslc?.instituteName && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 10, color: '#111827' }}>SSLC (10th)</strong>
            <span style={{ fontSize: 8.5, color: '#9ca3af' }}>{fmtYear(education.sslc.yearOfPassing)}</span>
          </div>
          <p style={{ fontSize: 9, color: '#6b7280', margin: 0 }}>{education.sslc.instituteName}</p>
          {education.sslc.result && <p style={{ fontSize: 9, color: '#6b7280', margin: 0 }}>{fmtResult(education.sslc.result, education.sslc.resultFormat)}</p>}
        </div>
      )}
      {/* Skills */}
      {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
        <>
          <p style={sectionStyle}>Skills</p>
          <div style={thinLine} />
          <p style={{ fontSize: 9.5, color: '#4b5563', margin: 0, lineHeight: 1.6 }}>
            {skillsLinks.skills.filter(s => s.enabled && s.skillName).map(s => s.skillName).join('  ·  ')}
          </p>
        </>
      )}
      {/* Languages */}
      {languages.length > 0 && (
        <>
          <p style={sectionStyle}>Languages</p>
          <div style={thinLine} />
          <p style={{ fontSize: 9.5, color: '#4b5563', margin: 0 }}>{languages.join('  ·  ')}</p>
        </>
      )}
      {/* Certifications */}
      {certifications.some(c => c.enabled && c.certificateTitle) && (
        <>
          <p style={sectionStyle}>Certifications</p>
          <div style={thinLine} />
          {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
            <p key={i} style={{ fontSize: 9, color: '#4b5563', margin: '0 0 2px' }}>
              {c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}
            </p>
          ))}
        </>
      )}
    </div>
  );
};
export default AiTemplate7Display;
