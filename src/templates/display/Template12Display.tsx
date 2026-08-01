import React from 'react';
import DOMPurify from 'dompurify';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

interface Template12DisplayProps {
  data: ResumeData;
  fontFamily?: string;
  primaryColor?: string;
}

const Template12Display: React.FC<Template12DisplayProps> = ({
  data,
  fontFamily = "Times New Roman, serif",
  primaryColor = "#000000",
}) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;

  const hasEducation = education.higherEducation.some(edu => edu.enabled) || (education.preUniversityEnabled && education.preUniversity.instituteName) || (education.sslcEnabled && education.sslc.instituteName);
  const hasSkills = skillsLinks.skills.some(s => s.enabled && s.skillName);
  const hasCerts = certifications.some(c => c.enabled && c.certificateTitle);

  const formatMonthYear = (s?: string) => {
    if (!s) return '';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    try {
      const str = String(s).trim();
      const ymdMatch = str.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
      if (ymdMatch) {
        const year = ymdMatch[1];
        const mm = parseInt(ymdMatch[2], 10);
        if (!isNaN(mm) && mm >= 1 && mm <= 12) return `${months[mm - 1]} ${year}`;
        return `${year}`;
      }
      const mYMatch = str.match(/^(\d{2})\/(\d{4})$/);
      if (mYMatch) {
        const mm = parseInt(mYMatch[1], 10);
        const year = mYMatch[2];
        if (!isNaN(mm) && mm >= 1 && mm <= 12) return `${months[mm - 1]} ${year}`;
        return `${year}`;
      }
    } catch (e) { }
    return String(s);
  };

  const htmlToLines = (s?: string) => {
    if (!s) return [] as string[];
    try {
      const text = String(s)
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<br\s*\/?>(?:\s*)/gi, '\n')
        .replace(/<ul[^>]*>/gi, '\n')
        .replace(/<ol[^>]*>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<span[^>]*>/gi, '')
        .replace(/<\/span>/gi, '')
        .replace(/<div[^>]*>/gi, '')
        .replace(/<\/div>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      return text.split(/\n|\r\n/).map(l => l.trim()).filter(Boolean);
    } catch (e) {
      return [String(s)];
    }
  };

  const hasListTags = (html?: string) => {
    if (!html) return false;
    return /<(ul|ol|li)[\s\/>]/i.test(html) || html.includes('•');
  };

  const renderDescription = (html?: string) => {
    if (!html) return null;

    // If no list tags, render as plain paragraph
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
        <div style={{ marginTop: 6, color: '#2b2a2a', lineHeight: 1.5 }}>
          {plainText}
        </div>
      );
    }

    // Has list tags - render as bullets
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

  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: fontFamily, background: '#fff' }}>
      <div style={{ padding: '20px 36px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              color: primaryColor,
            }}
          >
            {personal.firstName} {(personal.middleName || '')} {personal.lastName}
          </h1>
          <div style={{ marginTop: 8, fontSize: 11, color: '#2b2a2a' }}>{[personal.email, personal.mobileNumber, personal.address].filter(Boolean).join(' | ')}</div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '18px 0' }} />

        {personal.aboutCareerObjective && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', padding: '0 8px', marginBottom: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Career Objective</div>
              <div style={{ color: '#2b2a2a', fontSize: 11, lineHeight: 1.5 }}>{htmlToLines(personal.aboutCareerObjective).join(' ')}</div>
            </div>
            {experience.workExperiences.some(exp => exp.enabled) && <hr style={{ border: 'none', borderTop: '1px solid #aaa', margin: '18px 0' }} />}
          </>
        )}

        {experience.workExperiences.some(exp => exp.enabled) && (<>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', padding: '0 8px' }}>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Work Experience</div>
            <div>
              {experience.workExperiences.filter(e => e.enabled).map((w, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: '#111827', flex: 1, minWidth: 0, paddingRight: 12 }}>{w.jobTitle} — <span style={{ fontWeight: 700 }}>{w.companyName}</span></div>
                    <div style={{ color: '#111827', fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</div>
                  </div>
                  {w.description && renderDescription(w.description)}
                </div>
              ))}
              {/* divider after work experience */}
            </div>
          </div>

          {/* Divider after Work Experience, before Projects */}
          {projects.some(p => p.enabled) && <hr style={{ border: 'none', borderTop: '1px solid #aaa', margin: '18px 0' }} />}
        </>)}

        {/* Projects Section */}
        {projects.some(p => p.enabled) && (<>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', padding: '0 8px', marginTop: 8 }}>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Projects</div>
            <div>
              {projects && projects.filter(p => p.enabled).map((p, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: '#111827', flex: 1, minWidth: 0, paddingRight: 12 }}>{p.projectTitle}</div>
                    <div style={{ color: '#111827', fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</div>
                  </div>
                  {p.description && renderDescription(p.description)}
                </div>
              ))}
            </div>
          </div>
        </>)}

        {hasEducation && (<>
          <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '12px 0', width: '100%' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', padding: '0 8px' }}>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Education</div>
            <div>
              {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: '#111827', flex: 1, minWidth: 0, paddingRight: 12 }}>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</div>
                    <div style={{ color: '#111827', fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear)} - Present` : formatResumeEducationDateRange(edu)}</div>
                  </div>
                  <div style={{ color: '#111827', fontSize: 11, marginTop: 4 }}>{edu.instituteName}</div>
                  {edu.resultFormat && edu.result && (
                    <div style={{ fontSize: 11, color: '#2b2a2a', marginTop: 4 }}>{edu.resultFormat}: {edu.result}</div>
                  )}
                </div>
              ))}

              {education.preUniversityEnabled && education.preUniversity.instituteName && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: '#111827', flex: 1, minWidth: 0, paddingRight: 12 }}>PUC{education.preUniversity.subjectStream ? ` in ${education.preUniversity.subjectStream}` : ''}</div>
                    <div style={{ color: '#111827', fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>{formatResumeEducationDateRange(education.preUniversity)}</div>
                  </div>
                  <div style={{ color: '#111827', fontSize: 11, marginTop: 4 }}>{education.preUniversity.instituteName}{education.preUniversity.boardType ? `, ${education.preUniversity.boardType}` : ''}</div>
                  {education.preUniversity.resultFormat && education.preUniversity.result && (
                    <div style={{ fontSize: 11, color: '#2b2a2a', marginTop: 4 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</div>
                  )}
                </div>
              )}

              {education.sslcEnabled && education.sslc.instituteName && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: '#111827', flex: 1, minWidth: 0, paddingRight: 12 }}>SSLC</div>
                    <div style={{ color: '#111827', fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>{formatResumeEducationDateRange(education.sslc)}</div>
                  </div>
                  <div style={{ color: '#111827', fontSize: 11, marginTop: 4 }}>{education.sslc.instituteName}{education.sslc.boardType ? `, ${education.sslc.boardType}` : ''}</div>
                  {education.sslc.resultFormat && education.sslc.result && (
                    <div style={{ fontSize: 11, color: '#2b2a2a', marginTop: 4 }}>{education.sslc.resultFormat}: {education.sslc.result}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>)}
        {skillsLinks.linksEnabled && (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '12px 0', width: '100%' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', padding: '0 8px' }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Links</div>
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#2b2a2a', fontSize: 11 }}>
                  {skillsLinks.links?.linkedinEnabled && skillsLinks.links?.linkedinProfile && (
                    <a href={skillsLinks.links.linkedinProfile} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>LinkedIn: {skillsLinks.links.linkedinProfile}</a>
                  )}
                  {skillsLinks.links?.githubEnabled && skillsLinks.links?.githubProfile && (
                    <a href={skillsLinks.links.githubProfile} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>GitHub: {skillsLinks.links.githubProfile}</a>
                  )}
                  {skillsLinks.links?.portfolioEnabled && skillsLinks.links?.portfolioUrl && (
                    <a href={skillsLinks.links.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Portfolio: {skillsLinks.links.portfolioUrl}</a>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {hasSkills && (<>
          <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '12px 0', width: '100%' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', padding: '0 8px' }}>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Skills</div>
            <div>
              <div style={{ color: '#2b2a2a' }}>{skillsLinks.skills.filter(s => s.enabled && s.skillName).map(s => s.skillName).join(', ')}</div>
            </div>
          </div>
        </>)}

        {hasCerts && (<>
          <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '12px 0', width: '100%' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', padding: '0 8px' }}>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Certifications</div>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#2b2a2a' }}>
                {certifications.filter(c => c.enabled && (c.certificateTitle || c.providedBy)).map((c, i) => (
                  <div key={i} style={{ lineHeight: 1.4 }}>
                    {c.certificateTitle && <div style={{ fontWeight: 700, color: '#111827' }}>{c.certificateTitle}</div>}
                    {c.providedBy && <div style={{ fontSize: 11, color: '#2b2a2a' }}>Provided by: {c.providedBy}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>)}

      </div>
    </div>
  );
};

export default Template12Display;
