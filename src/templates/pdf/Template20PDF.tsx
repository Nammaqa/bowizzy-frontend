import React from 'react';
import DOMPurify from 'dompurify';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  header: { marginBottom: 12 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { width: '50%', fontSize: 20, paddingRight: 12, lineHeight: 1.05 },
  role: { width: '50%', fontSize: 12, textAlign: 'right' },
  dividerThick: { height: 1, backgroundColor: '#000', marginBottom: 12 },
  leftCol: { width: 170, paddingRight: 12 },
  rightCol: { flex: 1 },
  sectionHeading: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 },
  smallDivider: { height: 1, backgroundColor: '#ddd', marginTop: 6, marginBottom: 8 }
});

const htmlToPlainText = (html?: string) => {
  if (!html) return '';
  const sanitized = DOMPurify.sanitize(html || '');
  const withBreaks = sanitized.replace(/<br\s*\/?/gi, '\n').replace(/<\/p>|<\/li>/gi, '\n');
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

const renderBulletedParagraph = (html?: string) => {
  if (!html) return null;

  const hasListTags = /<(ul|ol|li)[\s\/>]/i.test(html);

  if (!hasListTags) {
    const sanitized = DOMPurify.sanitize(html || '');
    const plainText = sanitized
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();

    if (!plainText) return null;

    return (
      <View style={{ marginTop: 4 }}>
        <Text style={{ color: '#2b2a2a', fontSize: 10, lineHeight: 1.4 }}>
          {plainText}
        </Text>
      </View>
    );
  }

  const sanitized = DOMPurify.sanitize(html || '');
  let text = sanitized
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();

  const lines = text.split('\n').filter((l) => l.trim());

  return (
    <View style={{ marginTop: 4 }}>
      {lines.map((line, idx) => (
        <View key={idx} style={{ flexDirection: 'row', marginTop: idx > 0 ? 2 : 0 }}>
          <Text style={{ width: 12, flexShrink: 0, color: '#444', fontSize: 10 }}>
            {line.startsWith('•') ? '•' : ''}
          </Text>
          <Text style={{ flex: 1, color: '#444', fontSize: 10 }}>
            {line.startsWith('•') ? line.substring(1).trim() : line}
          </Text>
        </View>
      ))}
    </View>
  );
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

interface Template20PDFProps { data: ResumeData; primaryColor?: string; fontFamily?: string }

const Template20PDF: React.FC<Template20PDFProps> = ({ data, primaryColor = '#111827', fontFamily = 'Times-Roman, serif' }) => {
  const { personal, experience, education, certifications, skillsLinks } = data;
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Text style={{ ...styles.name, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{personal.firstName} {personal.middleName || ''} {personal.lastName}</Text>
            {(experience && (experience as any).jobRole) && <Text style={{ ...styles.role, fontFamily: pdfFontFamily, color: primaryColor }}>{(experience as any).jobRole}</Text>}
          </View>
        </View>

        <View style={styles.dividerThick} />

        {/* CONTACT row */}
        <View style={{ flexDirection: 'row', marginTop: 6 }}>
          <View style={{ width: 150 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold }}>CONTACT</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                {contactItems.slice(0, 2).map((c: any, i: number) => (<Text key={i} style={{ marginBottom: 4 }}>{c}</Text>))}
              </View>
              <View>
                {contactItems.slice(2).map((c: any, i: number) => (<Text key={i} style={{ marginBottom: 4 }}>{c}</Text>))}
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: primaryColor, marginTop: 12, marginBottom: 12 }} />

        {/* SUMMARY row */}
        {(personal.aboutCareerObjective || (skillsLinks?.technicalSummary && skillsLinks?.technicalSummaryEnabled)) && (
          <>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 150 }}><Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold }}>SUMMARY</Text></View>
              <View style={{ flex: 1 }}>
                {personal.aboutCareerObjective && (
                  <Text style={{ fontSize: 11, color: '#333', marginBottom: (skillsLinks?.technicalSummary && skillsLinks?.technicalSummaryEnabled) ? 6 : 0 }}>
                    {htmlToPlainText(personal.aboutCareerObjective).replace(/\s{2,}/g, ' ')}
                  </Text>
                )}
                {skillsLinks?.technicalSummary && skillsLinks?.technicalSummaryEnabled && (
                  <Text style={{ fontSize: 11, color: '#333' }}>
                    {htmlToPlainText(skillsLinks.technicalSummary).replace(/\s{2,}/g, ' ')}
                  </Text>
                )}
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 12, marginBottom: 12 }} />
          </>
        )}

        {/* PROFESSIONAL EXPERIENCE row */}
        {experience.workExperiences.filter((w: any) => w.enabled).length > 0 && (
          <>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 150 }}><Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold }}>PROFESSIONAL EXPERIENCE</Text></View>
              <View style={{ flex: 1 }}>
                {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
                  <View key={i} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontFamily: pdfFontFamilyBold }}>{w.jobTitle}</Text>
                      <Text style={{ color: '#000' }}>{w.startDate ? formatMonthYear(w.startDate) : ''} {w.currentlyWorking ? '— Present' : (w.endDate ? `— ${formatMonthYear(w.endDate)}` : '')}</Text>
                    </View>
                    <Text style={{ marginTop: 4, fontFamily: pdfFontFamilyBold, color: '#000' }}>{w.companyName}</Text>
                    {w.description && renderBulletedParagraph(w.description)}
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* EDUCATION row */}
        {(education.higherEducation.some(edu => edu.enabled) || education.preUniversityEnabled || education.sslcEnabled) && (
          <>
            <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 12, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 150 }}><Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold }}>EDUCATION</Text></View>
              <View style={{ flex: 1 }}>
                {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text>{edu.instituteName}</Text>
                      <Text style={{ fontSize: 11, color: '#000' }}>
                        {edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#000', marginTop: 6 }}>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</Text>
                    {edu.universityBoard ? (
                      <Text style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{edu.universityBoard}</Text>
                    ) : null}
                    {edu.resultFormat && edu.result ? (
                      <Text style={{ fontSize: 11, color: '#000', marginTop: 6 }}>{edu.resultFormat}: {edu.result}</Text>
                    ) : null}
                    {edu.description && renderBulletedParagraph(edu.description)}
                  </View>
                ))}

                {/* Pre University */}
                {education.preUniversityEnabled && (
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text>{education.preUniversity.instituteName || 'Pre University'}</Text>
                      <Text style={{ fontSize: 11, color: '#000' }}>{formatResumeEducationDateRange(education.preUniversity)}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#000', marginTop: 6 }}>Pre University (12th Standard){education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}{education.preUniversity.boardType ? ` — ${education.preUniversity.boardType}` : ''}</Text>
                    {education.preUniversity.resultFormat && education.preUniversity.result && (
                      <Text style={{ fontSize: 11, color: '#000', marginTop: 6 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</Text>
                    )}
                  </View>
                )}

                {/* SSLC */}
                {education.sslcEnabled && (
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text>{education.sslc.instituteName || 'SSLC'}</Text>
                      <Text style={{ fontSize: 11, color: '#000' }}>{formatResumeEducationDateRange(education.sslc)}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#000', marginTop: 6 }}>SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}</Text>
                    {education.sslc.resultFormat && education.sslc.result && (
                      <Text style={{ fontSize: 11, color: '#000', marginTop: 6 }}>{education.sslc.resultFormat}: {education.sslc.result}</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* SKILLS row */}
        {(skillsLinks?.skills || []).some((s: any) => s.enabled && s.skillName) && (
          <>
            <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 12, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 150 }}><Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold }}>SKILLS</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#000', lineHeight: 1.6 }}>
                  {(skillsLinks?.skills || []).filter((s: any) => s.enabled && s.skillName).map((s: any) => s.skillName).join(', ')}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* CERTIFICATES row */}
        {(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).length > 0 && (
          <>
            <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 12, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 150 }}><Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold }}>CERTIFICATES</Text></View>
              <View style={{ flex: 1 }}>
                <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap' }}>
                  {(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).map((c: any, i: number) => (
                    <View key={i} style={{ width: '50%', paddingRight: 6, marginBottom: 8 }}>
                      <Text>{c.certificateTitle} {c.year ? `| ${c.year}` : ''}</Text>
                      {c.providedBy && <Text style={{ marginTop: 4 }}>{c.providedBy}</Text>}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}

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

export default Template20PDF;
