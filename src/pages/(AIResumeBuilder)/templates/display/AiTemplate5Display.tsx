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

const AiTemplate5Display: React.FC<Props> = ({ data, primaryColor = '#0f766e' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const contactParts = [personal.email, personal.mobileNumber].filter(Boolean);
  const linkedin = normalizeProfileUrl(skillsLinks?.links?.linkedinProfile);
  const github = normalizeProfileUrl(skillsLinks?.links?.githubProfile);
  const portfolio = normalizeProfileUrl(skillsLinks?.links?.portfolioUrl);
  const languages: string[] = (personal as any).languagesKnown || [];

  const SectionTitle = ({ title }: { title: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: 14, marginBottom: 6 }}>
      <div style={{ width: 4, height: 14, backgroundColor: primaryColor, marginRight: 8 }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: primaryColor }}>{title}</span>
    </div>
  );

  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: "Calibri, sans-serif", background: '#fff', padding: '32px 40px' }}>
      {/* Header — split */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: primaryColor, margin: 0 }}>
            {personal.firstName} {personal.middleName || ''} {personal.lastName}
          </h1>
          {experience.jobRole && <p style={{ fontSize: 10, color: '#555', margin: '2px 0 0' }}>{experience.jobRole}</p>}
        </div>
        <div style={{ textAlign: 'right', width: 220, flexShrink: 0 }}>
          {contactParts.map((c, i) => <p key={i} style={{ fontSize: 9, color: '#555', margin: 0, wordBreak: 'break-word' }}>{c}</p>)}
          {personal.address && <p style={{ fontSize: 9, color: '#555', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>{personal.address}</p>}
          {[linkedin, github, portfolio].filter(Boolean).map((c, i) => (
            <p key={i} style={{ fontSize: 8, margin: 0, wordBreak: 'break-word' }}>
              <a href={c} target="_blank" rel="noreferrer" style={{ color: primaryColor, textDecoration: 'none' }}>{c}</a>
            </p>
          ))}
        </div>
      </div>
      <div style={{ height: 2, backgroundColor: primaryColor, marginBottom: 4 }} />

      {personal.aboutCareerObjective && (
        <>
          <SectionTitle title="Professional Summary" />
          <p style={{ fontSize: 9, color: '#333', lineHeight: 1.5, margin: 0, textAlign: 'justify' }}>{htmlToLines(personal.aboutCareerObjective).join(' ')}</p>
        </>
      )}

      {experience.workExperiences.some(w => w.enabled) && (
        <>
          <SectionTitle title="Experience" />
          {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 10 }}>{w.jobTitle}</strong>
                <span style={{ fontSize: 9, color: '#555' }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</span>
              </div>
              <p style={{ fontSize: 9, color: primaryColor, fontWeight: 700, margin: 0 }}>{w.companyName}{w.location ? ` • ${w.location}` : ''}</p>
              <ul style={{ margin: '2px 0 0 16px', padding: 0, fontSize: 9, color: '#333' }}>
                {htmlToLines(w.description).map((line, j) => <li key={j} style={{ marginBottom: 1, textAlign: 'justify' }}>{line.replace(/^[•\-]\s*/, '')}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}

      {projects.some(p => p.enabled) && (
        <>
          <SectionTitle title="Projects" />
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
        </>
      )}

      <SectionTitle title="Education" />
      {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 10 }}>{edu.degree} — {edu.fieldOfStudy}</strong>
            <span style={{ fontSize: 9, color: '#555' }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</span>
          </div>
          <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{edu.instituteName}</p>
          {edu.universityBoard && <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{edu.universityBoard}</p>}
          {edu.result && <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{fmtResult(edu.result, edu.resultFormat)}</p>}
        </div>
      ))}
      {education.preUniversityEnabled && education.preUniversity?.instituteName && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 10 }}>Pre University (12th)</strong>
            <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{fmtYear(education.preUniversity.yearOfPassing)}</p>
          </div>
          <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{education.preUniversity.instituteName}</p>
          {education.preUniversity.result && <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{fmtResult(education.preUniversity.result, education.preUniversity.resultFormat)}</p>}
        </div>
      )}
      {education.sslcEnabled && education.sslc?.instituteName && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 10 }}>SSLC (10th)</strong>
            <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{fmtYear(education.sslc.yearOfPassing)}</p>
          </div>
          <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{education.sslc.instituteName} </p>
          {education.sslc.result && <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{fmtResult(education.sslc.result, education.sslc.resultFormat)}</p>}
        </div>
      )}

      {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
        <>
          <SectionTitle title="Skills" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
              <span key={i} style={{ backgroundColor: '#e6f7f5', padding: '2px 8px', borderRadius: 3, fontSize: 8, color: primaryColor }}>{s.skillName}</span>
            ))}
          </div>
        </>
      )}

      {languages.length > 0 && (
        <>
          <SectionTitle title="Languages" />
          <p style={{ fontSize: 9, color: '#333', margin: 0 }}>{languages.join(', ')}</p>
        </>
      )}

      {certifications.some(c => c.enabled && c.certificateTitle) && (
        <>
          <SectionTitle title="Certifications" />
          {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
            <p key={i} style={{ fontSize: 9, color: '#333', margin: '0 0 2px' }}>• {c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}</p>
          ))}
        </>
      )}
    </div>
  );
};

export default AiTemplate5Display;
