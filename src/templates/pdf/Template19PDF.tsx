import React from 'react';
import DOMPurify from 'dompurify';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: 12, backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  name: { fontSize: 20 },
  role: { fontSize: 11, color: '#6b7280' },
  contact: { fontSize: 10, color: '#374151' },
  sectionHeading: { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  divider: { height: 1, marginTop: 6, width: '100%' },
  leftCol: { flex: 1, paddingRight: 12 },
  rightCol: { width: 220 }
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

interface Template19PDFProps { data: ResumeData; primaryColor?: string; fontFamily?: string }

const Template19PDF: React.FC<Template19PDFProps> = ({ data, primaryColor = '#111827', fontFamily = 'Times-Roman, serif' }) => {
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
  const role = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';
  const contactLine = [personal.email, personal.mobileNumber, personal.address, personal.dateOfBirth].filter(Boolean).join(' | ');
  const hasPreUniversity = Boolean(education.preUniversityEnabled && (education.preUniversity?.instituteName || education.preUniversity?.subjectStream || education.preUniversity?.boardType || education.preUniversity?.yearOfPassing || education.preUniversity?.result));
  const hasSSLC = Boolean(education.sslcEnabled && (education.sslc?.instituteName || education.sslc?.boardType || education.sslc?.yearOfPassing || education.sslc?.result));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={{ ...styles.name, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</Text>
            {role && <Text style={{ ...styles.role, fontFamily: pdfFontFamily, color: primaryColor }}>{role}</Text>}
          </View>
          <View style={{ textAlign: 'right' }}>
            {personal.email && <Text style={[styles.contact, { color: '#2563eb' }]}>{personal.email}</Text>}
            {personal.mobileNumber && <Text style={[styles.contact, { marginTop: 6 }]}>{personal.mobileNumber}</Text>}
            {personal.address && <Text style={[styles.contact, { marginTop: 6 }]}>{String(personal.address)}</Text>}
            {personal.dateOfBirth && <Text style={[styles.contact, { marginTop: 6 }]}>{personal.dateOfBirth}</Text>}
          </View>
        </View>

        <View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: pdfFontFamilyBold, fontSize: 10, marginBottom: 6, color: primaryColor }}>CAREER OBJECTIVE</Text>
            <View style={{ height: 1, backgroundColor: primaryColor, width: '100%' }} />
          </View>
          {personal.aboutCareerObjective ? <Text style={{ marginTop: 12, color: '#444', textAlign: 'justify' }}>{htmlToPlainText(personal.aboutCareerObjective).trim()}</Text> : null}

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            {/* Left sidebar */}
            <View style={[styles.rightCol, { paddingRight: 12 }]}>
              {(skillsLinks.skills || []).some((s: any) => s.enabled && s.skillName) && (<>
                <Text style={styles.sectionHeading}>Skills</Text>
                <View style={{ ...styles.divider, backgroundColor: '#999' }} />
                <View style={{ marginTop: 8 }}>{(skillsLinks.skills || []).filter((s: any) => s.enabled && s.skillName).map((s: any, i: number) => (<Text key={i} style={{ marginBottom: 6 }}>• {s.skillName}</Text>))}</View>
              </>)}

              {(education.higherEducation.some(edu => edu.enabled) || hasPreUniversity || hasSSLC) && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.sectionHeading}>Education</Text>
                  <View style={{ ...styles.divider, backgroundColor: '#999' }} />
                  <View style={{ marginTop: 8 }}>{[...education.higherEducation].filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, fontFamily: 'Helvetica' }}>{edu.instituteName}</Text>
                      <Text style={{ color: '#151616', marginTop: 4 }}>{edu.degree}{edu.fieldOfStudy ? ` (${edu.fieldOfStudy}) — ${edu.universityBoard}` : ''}</Text>
                      <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 9 }}>
                        {edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}
                      </Text>
                      {(edu.resultFormat && edu.result) && <Text style={{ color: '#151616', marginTop: 4 }}>{edu.resultFormat}: {edu.result}</Text>}
                    </View>
                  ))}

                    {hasPreUniversity && (
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 10, fontFamily: 'Helvetica' }}>{education.preUniversity.instituteName || 'Pre University'}</Text>
                        <Text style={{ color: '#151616', marginTop: 4 }}>Pre University (12th Standard){education.preUniversity.boardType ? ` — ${education.preUniversity.boardType}` : ''}{education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}</Text>
                        <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 9 }}>
                          {formatResumeEducationDateRange(education.preUniversity)}
                        </Text>
                        {education.preUniversity.resultFormat && education.preUniversity.result && <Text style={{ color: '#151616', marginTop: 4 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</Text>}
                      </View>
                    )}

                    {hasSSLC && (
                      <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 10, fontFamily: 'Helvetica' }}>{education.sslc.instituteName || 'SSLC'}</Text>
                        <Text style={{ color: '#151616', marginTop: 4 }}>SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}</Text>
                        <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 9 }}>
                          {formatResumeEducationDateRange(education.sslc)}
                        </Text>
                        {education.sslc.resultFormat && education.sslc.result && <Text style={{ color: '#151616', marginTop: 4 }}>{education.sslc.resultFormat}: {education.sslc.result}</Text>}
                      </View>
                    )}</View>
                </View>
              )}

              {(((personal as any).languagesKnown || (personal as any).languages || [])).filter((l: string) => l && l.trim()).length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.sectionHeading}>Language</Text>
                  <View style={{ ...styles.divider, backgroundColor: '#999' }} />
                  <View style={{ marginTop: 8 }}>{(((personal as any).languagesKnown || (personal as any).languages || [])).filter((l: string) => l && l.trim()).map((l: string, i: number) => (<Text key={i} style={{ marginBottom: 6 }}>• {l}</Text>))}</View>
                </View>
              )}

              {(certifications || []).some((c: any) => c.enabled && c.certificateTitle) && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.sectionHeading}>Certification</Text>
                  <View style={{ ...styles.divider, backgroundColor: '#999' }} />
                  <View style={{ marginTop: 8 }}>{(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).map((c: any, i: number) => (<Text key={i} style={{ marginBottom: 6 }}>• {c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}</Text>))}</View>
                </View>
              )}

            </View>

            {/* Right main content */}
            <View style={styles.leftCol}>
              {experience.workExperiences.some((exp: any) => exp.enabled) && (<>
                <Text style={styles.sectionHeading}>Professional Experience</Text>
                <View style={{ ...styles.divider, backgroundColor: '#999' }} />

                <View style={{ marginTop: 8 }}>
                  {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
                    <View key={i} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11, fontFamily: 'Times-Bold' }}>{w.jobTitle}</Text>
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

                      <Text style={{ marginTop: 6, color: '#000' }}>{w.companyName}{w.location ? ` — ${w.location}` : ''}</Text>

                      {w.description && htmlToLines(w.description).length > 0 && (
                        <View style={{ marginTop: 6 }}>
                          {htmlToLines(w.description).map((ln: any, idx: number) => (
                            <View key={idx} style={{ flexDirection: 'row', marginBottom: 4 }}>
                              <Text style={{ width: 12 }}>•</Text>
                              <Text style={{ flex: 1, color: '#444' }}>{ln}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                    </View>
                  ))}
                </View>
              </>)}

              {(projects || []).some((p: any) => p.enabled) && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.sectionHeading}>Projects</Text>
                  <View style={{ ...styles.divider, backgroundColor: '#999' }} />
                  <View style={{ marginTop: 8 }}>
                    {(projects || []).filter((p: any) => p.enabled).map((p: any, i: number) => (
                      <View key={i} style={{ marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 11, fontFamily: 'Times-Bold' }}>{p.projectTitle}</Text>
                          <Text style={{ fontSize: 11, color: '#000' }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</Text>
                        </View>
                        {p.description && htmlToLines(p.description).length > 0 && (
                          <View style={{ marginTop: 6 }}>
                            {htmlToLines(p.description).map((ln: any, idx: number) => (
                              <View key={idx} style={{ flexDirection: 'row', marginBottom: 4 }}>
                                <Text style={{ width: 12 }}>•</Text>
                                <Text style={{ flex: 1, color: '#444' }}>{ln}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

            </View>
          </View>

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

export default Template19PDF;
