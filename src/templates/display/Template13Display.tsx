import React from 'react';
import DOMPurify from 'dompurify';
import { FiPhone, FiMail, FiMapPin, FiLinkedin, FiGithub, FiLink, FiFileText } from 'react-icons/fi';

import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

interface Template13DisplayProps {
  data: ResumeData;
  fontFamily?: string;
  primaryColor?: string;
}

const htmlToLines = (s?: string) => {
  if (!s) return [] as string[];
  try {
    const text = String(s)
      .replace(/<\/p>|<\/li>/gi, '\n')
      .replace(/<br\s*\/?>(?:\s*)/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&');
    return text.split(/\n|\r\n/).map(l => l.trim()).filter(Boolean);
  } catch (e) { return [String(s)]; }
};

const formatMonthYear = (s?: string) => {
  if (!s) return '';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  try {
    const str = String(s).trim();
    const ymd = str.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
    if (ymd) {
      const year = ymd[1];
      const mm = parseInt(ymd[2], 10);
      if (!isNaN(mm) && mm >= 1 && mm <= 12) return `${months[mm - 1]} ${year}`;
      return year;
    }
    const mY = str.match(/^(\d{2})\/(\d{4})$/);
    if (mY) {
      const mm = parseInt(mY[1], 10);
      const year = mY[2];
      if (!isNaN(mm) && mm >= 1 && mm <= 12) return `${months[mm - 1]} ${year}`;
      return year;
    }
  } catch (e) { }
  return String(s);
};

const formatYear = (s?: string) => {
  if (!s) return '';
  const str = String(s).trim();
  const y = str.match(/(\d{4})/);
  return y ? y[1] : str;
};

const educationPriority = (degree?: string) => {
  if (!degree) return 99;
  const d = degree.toLowerCase();
  if (/(bachelor|b\.?e|btech|b\.tech|be|bsc|ba)/.test(d)) return 1;
  if (/(puc|higher secondary|12th|intermediate)/.test(d)) return 2;
  if (/(ssc|sslc|10th|matric)/.test(d)) return 3;
  return 4;
};

const hasListTags = (html?: string) => {
  if (!html) return false;
  return /<(ul|ol|li)[\s\/>]/i.test(html) || html.includes('•');
};

const renderDescription = (html?: string) => {
  if (!html) return null;

  if (!hasListTags(html)) {
    const plainText = String(html)
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
    
    if (!plainText) return null;
    
    return (
      <div style={{ marginTop: 6, color: '#2b2a2a', lineHeight: 1.4 }}>
        {plainText}
      </div>
    );
  }

  const lines = htmlToLines(html);
  if (lines.length === 0) return null;

  return (
    <div style={{ marginTop: 6, color: '#2b2a2a' }}>
      {lines.map((line, idx) => {
        const isBullet = line.startsWith('•');
        const cleanLine = isBullet ? line.replace(/^•\s*/, '') : line;
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', marginTop: idx > 0 ? 4 : 0 }}>
            <span style={{ marginRight: 6, lineHeight: 1.4, opacity: isBullet ? 1 : 0, width: 6 }}>{isBullet ? '•' : ''}</span>
            <div style={{ flex: 1, lineHeight: 1.4 }}>{cleanLine}</div>
          </div>
        );
      })}
    </div>
  );
};

const Template13Display: React.FC<Template13DisplayProps> = ({
  data,
  fontFamily = "Times New Roman, serif",
  primaryColor = "#000000",
}) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;

  return (
    <div
      style={{
        width: '210mm',
        minHeight: '297mm',
        fontFamily: fontFamily,
        background: '#fff',
      }}
    >      <div style={{ padding: '28px 36px 8px 36px', textAlign: 'center' }}>
        <h1
          style={{
            margin: 0,
            marginBottom: 4,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1,
            color: primaryColor,
          }}
        >
          {personal.firstName} {(personal.middleName || '')} {personal.lastName}
        </h1>        <div style={{ marginTop: 4, fontSize: 11, color: '#6b7280' }}>
          {(() => {
            const address = personal.address && String(personal.address);
            const email = personal.email;
            const phone = personal.mobileNumber;
            const links = (skillsLinks as any)?.links;
            const linkedin = links ? (links.linkedinEnabled !== false ? links.linkedinProfile : null) : (personal as any).linkedinProfile;
            const github = links ? (links.githubEnabled !== false ? links.githubProfile : null) : (personal as any).githubProfile;
            const portfolio = links ? (links.portfolioEnabled !== false ? links.portfolioUrl : null) : null;
            const publication = links ? (links.publicationEnabled !== false ? links.publicationUrl : null) : null;

            const parts: any[] = [];
            if (address) parts.push(
              <span key="addr" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiMapPin style={{ verticalAlign: 'middle', color: '#6b7280' }} /><span>{address}</span></span>
            );
            if (email) parts.push(
              <span key="email" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiMail style={{ verticalAlign: 'middle', color: '#6b7280' }} /><a href={`mailto:${email}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{email}</a></span>
            );
            if (phone) parts.push(
              <span key="phone" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiPhone style={{ verticalAlign: 'middle', color: '#6b7280' }} /><a href={`tel:${phone}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{phone}</a></span>
            );
            if (linkedin) parts.push(
              <span key="ln" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiLinkedin style={{ verticalAlign: 'middle', color: '#0A66C2' }} /><a href={linkedin} target="_blank" rel="noreferrer" style={{ color: '#6b7280', textDecoration: 'none' }}>{linkedin}</a></span>
            );
            if (github) parts.push(
              <span key="gh" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiGithub style={{ verticalAlign: 'middle', color: '#111827' }} /><a href={github} target="_blank" rel="noreferrer" style={{ color: '#6b7280', textDecoration: 'none' }}>{github}</a></span>
            );
            if (portfolio) parts.push(
              <span key="port" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiLink style={{ verticalAlign: 'middle', color: '#6b7280' }} /><a href={portfolio} target="_blank" rel="noreferrer" style={{ color: '#6b7280', textDecoration: 'none' }}>Portfolio</a></span>
            );
            if (publication) parts.push(
              <span key="pub" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiFileText style={{ verticalAlign: 'middle', color: '#6b7280' }} /><a href={publication} target="_blank" rel="noreferrer" style={{ color: '#6b7280', textDecoration: 'none' }}>Publication</a></span>
            );

            return parts.reduce((acc, cur, idx) => (idx === 0 ? [cur] : [...acc, <span key={`sep-${idx}`} style={{ margin: '0 6px' }}>|</span>, cur]), [] as any[]);
          })()}
        </div>
        <div style={{ height: 1, background: '#cfcfcf', marginTop: 12, width: '100%' }} />
      </div>

      <div style={{ padding: '0 36px 36px 36px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0 16px', alignItems: 'start' }}>
          <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: '#111827', fontWeight: 700 }}>SUMMARY</div>
            <div style={{ height: 1, background: '#cfcfcf', marginTop: 0, marginBottom: 0, width: '100%' }} />
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: 0 }}>
            {personal.aboutCareerObjective && (<div style={{ color: '#2b2a2a', lineHeight: 1.4 }}>{htmlToLines(personal.aboutCareerObjective).join(' ')}</div>)}
          </div>

          {experience.workExperiences.some(exp => exp.enabled) && (<>
            <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>EXPERIENCE</div>
              <div style={{ height: 1, background: '#cfcfcf', marginTop: 0, marginBottom: 0, width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: 0 }}>
              {experience.workExperiences.filter(e => e.enabled).map((w, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{w.jobTitle} — <span style={{ fontWeight: 700 }}>{w.companyName}</span></div>
                    <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</div>
                  </div>
                  {w.description && renderDescription(w.description)}
                </div>
              ))}
            </div>
          </>)}

          {projects.some(p => p.enabled) && (<>
            <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>PROJECTS</div>
              <div style={{ height: 1, background: '#cfcfcf', marginTop: 0, marginBottom: 0, width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: 0 }}>
              {projects && projects.filter(p => p.enabled).map((p, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{p.projectTitle}</div>
                    <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</div>
                  </div>
                  {p.description && renderDescription(p.description)}
                  {p.rolesResponsibilities && (
                    <div style={{ marginTop: 6, color: '#2b2a2a' }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: '#111827', marginBottom: 2 }}>Roles & Responsibilities:</div>
                      {renderDescription(p.rolesResponsibilities)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>)}

          {(education.higherEducation.some(edu => edu.enabled) || education.preUniversityEnabled || education.sslcEnabled) && (<>
            <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>EDUCATION</div>
              <div style={{ height: 1, background: '#cfcfcf', marginTop: 0, marginBottom: 0, width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: 0 }}>
              {/* Higher Education (BE/Bachelor etc.) */}
              {education.higherEducation.filter(edu => edu.enabled).sort((a, b) => educationPriority(a.degree) - educationPriority(b.degree)).map((edu, i) => (
                <div key={`he-${i}`} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>{edu.instituteName}</div>
                    <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear)} - Present` : formatResumeEducationDateRange(edu)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>
                    {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}{edu.universityBoard ? ` — ${edu.universityBoard}` : ''}
                  </div>
                  {edu.resultFormat && edu.result && (<div style={{ marginTop: 6, color: '#2b2a2a' }}>{edu.resultFormat}: {edu.result}</div>)}
                </div>
              ))}

              {/* Pre University (12th) */}
              {education.preUniversityEnabled && education.preUniversity && (education.preUniversity.instituteName || education.preUniversity.yearOfPassing) && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>{education.preUniversity.instituteName || 'Pre University'}</div>
                  <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>{formatResumeEducationDateRange(education.preUniversity)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>
                    Pre University (12th Standard){education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}{education.preUniversity.boardType ? ` — ${education.preUniversity.boardType}` : ''}
                  </div>
                  {education.preUniversity.resultFormat && education.preUniversity.result && (<div style={{ marginTop: 6, color: '#2b2a2a' }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</div>)}
                </div>
              )}

              {/* SSLC (10th) */}
              {education.sslcEnabled && education.sslc && (education.sslc.instituteName || education.sslc.yearOfPassing) && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>{education.sslc.instituteName || 'SSLC'}</div>
                  <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>{formatResumeEducationDateRange(education.sslc)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>
                    SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}
                  </div>
                  {education.sslc.resultFormat && education.sslc.result && (<div style={{ marginTop: 6, color: '#2b2a2a' }}>{education.sslc.resultFormat}: {education.sslc.result}</div>)}
                </div>
              )}
            </div>
          </>)}

          {skillsLinks.skills.some(s => s.enabled && s.skillName) && (<>
            <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>SKILLS</div>
              <div style={{ height: 1, background: '#cfcfcf', marginTop: 0, marginBottom: 0, width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: 0 }}>
              <div style={{ color: '#2b2a2a' }}>{skillsLinks.skills.filter(s => s.enabled && s.skillName).map(s => s.skillName).join(', ')}</div>
            </div>
          </>)}

          {certifications.some(c => c.enabled && (c.certificateTitle || c.providedBy)) && (<>
            <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>CERTIFICATIONS</div>
              <div style={{ height: 1, background: '#cfcfcf', marginTop: 0, marginBottom: 0, width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#2b2a2a' }}>
                {certifications.filter(c => c.enabled && (c.certificateTitle || c.providedBy)).map((c, i) => (
                  <div key={i} style={{ lineHeight: 1.4 }}>
                    {c.certificateTitle && <div style={{ fontWeight: 700, color: '#111827' }}>{c.certificateTitle}</div>}
                    {c.providedBy && <div style={{ fontSize: 11, color: '#2b2a2a' }}>Provided by: {c.providedBy}</div>}
                  </div>
                ))}
              </div>
            </div>
          </>)}
        </section>
      </div>
    </div>
  );
};

export default Template13Display;
