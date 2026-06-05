import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { FiPhone, FiMail, FiMapPin, FiLinkedin, FiGithub } from 'react-icons/fi';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';
import logo from '@/assets/bowizzy.png';

interface Template11DisplayProps {
  data: ResumeData;
  fontFamily?: string;
  primaryColor?: string;
  showPageBreaks?: boolean;
  supportsPhoto?: boolean;
  onPageCountChange?: (n: number) => void;
  onPageChange?: (i: number) => void;
  pageControllerRef?: React.RefObject<{ goTo: (i: number) => void; next: () => void; prev: () => void }>;
}

const Template11Display: React.FC<Template11DisplayProps> = ({
  data,
  fontFamily = 'Times New Roman, serif',
  primaryColor = '#111827',
  showPageBreaks = false,
  supportsPhoto = true,
  onPageCountChange,
  onPageChange,
  pageControllerRef,
}) => {
  const { personal, education, experience, projects, skillsLinks, certifications } = data;
  const sortedHigherEducation = React.useMemo(() => {
    const parseYearKey = (val: string) => {
      if (!val) return -Infinity;
      const parts = val.split('-');
      const y = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      return y * 100 + m;
    };

    return [...(education.higherEducation || [])].filter(edu => edu.enabled).sort((a, b) => {
      if (a.currentlyPursuing && !b.currentlyPursuing) return -1;
      if (!a.currentlyPursuing && b.currentlyPursuing) return 1;

      const aKey = parseYearKey(a.endYear || a.startYear || '');
      const bKey = parseYearKey(b.endYear || b.startYear || '');

      return aKey - bKey;
    });
  }, [education.higherEducation]);
  console.log('skill links', skillsLinks)
  const getYear = (s?: string) => (s ? s.split('-')[0] : '');

  const degreeMap: Record<string, string> = {
    'B.E': 'Bachelor of Technology',
    'B.Tech': 'Bachelor of Technology',
    'B.S': 'Bachelor of Science',
    'BS': 'Bachelor of Science',
    'B.A': 'Bachelor of Arts',
    'BA': 'Bachelor of Arts',
    'M.Tech': 'Master of Technology',
    'M.S': 'Master of Science',
    'MS': 'Master of Science',
    'M.A': 'Master of Arts',
    'MA': 'Master of Arts',
    'MBA': 'Master of Business Administration',
    'M.B.A': 'Master of Business Administration',
    'Ph.D': 'Doctor of Philosophy',
    'PhD': 'Doctor of Philosophy',
  };

  const getFullDegreeName = (degree: string) => {
    return degreeMap[degree] || degree;
  };

  const formatMonthYear = (s?: string) => {
    if (!s) return '';
    // Accepts YYYY-MM, YYYY-MM-DD, MM/YYYY, MonthName YYYY, or plain YYYY
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    try {
      const str = String(s).trim();
      // YYYY-MM or YYYY-MM-DD
      const ymdMatch = str.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
      if (ymdMatch) {
        const year = ymdMatch[1];
        const mm = parseInt(ymdMatch[2], 10);
        const mon = months[mm - 1] || String(mm).padStart(2, '0');
        return `${year} ${mon}`;
      }
      // MM/YYYY
      const mYMatch = str.match(/^(\d{2})\/(\d{4})$/);
      if (mYMatch) {
        const mm = parseInt(mYMatch[1], 10);
        const year = mYMatch[2];
        const mon = months[mm - 1] || String(mm).padStart(2, '0');
        return `${mon} ${year}`;
      }
      // MonthName YYYY or plain YYYY
      const monthNameMatch = str.match(/^[A-Za-z]{3,}\s+\d{4}$/);
      if (monthNameMatch) return str;
      const yearOnly = str.match(/^(\d{4})$/);
      if (yearOnly) return yearOnly[1];
      return str;
    } catch (e) {
      return String(s);
    }
  };

  const formatEducationDateRange = (edu: any) => {
    const start = formatMonthYear(edu?.startYear || edu?.startDate || '');
    const end = formatMonthYear(edu?.endYear || edu?.yearOfPassing || '');
    if (start && end) return `${start} - ${end}`;
    return start || end || '';
  };

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
    } catch (e) {
      return [String(s)];
    }
  };

  // Build header contact items including optional links
  const headerContactItems = React.useMemo(() => {
    const items: string[] = [];
    if (personal.email) items.push(personal.email);
    if (personal.mobileNumber) items.push(personal.mobileNumber);
    if (personal.address) items.push(personal.address);

    // links live under skillsLinks.links
    const links = skillsLinks?.links || {} as any;
    if (links.linkedinProfile && links.linkedinEnabled) items.push(links.linkedinProfile);
    if (links.githubProfile && links.githubEnabled) items.push(links.githubProfile);
    if (links.portfolioUrl && links.portfolioEnabled) items.push(links.portfolioUrl);
    if (links.publicationUrl && links.publicationEnabled) items.push(links.publicationUrl);

    return items;
  }, [personal, skillsLinks]);
  console.log("edu", education.preUniversityEnabled, education.preUniversity.instituteName)
  return (
    <div className="w-[210mm] bg-white relative" style={{ minHeight: '297mm', fontFamily: fontFamily, }}>
      {/* Tiled Watermark Pattern — 4 cols × 6 rows */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(6, 1fr)',
        gap: '0px',
        alignItems: 'center',
        justifyItems: 'center',
      }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <img
            key={i}
            src={logo}
            alt=""
            style={{
              width: '85px',
              opacity: 0.2,
              transform: 'rotate(-30deg)',
              userSelect: 'none',
            }}
          />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header Section - Classic Serif look */}
        <div style={{ padding: '18px 36px 6px 36px' }}>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: primaryColor,
              margin: 0,
              lineHeight: '1',
              fontFamily: fontFamily,
              textAlign: 'left',
            }}
          >
            {personal.firstName}
            {personal.middleName ? ' ' + personal.middleName : ''}
            {personal.lastName ? ' ' + personal.lastName : ''}
          </h1>        <div style={{ fontSize: '11px', color: '#111827', marginTop: 8, textAlign: 'left' }}>
            {headerContactItems.filter(Boolean).join(' | ')}
          </div>
        </div>



        {/* Content - Single column like image */}
        <div style={{ padding: '0 36px 36px 36px' }}>
          {/* About / Career Objective Section */}
          {personal.aboutCareerObjective && personal.aboutCareerObjective.trim() !== '' && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: primaryColor, letterSpacing: 1.2, marginBottom: 8 }}>CAREER OBJECTIVE</h2>
              <div style={{ height: 1, background: '#333', width: '100%', marginBottom: 12 }} />
              <div style={{ fontSize: 11, color: '#000000', fontWeight: 'normal', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(personal.aboutCareerObjective || '') }} />
            </section>
          )}

          {/* Experience Section */}
          {experience.workExperiences.filter(exp => exp.enabled).length > 0 && (
            <section style={{ marginBottom: 22 }}>
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: primaryColor,
                  letterSpacing: 1.2,
                  marginBottom: 8,
                }}
              >
                EXPERIENCE
              </h2>                      <div style={{ height: 1, background: '#333', width: '100%', marginBottom: 12 }} />


              {experience.workExperiences.filter(exp => exp.enabled).map((exp, idx) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{exp.companyName}</div>
                    <div style={{ fontSize: 11, color: '#111827', fontWeight: 700 }}>{formatMonthYear(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatMonthYear(exp.endDate)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#000000' }}>{exp.jobTitle}</div>
                    {exp.location && <div style={{ fontSize: 11, fontWeight: 700, color: '#000000' }}>{exp.location}</div>}
                  </div>
                  {exp.description && (
                    <div style={{ fontSize: 11, color: '#000000', fontWeight: 'normal', lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(exp.description || '') }}
                    />
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Education Section */}
          {(education.higherEducation.some(edu => edu.enabled) || education.preUniversityEnabled || education.sslcEnabled) && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: primaryColor, letterSpacing: 1.2, marginBottom: 8 }}>EDUCATION</h2>
              <div style={{ height: 1, background: '#333', width: '100%', marginBottom: 12 }} />
              {education.higherEducation.some(edu => edu.enabled) && (
                <>
                  {sortedHigherEducation.map((edu, idx) => (
                    <div key={idx} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#000000', flex: 1, marginRight: 8 }}>{edu.instituteName}</div>
          <div style={{ fontSize: 10, color: '#000000', fontWeight: 700 }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear)} - Present` : formatResumeEducationDateRange(edu)}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#000000', fontWeight: 'normal', marginTop: 4 }}>
                          {getFullDegreeName(edu.degree)}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                      </div>
                      {edu.resultFormat && edu.result && (
                        <div style={{ marginTop: 6, color: '#000000', fontSize: 11 }}>{edu.resultFormat}: {edu.result}</div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Pre University (PUC/12th) */}
              {education.preUniversityEnabled && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#000000', flex: 1, marginRight: 8 }}>{education.preUniversity.instituteName || 'Pre University'}</div>
                  <div style={{ fontSize: 10, color: '#000000', fontWeight: 700 }}>{formatResumeEducationDateRange(education.preUniversity)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#000000', fontWeight: 'normal', marginTop: 4 }}>
                    Pre University (12th Standard){education.preUniversity.boardType ? ` — ${education.preUniversity.boardType}` : ''} {education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}
                  </div>
                  {education.preUniversity.resultFormat && education.preUniversity.result && (
                    <div style={{ marginTop: 6, color: '#000000', fontSize: 11 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</div>
                  )}
                </div>
              )}

              {/* SSLC (10th) */}
              {education.sslcEnabled && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#000000', flex: 1, marginRight: 8 }}>{education.sslc.instituteName || 'SSLC'}</div>
                  <div style={{ fontSize: 10, color: '#000000', fontWeight: 700 }}>{formatResumeEducationDateRange(education.sslc)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#000000', fontWeight: 'normal', marginTop: 4 }}>
                    SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}
                  </div>
                  {education.sslc.resultFormat && education.sslc.result && (
                    <div style={{ marginTop: 6, color: '#000000', fontSize: 11 }}>{education.sslc.resultFormat}: {education.sslc.result}</div>
                  )}
                </div>
              )}

            </section>
          )}

          {/* Projects Section */}
          {projects && projects.filter((proj) => proj.enabled).length > 0 && (
            <section style={{ marginBottom: 22 }}>
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: primaryColor,
                  letterSpacing: 1.2,
                  marginBottom: 8,
                }}
              >
                PROJECTS
              </h2>
              <div style={{ height: 1, background: '#333', width: '100%', marginBottom: 12 }} />

              {projects
                .filter((proj) => proj.enabled)
                .map((proj, idx) => (
                  <div key={idx} style={{ marginBottom: 14 }}>
                    {/* Title row with dates */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 3,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                        {proj.projectTitle}
                      </div>
                      <div style={{ fontSize: 11, color: '#111827', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatMonthYear(proj.startDate)}
                        {' – '}
                        {proj.currentlyWorking ? 'Present' : formatMonthYear(proj.endDate)}
                      </div>
                    </div>

                    {/* Project type badge */}
                    {proj.projectType && (
                      <div
                        style={{
                          fontSize: 10,
                          color: '#555',
                          fontStyle: 'italic',
                          marginBottom: 5,
                        }}
                      >
                        {proj.projectType}
                      </div>
                    )}

                    {/* Description */}
                    {proj.description && (
                      <div
                        style={{
                          fontSize: 11,
                          color: '#000000',
                          fontWeight: 'normal',
                          lineHeight: 1.6,
                        }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(proj.description),
                        }}
                      />
                    )}

                    {/* Roles & Responsibilities */}
                    {proj.rolesResponsibilities &&
                      proj.rolesResponsibilities.replace(/<[^>]*>/g, '').trim() && (
                        <div style={{ marginTop: 5 }}>
                          <span
                            style={{ fontSize: 11, fontWeight: 700, color: '#000000' }}
                          >
                            Role:{' '}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: '#000000',
                              fontWeight: 'normal',
                            }}
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(proj.rolesResponsibilities),
                            }}
                          />
                        </div>
                      )}
                  </div>
                ))}
            </section>
          )}

          {/* Certifications Section */}
          {certifications.filter(c => c.enabled).length > 0 && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: primaryColor, letterSpacing: 1.2, marginBottom: 8 }}>TECHNICAL CERTIFICATIONS</h2>
              <div style={{ height: 1, background: '#333', width: '100%', marginBottom: 12 }} />
              {certifications.filter(c => c.enabled).map((cert, idx) => (
                <div key={idx} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#000000', flex: 1, marginRight: 8 }}>{cert.certificateTitle}</div>
                    <div style={{ fontSize: 10, color: '#000000', fontWeight: 700 }}>{cert.date}</div>
                  </div>
                  {cert.description && (
                    <div style={{ fontSize: 11, color: '#000000', fontWeight: 'normal', marginTop: 4 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cert.description) }} />
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Technical Summary Section */}
          {skillsLinks.technicalSummaryEnabled &&
            skillsLinks.technicalSummary &&
            skillsLinks.technicalSummary.replace(/<[^>]*>/g, '').trim() !== '' && (
              <section style={{ marginBottom: 22 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: primaryColor, letterSpacing: 1.2, marginBottom: 8 }}>
                  TECHNICAL SUMMARY
                </h2>
                <div style={{ height: 1, background: '#333', width: '100%', marginBottom: 12 }} />
                <div
                  style={{ fontSize: 11, color: '#000000', fontWeight: 'normal', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(skillsLinks.technicalSummary) }}
                />
              </section>
            )}

          {/* Skills Section */}
          {skillsLinks.skills.filter(s => s.enabled && s.skillName).length > 0 && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: primaryColor, letterSpacing: 1.2, marginBottom: 8 }}>
                SKILLS
              </h2>
              <div style={{ height: 1, background: '#333', width: '100%', marginBottom: 12 }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 0' }}>
                {skillsLinks.skills
                  .filter(s => s.enabled && s.skillName)
                  .map((s, idx, arr) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', marginRight: 16, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#000000' }}>{s.skillName}</span>
                      {s.skillLevel && (
                        <span style={{ fontSize: 10, color: '#555555', marginLeft: 4 }}>({s.skillLevel})</span>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Languages Section */}
          {personal.languagesKnown && personal.languagesKnown.length > 0 && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: primaryColor, letterSpacing: 1.2, marginBottom: 8 }}>
                LANGUAGES
              </h2>
              <div style={{ height: 1, background: '#333', width: '100%', marginBottom: 12 }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 0' }}>
                {personal.languagesKnown.map((lang, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', marginRight: 16, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#000000' }}>{lang}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Template11Display;
