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
const AiTemplate1Display: React.FC<Props> = ({ data, primaryColor = '#1a1a1a' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const contactParts = [personal.email, personal.mobileNumber, personal.address].filter(Boolean);
  const linkedin = normalizeProfileUrl(skillsLinks?.links?.linkedinProfile);
  const github = normalizeProfileUrl(skillsLinks?.links?.githubProfile);
  const portfolio = normalizeProfileUrl(skillsLinks?.links?.portfolioUrl);
  const languages: string[] = (personal as any).languagesKnown || [];
  const sectionStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: primaryColor, marginTop: 14 };
  const divider: React.CSSProperties = { height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 2, marginBottom: 6 };
  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: "Calibri, sans-serif", background: '#fff', padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: primaryColor, margin: 0, letterSpacing: 1 }}>
          {personal.firstName} {personal.middleName || ''} {personal.lastName}
        </h1>
        <p style={{ fontSize: 9, color: '#555', margin: '4px 0 0' }}>{contactParts.join('  |  ')}</p>
        {[linkedin, github, portfolio].filter(Boolean).map((c, i) => (
          <p key={i} style={{ fontSize: 9, margin: '2px 0 0' }}>
            <a href={c} target="_blank" rel="noreferrer" style={{ color: '#555', textDecoration: 'none' }}>{c}</a>
          </p>
        ))}
      </div>
      <div style={divider} />
      {/* Summary */}
      {personal.aboutCareerObjective && (
        <>
          <p style={sectionStyle}>Professional Summary</p>
          <div style={divider} />
          <p style={{ fontSize: 10, color: '#333', lineHeight: 1.5, margin: 0, textAlign: 'justify' }}>{htmlToLines(personal.aboutCareerObjective).join(' ')}</p>
        </>
      )}
      {/* Experience */}
      {experience.workExperiences.some(w => w.enabled) && (
        <>
          <p style={sectionStyle}>Experience</p>
          <div style={divider} />
          {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 11 }}>{w.jobTitle} — {w.companyName}</strong>
                <span style={{ fontSize: 10, color: '#555' }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</span>
              </div>
              <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: 10, color: '#333' }}>
                {htmlToLines(w.description).map((line, j) => <li key={j} style={{ marginBottom: 1, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}
      {/* Projects */}
      {projects.some(p => p.enabled) && (
        <>
          <p style={sectionStyle}>Projects</p>
          <div style={divider} />
          {projects.filter(p => p.enabled).map((p: any, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: 11 }}>{p.projectTitle}</strong>
                {(p.startDate || p.endDate || p.currentlyWorking) && <span style={{ fontSize: 9, color: '#555' }}>{fmtDate(p.startDate)}{(p.currentlyWorking || p.endDate) ? ` – ${p.currentlyWorking ? 'Present' : fmtDate(p.endDate)}` : ''}</span>}
              </div>
              <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: 10, color: '#333' }}>
                {htmlToLines(p.description).map((line, j) => <li key={j} style={{ marginBottom: 1, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
                {htmlToLines(p.rolesResponsibilities).map((line, j) => <li key={j} style={{ marginBottom: 1, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}
      {/* Education */}
      <p style={sectionStyle}>Education</p>
      <div style={divider} />
      {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 11 }}>{edu.degree} — {edu.fieldOfStudy}</strong>
            <span style={{ fontSize: 9, color: '#555' }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</span>
          </div>
          <p style={{ fontSize: 10, color: '#555', margin: 0 }}>{edu.instituteName}</p>
          {edu.universityBoard && <p style={{ fontSize: 10, color: '#555', margin: 0 }}>{edu.universityBoard}</p>}
          {edu.result && <p style={{ fontSize: 10, color: '#555', margin: 0 }}>{fmtResult(edu.result, edu.resultFormat)}</p>}
        </div>
      ))}
      {education.preUniversityEnabled && education.preUniversity?.instituteName && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 11 }}>Pre University (12th)</strong>
            <span style={{ fontSize: 9, color: '#555' }}>{fmtYear(education.preUniversity.yearOfPassing)}</span>
          </div>
          <p style={{ fontSize: 10, color: '#555', margin: 0 }}>{education.preUniversity.instituteName}</p>
          {education.preUniversity.result && <p style={{ fontSize: 10, color: '#555', margin: 0 }}>{fmtResult(education.preUniversity.result, education.preUniversity.resultFormat)}</p>}
        </div>
      )}
      {education.sslcEnabled && education.sslc?.instituteName && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 11 }}>SSLC (10th)</strong>
            <span style={{ fontSize: 9, color: '#555' }}>{fmtYear(education.sslc.yearOfPassing)}</span>
          </div>
          <p style={{ fontSize: 10, color: '#555', margin: 0 }}>{education.sslc.instituteName}</p>
          {education.sslc.result && <p style={{ fontSize: 10, color: '#555', margin: 0 }}>{fmtResult(education.sslc.result, education.sslc.resultFormat)}</p>}
        </div>
      )}
      {/* Skills */}
      {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
        <>
          <p style={sectionStyle}>Skills</p>
          <div style={divider} />
          <p style={{ fontSize: 10, color: '#333', margin: 0 }}>{skillsLinks.skills.filter(s => s.enabled && s.skillName).map(s => s.skillName).join(', ')}</p>
        </>
      )}
      {/* Languages */}
      {languages.length > 0 && (
        <>
          <p style={sectionStyle}>Languages</p>
          <div style={divider} />
          <p style={{ fontSize: 10, color: '#333', margin: 0 }}>{languages.join(', ')}</p>
        </>
      )}
      {/* Certifications */}
      {certifications.some(c => c.enabled && c.certificateTitle) && (
        <>
          <p style={sectionStyle}>Certifications</p>
          <div style={divider} />
          <p style={{ fontSize: 10, color: '#333', margin: 0 }}>{certifications.filter(c => c.enabled && c.certificateTitle).map(c => c.certificateTitle).join(', ')}</p>
        </>
      )}
    </div>
  );
};
export default AiTemplate1Display;
