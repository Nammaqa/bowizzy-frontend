import React from 'react';
import DOMPurify from 'dompurify';
import { Document, Page, View, Text, StyleSheet, Svg, Path, Link } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';
import { renderPdfRichBullets } from '@/templates/utils/richTextPdf';

const styles = StyleSheet.create({
  page: { flexDirection: 'row', padding: 0, fontSize: 10, },
  sidebar: { width: 220, backgroundColor: '#f3f4f6', padding: 18 },
  name: { fontSize: 20, color: '#0f172a' },
  role: { fontSize: 11, marginTop: 6 },
  sectionHeading: { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', paddingTop: 10 },
  divider: { height: 1, marginTop: 6, width: '100%' },
  content: { flex: 1, padding: 18, paddingLeft: 24 }
});

const htmlToPlainText = (html?: string) => {
  if (!html) return '';
  const sanitized = DOMPurify.sanitize(html || '');
  const withBreaks = sanitized.replace(/<br\s*\/?/gi, '\n').replace(/<\/p>|<\/li>/gi, '\n').replace(/<ul[^>]*>|<ol[^>]*>/gi, '\n');
  const decoded = withBreaks.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  try {
    if (typeof document !== 'undefined') {
      const tmp = document.createElement('div');
      tmp.innerHTML = decoded;
      return (tmp.textContent || tmp.innerText || '').trim();
    }
  } catch (e) { }
  return decoded.replace(/<[^>]+>/g, '').trim();
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

const formatYear = (s?: string) => {
  if (!s) return '';
  const str = String(s).trim();
  const y = str.match(/(\d{4})/);
  return y ? y[1] : str;
};

interface Template17PDFProps { data: ResumeData; primaryColor?: string; fontFamily?: string }

const IconEmail = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="none" stroke="#374151" strokeWidth="1.5" />
    <Path d="M20 6l-8 5-8-5" stroke="#374151" strokeWidth="1.5" fill="none" />
  </Svg>
);

const IconPhone = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
    <Path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1v3.5a1 1 0 01-1 1C10.07 22 2 13.93 2 3.5A1 1 0 013 2.5H6.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.24 1.01l-2.2 2.2z" fill="none" stroke="#374151" strokeWidth="1.5" />
  </Svg>
);

const IconLocation = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" fill="none" stroke="#374151" strokeWidth="1.5" />
  </Svg>
);

const StarIcon = () => (
  <Svg width="10" height="10" viewBox="0 0 24 24" style={{ marginRight: 2 }}>
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#374151" />
  </Svg>
);
const IconLinkedin = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
    <Path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" fill="#374151" />
  </Svg>
);

const IconGithub = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
    <Path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="#374151" />
  </Svg>
);

const IconGlobe = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
    <Path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="none" stroke="#374151" strokeWidth="1.5" />
    <Path d="M2 12h20M12 2c2.5 2.7 4 6 4 10s-1.5 7.3-4 10c-2.5-2.7-4-6-4-10s1.5-7.3 4-10z" fill="none" stroke="#374151" strokeWidth="1.5" />
  </Svg>
);

const IconExternalLink = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
    <Path d="M14 3h7v7M10 14L21 3" fill="none" stroke="#374151" strokeWidth="1.5" />
    <Path d="M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" fill="none" stroke="#374151" strokeWidth="1.5" />
  </Svg>
);

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

const Template17PDF: React.FC<Template17PDFProps> = ({ data, primaryColor = '#111827', fontFamily = 'Times-Roman, serif' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const getPdfFontFamily = (cssFont?: string): string => {
    if (!cssFont) return 'Times-Roman';
    const fontLower = cssFont.toLowerCase();
    if (fontLower.includes('arial')) return 'Helvetica';
    if (fontLower.includes('times')) return 'Times-Roman';
    if (fontLower.includes('georgia')) return 'Times-Roman';
    if (fontLower.includes('calibri')) return 'Helvetica';
    if (fontLower.includes('roboto')) return 'Helvetica';
    if (fontLower.includes('inter')) return 'Helvetica';
    return 'Times-Roman';
  };

  const getPdfFontFamilyBold = (cssFont?: string): string => {
    if (!cssFont) return 'Times-Bold';
    const fontLower = cssFont.toLowerCase();
    if (fontLower.includes('arial')) return 'Helvetica-Bold';
    if (fontLower.includes('times')) return 'Times-Bold';
    if (fontLower.includes('georgia')) return 'Times-Bold';
    if (fontLower.includes('calibri')) return 'Helvetica-Bold';
    if (fontLower.includes('roboto')) return 'Helvetica-Bold';
    if (fontLower.includes('inter')) return 'Helvetica-Bold';
    return 'Times-Bold';
  };

  const pdfFontFamily = getPdfFontFamily(fontFamily);
  const pdfFontFamilyBold = getPdfFontFamilyBold(fontFamily);

  const renderBulletedParagraph = (html?: string, extra?: { forceBullets?: boolean }) =>
    renderPdfRichBullets(html, {
      fontSize: 9,
      color: '#444',
      marginTop: 6,
      boldFontFamily: pdfFontFamilyBold,
      textAlign: 'justify',
      ...extra,
    });

  const role = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';
  const linksEnabled = skillsLinks?.linksEnabled ?? true;
  const links: any = skillsLinks?.links || {};
  const linkedinUrl = linksEnabled && (links.linkedinEnabled ?? true) ? links.linkedinProfile : '';
  const githubUrl = linksEnabled && (links.githubEnabled ?? true) ? links.githubProfile : '';
  const portfolioUrl = linksEnabled && (links.portfolioEnabled ?? true) ? links.portfolioUrl : '';
  const publicationUrl = linksEnabled && (links.publicationEnabled ?? true) ? links.publicationUrl : '';
  const linkTextStyle = { fontSize: 9, color: '#000', textDecoration: 'none' as const };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.sidebar}>
          <Text style={{ ...styles.name, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</Text>
          {role && <Text style={{ ...styles.role, fontFamily: pdfFontFamily, color: primaryColor }}>{role}</Text>}

          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 10, fontFamily: pdfFontFamilyBold, letterSpacing: 1, color: primaryColor, marginBottom: 6 }}>PERSONAL DETAILS</Text>
            <View style={{ height: 1, backgroundColor: primaryColor, marginBottom: 8 }} />
            {personal.email && <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}><IconEmail /><Text style={{ fontSize: 9, color: '#000' }}>{personal.email}</Text></View>}
            {personal.mobileNumber && <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}><IconPhone /><Text style={{ fontSize: 9, color: '#000' }}>{personal.mobileNumber}</Text></View>}
            {(personal.address || personal.city || personal.state) && <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}><IconLocation /><Text style={{ fontSize: 9, color: '#000' }}>{[personal.address, personal.city, personal.state, personal.pincode].filter(Boolean).join(', ')}</Text></View>}
            {linkedinUrl && <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, width: '100%' }}><IconLinkedin /><Text style={{ ...linkTextStyle, fontSize: 7, flex: 1, flexWrap: 'wrap' }}>{linkedinUrl}</Text></View>}
            {githubUrl && <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, width: '100%' }}><IconGithub /><Text style={{ ...linkTextStyle, fontSize: 7, flex: 1, flexWrap: 'wrap' }}>{githubUrl}</Text></View>}
            {portfolioUrl && <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, width: '100%' }}><IconGlobe /><Text style={{ ...linkTextStyle, fontSize: 7, flex: 1, flexWrap: 'wrap' }}>{portfolioUrl}</Text></View>}
            {publicationUrl && <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, width: '100%' }}><IconExternalLink /><Text style={{ ...linkTextStyle, fontSize: 7, flex: 1, flexWrap: 'wrap' }}>{publicationUrl}</Text></View>}
          </View>

          {(skillsLinks.skills || []).some((s: any) => s.enabled && s.skillName) && (
            <View style={{ marginTop: 18 }}>
              <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Skills</Text>
              <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
              {(skillsLinks.skills || []).filter((s: any) => s.enabled && s.skillName).map((s: any, i: number) => (<View key={i} style={{ marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ fontSize: 9, color: '#000', flex: 1 }}>• {s.skillName}</Text><Text style={{ fontSize: 9, color: '#000' }}>{getSkillStars(s.skillLevel)}</Text></View>))}
            </View>
          )}

          <View style={{ marginTop: 18 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Languages</Text>
            <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
            {(((personal as any).languagesKnown || (personal as any).languages || [])).map((l: string, i: number) => (<Text key={i} style={{ marginTop: 6, fontSize: 9, color: '#000' }}>• {l}</Text>))}
          </View>

        </View>

        <View style={styles.content}>
          {personal.aboutCareerObjective ? (
            <View>
              <View wrap={false} minPresenceAhead={40}>
                <Text style={styles.sectionHeading}>About</Text>
                <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 6, width: '100%' }} />
              </View>
              <Text style={{ marginTop: 8, fontSize: 9, color: '#444', textAlign: 'justify' }}>{htmlToPlainText(personal.aboutCareerObjective).replace(/\s{2,}/g, ' ')}</Text>
            </View>
          ) : null}

          {skillsLinks.technicalSummaryEnabled && skillsLinks.technicalSummary ? (
            <View style={{ marginTop: personal.aboutCareerObjective ? 18 : 0 }}>
              <View wrap={false} minPresenceAhead={40}>
                <Text style={styles.sectionHeading}>Technical Summary</Text>
                <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 6, width: '100%' }} />
              </View>
              {renderBulletedParagraph(skillsLinks.technicalSummary, { forceBullets: true })}
            </View>
          ) : null}

          {experience.workExperiences.filter((w: any) => w.enabled).length > 0 && (
            <View style={{ marginTop: 18 }}>
              <View wrap={false} minPresenceAhead={40}>
                <Text style={styles.sectionHeading}>Experience</Text>
                <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 6, width: '100%' }} />
              </View>
              <View style={{ marginTop: 8 }}>
                {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
                  <View key={i} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 10, fontFamily: pdfFontFamilyBold, flex: 1, paddingRight: 16 }}>{w.companyName}</Text>
                      <Text style={{ fontSize: 10, color: '#000', flexShrink: 0, textAlign: 'right' }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</Text>
                    </View>
                    <Text style={{ marginTop: 6, fontSize: 9, color: '#000' }}>{w.jobTitle}{w.location ? ` — ${w.location}` : ''}</Text>
                    {w.description && <View style={{ paddingLeft: 10 }}>{renderBulletedParagraph(w.description)}</View>}
                  </View>
                ))}
              </View>
            </View>
          )}

          {projects.filter((p: any) => p.enabled).length > 0 && (
            <View style={{ marginTop: 18 }}>
              <View wrap={false} minPresenceAhead={40}>
                <Text style={styles.sectionHeading}>Projects</Text>
                <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 6, width: '100%' }} />
              </View>
              <View style={{ marginTop: 8 }}>
                {projects.filter((p: any) => p.enabled).map((p: any, i: number) => (
                  <View key={i} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 10, fontFamily: pdfFontFamilyBold, flex: 1, paddingRight: 16 }}>{p.projectTitle}</Text>
                      <Text style={{ fontSize: 10, color: '#000', flexShrink: 0, textAlign: 'right' }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</Text>
                    </View>
                    {p.description && <View style={{ marginTop: 6 }}>{renderBulletedParagraph(p.description)}</View>}
                    {p.rolesResponsibilities && (
                      <View style={{ marginTop: 6, paddingLeft: 10 }}>
                        <Text style={{ fontSize: 9, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Roles & Responsibilities:</Text>
                        {renderBulletedParagraph(p.rolesResponsibilities)}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {(education.higherEducation.filter(edu => edu.enabled).length > 0 || education.preUniversityEnabled || education.sslcEnabled) && (
            <View style={{ marginTop: 18 }}>
              <View wrap={false} minPresenceAhead={40}>
                <Text style={styles.sectionHeading}>Education</Text>
                <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 6, width: '100%' }} />
              </View>
              <View style={{ marginTop: 8 }}>
                {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
                  <View key={i} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 10, fontFamily: pdfFontFamilyBold, flex: 1, paddingRight: 16 }}>{edu.instituteName}</Text>
                      <Text style={{ fontSize: 9, color: '#000', flexShrink: 0, textAlign: 'right' }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}</Text>
                    </View>
                    <Text style={{ marginTop: 4, fontSize: 9, color: '#000' }}>
                      {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                      {edu.universityBoard ? ` — ${edu.universityBoard}` : ''}
                    </Text>
                    {edu.resultFormat && edu.result ? (
                      <Text style={{ fontSize: 9, color: '#444', fontFamily: pdfFontFamilyBold, marginTop: 4 }}>{edu.resultFormat}: {edu.result}</Text>
                    ) : null}
                  </View>
                ))}

                {/* Pre University */}
                {education.preUniversityEnabled && (
                  <View style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 10, fontFamily: pdfFontFamilyBold, flex: 1, paddingRight: 16 }}>{education.preUniversity.instituteName || 'Pre University'}</Text>
                      <Text style={{ fontSize: 9, color: '#000', flexShrink: 0, textAlign: 'right' }}>{formatResumeEducationDateRange(education.preUniversity)}</Text>
                    </View>
                    <Text style={{ marginTop: 4, fontSize: 9, color: '#000' }}>
                      Pre University (12th Standard)
                      {education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}
                      {education.preUniversity.boardType ? ` — ${education.preUniversity.boardType}` : ''}
                    </Text>
                    {education.preUniversity.resultFormat && education.preUniversity.result && (
                      <Text style={{ fontSize: 9, color: '#444', fontFamily: pdfFontFamilyBold, marginTop: 4 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</Text>
                    )}
                  </View>
                )}

                {/* SSLC */}
                {education.sslcEnabled && (
                  <View style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 10, fontFamily: pdfFontFamilyBold, flex: 1, paddingRight: 16 }}>{education.sslc.instituteName || 'SSLC'}</Text>
                      <Text style={{ fontSize: 9, color: '#000', flexShrink: 0, textAlign: 'right' }}>{formatResumeEducationDateRange(education.sslc)}</Text>
                    </View>
                    <Text style={{ marginTop: 4, fontSize: 9, color: '#000' }}>SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}</Text>
                    {education.sslc.resultFormat && education.sslc.result && (
                      <Text style={{ fontSize: 9, color: '#444', fontFamily: pdfFontFamilyBold, marginTop: 4 }}>{education.sslc.resultFormat}: {education.sslc.result}</Text>
                    )}
                  </View>
                )}

              </View>
            </View>
          )}

          {(certifications || []).some((c: any) => c.enabled && c.certificateTitle) && (
            <View style={{ marginTop: 18 }}>
              <View wrap={false} minPresenceAhead={40}>
                <Text style={styles.sectionHeading}>Achievements / Certifications</Text>
                <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 6, width: '100%' }} />
              </View>
              <View style={{ marginTop: 8 }}>
                {(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).map((c: any, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 9, flex: 1, paddingRight: 16 }}>{c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}</Text>
                    {c.date && <Text style={{ fontSize: 9, flexShrink: 0, textAlign: 'right' }}>{formatMonthYear(c.date)}</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>
        {/* Footer */}
        {/* <View style={{
          position: 'absolute',
          left: 220,
          right: 0,
          bottom: 12,
          paddingHorizontal: 36,
          paddingVertical: 8,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 10,
          color: '#B0B0B0',
        }} fixed>
          <Text style={{ color: '#B0B0B0', fontSize: 7, letterSpacing: 0.5 }}>bowizzy.com</Text>
          <Text style={{ color: '#B0B0B0', fontSize: 7, letterSpacing: 0.5 }}>Powered by Wizzybox</Text>
        </View> */}
      </Page>
    </Document>
  );
};

export default Template17PDF;
