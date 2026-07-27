import React from 'react';
import DOMPurify from 'dompurify';

import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

interface Template14DisplayProps {
  data: ResumeData
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

const formatMonthYearNumeric = (s?: string) => {
  if (!s) return '';
  try {
    const str = String(s).trim();
    const ymd = str.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
    if (ymd) {
      const year = ymd[1];
      const mm = ymd[2];
      return `${mm}/${year}`;
    }
    const mY = str.match(/^(\d{2})\/(\d{4})$/);
    if (mY) {
      return `${mY[1]}/${mY[2]}`;
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

const Template14Display: React.FC<Template14DisplayProps> = ({
  data,
  fontFamily = "Times New Roman, serif",
  primaryColor = "#000000",
}) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  // Use the separate jobRole if set by the user; otherwise fall back to first work experience jobTitle
  const profession = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';

  return (
    <div
      style={{
        width: '210mm',
        minHeight: '297mm',
        fontFamily: fontFamily,
        background: '#fff',
      }}
    >      <div style={{ padding: '28px 36px 8px 36px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ margin: 0, marginBottom: 6, fontSize: 30, color: primaryColor, fontWeight: 800, lineHeight: 1 }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</h1>
          {profession && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{profession}</div>}
          <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280' }}>
            {(() => {
              const contactParts = [personal.address, personal.email, personal.mobileNumber].filter(Boolean);
              const links = skillsLinks && (skillsLinks as any).links;
              const linkedin = links?.linkedinEnabled !== false && (links?.linkedinProfile || (personal as any).linkedinProfile);
              const github = links?.githubEnabled !== false && (links?.githubProfile || (personal as any).githubProfile);
              const portfolio = links?.portfolioEnabled && links?.portfolioUrl;
              const extraLinks = [linkedin, github, portfolio].filter(Boolean);
              return (
                <>
                  <span>{contactParts.join(' | ')}</span>
                  {extraLinks.length > 0 && <span> | </span>}
                  {linkedin && <a href={links?.linkedinProfile || (personal as any).linkedinProfile} target="_blank" rel="noreferrer" style={{ color: '#0a66c2', textDecoration: 'none' }}>{linkedin}</a>}
                  {linkedin && (github || portfolio) && <span> | </span>}
                  {github && <a href={links?.githubProfile || (personal as any).githubProfile} target="_blank" rel="noreferrer" style={{ color: '#111', textDecoration: 'none' }}>{github}</a>}
                  {github && portfolio && <span> | </span>}
                  {portfolio && <a href={links?.portfolioUrl} target="_blank" rel="noreferrer" style={{ color: '#111', textDecoration: 'none' }}>{portfolio}</a>}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 36px 36px 36px' }}>
        <section style={{ display: 'block', gap: '0 16px' }}>

          {experience.workExperiences.some(exp => exp.enabled) && (<>
            <div style={{ marginTop: 16 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Work Experience</div>
              <div style={{ height: 1.5, background: '#999', marginTop: 4, width: '100%' }} />
            </div>

            <div style={{ marginTop: 8 }}>
              {experience.workExperiences.filter(e => e.enabled).map((w, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{w.jobTitle} <span style={{ fontWeight: 600, color: '#111' }}>— {w.companyName}, {w.location || ''}</span></div>
                    <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>{formatMonthYearNumeric(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYearNumeric(w.endDate)}</div>
                  </div>
                  {w.description && (
                    <div style={{ marginTop: 6, color: '#2b2a2a' }}>
                      <div
                        style={{ fontSize: '10px', color: '#2b2a2a', lineHeight: '1.4' }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(w.description || '') }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>)}

          {projects.some(p => p.enabled) && (<>
            <div style={{ marginTop: 16 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Projects</div>
              <div style={{ height: 1.5, background: '#999', marginTop: 4, width: '100%' }} />
            </div>

            <div style={{ marginTop: 8 }}>
              {projects && projects.filter(p => p.enabled).map((p, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.projectTitle}</div>
                    <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>{formatMonthYearNumeric(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYearNumeric(p.endDate)}</div>
                  </div>
                  {p.description && (
                    <div style={{ marginTop: 6, color: '#2b2a2a' }}>
                      <div
                        style={{ fontSize: '10px', color: '#2b2a2a', lineHeight: '1.4' }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.description || '') }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>)}

          {(education.higherEducation.some(edu => edu.enabled) || education.preUniversityEnabled || education.sslcEnabled) && (<>
            <div style={{ marginTop: 16 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Education</div>
              <div style={{ height: 1.5, background: '#999', marginTop: 4, width: '100%' }} />
            </div>

            <div style={{ marginTop: 8 }}>
              {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu, i) => (
                <div key={`he-${i}`} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{edu.instituteName}</div>
                    <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear)} - Present` : formatResumeEducationDateRange(edu)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</div>
                  {edu.resultFormat && edu.result && (<div style={{ marginTop: 6, color: '#2b2a2a' }}>{edu.resultFormat}: {edu.result}</div>)}
                </div>
              ))}

              {education.preUniversityEnabled && education.preUniversity && (education.preUniversity.instituteName || education.preUniversity.yearOfPassing) && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{education.preUniversity.instituteName || 'Pre University'}</div>
                  <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>{formatResumeEducationDateRange(education.preUniversity)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Pre University (12th Standard)</div>
                  {education.preUniversity.resultFormat && education.preUniversity.result && (<div style={{ marginTop: 6, color: '#2b2a2a' }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</div>)}
                </div>
              )}

              {education.sslcEnabled && education.sslc && (education.sslc.instituteName || education.sslc.yearOfPassing) && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{education.sslc.instituteName || 'SSLC'}</div>
                  <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>{formatResumeEducationDateRange(education.sslc)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>SSLC (10th Standard)</div>
                  {education.sslc.resultFormat && education.sslc.result && (<div style={{ marginTop: 6, color: '#2b2a2a' }}>{education.sslc.resultFormat}: {education.sslc.result}</div>)}
                </div>
              )}
            </div>
          </>)}

          {skillsLinks.skills.some(s => s.enabled && s.skillName) && (<>
            <div style={{ marginTop: 16 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Skills</div>
              <div style={{ height: 1.5, background: '#999', marginTop: 4, width: '100%' }} />
            </div>
            <div style={{ marginTop: 8, color: '#2b2a2a' }}>{skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => <span key={i} style={{ marginRight: 6 }}>{s.skillName}{i < skillsLinks.skills.filter(s => s.enabled && s.skillName).length - 1 ? ',' : ''}</span>)}</div>
          </>)}

          {certifications.some(c => c.enabled && (c.certificateTitle || c.providedBy)) && (<>
            <div style={{ marginTop: 16 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.5, color: primaryColor, fontWeight: 700 }}>Certifications</div>
              <div style={{ height: 1.5, background: '#999', marginTop: 4, width: '100%' }} />
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, color: '#2b2a2a' }}>
              {certifications.filter(c => c.enabled && (c.certificateTitle || c.providedBy)).map((c, i) => (
                <div key={i} style={{ lineHeight: 1.4 }}>
                  {c.certificateTitle && <div style={{ fontWeight: 700, color: '#111827' }}>{c.certificateTitle}</div>}
                  {c.providedBy && <div style={{ fontSize: 11, color: '#2b2a2a' }}>Provided by: {c.providedBy}</div>}
                </div>
              ))}
            </div>
          </>)}

        </section>
      </div>
    </div>
  );
};

export default Template14Display;
