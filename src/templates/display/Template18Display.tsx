import React from 'react';
import DOMPurify from 'dompurify';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

interface Template18DisplayProps {
  data: ResumeData
  fontFamily?: string;
  primaryColor?: string;
}

const htmlToLines = (s?: string) => {
  if (!s) return [] as string[];
  try {
    const text = String(s)
      .replace(/<br\s*\/?/gi, '\n')
      .replace(/<\/p>|<\/li>/gi, '\n')
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
    if (ymd) return `${months[parseInt(ymd[2], 10) - 1]} ${ymd[1]}`;
    const mY = str.match(/^(\d{2})\/(\d{4})$/);
    if (mY) return `${months[parseInt(mY[1], 10) - 1]} ${mY[2]}`;
  } catch (e) { }
  return String(s);
};

const formatMonthYearParts = (s?: string) => {
  if (!s) return { month: '', year: '' };
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  try {
    const str = String(s).trim();
    const ymd = str.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
    if (ymd) return { month: months[parseInt(ymd[2], 10) - 1], year: ymd[1] };
    const mY = str.match(/^(\d{2})\/(\d{4})$/);
    if (mY) return { month: months[parseInt(mY[1], 10) - 1], year: mY[2] };
  } catch (e) { }
  // Fallback: attempt to split last number group as year
  const yearMatch = String(s).match(/(\d{4})/);
  if (yearMatch) {
    return { month: String(s).replace(yearMatch[1], '').trim(), year: yearMatch[1] };
  }
  return { month: String(s), year: '' };
};

const formatYear = (s?: string) => {
  if (!s) return '';
  const str = String(s).trim();
  const y = str.match(/(\d{4})/);
  return y ? y[1] : str;
};

const formatEducationDateRange = (edu: any) => {
  const start = formatYear(edu?.startYear || edu?.startDate || '');
  const end = formatYear(edu?.endYear || edu?.yearOfPassing || '');
  if (start && end) return `${start} - ${end}`;
  return start || end || '';
};

const Template18Display: React.FC<Template18DisplayProps> = ({
  data,
  fontFamily = 'Times New Roman, serif',
  primaryColor = '#000000',
}) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const role = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';

  // Helpers for contact formatting
  const extractHandle = (s?: string) => {
    if (!s) return '';
    try {
      if (/^https?:\/\//i.test(s)) {
        const u = new URL(s);
        const path = u.pathname.replace(/\/+$|^\//g, '');
        if (!path) return u.hostname;
        const parts = path.split('/');
        return parts[parts.length - 1];
      }
    } catch (e) { }
    return s;
  };

  const formatMobile = (m?: string) => {
    if (!m) return '';
    const trimmed = String(m).trim();
    if (/^\+/.test(trimmed)) return trimmed;
    if ((personal.country || '').toLowerCase() === 'india') return `+91 ${trimmed}`;
    return trimmed;
  };

  const locationPart = [personal.city, personal.state].filter(Boolean).join(', ') || personal.address || '';
  const links = skillsLinks?.links;
  const linkedinLabel = links?.linkedinEnabled !== false ? extractHandle(links?.linkedinProfile || (personal as any).linkedinProfile) : '';
  const githubLabel = links?.githubEnabled !== false ? extractHandle(links?.githubProfile) : '';
  const portfolioLabel = links?.portfolioEnabled ? links?.portfolioUrl : '';
  const contactLine = [locationPart, personal.email, formatMobile(personal.mobileNumber), linkedinLabel, githubLabel, portfolioLabel].filter(Boolean).join(' | ');

  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: fontFamily, background: '#fff', padding: 24, boxSizing: 'border-box' }}>
      <header style={{ textAlign: 'center', marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 1, color: primaryColor }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</h1>
        {role && <div style={{ marginTop: 6, color: '#000', fontSize: 12, fontWeight: 800 }}>{role}</div>}
        {contactLine && <div style={{ marginTop: 10, color: '#374151', fontSize: 12 }}>{contactLine}</div>}
      </header>

      <main>
        <section style={{ marginTop: 8 }}>
          <div>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Career Objective</div>
            <div style={{ height: 1, background: '#ddd', marginTop: 6, width: '100%' }} />
          </div>
          <div style={{ marginTop: 8, color: '#444' }}>{personal.aboutCareerObjective && <div>{DOMPurify.sanitize(personal.aboutCareerObjective).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ').replace(/ /g, ' ').trim()}</div>}</div>
        </section>

        {experience.workExperiences.some(exp => exp.enabled) && (
          <section style={{ marginTop: 18 }}>
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Work Experience</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 6, width: '100%' }} />
            </div>
            <div style={{ marginTop: 8 }}>
              {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>{w.companyName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Start date */}
                      {(() => {
                        const s = formatMonthYearParts(w.startDate);
                        return (<div style={{ whiteSpace: 'nowrap' }}><span style={{ color: '#000' }}>{s.month}{s.month ? ' ' : ''}</span><span style={{ fontWeight: 400, color: '#000' }}>{s.year}</span></div>);
                      })()}
                      <div style={{ margin: '0 6px', fontWeight: 400, color: '#000' }}>-</div>
                      {/* End date or Present */}
                      {w.currentlyWorking ? (<div style={{ fontWeight: 400, color: '#000' }}>Present</div>) : (() => {
                        const e = formatMonthYearParts(w.endDate);
                        return (<div style={{ whiteSpace: 'nowrap' }}><span style={{ color: '#000' }}>{e.month}{e.month ? ' ' : ''}</span><span style={{ fontWeight: 400, color: '#000' }}>{e.year}</span></div>);
                      })()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <div style={{ color: '#000' }}>{w.jobTitle}</div>
                    <div style={{ color: '#000', fontWeight: 400 }}>{w.location}</div>
                  </div>
                  {w.description && <div style={{ marginTop: 6, paddingLeft: 10 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(w.description || '') }} />}
                </div>
              ))}
            </div>
          </section>
        )}

        {(education.higherEducation.some(edu => edu.enabled) || (education.preUniversityEnabled && education.preUniversity.instituteName) || (education.sslcEnabled && education.sslc.instituteName)) && (
          <section style={{ marginTop: 18 }}>
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Education</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 6, width: '100%' }} />
            </div>
            <div style={{ marginTop: 8 }}>
              {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ color: '#000', marginTop: 4, fontWeight: 800 }}>{edu.instituteName}{edu.universityBoard ? ` - ${edu.universityBoard}` : ''}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <div style={{ color: '#000' }}>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</div>
                    <div style={{ color: '#000', fontWeight: 400 }}>
                      {edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}
                    </div>
                  </div>
                  {edu.resultFormat && edu.result && (<div style={{ marginTop: 4, color: '#444', fontSize: 11 }}>{edu.resultFormat}: {edu.result}</div>)}
                </div>
              ))}

              {education.preUniversityEnabled && education.preUniversity.instituteName && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#000', marginTop: 4, fontWeight: 800 }}>{education.preUniversity.instituteName || 'Pre University'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <div style={{ color: '#000' }}>Pre University (12th Standard){education.preUniversity.boardType ? ` - ${education.preUniversity.boardType}` : ''}{education.preUniversity.subjectStream ? ` (${education.preUniversity.subjectStream})` : ''}</div>
                    <div style={{ color: '#000', fontWeight: 400 }}>{formatResumeEducationDateRange(education.preUniversity)}</div>
                  </div>
                  {education.preUniversity.resultFormat && education.preUniversity.result && (<div style={{ marginTop: 4, color: '#444', fontSize: 11 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</div>)}
                </div>
              )}

              {education.sslcEnabled && education.sslc.instituteName && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#000', marginTop: 4, fontWeight: 800 }}>{education.sslc.instituteName || 'SSLC'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <div style={{ color: '#000' }}>SSLC (10th Standard){education.sslc.boardType ? ` - ${education.sslc.boardType}` : ''}</div>
                    <div style={{ color: '#000', fontWeight: 400 }}>{formatResumeEducationDateRange(education.sslc)}</div>
                  </div>
                  {education.sslc.resultFormat && education.sslc.result && (<div style={{ marginTop: 4, color: '#444', fontSize: 11 }}>{education.sslc.resultFormat}: {education.sslc.result}</div>)}
                </div>
              )}
            </div>
          </section>
        )}

        {(skillsLinks.skills || []).some((s: any) => s.enabled && s.skillName) && (
          <section style={{ marginTop: 18 }}>
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Skills</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 6, width: '100%' }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <ul style={{ paddingLeft: 20, marginTop: 6, color: '#374151', listStyleType: 'disc', listStylePosition: 'outside' }}>
                {(skillsLinks.skills || []).filter((s: any) => s.enabled && s.skillName).map((s: any, i: number) => (<li key={i} style={{ marginBottom: 6, lineHeight: 1.4 }}>{s.skillName}</li>))}
              </ul>
            </div>
          </section>
        )}

        {(certifications || []).some((c: any) => c.enabled && c.certificateTitle) && (
          <section style={{ marginTop: 18 }}>
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Certifications</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 6, width: '100%' }} />
            </div>
            <div style={{ marginTop: 8 }}>
              {(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).map((c: any, i: number) => (
                <div key={i} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#444' }}>•</span>
                    <div style={{ color: '#444', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 100, color: '#000' }}>{c.certificateTitle}</span>
                      {c.providedBy ? ` - ${c.providedBy}` : ''}
                    </div>
                  </div>
                  <div style={{ color: '#000', fontSize: 11, whiteSpace: 'nowrap', marginLeft: 12 }}>{c.date ? String(c.date).match(/(\d{4})/)?.[1] : ''}</div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default Template18Display;
