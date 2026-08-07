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
const AiTemplate9Display: React.FC<Props> = ({ data, primaryColor = '#334155' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const contactParts = [personal.email, personal.mobileNumber, personal.address].filter(Boolean);
  const linkedin = normalizeProfileUrl(skillsLinks?.links?.linkedinProfile);
  const github = normalizeProfileUrl(skillsLinks?.links?.githubProfile);
  const portfolio = normalizeProfileUrl(skillsLinks?.links?.portfolioUrl);
  const languages: string[] = (personal as any).languagesKnown || [];
  const initials = `${(personal.firstName || '')[0] || ''}${(personal.lastName || '')[0] || ''}`.toUpperCase();
  const SectionTitle = ({ title }: { title: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 8 }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontSize: 7, fontWeight: 700 }}>●</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: primaryColor, letterSpacing: 1.5 }}>{title}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
    </div>
  );
  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: "Calibri, sans-serif", background: '#fff' }}>
      {/* Top banner */}
      <div style={{ backgroundColor: primaryColor, padding: '24px 40px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: primaryColor }}>{initials}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: 0.5 }}>
            {personal.firstName} {personal.middleName || ''} {personal.lastName}
          </h1>
          {experience.jobRole && <p style={{ fontSize: 11, color: '#cbd5e1', margin: '2px 0 0', fontWeight: 600 }}>{experience.jobRole}</p>}
        </div>
        <div style={{ textAlign: 'right', width: 220, flexShrink: 0 }}>
          {contactParts.map((c, i) => <p key={i} style={{ fontSize: 8.5, color: '#e2e8f0', margin: 0, wordBreak: 'break-word' }}>{c}</p>)}
          {[linkedin, github, portfolio].filter(Boolean).map((c, i) => (
            <p key={i} style={{ fontSize: 8, margin: 0, wordBreak: 'break-word' }}>
              <a href={c} target="_blank" rel="noreferrer" style={{ color: '#93c5fd', textDecoration: 'none' }}>{c}</a>
            </p>
          ))}
        </div>
      </div>
      <div style={{ padding: '12px 40px 32px' }}>
        {/* Summary */}
        {personal.aboutCareerObjective && (
          <>
            <SectionTitle title="Profile" />
            <p style={{ fontSize: 9.5, color: '#475569', lineHeight: 1.7, margin: 0, textAlign: 'justify' }}>{htmlToLines(personal.aboutCareerObjective).join(' ')}</p>
          </>
        )}
        {/* Experience */}
        {experience.workExperiences.some(w => w.enabled) && (
          <>
            <SectionTitle title="Experience" />
            {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: 10.5, color: '#0f172a' }}>{w.jobTitle}</strong>
                  <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, backgroundColor: '#f1f5f9', padding: '1px 8px', borderRadius: 8 }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</span>
                </div>
                <p style={{ fontSize: 9.5, color: primaryColor, fontWeight: 600, margin: '1px 0 0' }}>{w.companyName}{w.location ? ` | ${w.location}` : ''}</p>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: 9, color: '#475569', lineHeight: 1.6 }}>
                  {htmlToLines(w.description).map((line, j) => <li key={j} style={{ marginBottom: 2, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
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
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: 10.5, color: '#0f172a' }}>{p.projectTitle}</strong>
                  {(p.startDate || p.endDate || p.currentlyWorking) && <span style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtDate(p.startDate)}{(p.currentlyWorking || p.endDate) ? ` – ${p.currentlyWorking ? 'Present' : fmtDate(p.endDate)}` : ''}</span>}
                </div>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: 9, color: '#475569', lineHeight: 1.6 }}>
                  {htmlToLines(p.description).map((line, j) => <li key={j} style={{ marginBottom: 2, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
                  {htmlToLines(p.rolesResponsibilities).map((line, j) => <li key={j} style={{ marginBottom: 2, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
                </ul>
              </div>
            ))}
          </>
        )}
        {/* Two-column: Education + Skills/Certs */}
        <div style={{ display: 'flex', gap: 30, marginTop: 4 }}>
          <div style={{ flex: 1 }}>
            <SectionTitle title="Education" />
            {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
              <div key={i} style={{ marginBottom: 7 }}>
                <strong style={{ fontSize: 10, color: '#0f172a' }}>{edu.degree} — {edu.fieldOfStudy}</strong>
                <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{edu.instituteName}</p>
                {edu.universityBoard && <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{edu.universityBoard}</p>}
                <p style={{ fontSize: 8.5, color: '#94a3b8', margin: 0 }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</p>
                {edu.result && <p style={{ fontSize: 8.5, color: '#94a3b8', margin: 0 }}>{fmtResult(edu.result, edu.resultFormat)}</p>}
              </div>
            ))}
            {education.preUniversityEnabled && education.preUniversity?.instituteName && (
              <div style={{ marginBottom: 6 }}>
                <strong style={{ fontSize: 10, color: '#0f172a' }}>Pre University (12th)</strong>
                <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{education.preUniversity.instituteName}</p>
                <p style={{ fontSize: 8.5, color: '#94a3b8', margin: 0 }}>{fmtYear(education.preUniversity.yearOfPassing)}</p>
                {education.preUniversity.result && <p style={{ fontSize: 8.5, color: '#94a3b8', margin: 0 }}>{fmtResult(education.preUniversity.result, education.preUniversity.resultFormat)}</p>}
              </div>
            )}
            {education.sslcEnabled && education.sslc?.instituteName && (
              <div style={{ marginBottom: 6 }}>
                <strong style={{ fontSize: 10, color: '#0f172a' }}>SSLC (10th)</strong>
                <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{education.sslc.instituteName} | {fmtYear(education.sslc.yearOfPassing)}</p>
                {education.sslc.result && <p style={{ fontSize: 8.5, color: '#94a3b8', margin: 0 }}>{fmtResult(education.sslc.result, education.sslc.resultFormat)}</p>}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
              <>
                <SectionTitle title="Skills" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
                    <span key={i} style={{ fontSize: 8.5, color: '#fff', backgroundColor: primaryColor, padding: '3px 10px', borderRadius: 12 }}>
                      {s.skillName}
                    </span>
                  ))}
                </div>
              </>
            )}
            {certifications.some(c => c.enabled && c.certificateTitle) && (
              <>
                <SectionTitle title="Certifications" />
                {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
                  <p key={i} style={{ fontSize: 9, color: '#475569', margin: '0 0 3px' }}>
                    • {c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}
                  </p>
                ))}
              </>
            )}
            {languages.length > 0 && (
              <>
                <SectionTitle title="Languages" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {languages.map((l, i) => (
                    <span key={i} style={{ fontSize: 8.5, color: '#fff', backgroundColor: primaryColor, padding: '3px 10px', borderRadius: 12 }}>{l}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AiTemplate9Display;
