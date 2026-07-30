import React from 'react';
import DOMPurify from 'dompurify';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

interface Template19DisplayProps {
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
      .replace(/<ul[^>]*>|<ol[^>]*>/gi, '\n')
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

const Template19Display: React.FC<Template19DisplayProps> = ({
  data,
  fontFamily = 'Georgia, serif',
  primaryColor = '#111827',
}) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const role = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';
  const contactLine = [personal.email, personal.mobileNumber, (skillsLinks && skillsLinks.links && skillsLinks.links.linkedinProfile) || ''].filter(Boolean).join(' | ');
  const hasPreUniversity = Boolean(education.preUniversityEnabled && (education.preUniversity?.instituteName || education.preUniversity?.subjectStream || education.preUniversity?.boardType || education.preUniversity?.yearOfPassing || education.preUniversity?.result));
  const hasSSLC = Boolean(education.sslcEnabled && (education.sslc?.instituteName || education.sslc?.boardType || education.sslc?.yearOfPassing || education.sslc?.result));

  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: fontFamily, background: '#fff', padding: 24, boxSizing: 'border-box' }}>
      <div style={{ background: '#f3f4f6', padding: '18px 24px', marginBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontFamily: fontFamily, letterSpacing: 1, color: primaryColor }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</h1>
            {role && <div style={{ marginTop: 4, color: '#6b7280', fontSize: 12, fontWeight: 700 }}>{role}</div>}
          </div>

          <div style={{ textAlign: 'right', color: '#374151', fontSize: 12 }}>
            {personal.email && <div><a href={`mailto:${personal.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{personal.email}</a></div>}
            {personal.mobileNumber && <div style={{ marginTop: 6 }}>{personal.mobileNumber}</div>}
            {personal.address && <div style={{ marginTop: 6 }}>{String(personal.address)}</div>}
            {personal.dateOfBirth && <div style={{ marginTop: 6 }}>{personal.dateOfBirth}</div>}
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 12 }}>
        <section style={{ textAlign: 'center', marginTop: 0 }}>
          <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700, marginBottom: 6 }}>SUMMARY</div>
          <div style={{ height: 1, background: '#999', width: '100%' }} />
          <div style={{ marginTop: 12, color: '#444', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto', textAlign: 'left' }}>{personal.aboutCareerObjective && <div>{DOMPurify.sanitize(personal.aboutCareerObjective).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()}</div>}</div>
        </section>

        <div style={{ display: 'flex', marginTop: 18, gap: 24 }}>
          {/* Left sidebar (fixed width) */}
          <aside style={{ width: 260, paddingRight: 12 }}>
            {(skillsLinks.skills || []).some((s: any) => s.enabled && s.skillName) && (<>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Skills</div>
              <div style={{ height: 1, background: '#999', marginTop: 6, width: '80%' }} />
              <ul style={{ paddingLeft: 20, marginTop: 8, listStyleType: 'disc' }}>
                {(skillsLinks.skills || []).filter((s: any) => s.enabled && s.skillName).map((s: any, i: number) => (<li key={i} style={{ marginBottom: 6 }}>{s.skillName}</li>))}
              </ul>
            </>)}

            {(education.higherEducation.some(edu => edu.enabled) || hasPreUniversity || hasSSLC) && (
              <div style={{ marginTop: 18 }}>
                <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Education</div>
                <div style={{ height: 1, background: '#999', marginTop: 6, width: '80%' }} />
                <div style={{ marginTop: 8 }}>
                  {[...education.higherEducation].filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400 }}>{edu.instituteName}</div>
                      <div style={{ color: '#151616', marginTop: 4 }}>{edu.degree}{edu.fieldOfStudy ? ` (${edu.fieldOfStudy}) — ${edu.universityBoard}` : ''}</div>
                      <div style={{ color: '#6b7280', marginTop: 4, fontSize: 11 }}>
                        {edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}
                      </div>
                      {(edu.resultFormat && edu.result) && <div style={{ color: '#151616', marginTop: 4 }}>{edu.resultFormat}: {edu.result}</div>}
                    </div>
                  ))}
                  {hasPreUniversity && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400 }}>{education.preUniversity.instituteName || 'Pre University'}</div>
                      <div style={{ color: '#151616', marginTop: 4 }}>Pre University (12th Standard){education.preUniversity.boardType ? ` — ${education.preUniversity.boardType}` : ''}{education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}</div>
                      <div style={{ color: '#6b7280', marginTop: 4, fontSize: 11 }}>
                        {formatResumeEducationDateRange(education.preUniversity)}
                      </div>
                      {education.preUniversity.resultFormat && education.preUniversity.result && <div style={{ color: '#151616', marginTop: 4 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</div>}
                    </div>
                  )}

                  {hasSSLC && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400 }}>{education.sslc.instituteName || 'SSLC'}</div>
                      <div style={{ color: '#151616', marginTop: 4 }}>SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}</div>
                      <div style={{ color: '#6b7280', marginTop: 4, fontSize: 11 }}>
                        {formatResumeEducationDateRange(education.sslc)}
                      </div>
                      {education.sslc.resultFormat && education.sslc.result && <div style={{ color: '#151616', marginTop: 4 }}>{education.sslc.resultFormat}: {education.sslc.result}</div>}
                    </div>
                  )}              </div>
              </div>
            )}

            {(((personal as any).languagesKnown || (personal as any).languages || [])).filter((l: string) => l && l.trim()).length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Language</div>
                <div style={{ height: 1, background: '#999', marginTop: 6, width: '60%' }} />
                <div style={{ marginTop: 8 }}>
                  {(((personal as any).languagesKnown || (personal as any).languages || [])).filter((l: string) => l && l.trim()).map((l: string, i: number) => (<div key={i} style={{ marginBottom: 6 }}>• {l}</div>))}
                </div>
              </div>
            )}

            {(certifications || []).some((c: any) => c.enabled && c.certificateTitle) && (
              <div style={{ marginTop: 18 }}>
                <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Certification</div>
                <div style={{ height: 1, background: '#999', marginTop: 6, width: '80%' }} />
                <div style={{ marginTop: 8 }}>
                  {(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).map((c: any, i: number) => (<div key={i} style={{ marginBottom: 6 }}>• {c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}</div>))}
                </div>
              </div>
            )}

          </aside>

          {/* Right main content */}
          <div style={{ flex: 1 }}>
            {experience.workExperiences.some(exp => exp.enabled) && (<>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Professional Experience</div>
              <div style={{ height: 1, background: '#999', marginTop: 6, width: '100%' }} />

              <div style={{ marginTop: 8 }}>
                {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 800 }}>{w.jobTitle}</div>
                      <div style={{ color: '#000', fontWeight: 400 }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</div>
                    </div>
                    <div style={{ color: '#000', marginTop: 6, fontFamily: 'Arial, sans-serif', fontWeight: 400 }}>{w.companyName}{w.location ? ` — ${w.location}` : ''}</div>
                    {w.description && htmlToLines(w.description).length > 0 && (
                      <div style={{ marginTop: 6, paddingLeft: 12 }}>
                        {htmlToLines(w.description).map((ln, idx) => <div key={idx} style={{ marginTop: 6 }}>• {ln}</div>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>)}

            {(projects || []).some((p: any) => p.enabled) && (
              <div style={{ marginTop: 24 }}>
                <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Projects</div>
                <div style={{ height: 1, background: '#999', marginTop: 6, width: '100%' }} />
                <div style={{ marginTop: 8 }}>
                  {(projects || []).filter((p: any) => p.enabled).map((p: any, i: number) => (
                    <div key={i} style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 800 }}>{p.projectTitle}</div>
                        <div style={{ color: '#000', fontWeight: 400 }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</div>
                      </div>
                      {p.description && htmlToLines(p.description).length > 0 && (
                        <div style={{ marginTop: 6, paddingLeft: 12 }}>
                          {htmlToLines(p.description).map((ln: any, idx: number) => (
                            <div key={idx} style={{ marginTop: 6 }}>• {ln}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Template19Display;
