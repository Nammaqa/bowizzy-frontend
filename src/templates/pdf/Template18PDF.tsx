import React from 'react';
import DOMPurify from 'dompurify';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';
import { renderPdfRichBullets } from '@/templates/utils/richTextPdf';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  header: { textAlign: 'center', marginBottom: 8 },
  name: { fontSize: 22, color: '#000' },
  role: { fontSize: 11, marginTop: 6 },
  contact: { fontSize: 10, color: '#374151', marginTop: 6 },
  sectionHeading: { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  divider: { height: 1, marginTop: 6, width: '100%' },
  section: { marginTop: 12 }
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

const htmlToLines = (html?: string) => {
  const plain = htmlToPlainText(html);
  if (!plain) return [] as string[];
  return plain.split(/\n|\r\n/).map(l => l.trim()).filter(Boolean);
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

interface Template18PDFProps { data: ResumeData; primaryColor?: string; fontFamily?: string }

const Template18PDF: React.FC<Template18PDFProps> = ({ data, primaryColor = '#111827', fontFamily = 'Times-Roman, serif' }) => {
  const { personal, experience, education, skillsLinks, certifications } = data;
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

  const renderBulletedParagraph = (html?: string) =>
    renderPdfRichBullets(html, {
      fontSize: 10,
      color: '#444',
      lineHeight: 1.4,
      marginTop: 6,
      boldFontFamily: pdfFontFamilyBold,
      textAlign: 'justify',
    });

  const role = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';

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
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ ...styles.name, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</Text>
          {role && <Text style={{ ...styles.role, fontFamily: pdfFontFamily, color: primaryColor }}>{role}</Text>}
          {contactLine && <Text style={styles.contact}>{contactLine}</Text>}
        </View>

        <View>
          <View style={styles.section}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Career Objective</Text>
            <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
            {personal.aboutCareerObjective ? <Text style={{ marginTop: 6, color: '#444', textAlign: 'justify' }}>{htmlToPlainText(personal.aboutCareerObjective).replace(/ /g, ' ').trim()}</Text> : null}
          </View>

          {experience.workExperiences.some((exp: any) => exp.enabled) && (
            <View style={styles.section}>
              <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Work Experience</Text>
              <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
              <View style={{ marginTop: 8 }}>
                {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
                  <View key={i} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold }}>{w.companyName}</Text>
                      <View style={{ flexDirection: 'row' }}>
                        {(() => {
                          const sParts = formatMonthYearParts(w.startDate);
                          return (
                            <>
                              <Text style={{ fontSize: 11, color: '#000' }}>{sParts.month}{sParts.month ? ' ' : ''}</Text>
                              <Text style={{ fontSize: 11, color: '#000' }}>{sParts.year}</Text>
                            </>
                          );
                        })()}

                        <Text style={{ fontSize: 11, color: '#000' }}> {' '}-{' '}</Text>

                        {w.currentlyWorking ? (
                          <Text style={{ fontSize: 11, color: '#000' }}>Present</Text>
                        ) : (() => {
                          const eParts = formatMonthYearParts(w.endDate);
                          return (
                            <>
                              <Text style={{ fontSize: 11, color: '#000' }}>{eParts.month}{eParts.month ? ' ' : ''}</Text>
                              <Text style={{ fontSize: 11, color: '#000' }}>{eParts.year}</Text>
                            </>
                          );
                        })()}
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={{ fontSize: 11, color: '#000' }}>{w.jobTitle}</Text>
                      <Text style={{ fontSize: 11, color: '#000' }}>{w.location}</Text>
                    </View>
                    {w.description && renderBulletedParagraph(w.description)}
                  </View>
                ))}
              </View>
            </View>
          )}

          {(education.higherEducation.some(edu => edu.enabled) || (education.preUniversityEnabled && education.preUniversity.instituteName) || (education.sslcEnabled && education.sslc.instituteName)) && (
            <View style={styles.section}>
              <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Education</Text>
              {/* ✅ Fixed: added backgroundColor: primaryColor so the divider is visible */}
              <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
              <View style={{ marginTop: 8 }}>
                {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
                  <View key={i} style={{ marginBottom: 10 }}>
                    <Text style={{ marginTop: 6, color: '#000', fontWeight: 700 }}>{edu.instituteName}{edu.universityBoard ? ` - ${edu.universityBoard}` : ''}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: '#000' }}>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</Text>
                      <Text style={{ fontSize: 11, color: '#000' }}>
                        {edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}
                      </Text>
                    </View>
                    {edu.resultFormat && edu.result && (<Text style={{ fontSize: 10, color: '#000', marginTop: 4 }}>{edu.resultFormat}: {edu.result}</Text>)}
                  </View>
                ))}

                {/* Pre University */}
                {education.preUniversityEnabled && education.preUniversity.instituteName && (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ marginTop: 6, color: '#000', fontWeight: 700 }}>{education.preUniversity.instituteName || 'Pre University'}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: '#000' }}>Pre University (12th Standard){education.preUniversity.boardType ? ` - ${education.preUniversity.boardType}` : ''}{education.preUniversity.subjectStream ? ` (${education.preUniversity.subjectStream})` : ''}</Text>
                      <Text style={{ fontSize: 11, color: '#000' }}>{formatResumeEducationDateRange(education.preUniversity)}</Text>
                    </View>
                    {education.preUniversity.resultFormat && education.preUniversity.result && (<Text style={{ fontSize: 10, color: '#444', marginTop: 4 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</Text>)}
                  </View>
                )}

                {/* SSLC */}
                {education.sslcEnabled && education.sslc.instituteName && (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ marginTop: 6, color: '#000', fontWeight: 700 }}>{education.sslc.instituteName || 'SSLC'}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: '#000' }}>SSLC (10th Standard){education.sslc.boardType ? ` - ${education.sslc.boardType}` : ''}</Text>
                      <Text style={{ fontSize: 11, color: '#000' }}>{formatResumeEducationDateRange(education.sslc)}</Text>
                    </View>
                    {education.sslc.resultFormat && education.sslc.result && (<Text style={{ fontSize: 10, color: '#444', marginTop: 4 }}>{education.sslc.resultFormat}: {education.sslc.result}</Text>)}
                  </View>
                )}
              </View>
            </View>
          )}

          {(skillsLinks.skills || []).some((s: any) => s.enabled && s.skillName) && (
            <View style={styles.section}>
              <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Skills</Text>
              <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
              <View style={{ marginTop: 8 }}>
                {(skillsLinks.skills || []).filter((s: any) => s.enabled && s.skillName).map((s: any, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
                    <Text style={{ width: 12 }}>•</Text>
                    <Text style={{ flex: 1, color: '#444' }}>{s.skillName}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(certifications || []).some((c: any) => c.enabled && c.certificateTitle) && (
            <View style={styles.section}>
              <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Certifications</Text>
              <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
              <View style={{ marginTop: 8 }}>
                {(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).map((c: any, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', flex: 1, marginRight: 12 }}>
                      <Text style={{ width: 12 }}>•</Text>
                      <Text style={{ flex: 1, color: '#444' }}>
                        <Text style={{ color: '#000' }}>{c.certificateTitle}</Text>
                        {c.providedBy ? ` - ${c.providedBy}` : ''}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#000' }}>{c.date ? formatYear(c.date) : ''}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        {/* <View style={{
          position: 'absolute',
          left: 0,
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
          <Text style={{ color: '#B0B0B0', fontSize: 10, letterSpacing: 0.5 }}>bowizzy.com</Text>
          <Text style={{ color: '#B0B0B0', fontSize: 10, letterSpacing: 0.5 }}>Powered by Wizzybox</Text>
        </View> */}
      </Page>
    </Document>
  );
};

export default Template18PDF;