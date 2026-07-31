import React from 'react';
import DOMPurify from 'dompurify';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

interface Template20DisplayProps {
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
  const yr = String(s).match(/(\d{4})/)?.[1];
  return yr || String(s);
};

const Template20Display: React.FC<Template20DisplayProps> = ({
  data,
  fontFamily = 'Georgia, serif',
  primaryColor = '#111827',
}) => {
  const { personal, experience, education, certifications, skillsLinks } = data;

  const formatMobile = (m?: string) => {
    if (!m) return '';
    const trimmed = String(m).trim();
    if (/^\+/.test(trimmed)) return trimmed;
    if ((personal.country || '').toLowerCase() === 'india') return `+91 ${trimmed}`;
    return trimmed;
  };

  const formatYear = (s?: string) => {
    if (!s) return '';
    const y = String(s).match(/(\d{4})/);
    return y ? y[1] : '';
  };

  const formatEducationDateRange = (edu: any) => {
    const start = formatYear(edu?.startYear || edu?.startDate || '');
    const end = formatYear(edu?.endYear || edu?.yearOfPassing || '');
    if (start && end) return `${start} - ${end}`;
    return start || end || '';
  };

  const contactItems = [personal.mobileNumber && `Phone: ${formatMobile(personal.mobileNumber)}`, personal.email && `Email: ${personal.email}`, personal.address && `Address: ${personal.address}`, skillsLinks && skillsLinks.links && skillsLinks.links.portfolioEnabled && skillsLinks.links.portfolioUrl && `Portfolio: ${skillsLinks.links.portfolioUrl}`].filter(Boolean);
  const hasPreUniversity = Boolean(education.preUniversityEnabled && (education.preUniversity?.instituteName || education.preUniversity?.subjectStream || education.preUniversity?.boardType || education.preUniversity?.yearOfPassing || education.preUniversity?.result));
  const hasSSLC = Boolean(education.sslcEnabled && (education.sslc?.instituteName || education.sslc?.boardType || education.sslc?.yearOfPassing || education.sslc?.result));

  return (
    <div style={{ width: '210mm', minHeight: '297mm', fontFamily: fontFamily, background: '#fff', padding: 24, boxSizing: 'border-box' }}>
      <div style={{ paddingBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, width: '50%', flexShrink: 0, paddingRight: 12, fontFamily: fontFamily, fontSize: 28, lineHeight: 1.05, color: primaryColor, }}>{personal.firstName} {personal.middleName || ''} {personal.lastName}</h1>
          {(experience && (experience as any).jobRole) && <div style={{ width: '50%', textAlign: 'right', flexShrink: 0, fontSize: 14, color: primaryColor, fontFamily: 'monospace' }}>{(experience as any).jobRole}</div>}
        </div>
      </div>

      <div style={{ height: 1, background: '#000', marginBottom: 16 }} />

      <div>
        {/* CONTACT row */}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 170,
              paddingRight: 12,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              color: primaryColor,
            }}
          >
            Contact
          </div>          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, color: '#111827', lineHeight: 1.6 }}>
              {contactItems.map((c, i) => (<div key={i} style={{ marginBottom: 6 }}>{c}</div>))}
            </div>
          </div>
        </div>

        {/* CAREER OBJECTIVE row */}
        {personal.aboutCareerObjective && (
          <div style={{ height: 1, background: '#ddd', margin: '12px 0' }} />
        )}
        {personal.aboutCareerObjective && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div
              style={{
                width: 170,
                paddingRight: 12,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                color: primaryColor,
              }}
            >
              Career Objective
            </div>          <div style={{ flex: 1, fontSize: 12, color: '#333', lineHeight: 1.6 }}>
              {DOMPurify.sanitize(personal.aboutCareerObjective).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim()}
            </div>
          </div>
        )}

        {/* TECHNICAL SUMMARY row */}
        {skillsLinks?.technicalSummary && skillsLinks?.technicalSummaryEnabled && (
          <div style={{ height: 1, background: '#ddd', margin: '12px 0' }} />
        )}
        {skillsLinks?.technicalSummary && skillsLinks?.technicalSummaryEnabled && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div
              style={{
                width: 170,
                paddingRight: 12,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                color: primaryColor,
              }}
            >
              Technical Summary
            </div>          <div style={{ flex: 1, fontSize: 12, color: '#333', lineHeight: 1.6 }}>
              {DOMPurify.sanitize(skillsLinks.technicalSummary).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim()}
            </div>
          </div>
        )}

        {experience.workExperiences.filter((w: any) => w.enabled).length > 0 && (
          <div style={{ height: 1, background: '#ddd', margin: '12px 0' }} />
        )}

        {/* PROFESSIONAL EXPERIENCE row */}
        {experience.workExperiences.filter((w: any) => w.enabled).length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div
              style={{
                width: 170,
                paddingRight: 12,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                color: primaryColor, // ✅ ADD THIS
              }}
            >
              Professional Experience
            </div>          <div style={{ flex: 1 }}>
              {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700 }}>{w.jobTitle}</div>
                    <div style={{ color: '#000', fontWeight: 400 }}>{w.startDate ? formatMonthYear(w.startDate) : ''} {w.currentlyWorking ? '— Present' : (w.endDate ? `— ${formatMonthYear(w.endDate)}` : '')}</div>
                  </div>
                  <div style={{ color: '#000', marginTop: 4, fontWeight: 700 }}>{w.companyName}</div>
                  {w.description && (
                    <div style={{ marginTop: 8, color: '#333' }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(w.description || '') }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(education.higherEducation.some(edu => edu.enabled) || hasPreUniversity || hasSSLC) && (
          <div style={{ height: 1, background: '#ddd', margin: '12px 0' }} />
        )}

        {/* EDUCATION row */}
        {(education.higherEducation.some(edu => edu.enabled) || hasPreUniversity || hasSSLC) && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div
              style={{
                width: 170,
                paddingRight: 12,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                color: primaryColor, // ✅ add this
              }}
            >
              Education
            </div>          <div style={{ flex: 1 }}>
              {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 800, color: '#000' }}>{edu.instituteName}</div>
                    <div style={{ color: '#000', fontWeight: 800 }}>
                      {edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}
                    </div>
                  </div>
                  <div style={{ color: '#000', marginTop: 6 }}>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</div>
                  {edu.universityBoard ? (
                    <div style={{ color: '#555', marginTop: 4, fontSize: 12 }}>{edu.universityBoard}</div>
                  ) : null}
                  {edu.resultFormat && edu.result ? (
                    <div style={{ marginTop: 6, color: '#000' }}>{edu.resultFormat}: {edu.result}</div>
                  ) : null}
                  {edu.description && (
                    <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                      {htmlToLines(edu.description).map((ln, j) => <li key={j} style={{ marginBottom: 6 }}>{ln}</li>)}
                    </ul>
                  )}
                </div>
              ))}

              {hasPreUniversity && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 800, color: '#000' }}>{education.preUniversity.instituteName || 'Pre University'}</div>
                    <div style={{ color: '#000', fontWeight: 800 }}>{formatResumeEducationDateRange(education.preUniversity)}</div>
                  </div>
                  <div style={{ color: '#000', marginTop: 6 }}>Pre University (12th Standard){education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}{education.preUniversity.boardType ? ` — ${education.preUniversity.boardType}` : ''}</div>
                  {education.preUniversity.resultFormat && education.preUniversity.result && (
                    <div style={{ marginTop: 6, color: '#000' }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</div>
                  )}
                </div>
              )}

              {hasSSLC && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 800, color: '#000' }}>{education.sslc.instituteName || 'SSLC'}</div>
                    <div style={{ color: '#000', fontWeight: 800 }}>{formatResumeEducationDateRange(education.sslc)}</div>
                  </div>
                  <div style={{ color: '#000', marginTop: 6 }}>SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}</div>
                  {education.sslc.resultFormat && education.sslc.result && (
                    <div style={{ marginTop: 6, color: '#000' }}>{education.sslc.resultFormat}: {education.sslc.result}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {(skillsLinks?.skills || []).some((s: any) => s.enabled && s.skillName) && (
          <div style={{ height: 1, background: '#ddd', margin: '12px 0' }} />
        )}

        {/* SKILLS row */}
        {(skillsLinks?.skills || []).some((s: any) => s.enabled && s.skillName) && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div
              style={{
                width: 170,
                paddingRight: 12,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                color: primaryColor,
              }}
            >
              Skills
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#000', fontSize: 12, lineHeight: 1.6 }}>
                {(skillsLinks?.skills || []).filter((s: any) => s.enabled && s.skillName).map((s: any) => s.skillName).join(', ')}
              </div>
            </div>
          </div>
        )}

        {(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).length > 0 && (
          <div style={{ height: 1, background: '#ddd', margin: '12px 0' }} />
        )}

        {/* CERTIFICATES row */}
        {(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div
              style={{
                width: 170,
                paddingRight: 12,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                color: primaryColor, // ✅ headline accent
              }}
            >
              Certificates
            </div>          <div style={{ flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).map((c: any, i: number) => (
                  <div key={i} style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 700 }}>{c.certificateTitle} {c.year ? `| ${c.year}` : ''}</div>
                    {c.providedBy && <div style={{ color: '#6b7280', marginTop: 4 }}>{c.providedBy}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Template20Display;
