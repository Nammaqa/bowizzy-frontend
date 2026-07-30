import React from 'react';
import DOMPurify from 'dompurify';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 24, paddingLeft: 36, paddingRight: 36, fontSize: 10 },
  headerWrap: { marginBottom: 6 },
  name: { fontSize: 30, color: '#b91c1c', marginBottom: 2 },
  subtitle: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  contact: { fontSize: 10, color: '#6b7280' },
  divider: { height: 1, backgroundColor: '#eee', marginTop: 12, marginBottom: 0, width: '100%' },
  sectionHeading: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: '#b91c1c' },
  itemTitle: { fontSize: 13 },
  itemSub: { fontSize: 11, color: '#111827' },
  bullet: { fontSize: 10, color: '#444', marginTop: 4 },
});

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
      <View style={{ marginTop: 6 }}>
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
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
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
    <View style={{ marginTop: 6 }}>
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

const formatMonthYearNumeric = (s?: string) => {
  if (!s) return '';
  try {
    const str = String(s).trim();
    const ymd = str.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
    if (ymd) {
      const year = ymd[1];
      const mm = ymd[2];
      return `${mm}/${year}`;
    }
    const mY = str.match(/^(\d{2})\/(\d{4})$/);
    if (mY) {
      return `${mY[1]}/${mY[2]}`;
    }
  } catch (e) { /* ignore */ }
  return String(s);
};

const formatYear = (s?: string) => {
  if (!s) return '';
  const str = String(s).trim();
  const y = str.match(/(\d{4})/);
  return y ? y[1] : str;
};

interface Template14PDFProps {
  data: ResumeData;
  primaryColor?: string;
  fontFamily?: string;
}

const Template14PDF: React.FC<Template14PDFProps> = ({ data, primaryColor = '#111827', fontFamily = 'Times-Roman, serif' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;

  // Map CSS font families to react-pdf compatible fonts
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
  // Use the separate jobRole if set by the user; otherwise fall back to first work experience jobTitle
  const profession = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';

  const contactParts = [personal.address, personal.email, personal.mobileNumber].filter(Boolean);
  const links = skillsLinks && (skillsLinks as any).links;
  const linkedinPresent = links?.linkedinEnabled !== false && (links?.linkedinProfile || (personal as any).linkedinProfile);
  const githubPresent = links?.githubEnabled !== false && (links?.githubProfile || (personal as any).githubProfile);
  const portfolioPresent = links?.portfolioEnabled && links?.portfolioUrl;
  const pdfContactLine = [...contactParts, ...(linkedinPresent ? [linkedinPresent] : []), ...(githubPresent ? [githubPresent] : []), ...(portfolioPresent ? [portfolioPresent] : [])].join(' | ');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerWrap}>
          <Text style={{ ...styles.name, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</Text>
          {profession && <Text style={styles.subtitle}>{profession}</Text>}
          <Text style={styles.contact}>{pdfContactLine}</Text>
        </View>

        {experience.workExperiences.some((exp: any) => exp.enabled) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>WORK EXPERIENCE</Text>
            <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>

          <View style={{ marginTop: 8 }}>
            {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{w.jobTitle} — {w.companyName}{w.location ? `, ${w.location}` : ''}</Text>
                  <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatMonthYearNumeric(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYearNumeric(w.endDate)}</Text>
                </View>
                {w.description && renderBulletedParagraph(w.description)}
              </View>
            ))}
          </View>
        </>)}

        {projects.some((p: any) => p.enabled) && (<>
          <View style={{ marginTop: 16 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>PROJECTS</Text>
            <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>

          <View style={{ marginTop: 8 }}>
            {projects && projects.filter((p: any) => p.enabled).map((p: any, i: number) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{p.projectTitle}</Text>
                  <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatMonthYearNumeric(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYearNumeric(p.endDate)}</Text>
                </View>
                {p.description && renderBulletedParagraph(p.description)}
              </View>
            ))}
          </View>
        </>)}

        {(education.higherEducation.some(edu => edu.enabled) || education.preUniversityEnabled || education.sslcEnabled) && (<>
          <View style={{ marginTop: 16 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>EDUCATION</Text>
            <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>

          <View style={{ marginTop: 8 }}>
            {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
              <View key={`he-${i}`} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{edu.instituteName}</Text>
                    <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}</Text>
                </View>
                  <Text style={{ fontSize: 10, color: '#444', marginTop: 4 }}>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</Text>
                {edu.resultFormat && edu.result && (<Text style={{ fontSize: 10, color: '#2b2a2a', marginTop: 6 }}>{edu.resultFormat}: {edu.result}</Text>)}
              </View>
            ))}

            {education.preUniversityEnabled && education.preUniversity && (education.preUniversity.instituteName || education.preUniversity.yearOfPassing) && (
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{education.preUniversity.instituteName || 'Pre University'}</Text>
                  <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatResumeEducationDateRange(education.preUniversity)}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#444', marginTop: 4 }}>Pre University (12th Standard)</Text>
                {education.preUniversity.resultFormat && education.preUniversity.result && (<Text style={{ fontSize: 10, color: '#2b2a2a', marginTop: 6 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</Text>)}
              </View>
            )}

            {education.sslcEnabled && education.sslc && (education.sslc.instituteName || education.sslc.yearOfPassing) && (
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{education.sslc.instituteName || 'SSLC'}</Text>
                  <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatResumeEducationDateRange(education.sslc)}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#444', marginTop: 4 }}>SSLC (10th Standard)</Text>
                {education.sslc.resultFormat && education.sslc.result && (<Text style={{ fontSize: 10, color: '#2b2a2a', marginTop: 6 }}>{education.sslc.resultFormat}: {education.sslc.result}</Text>)}
              </View>
            )}
          </View>
        </>)}

        {skillsLinks.skills.some((s: any) => s.enabled && s.skillName) && (<>
          <View style={{ marginTop: 16 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>SKILLS</Text>
            <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>
          <View style={{ marginTop: 8 }}><Text style={{ fontSize: 10, color: '#2b2a2a' }}>{skillsLinks.skills.filter((s: any) => s.enabled && s.skillName).map((s: any) => s.skillName).join(', ')}</Text></View>
        </>)}

        {certifications.some((c: any) => c.enabled && (c.certificateTitle || c.providedBy)) && (<>
          <View style={{ marginTop: 16 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>CERTIFICATIONS</Text>
            <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>
          <View style={{ marginTop: 8, flexDirection: 'column' }}>
            {certifications.filter((c: any) => c.enabled && (c.certificateTitle || c.providedBy)).map((c: any, i: number) => (
              <View key={i} style={{ marginBottom: 6 }}>
                {c.certificateTitle ? <Text style={{ fontSize: 10, color: '#111827', fontFamily: pdfFontFamilyBold }}>{c.certificateTitle}</Text> : null}
                {c.providedBy ? <Text style={{ fontSize: 9, color: '#2b2a2a', marginTop: 1 }}>Provided by: {c.providedBy}</Text> : null}
              </View>
            ))}
          </View>
        </>)}

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

export default Template14PDF;
