import React from 'react';
import DOMPurify from 'dompurify';
import { FiPhone, FiMail, FiMapPin, FiGithub, FiLinkedin, FiGlobe, FiExternalLink } from 'react-icons/fi';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

interface Template17DisplayProps {
  data: ResumeData
  fontFamily?: string;
  primaryColor?: string;
}

const htmlToLines = (s?: string) => {
  if (!s) return [] as string[];
  try {
    const text = String(s)
      .replace(/<br\s*\/?>/gi, '\n')
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

const getSkillStars = (level?: string) => {
  const normalizedLevel = String(level || '').toLowerCase().trim();
  switch (normalizedLevel) {
    case 'beginner': return '*';
    case 'intermediate': return '**';
    case 'advanced': return '****';
    case 'expert': return '*****';
    default: return '';
  }
};

const Template17Display: React.FC<Template17DisplayProps> = ({
  data,
  fontFamily = 'Times New Roman, serif',
  primaryColor = '#000000',
}) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const role = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';
  const linksEnabled = skillsLinks?.linksEnabled ?? true;
  const links: any = skillsLinks?.links || {};
  const linkedinUrl = linksEnabled && (links.linkedinEnabled ?? true) ? links.linkedinProfile : '';
  const githubUrl = linksEnabled && (links.githubEnabled ?? true) ? links.githubProfile : '';
  const portfolioUrl = linksEnabled && (links.portfolioEnabled ?? true) ? links.portfolioUrl : '';
  const publicationUrl = linksEnabled && (links.publicationEnabled ?? true) ? links.publicationUrl : '';

  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily, background: '#fff', paddingTop: 24 }}>      <div style={{ display: 'flex' }}>
      {/* Left sidebar */}
      <aside style={{ width: 220, background: '#f3f4f6', padding: 24, boxSizing: 'border-box' }}>
        <h2 style={{ margin: 0, fontSize: 20, color: primaryColor }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</h2>
        {role && <div style={{ color: '#000', marginTop: 6, fontWeight: 700 }}>{role}</div>}

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: primaryColor }}>PERSONAL DETAILS</div>
          <div style={{ height: 1, background: '#999', marginTop: 6, marginBottom: 8 }} />
          <div style={{ color: '#000', fontSize: 11 }}>
            {personal.email && <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}><FiMail style={{ color: '#000' }} /><a href={`mailto:${personal.email}`} style={{ color: '#000', textDecoration: 'none' }}>{personal.email}</a></div>}
            {personal.mobileNumber && <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}><FiPhone style={{ color: '#000' }} /><a href={`tel:${personal.mobileNumber}`} style={{ color: '#000', textDecoration: 'none' }}>{personal.mobileNumber}</a></div>}
            {(personal.address || personal.city || personal.state) && <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}><FiMapPin style={{ color: '#000' }} /><div>{[personal.address, personal.city, personal.state, personal.pincode].filter(Boolean).join(', ')}</div></div>}
            {linkedinUrl && <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}><FiLinkedin style={{ marginTop: 2, color: '#000', scale: 1, flexShrink: 0 }} /><a href={linkedinUrl} target="_blank" rel="noreferrer" style={{ color: '#000', textDecoration: 'none', wordBreak: 'break-word', overflow: 'hidden', fontSize: 10 }}>{linkedinUrl}</a></div>}
            {githubUrl && <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}><FiGithub style={{ marginTop: 2, color: '#000', flexShrink: 0 }} /><a href={githubUrl} target="_blank" rel="noreferrer" style={{ color: '#000', textDecoration: 'none', wordBreak: 'break-word', overflow: 'hidden', fontSize: 10 }}>{githubUrl}</a></div>}
            {portfolioUrl && <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}><FiGlobe style={{ marginTop: 2, color: '#000', flexShrink: 0 }} /><a href={portfolioUrl} target="_blank" rel="noreferrer" style={{ color: '#000', textDecoration: 'none', wordBreak: 'break-word', overflow: 'hidden', fontSize: 10 }}>{portfolioUrl}</a></div>}
            {publicationUrl && <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}><FiExternalLink style={{ marginTop: 2, color: '#000', flexShrink: 0 }} /><a href={publicationUrl} target="_blank" rel="noreferrer" style={{ color: '#000', textDecoration: 'none', wordBreak: 'break-word', overflow: 'hidden', fontSize: 10 }}>{publicationUrl}</a></div>}
          </div>
        </div>

        {(skillsLinks.skills || []).some(s => s.enabled && s.skillName) && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: primaryColor }}>SKILLS</div>
            <div style={{ height: 1, background: '#999', marginTop: 6, marginBottom: 8 }} />
            <div style={{ color: '#000' }}>
              {(skillsLinks.skills || []).filter(s => s.enabled && s.skillName).map((s, i) => (
                <div key={i} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span>• {s.skillName}</span>
                  <span style={{ fontSize: 11 }}>{getSkillStars(s.skillLevel)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: primaryColor }}>LANGUAGES</div>
          <div style={{ height: 1, background: '#999', marginTop: 6, marginBottom: 8 }} />
          <div style={{ color: '#000' }}>
            {(((personal as any).languagesKnown || (personal as any).languages || [])).map((l: string, i: number) => <div key={i} style={{ marginBottom: 6, fontSize: 11 }}>• {l}</div>)}
          </div>
        </div>

      </aside>

      {/* Right content */}
      <main style={{ flex: 1, padding: '24px 36px', boxSizing: 'border-box' }}>
        {personal.aboutCareerObjective && (
          <section>
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>About</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 6, width: '100%' }} />
            </div>
            <div style={{ marginTop: 8, color: '#444', fontSize: 11 }}>
              {DOMPurify.sanitize(personal.aboutCareerObjective).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim()}
            </div>
          </section>
        )}

        {skillsLinks.technicalSummaryEnabled && skillsLinks.technicalSummary && (
          <section style={{ marginTop: personal.aboutCareerObjective ? 18 : 0 }}>
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Technical Summary</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 6, width: '100%' }} />
            </div>
            <div style={{ marginTop: 8, color: '#444', fontSize: 11 }}>
              {DOMPurify.sanitize(skillsLinks.technicalSummary).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim()}
            </div>
          </section>
        )}

        <section>

          {experience.workExperiences.filter((w: any) => w.enabled).length > 0 && (
            <>
              <div style={{ marginTop: 18 }}>
                <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Experience</div>
                <div style={{ height: 1, background: '#ddd', marginTop: 6, width: '100%' }} />
              </div>
              <div style={{ marginTop: 8 }}>
                {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, flex: 1, wordBreak: 'break-word' }}>{w.companyName}</div>
                      <div style={{ color: '#000', fontSize: 11, flexShrink: 0, textAlign: 'right' }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</div>
                    </div>
                    <div style={{ color: '#000', marginTop: 6, fontSize: 11 }}>{w.jobTitle}{w.location ? ` — ${w.location}` : ''}</div>
                    {w.description && <div style={{ marginTop: 6, paddingLeft: 10 }}>{htmlToLines(w.description).map((ln, idx) => <div key={idx} style={{ marginTop: 6, fontSize: 11 }}>• {ln}</div>)}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {projects.filter((p: any) => p.enabled).length > 0 && (
            <>
              <div style={{ marginTop: 18 }}>
                <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Projects</div>
                <div style={{ height: 1, background: '#ddd', marginTop: 6, width: '100%' }} />
              </div>
              <div style={{ marginTop: 8 }}>
                {projects.filter((p: any) => p.enabled).map((p: any, i: number) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, flex: 1, wordBreak: 'break-word' }}>{p.projectTitle}</div>
                      <div style={{ color: '#000', fontSize: 11, flexShrink: 0, textAlign: 'right' }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</div>
                    </div>
                    {p.description && <div style={{ color: '#000', marginTop: 6, fontSize: 11 }}>{DOMPurify.sanitize(p.description).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()}</div>}
                    {p.rolesResponsibilities && <div style={{ marginTop: 6, paddingLeft: 10 }}>{htmlToLines(p.rolesResponsibilities).map((ln, idx) => <div key={idx} style={{ marginTop: 6, fontSize: 11 }}>• {ln}</div>)}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {(education.higherEducation.filter(edu => edu.enabled).length > 0 || education.preUniversityEnabled || education.sslcEnabled) && (<>
            <div style={{ marginTop: 18 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Education</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 6, width: '100%' }} />
            </div>
            <div style={{ marginTop: 8 }}>
              {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, flex: 1, wordBreak: 'break-word' }}>{edu.instituteName}</div>
                    <div style={{ color: '#000', fontSize: 11, flexShrink: 0, textAlign: 'right' }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}</div>
                  </div>
                  <div style={{ color: '#000', marginTop: 4, fontSize: 11 }}>
                    {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                    {edu.universityBoard ? ` — ${edu.universityBoard}` : ''}
                  </div>
                  {edu.resultFormat && edu.result ? (
                    <div style={{ marginTop: 6, color: '#444', fontWeight: 700, fontSize: 11 }}>{edu.resultFormat}: {edu.result}</div>
                  ) : null}
                </div>
              ))}

              {education.preUniversityEnabled && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, flex: 1, wordBreak: 'break-word' }}>{education.preUniversity.instituteName || 'Pre University'}</div>
                    <div style={{ color: '#000', fontSize: 11, flexShrink: 0, textAlign: 'right' }}>{formatResumeEducationDateRange(education.preUniversity)}</div>
                  </div>
                  <div style={{ color: '#000', marginTop: 4, fontSize: 11 }}>
                    Pre University (12th Standard)
                    {education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}
                    {education.preUniversity.boardType ? ` — ${education.preUniversity.boardType}` : ''}
                  </div>
                  {education.preUniversity.resultFormat && education.preUniversity.result && (<div style={{ marginTop: 6, color: '#444', fontWeight: 700, fontSize: 11 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</div>)}
                </div>
              )}

              {education.sslcEnabled && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, flex: 1, wordBreak: 'break-word' }}>{education.sslc.instituteName || 'SSLC'}</div>
                    <div style={{ color: '#000', fontSize: 11, flexShrink: 0, textAlign: 'right' }}>{formatResumeEducationDateRange(education.sslc)}</div>
                  </div>
                  <div style={{ color: '#000', marginTop: 4, fontSize: 11 }}>SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}</div>
                  {education.sslc.resultFormat && education.sslc.result && (<div style={{ marginTop: 6, color: '#444', fontWeight: 700, fontSize: 11 }}>{education.sslc.resultFormat}: {education.sslc.result}</div>)}
                </div>
              )}

            </div>
          </>)}

          {(certifications || []).some((c: any) => c.enabled && c.certificateTitle) && (<>
            <div style={{ marginTop: 18 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1.2, color: primaryColor, fontWeight: 700 }}>Achievements / Certifications</div>
              <div style={{ height: 1, background: '#ddd', marginTop: 6, width: '100%' }} />
            </div>
            <div style={{ marginTop: 8, color: '#444' }}>
              {(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).map((c: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11, gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, wordBreak: 'break-word' }}>{c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}</div>
                  {c.date && <div style={{ flexShrink: 0, textAlign: 'right' }}>{formatMonthYear(c.date)}</div>}
                </div>
              ))}
            </div>
          </>)}

        </section>
      </main>
    </div>
    </div>
  );
};

export default Template17Display;
