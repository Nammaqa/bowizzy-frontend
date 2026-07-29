import React from 'react';
import DOMPurify from 'dompurify';
import { Document, Page, View, Text, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingLeft: 36,
    paddingRight: 36,
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 22, marginBottom: 6 },
  summary: { fontSize: 10, color: '#333', marginBottom: 6 },
  contact: { fontSize: 10, color: '#2b2a2a' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 12 },

  grid: { flexDirection: 'row' },
  leftCol: { width: 120, paddingRight: 12 },
  sectionHeading: { fontSize: 9, letterSpacing: 0.9, textTransform: 'uppercase', color: '#111827' },
  rightCol: { flex: 1 },

  sectionTitle: { fontSize: 11, marginBottom: 6 },
  itemTitle: { fontSize: 11 },
  itemSub: { fontSize: 10, color: '#2b2a2a' },
  bullet: { fontSize: 10, color: '#2b2a2a', marginTop: 4 },
});

interface Template12PDFProps {
  data: ResumeData;
  primaryColor?: string;
  fontFamily?: string;
}

const htmlToPlainText = (html?: string) => {
  if (!html) return '';
  const sanitized = DOMPurify.sanitize(html || '');
  const withBreaks = sanitized.replace(/<br\s*\/?/gi, '\n').replace(/<\/p>|<\/li>/gi, '\n');
  try {
    if (typeof document !== 'undefined') {
      const tmp = document.createElement('div');
      tmp.innerHTML = withBreaks;
      return (tmp.textContent || tmp.innerText || '').trim();
    }
  } catch (e) { /* ignore */ }
  return withBreaks.replace(/<[^>]+>/g, '').trim();
};

const renderBulletedParagraph = (html?: string) => {
  if (!html) return null;
  const sanitized = DOMPurify.sanitize(html || '');
  let text = sanitized
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();

  const lines = text.split('\n').filter((l) => l.trim());

  return (
    <View style={{ marginTop: 2 }}>
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
  } catch (e) { /* ignore */ }
  return String(s);
};

const Template12PDF: React.FC<Template12PDFProps> = ({ data, primaryColor = '#111827', fontFamily = 'Times-Roman, serif' }) => {
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

  const hasEducation = education.higherEducation.some(edu => edu.enabled) || (education.preUniversityEnabled && education.preUniversity.instituteName) || (education.sslcEnabled && education.sslc.instituteName);
  const hasSkills = skillsLinks.skills.some((s: any) => s.enabled && s.skillName);
  const hasCerts = certifications.some((c: any) => c.enabled && c.certificateTitle);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ ...styles.name, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</Text>
          {personal.aboutCareerObjective ? <Text style={styles.summary}>{htmlToPlainText(personal.aboutCareerObjective)}</Text> : null}
          <Text style={styles.contact}>{[personal.email, personal.mobileNumber, personal.address].filter(Boolean).join(' | ')}</Text>
        </View>

        <View style={{ ...styles.divider, backgroundColor: primaryColor }} />

        {experience.workExperiences.some((exp: any) => exp.enabled) && (<>
          <View style={styles.grid}>
            <View style={styles.leftCol}>
              <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>WORK</Text>
              <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>EXPERIENCE</Text>
            </View>
            <View style={styles.rightCol}>
              {experience.workExperiences.filter(w => w.enabled).map((w: any, i: number) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{w.jobTitle} — {w.companyName}</Text>
                    <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</Text>
                  </View>
                  {w.description && (
                    <View style={{ color: '#2b2a2a' }}>{renderBulletedParagraph(w.description)}</View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* divider after work experience, only if projects exist */}
          {projects.some((p: any) => p.enabled) && <View style={{ height: 1, backgroundColor: '#aaa', width: '100%', marginVertical: 12 }} />}
        </>)}

        {/* Projects Section */}
        {projects.some((p: any) => p.enabled) && (<>
          <View style={{ height: 12 }} />
          <View style={styles.grid}>
            <View style={styles.leftCol}>
              <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>PROJECTS</Text>
            </View>
            <View style={styles.rightCol}>
              {projects && projects.filter((p: any) => p.enabled).map((p: any, i: number) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{p.projectTitle}</Text>
                    <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</Text>
                  </View>
                  {p.description && renderBulletedParagraph(p.description)}
                </View>
              ))}
            </View>
          </View>
        </>)}

        {hasEducation && (<>
          {/* divider before education */}
          <View style={{ height: 1, backgroundColor: '#333', width: '100%', marginVertical: 12 }} />

          {/* Education */}
          <View style={{ height: 12 }} />
          <View style={styles.grid}>
            <View style={styles.leftCol}>
              <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>EDUCATION</Text>
            </View>
            <View style={styles.rightCol}>
              {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</Text>
                    <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#2b2a2a', marginTop: 4 }}>{edu.instituteName}</Text>
                  {edu.resultFormat && edu.result && (
                    <Text style={{ fontSize: 10, color: '#2b2a2a', marginTop: 4 }}>{edu.resultFormat}: {edu.result}</Text>
                  )}
                </View>
              ))}

              {education.preUniversityEnabled && education.preUniversity.instituteName && (
                <View style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>PUC{education.preUniversity.subjectStream ? ` in ${education.preUniversity.subjectStream}` : ''}</Text>
                    <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatResumeEducationDateRange(education.preUniversity)}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#2b2a2a', marginTop: 4 }}>{education.preUniversity.instituteName}{education.preUniversity.boardType ? `, ${education.preUniversity.boardType}` : ''}</Text>
                  {education.preUniversity.resultFormat && education.preUniversity.result && (
                    <Text style={{ fontSize: 10, color: '#2b2a2a', marginTop: 4 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</Text>
                  )}
                </View>
              )}

              {education.sslcEnabled && education.sslc.instituteName && (
                <View style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>SSLC</Text>
                    <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatResumeEducationDateRange(education.sslc)}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#2b2a2a', marginTop: 4 }}>{education.sslc.instituteName}{education.sslc.boardType ? `, ${education.sslc.boardType}` : ''}</Text>
                  {education.sslc.resultFormat && education.sslc.result && (
                    <Text style={{ fontSize: 10, color: '#2b2a2a', marginTop: 4 }}>{education.sslc.resultFormat}: {education.sslc.result}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </>)}

        {skillsLinks.linksEnabled && (
          <>
            <View style={{ height: 1, backgroundColor: '#333', width: '100%', marginVertical: 12 }} />
            <View style={styles.grid}>
              <View style={styles.leftCol}>
                <Text style={{ ...styles.sectionHeading, fontSize: 10, fontFamily: pdfFontFamilyBold, color: primaryColor }}>LINKS</Text>
              </View>
              <View style={styles.rightCol}>
                <View style={{ flexDirection: 'column' }}>
                  {skillsLinks.links?.linkedinEnabled && skillsLinks.links?.linkedinProfile && (
                    <Link src={skillsLinks.links.linkedinProfile} style={{ color: '#2b2a2a', textDecoration: 'none', marginBottom: 4 }}>LinkedIn: {skillsLinks.links.linkedinProfile}</Link>
                  )}
                  {skillsLinks.links?.githubEnabled && skillsLinks.links?.githubProfile && (
                    <Link src={skillsLinks.links.githubProfile} style={{ color: '#2b2a2a', textDecoration: 'none', marginBottom: 4 }}>GitHub: {skillsLinks.links.githubProfile}</Link>
                  )}
                  {skillsLinks.links?.portfolioEnabled && skillsLinks.links?.portfolioUrl && (
                    <Link src={skillsLinks.links.portfolioUrl} style={{ color: '#2b2a2a', textDecoration: 'none' }}>Portfolio: {skillsLinks.links.portfolioUrl}</Link>
                  )}
                </View>
              </View>
            </View>
          </>
        )}

        {hasSkills && (<>
          {/* divider before skills */}
          <View style={{ height: 1, backgroundColor: '#333', width: '100%', marginVertical: 12 }} />

          <View style={{ height: 12 }} />
          <View style={styles.grid}>
            <View style={styles.leftCol}><Text style={{ ...styles.sectionHeading, fontSize: 10, fontFamily: pdfFontFamilyBold, color: primaryColor }}>SKILLS</Text></View>
            <View style={styles.rightCol}><Text style={{ color: '#2b2a2a' }}>{skillsLinks.skills.filter((s: any) => s.enabled && s.skillName).map((s: any) => s.skillName).join(', ')}</Text></View>
          </View>
        </>)}

        {hasCerts && (<>
          <View style={{ height: 1, backgroundColor: '#333', width: '100%', marginVertical: 12 }} />
          <View style={styles.grid}>
            <View style={styles.leftCol}><Text style={{ ...styles.sectionHeading, fontSize: 10, fontFamily: pdfFontFamilyBold, color: primaryColor }}>CERTIFICATIONS</Text></View>
            <View style={styles.rightCol}>
              <View style={{ flexDirection: 'column' }}>
                {certifications.filter((c: any) => c.enabled && (c.certificateTitle || c.providedBy)).map((c: any, i: number) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    {c.certificateTitle ? <Text style={{ color: '#111827', fontFamily: pdfFontFamilyBold }}>{c.certificateTitle}</Text> : null}
                    {c.providedBy ? <Text style={{ color: '#2b2a2a', fontSize: 9, marginTop: 1 }}>Provided by: {c.providedBy}</Text> : null}
                  </View>
                ))}
              </View>
            </View>
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

export default Template12PDF;
