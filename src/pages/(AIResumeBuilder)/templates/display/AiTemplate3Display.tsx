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

interface Props { data: ResumeData; primaryColor?: string; }

const AiTemplate3Display: React.FC<Props> = ({ data, primaryColor = '#2d3748' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const linkedin = normalizeProfileUrl(skillsLinks?.links?.linkedinProfile);
  const github = normalizeProfileUrl(skillsLinks?.links?.githubProfile);
  const portfolio = normalizeProfileUrl(skillsLinks?.links?.portfolioUrl);
  const languages: string[] = (personal as any).languagesKnown || [];

  const sidebarSectionTitle: React.CSSProperties = { fontSize: 9, fontWeight: 700, color: '#e2e8f0', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginTop: 18, marginBottom: 4 };
  const mainSectionTitle: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: primaryColor, marginBottom: 2, marginTop: 14 };

  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: "Nunito Sans, sans-serif", background: '#fff', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: 170, backgroundColor: primaryColor, padding: '28px 18px', color: '#fff', flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>{personal.firstName}</h1>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>{personal.lastName}</h1>

        <p style={sidebarSectionTitle}>Contact</p>
        <div style={{ height: 1, backgroundColor: '#e2e8f0', marginBottom: 6 }} />
        {personal.email && <p style={{ fontSize: 8, color: '#e2e8f0', margin: '0 0 3px' }}>{personal.email}</p>}
        {personal.mobileNumber && <p style={{ fontSize: 8, color: '#e2e8f0', margin: '0 0 3px' }}>{personal.mobileNumber}</p>}
        {personal.address && <p style={{ fontSize: 8, color: '#e2e8f0', margin: '0 0 3px' }}>{personal.address}</p>}
        {linkedin && <p style={{ fontSize: 7, margin: '0 0 3px', wordBreak: 'break-all' }}><a href={linkedin} target="_blank" rel="noreferrer" style={{ color: '#90cdf4', textDecoration: 'none' }}>{linkedin}</a></p>}
        {github && <p style={{ fontSize: 7, margin: '0 0 3px', wordBreak: 'break-all' }}><a href={github} target="_blank" rel="noreferrer" style={{ color: '#90cdf4', textDecoration: 'none' }}>{github}</a></p>}
        {portfolio && <p style={{ fontSize: 7, margin: '0 0 3px', wordBreak: 'break-all' }}><a href={portfolio} target="_blank" rel="noreferrer" style={{ color: '#90cdf4', textDecoration: 'none' }}>{portfolio}</a></p>}

        <p style={sidebarSectionTitle}>Education</p>
        <div style={{ height: 1, backgroundColor: '#e2e8f0', marginBottom: 6 }} />
        {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#fff', margin: 0 }}>{edu.degree}</p>
              <span style={{ fontSize: 7, color: '#a0aec0' }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</span>
            </div>
            <p style={{ fontSize: 8, color: '#e2e8f0', margin: 0 }}>{edu.fieldOfStudy}</p>
            <p style={{ fontSize: 8, color: '#e2e8f0', margin: 0 }}>{edu.instituteName}</p>
            {edu.universityBoard && <p style={{ fontSize: 8, color: '#e2e8f0', margin: 0 }}>{edu.universityBoard}</p>}
          </div>
        ))}
        {education.preUniversityEnabled && education.preUniversity?.instituteName && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#fff', margin: 0 }}>Pre University</p>
              <span style={{ fontSize: 7, color: '#a0aec0' }}>{fmtYear(education.preUniversity.yearOfPassing)}</span>
            </div>
            <p style={{ fontSize: 8, color: '#e2e8f0', margin: 0 }}>{education.preUniversity.instituteName}</p>
          </div>
        )}
        {education.sslcEnabled && education.sslc?.instituteName && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#fff', margin: 0 }}>SSLC</p>
              <span style={{ fontSize: 7, color: '#a0aec0' }}>{fmtYear(education.sslc.yearOfPassing)}</span>
            </div>
            <p style={{ fontSize: 8, color: '#e2e8f0', margin: 0 }}>{education.sslc.instituteName}</p>
          </div>
        )}

        {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
          <>
            <p style={sidebarSectionTitle}>Skills</p>
            <div style={{ height: 1, backgroundColor: '#e2e8f0', marginBottom: 6 }} />
            {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
              <p key={i} style={{ fontSize: 8, color: '#e2e8f0', margin: '0 0 2px' }}>• {s.skillName}</p>
            ))}
          </>
        )}

        {certifications.some(c => c.enabled && c.certificateTitle) && (
          <>
            <p style={sidebarSectionTitle}>Certifications</p>
            <div style={{ height: 1, backgroundColor: '#e2e8f0', marginBottom: 6 }} />
            {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
              <p key={i} style={{ fontSize: 8, color: '#e2e8f0', margin: '0 0 2px' }}>• {c.certificateTitle}</p>
            ))}
          </>
        )}
        {languages.length > 0 && (
          <>
            <p style={sidebarSectionTitle}>Languages</p>
            <div style={{ height: 1, backgroundColor: '#e2e8f0', marginBottom: 6 }} />
            {languages.map((l, i) => <p key={i} style={{ fontSize: 8, color: '#e2e8f0', margin: '0 0 2px' }}>• {l}</p>)}
          </>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '28px 24px' }}>
        {personal.aboutCareerObjective && (
          <>
            <p style={mainSectionTitle}>Summary</p>
            <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
            <p style={{ fontSize: 9, color: '#333', lineHeight: 1.5, margin: 0 }}>{htmlToLines(personal.aboutCareerObjective).join(' ')}</p>
          </>
        )}

        {experience.workExperiences.some(w => w.enabled) && (
          <>
            <p style={mainSectionTitle}>Experience</p>
            <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
            {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 10 }}>{w.jobTitle}</strong>
                  <span style={{ fontSize: 8, color: '#555' }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</span>
                </div>
                <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{w.companyName}{w.location ? ` | ${w.location}` : ''}</p>
                <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: 9, color: '#333' }}>
                  {htmlToLines(w.description).map((line, j) => <li key={j} style={{ marginBottom: 1 }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
                </ul>
              </div>
            ))}
          </>
        )}

        {projects.some(p => p.enabled) && (
          <>
            <p style={mainSectionTitle}>Projects</p>
            <div style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
            {projects.filter(p => p.enabled).map((p: any, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: 10 }}>{p.projectTitle}</strong>
                  {(p.startDate || p.endDate || p.currentlyWorking) && <span style={{ fontSize: 9, color: '#555' }}>{fmtDate(p.startDate)}{(p.currentlyWorking || p.endDate) ? ` – ${p.currentlyWorking ? 'Present' : fmtDate(p.endDate)}` : ''}</span>}
                </div>
                <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: 9, color: '#333' }}>
                  {htmlToLines(p.description).map((line, j) => <li key={j} style={{ marginBottom: 1 }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
                  {htmlToLines(p.rolesResponsibilities).map((line, j) => <li key={j} style={{ marginBottom: 1 }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
                </ul>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default AiTemplate3Display;
