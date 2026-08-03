import React from 'react';
import DOMPurify from 'dompurify';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';

const styles = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 24, paddingLeft: 36, paddingRight: 36, fontSize: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  name: { fontSize: 22, color: '#111827' },
  role: { fontSize: 11, marginTop: 4 },
  contact: { fontSize: 10, color: '#6b7280', textAlign: 'right' },
  sectionHeading: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  itemTitle: { fontSize: 11 },
  itemSub: { fontSize: 10, color: '#6b7280' },
  bullet: { fontSize: 10, color: '#444', marginTop: 4 },
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
  } catch (e) { /* ignore */ }
  return decoded.replace(/<[^>]+>/g, '').trim();
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
        <Text style={{ color: '#2b2a2a', fontSize: 10, lineHeight: 1.4, textAlign: 'justify' }}>
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
    <View style={{ marginTop: 4 }}>
      {lines.map((line, idx) => (
        <View key={idx} style={{ flexDirection: 'row', marginTop: idx > 0 ? 2 : 0 }}>
          <Text style={{ width: 12, flexShrink: 0, color: '#444', fontSize: 10, textAlign: 'justify' }}>
            {line.startsWith('•') ? '•' : ''}
          </Text>
          <Text style={{ flex: 1, color: '#444', fontSize: 10, textAlign: 'justify' }}>
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

const formatYear = (s?: string) => {
  if (!s) return '';
  const str = String(s).trim();
  const y = str.match(/(\d{4})/);
  return y ? y[1] : str;
};

const formatEducationDateRange = (edu: any) => {
  const start = formatYear(edu?.startYear || edu?.startDate || '');
  const end = formatYear(edu?.endYear || edu?.yearOfPassing || '');
  if (start && end) return `${start} — ${end}`;
  return start || end || '';
};

const getStarsByLevel = (skillLevel?: string): string => {
  const level = String(skillLevel || '').toLowerCase().trim();
  if (level === 'beginner') return '*';
  if (level === 'intermediate') return '**';
  if (level === 'advanced') return '****';
  if (level === 'expert') return '*****';
  return '*****';
};

interface Template16PDFProps { data: ResumeData; primaryColor?: string; fontFamily?: string }

const Template16PDF: React.FC<Template16PDFProps> = ({ data, primaryColor = '#111827', fontFamily = 'Times-Roman, serif' }) => {
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

  const addressLine = personal.address && String(personal.address);
  const phone = personal.mobileNumber;
  const email = personal.email;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={{ ...styles.name, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</Text>
            {role && <Text style={{ ...styles.role, fontFamily: pdfFontFamily, color: primaryColor }}>{role}</Text>}
            <View style={{ marginTop: 6 }}>
              {addressLine && <Text style={{ fontSize: 10, color: '#000' }}>{addressLine}</Text>}
              {phone && <Text style={{ fontSize: 10, color: '#000' }}>{phone}</Text>}
            </View>
          </View>
          <View style={{ width: 180 }}>
            {email && <Text style={{ ...styles.contact, color: '#000' }}>{email}</Text>}
            {skillsLinks.linksEnabled && (
              <>
                {skillsLinks.links?.linkedinEnabled && skillsLinks.links?.linkedinProfile && (
                  <Text style={{ ...styles.contact, color: '#000', marginTop: 2 }}>{skillsLinks.links.linkedinProfile}</Text>
                )}
                {skillsLinks.links?.githubEnabled && skillsLinks.links?.githubProfile && (
                  <Text style={{ ...styles.contact, color: '#000', marginTop: 2 }}>{skillsLinks.links.githubProfile}</Text>
                )}
                {skillsLinks.links?.portfolioEnabled && skillsLinks.links?.portfolioUrl && (
                  <Text style={{ ...styles.contact, color: '#000', marginTop: 2 }}>{skillsLinks.links.portfolioUrl}</Text>
                )}
              </>
            )}
          </View>
        </View>

        {personal.aboutCareerObjective && (
          <>
            <View style={{ marginTop: 12 }}>
              <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Career Objective</Text>
              <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
            </View>
            {htmlToPlainText(personal.aboutCareerObjective).split('\n').map((ln, idx) => (
              <Text key={idx} style={{ fontSize: 10, color: '#444', marginTop: idx === 0 ? 6 : 4, textAlign: 'justify' }}>{ln}</Text>
            ))}
          </>
        )}

        {experience.workExperiences.some((exp: any) => exp.enabled) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Experience</Text>
            <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>

          <View style={{ marginTop: 8 }}>
            {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{w.jobTitle} — {w.companyName}{w.location ? `, ${w.location}` : ''}</Text>
                  <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold, color: '#000' }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</Text>
                </View>
                {w.description && renderBulletedParagraph(w.description)}
              </View>
            ))}
          </View>
        </>)}

        {/* Projects - moved directly after Experience */}
        {projects.filter((p: any) => p.enabled).length > 0 && (
          <>
            <View style={{ marginTop: 12 }}>
              <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Projects</Text>
              <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
            </View>
            <View style={{ marginTop: 8 }}>
              {projects.filter((p: any) => p.enabled).map((p: any, i: number) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{p.projectTitle}</Text>
                    <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold, color: '#000' }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</Text>
                  </View>
                  {p.description && renderBulletedParagraph(p.description)}
                  {p.rolesResponsibilities && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 10, fontFamily: pdfFontFamilyBold, color: primaryColor }}>Roles & Responsibilities:</Text>
                      {renderBulletedParagraph(p.rolesResponsibilities)}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {(education.higherEducation.some(edu => edu.enabled) || education.preUniversityEnabled || education.sslcEnabled) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionHeading}>Education</Text>
            <View style={{ height: 1, backgroundColor: '#ddd', width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>

          <View style={{ marginTop: 8 }}>
            {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
              <View key={`he-${i}`} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.itemTitle}>{edu.instituteName}</Text>
                    <Text style={{ ...styles.itemSub, color: '#000' }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}</Text>
                </View>
                  <Text style={{ fontSize: 10, color: '#000' }}>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</Text>
                {edu.resultFormat && edu.result ? (
                  <Text style={{ fontSize: 10, color: '#000', fontFamily: 'Times-Bold', marginTop: 4 }}>{edu.resultFormat}: {edu.result}</Text>
                ) : null}
              </View>
            ))}

            {/* Pre University */}
            {education.preUniversityEnabled && (
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.itemTitle}>{education.preUniversity.instituteName || 'Pre University'}</Text>
                  <Text style={{ ...styles.itemSub, color: '#000' }}>{formatResumeEducationDateRange(education.preUniversity)}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#000', marginTop: 4 }}>Pre University (12th Standard){education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}</Text>
                {education.preUniversity.resultFormat && education.preUniversity.result && (
                  <Text style={{ fontSize: 10, color: '#000', marginTop: 4 }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</Text>
                )}
              </View>
            )}

            {/* SSLC */}
            {education.sslcEnabled && (
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.itemTitle}>{education.sslc.instituteName || 'SSLC'}</Text>
                  <Text style={{ ...styles.itemSub, color: '#000' }}>{formatResumeEducationDateRange(education.sslc)}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#000', marginTop: 4 }}>SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}</Text>
                {education.sslc.resultFormat && education.sslc.result && (
                  <Text style={{ fontSize: 10, color: '#000', marginTop: 4 }}>{education.sslc.resultFormat}: {education.sslc.result}</Text>
                )}
              </View>
            )}
          </View>
        </>)}

        {(skillsLinks.skills || []).some((s: any) => s.enabled && s.skillName) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionHeading}>Skills</Text>
            <View style={{ height: 1, backgroundColor: '#ddd', width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>
          <View style={{ marginTop: 6 }}>{(skillsLinks.skills || []).filter((s: any) => s.enabled && s.skillName).map((s: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 10, color: '#444' }}>• {s.skillName}</Text>
              <Text style={{ fontSize: 10, color: '#111827', textAlign: 'right', width: 60 }}>{getStarsByLevel(s.skillLevel)}</Text>
            </View>
          ))}</View>
        </>)}

        <View style={{ marginTop: 12 }}>
          <Text style={styles.sectionHeading}>Languages</Text>
          <View style={{ height: 1, backgroundColor: '#ddd', width: '100%', marginTop: 4, marginBottom: 0 }} />
        </View>
        <View style={{ marginTop: 6 }}>{((personal as any).languagesKnown || (personal as any).languages || []).map((l: string, i: number) => (
          <View key={i} style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 10, color: '#444' }}>• {l}</Text>
          </View>
        ))}</View>

        {(certifications || []).some((c: any) => c.enabled && c.certificateTitle) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionHeading}>Achievements / Certifications</Text>
            <View style={{ height: 1, backgroundColor: '#ddd', width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>
          <View style={{ marginTop: 6 }}>{(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).map((c: any, i: number) => <Text key={i} style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>{c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}</Text>)}</View>
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

export default Template16PDF;
