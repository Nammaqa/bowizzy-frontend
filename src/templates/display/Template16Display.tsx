import React from 'react';
import DOMPurify from 'dompurify';

import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

interface Template16DisplayProps {
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
  const start = formatYear(edu?.startYear || edu?.startDate || '');
  const end = formatYear(edu?.endYear || edu?.yearOfPassing || '');
  if (start && end) return `${start} — ${end}`;
  return start || end || '';
};

const getStarsByLevel = (skillLevel?: string): string => {
  const level = String(skillLevel || '').toLowerCase().trim();
  if (level === 'beginner') return '*';
  if (level === 'intermediate') return '**';
  if (level === 'advanced') return '****';
  if (level === 'expert') return '*****';
  return '*****';
};

const Template16Display: React.FC<Template16DisplayProps> = ({
  data,
  fontFamily = 'Times New Roman, serif',
  primaryColor = '#000000',
}) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const role = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';

  const contactParts = [personal.address, personal.email, personal.mobileNumber].filter(Boolean);

  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily, background: '#fff' }}>      <div style={{ padding: '24px 36px 8px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, color: primaryColor, fontFamily, fontWeight: 700 }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</h1>
        {role && <div style={{ fontSize: 11, color: primaryColor, marginTop: 4, fontWeight: 700 }}>{role}</div>}
        <div style={{ marginTop: 6, fontSize: 11, color: '#000' }}>
          {personal.address && <div>{String(personal.address)}</div>}
          {personal.mobileNumber && <div>{personal.mobileNumber}</div>}
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, color: '#000' }}>
        {personal.email && <div>{personal.email}</div>}
        {skillsLinks.linksEnabled && (
          <>
            {skillsLinks.links?.linkedinEnabled && skillsLinks.links?.linkedinProfile && (
              <div style={{ marginTop: 2 }}>{skillsLinks.links.linkedinProfile}</div>
            )}
            {skillsLinks.links?.githubEnabled && skillsLinks.links?.githubProfile && (
              <div style={{ marginTop: 2 }}>{skillsLinks.links.githubProfile}</div>
            )}
            {skillsLinks.links?.portfolioEnabled && skillsLinks.links?.portfolioUrl && (
              <div style={{ marginTop: 2 }}>{skillsLinks.links.portfolioUrl}</div>
            )}
          </>
        )}
      </div>
    </div>


      <div style={{ padding: '0 36px 36px 36px' }}>
        <section style={{ display: 'block' }}>

          <div style={{ marginTop: 12 }}>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Summary</div>
            <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
          </div>

          <div style={{ marginTop: 6 }}>
            {personal.aboutCareerObjective && (
              <>
                {htmlToLines(personal.aboutCareerObjective).map((ln, idx) => <div key={idx} style={{ color: '#444', lineHeight: 1.4, marginTop: idx ? 4 : 0 }}>{ln}</div>)}
              </>
            )}
          </div>

          {experience.workExperiences.some(exp => exp.enabled) && (<>
            <div style={{ marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Experience</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
            </div>

            <div style={{ marginTop: 8 }}>
              {experience.workExperiences.filter(e => e.enabled).map((w, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>{w.jobTitle} <span style={{ fontWeight: 600, color: '#000' }}>— {w.companyName}{w.location ? `, ${w.location}` : ''}</span></div>
                    <div style={{ color: '#000' }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</div>
                  </div>
                  {w.description && (
                    <div style={{ marginTop: 4, color: '#444', paddingLeft: 10 }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(w.description || '') }}
                    />
                  )}
                </div>
              ))}
            </div>
          </>)}

          {/* Projects - moved directly after Experience */}
          {projects.filter((p: any) => p.enabled).length > 0 && (
            <>
              <div style={{ marginTop: 12 }}>
                <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Projects</div>
                <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
              </div>
              <div style={{ marginTop: 8 }}>
                {projects.filter((p: any) => p.enabled).map((p: any, i: number) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 700 }}>{p.projectTitle}</div>
                      <div style={{ color: '#000' }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</div>
                    </div>
                    {p.rolesResponsibilities && (
                      <div style={{ marginTop: 2, color: '#444', paddingLeft: 10 }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.rolesResponsibilities || '') }}
                      />
                    )}
                    {p.description && (
                      <div style={{ marginTop: 4, color: '#444', paddingLeft: 10 }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.description || '') }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

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
                    <div style={{ color: '#000' }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear)} - Present` : formatResumeEducationDateRange(edu)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#000' }}>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</div>
                  {edu.resultFormat && edu.result ? (
                    <div style={{ marginTop: 6, color: '#000' }}>{edu.resultFormat}: {edu.result}</div>
                  ) : null}
                </div>
              ))}

              {education.preUniversityEnabled && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>{education.preUniversity.instituteName || 'Pre University'}</div>
                  <div style={{ color: '#000' }}>{formatResumeEducationDateRange(education.preUniversity)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#000', marginTop: 4 }}>Pre University (12th Standard){education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}</div>
                  {education.preUniversity.resultFormat && education.preUniversity.result && (<div style={{ marginTop: 6, color: '#000' }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</div>)}
                </div>
              )}

              {education.sslcEnabled && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>{education.sslc.instituteName || 'SSLC'}</div>
                  <div style={{ color: '#000' }}>{formatResumeEducationDateRange(education.sslc)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#000', marginTop: 4 }}>SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}</div>
                  {education.sslc.resultFormat && education.sslc.result && (<div style={{ marginTop: 6, color: '#000' }}>{education.sslc.resultFormat}: {education.sslc.result}</div>)}
                </div>
              )}
            </div>
          </>)}

          {skillsLinks.skills.some(s => s.enabled && s.skillName) && (<>
            <div style={{ marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Skills</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
            </div>

            <div style={{ marginTop: 6 }}>{skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}><div>• {s.skillName}</div><div style={{ color: '#111827', fontSize: 12, minWidth: 60, textAlign: 'right' }}>{getStarsByLevel(s.skillLevel)}</div></div>)}</div>
          </>)}

          <div style={{ marginTop: 12 }}>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Languages</div>
            <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
          </div>
          <div style={{ marginTop: 6 }}>{((personal as any).languagesKnown || (personal as any).languages || []).map((l: string, i: number) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <div>• {l}</div>
            </div>
          ))}</div>

          {certifications.some(c => c.enabled && c.certificateTitle) && (<>
            <div style={{ marginTop: 12 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Achievements / Certifications</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 4, width: '100%' }} />
            </div>
            <div style={{ marginTop: 6 }}>{certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => <div key={i} style={{ marginBottom: 6 }}>{c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}</div>)}</div>
          </>)}



        </section>
      </div>
    </div>
  );
};

export default Template16Display;
