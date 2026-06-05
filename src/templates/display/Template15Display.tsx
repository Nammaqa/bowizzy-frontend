import React from 'react';
import DOMPurify from 'dompurify';

import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

interface Template15DisplayProps {
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

const formatEducationDateRange = (edu: any) => {
  const start = formatMonthYear(edu?.startYear || edu?.startDate || '');
  const end = formatMonthYear(edu?.endYear || edu?.yearOfPassing || '');
  if (start && end) return `${start} — ${end}`;
  return start || end || '';
};

const Template15Display: React.FC<Template15DisplayProps> = ({
  data,
  fontFamily = "Times New Roman, serif",
  primaryColor = "#000000",
}) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const role = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';

  const mobile = personal.mobileNumber;
  const email = personal.email;
  const linksEnabled = skillsLinks?.linksEnabled ?? true;
  const linkedin = linksEnabled && (skillsLinks?.links?.linkedinEnabled ?? true) ? ((skillsLinks as any).links?.linkedinProfile || (personal as any).linkedinProfile) : null;
  const github = linksEnabled && (skillsLinks?.links?.githubEnabled ?? true) ? ((skillsLinks as any).links?.githubProfile || (personal as any).githubProfile) : null;
  const portfolio = linksEnabled && (skillsLinks?.links?.portfolioEnabled ?? true) ? (skillsLinks as any).links?.portfolioUrl : null;

  // Extract a short handle to display for profile URLs (e.g., username from URL)
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

  // Build contact nodes in the required order: phone | email | linkedin | github
  const contactNodes: any[] = [];
  if (mobile) contactNodes.push(mobile);
  if (email) contactNodes.push(email);
  if (linkedin) contactNodes.push(<a href={(skillsLinks as any).links?.linkedinProfile || (personal as any).linkedinProfile} target="_blank" rel="noreferrer" style={{ color: '#0a66c2', textDecoration: 'none' }}>{extractHandle(linkedin)}</a>);
  if (github) contactNodes.push(<a href={(skillsLinks as any).links?.githubProfile || (personal as any).githubProfile} target="_blank" rel="noreferrer" style={{ color: '#111', textDecoration: 'none' }}>{extractHandle(github)}</a>);
  if (portfolio) contactNodes.push(<a href={(skillsLinks as any).links?.portfolioUrl} target="_blank" rel="noreferrer" style={{ color: '#000', textDecoration: 'none' }}>{extractHandle(portfolio)}</a>);

  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: fontFamily, background: '#fff' }}>
      <div style={{ padding: '28px 36px 8px 36px', textAlign: 'center' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            color: primaryColor,
          }}
        >
          {personal.firstName} {(personal.middleName || '')} {personal.lastName}
        </h1>   {role && <div style={{ fontSize: 12, color: primaryColor, marginTop: 6, fontWeight: 600 }}>{role}</div>}
        <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280' }}>{contactNodes.map((c, i) => <React.Fragment key={i}>{i > 0 && ' | '}{c}</React.Fragment>)}</div>
      </div>

      <div style={{ padding: '0 36px 36px 36px' }}>
        <section style={{ display: 'block' }}>

          <div style={{ marginTop: 12 }}>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>OBJECTIVE</div>
            <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
          </div>

          <div style={{ marginTop: 6 }}>
            {personal.aboutCareerObjective && (<div style={{ color: '#444', lineHeight: 1.4 }}>{DOMPurify.sanitize(personal.aboutCareerObjective).replace(/<[^>]+>/g, '')}</div>)}
          </div>

          {(skillsLinks?.technicalSummary && skillsLinks?.technicalSummaryEnabled) && (<>
            <div style={{ marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>SUMMARY</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
            </div>
            <div style={{ marginTop: 6 }}>
              {skillsLinks?.technicalSummary && skillsLinks?.technicalSummaryEnabled && (<div style={{ color: '#444', lineHeight: 1.4 }}>{DOMPurify.sanitize(skillsLinks.technicalSummary).replace(/<[^>]+>/g, '')}</div>)}
            </div>
          </>)}

          {(education.higherEducation.some(edu => edu.enabled) || education.preUniversityEnabled || education.sslcEnabled) && (<>
            <div style={{ marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Education</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
            </div>

            <div style={{ marginTop: 8 }}>
              {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu, i) => (
                <div key={`he-${i}`} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>{edu.instituteName}</div>
                    <div style={{ fontSize: 12, color: '#101113ff', fontWeight: 700 }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear)} - Present` : formatResumeEducationDateRange(edu)}</div>

                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ''}</div>
                    {edu.resultFormat && edu.result ? (
                      <div style={{ fontWeight: 700, fontSize: 11, color: '#6b7280' }}>{edu.resultFormat}: {edu.result}</div>
                    ) : null}
                  </div>
                  {edu.universityBoard && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{edu.universityBoard}</div>}
                </div>
              ))}

              {education.preUniversityEnabled && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>{education.preUniversity.instituteName || 'Pre University'}</div>
                  <div style={{ fontSize: 12, color: '#101113ff', fontWeight: 700 }}>{formatResumeEducationDateRange(education.preUniversity)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
                    Pre University (12th Standard){education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}
                    {education.preUniversity.resultFormat && education.preUniversity.result && (<div style={{ fontWeight: 700, color: '#6b7280', fontSize: 11 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</div>)}
                  </div>
                </div>
              )}

              {education.sslcEnabled && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>{education.sslc.instituteName || 'SSLC'}</div>
                  <div style={{ fontSize: 11, color: '#101113ff', fontWeight: 700 }}>{formatResumeEducationDateRange(education.sslc)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
                    SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}
                    {education.sslc.resultFormat && education.sslc.result && (<div style={{ fontWeight: 700, color: '#6b7280' }}>{education.sslc.resultFormat}: {education.sslc.result}</div>)}
                  </div>
                </div>
              )}
            </div>
          </>)}

          {skillsLinks.skills.some((s: any) => s.enabled && s.skillName) && (<>
            <div style={{ marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Skills</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
            </div>
            <div style={{ marginTop: 6 }}>
              {(() => {
                const skills = skillsLinks.skills.filter((s: any) => s.enabled && s.skillName).map((s: any) => s.skillName);
                const categories: Record<string, string[]> = {
                  'Programming Languages': [],
                  'Web Development': [],
                  'Databases': [],
                  'Tools': [],
                  'Others': [],
                };
                const langRegex = /(python|java|c\+\+|c#|javascript|typescript|ruby|go|php)/i;
                const webRegex = /(html|css|javascript|react|angular|vue|next|node|express)/i;
                const dbRegex = /(mysql|mongodb|postgres|postgresql|redis|sql)/i;
                const toolsRegex = /(git|docker|jenkins|kubernetes|aws|gcp|azure|terraform|ci|cd)/i;

                skills.forEach(sk => {
                  if (langRegex.test(sk)) categories['Programming Languages'].push(sk);
                  else if (webRegex.test(sk)) categories['Web Development'].push(sk);
                  else if (dbRegex.test(sk)) categories['Databases'].push(sk);
                  else if (toolsRegex.test(sk)) categories['Tools'].push(sk);
                  else categories['Others'].push(sk);
                });

                return Object.entries(categories).map(([cat, items]) => items.length ? (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: primaryColor }}>{cat}</div>
                    <div style={{ marginTop: 4, color: '#444' }}>{items.join(', ')}</div>
                  </div>
                ) : null);
              })()}
            </div>
          </>)}

          {certifications.some(c => c.enabled && c.certificateTitle) && (<>
            <div style={{ marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Certifications</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
            </div>
            <div style={{ marginTop: 6 }}>{certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => <div key={i} style={{ marginBottom: 6, color: '#444' }}>{c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}</div>)}</div>
          </>)}

          {experience.workExperiences.some(exp => exp.enabled) && (<>
            <div style={{ marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>EXPERIENCE</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
            </div>

            <div style={{ marginTop: 8 }}>
              {experience.workExperiences.filter(e => e.enabled).map((w, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  {w.jobTitle ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, color: primaryColor }}>{w.jobTitle}</div>
                        <div style={{ color: '#111827', fontWeight: 700 }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <div style={{ fontSize: 11, color: '#444', fontWeight: 700 }}>{w.companyName}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{w.location}</div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 700 }}>{w.companyName}{w.location ? `, ${w.location}` : ''}</div>
                      <div style={{ color: '#111827', fontWeight: 700 }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</div>
                    </div>
                  )}

                  {w.description && (
                    <div style={{ marginTop: 4, color: '#444', paddingLeft: 10 }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(w.description || '') }}
                    />
                  )}
                </div>
              ))}
            </div>
          </>)}

          {projects.some(p => p.enabled) && (<>
            <div style={{ marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>ACADEMIC Projects</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
            </div>
            <div style={{ marginTop: 8 }}>
              {projects.filter((p: any) => p.enabled).map((p: any, i: number) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>{p.projectTitle}</div>
                    <div style={{ color: '#111827', fontWeight: 700 }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</div>
                  </div>
                  {p.description && (
                    <div style={{ marginTop: 4, color: '#444', paddingLeft: 10 }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.description || '') }}
                    />
                  )}
                  {p.rolesResponsibilities && (
                    <div style={{ marginTop: 4, paddingLeft: 10 }}>
                      {htmlToLines(p.rolesResponsibilities).map((ln: string, idx: number) => (
                        <div key={idx} style={{ marginTop: 2, color: '#444' }}>• {ln}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>)}

        </section>
      </div>
    </div>
  );
};

export default Template15Display;
