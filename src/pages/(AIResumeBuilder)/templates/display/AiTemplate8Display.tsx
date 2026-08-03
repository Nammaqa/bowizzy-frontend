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
const AiTemplate8Display: React.FC<Props> = ({ data, primaryColor = '#1e293b' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const contactParts = [personal.email, personal.mobileNumber, personal.address].filter(Boolean);
  const linkedin = normalizeProfileUrl(skillsLinks?.links?.linkedinProfile);
  const github = normalizeProfileUrl(skillsLinks?.links?.githubProfile);
  const portfolio = normalizeProfileUrl(skillsLinks?.links?.portfolioUrl);
  const languages: string[] = (personal as any).languagesKnown || [];
  const SectionTitle = ({ title }: { title: string }) => (
    <div style={{ marginTop: 16, marginBottom: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: primaryColor, letterSpacing: 1.5 }}>{title}</span>
      <div style={{ height: 2, backgroundColor: primaryColor, width: 40, marginTop: 3 }} />
    </div>
  );
  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: '"Source Sans 3", sans-serif', background: '#fff', padding: '28px 40px' }}>
      {/* Double-line header */}
      <div style={{ borderTop: `3px solid ${primaryColor}`, borderBottom: `1px solid ${primaryColor}`, padding: '14px 0', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: primaryColor, margin: 0, letterSpacing: 1 }}>
              {personal.firstName} {personal.middleName || ''} {personal.lastName}
            </h1>
            {experience.jobRole && <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>{experience.jobRole}</p>}
          </div>
          <div style={{ textAlign: 'right', width: 220, flexShrink: 0 }}>
            {contactParts.map((c, i) => <p key={i} style={{ fontSize: 8.5, color: '#475569', margin: 0, wordBreak: 'break-word' }}>{c}</p>)}
            {[linkedin, github, portfolio].filter(Boolean).map((c, i) => (
              <p key={i} style={{ fontSize: 8, margin: 0, wordBreak: 'break-word' }}>
                <a href={c} target="_blank" rel="noreferrer" style={{ color: primaryColor, textDecoration: 'none' }}>{c}</a>
              </p>
            ))}
          </div>
        </div>
      </div>
      {/* Summary */}
      {personal.aboutCareerObjective && (
        <>
          <SectionTitle title="Professional Summary" />
          <p style={{ fontSize: 9.5, color: '#334155', lineHeight: 1.6, margin: 0, textAlign: 'justify' }}>{htmlToLines(personal.aboutCareerObjective).join(' ')}</p>
        </>
      )}
      {/* Experience */}
      {experience.workExperiences.some(w => w.enabled) && (
        <>
          <SectionTitle title="Work Experience" />
          {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
            <div key={i} style={{ marginBottom: 10, paddingLeft: 10, borderLeft: `2px solid ${primaryColor}20` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 10.5, color: '#0f172a' }}>{w.jobTitle}</strong>
                <span style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</span>
              </div>
              <p style={{ fontSize: 9.5, color: primaryColor, fontWeight: 600, margin: '1px 0 0' }}>{w.companyName}{w.location ? `, ${w.location}` : ''}</p>
              <ul style={{ margin: '3px 0 0 14px', padding: 0, fontSize: 9, color: '#475569', lineHeight: 1.5 }}>
                {htmlToLines(w.description).map((line, j) => <li key={j} style={{ marginBottom: 1.5, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}
      {/* Projects */}
      {projects.some(p => p.enabled) && (
        <>
          <SectionTitle title="Projects" />
          {projects.filter(p => p.enabled).map((p: any, i) => (
            <div key={i} style={{ marginBottom: 10, paddingLeft: 10, borderLeft: `2px solid ${primaryColor}20` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: 10.5, color: '#0f172a' }}>{p.projectTitle}</strong>
                {(p.startDate || p.endDate || p.currentlyWorking) && <span style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtDate(p.startDate)}{(p.currentlyWorking || p.endDate) ? ` – ${p.currentlyWorking ? 'Present' : fmtDate(p.endDate)}` : ''}</span>}
              </div>
              <ul style={{ margin: '3px 0 0 14px', padding: 0, fontSize: 9, color: '#475569', lineHeight: 1.5 }}>
                {htmlToLines(p.description).map((line, j) => <li key={j} style={{ marginBottom: 1.5, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
                {htmlToLines(p.rolesResponsibilities).map((line, j) => <li key={j} style={{ marginBottom: 1.5, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}
      {/* Education */}
      <SectionTitle title="Education" />
      {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 10, color: '#0f172a' }}>{edu.degree} — {edu.fieldOfStudy}</strong>
            <span style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</span>
          </div>
          <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{edu.instituteName}</p>
          {/* {edu.universityBoard && <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{edu.universityBoard}</p>} */}
        </div>
      ))}
      {education.preUniversityEnabled && education.preUniversity?.instituteName && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 10, color: '#0f172a' }}>Pre University (12th)</strong>
            <span style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtYear(education.preUniversity.yearOfPassing)}</span>
          </div>
          <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{education.preUniversity.instituteName}</p>
        </div>
      )}
      {education.sslcEnabled && education.sslc?.instituteName && (
        <div style={{ marginBottom: 6 }}>
          <strong style={{ fontSize: 10, color: '#0f172a' }}>SSLC (10th)</strong>
          <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{education.sslc.instituteName} | {fmtYear(education.sslc.yearOfPassing)}</p>
        </div>
      )}
      {/* Skills */}
      {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
        <>
          <SectionTitle title="Technical Skills" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
              <span key={i} style={{ fontSize: 8.5, color: primaryColor, border: `1px solid ${primaryColor}40`, padding: '2px 10px', borderRadius: 3, background: `${primaryColor}08` }}>
                {s.skillName}
              </span>
            ))}
          </div>
        </>
      )}
      {/* Languages */}
      {languages.length > 0 && (
        <>
          <SectionTitle title="Languages" />
          <p style={{ fontSize: 9.5, color: '#334155', margin: 0 }}>{languages.join(', ')}</p>
        </>
      )}
      {/* Certifications */}
      {certifications.some(c => c.enabled && c.certificateTitle) && (
        <>
          <SectionTitle title="Certifications" />
          {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
            <p key={i} style={{ fontSize: 9, color: '#475569', margin: '0 0 2px' }}>
              • {c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}
            </p>
          ))}
        </>
      )}
    </div>
  );
};
export default AiTemplate8Display;
