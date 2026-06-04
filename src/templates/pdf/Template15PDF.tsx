import React from 'react';
import DOMPurify from 'dompurify';
import { Document, Page, View, Text, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 24, paddingLeft: 36, paddingRight: 36, fontSize: 10 },
  header: { textAlign: 'center', marginBottom: 6 },
  name: { fontSize: 28, marginBottom: 4 },
  role: { fontSize: 12, marginTop: 2 },
  contact: { fontSize: 10, color: '#6b7280' },
  divider: { height: 1, marginTop: 12, marginBottom: 0, width: '100%' },
  sectionHeading: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  itemTitle: { fontSize: 12 },
  itemSub: { fontSize: 11, color: '#111827' },
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

interface Template15PDFProps {
  data: ResumeData;
  primaryColor?: string;
  fontFamily?: string;
}

const Template15PDF: React.FC<Template15PDFProps> = ({ data, primaryColor = '#0b60d6', fontFamily = 'Times-Roman, serif' }) => {
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

  const role = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';

  const mobile = personal.mobileNumber;
  const email = personal.email;
  const linksEnabled = skillsLinks?.linksEnabled ?? true;
  const linkedinPresent = linksEnabled && (skillsLinks?.links?.linkedinEnabled ?? true) ? (skillsLinks?.links?.linkedinProfile || (personal as any).linkedinProfile) : null;
  const githubPresent = linksEnabled && (skillsLinks?.links?.githubEnabled ?? true) ? (skillsLinks?.links?.githubProfile || (personal as any).githubProfile) : null;
  const portfolioPresent = linksEnabled && (skillsLinks?.links?.portfolioEnabled ?? true) ? skillsLinks?.links?.portfolioUrl : null;

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

  const linkedinLabel = linkedinPresent ? extractHandle(linkedinPresent) : null;
  const githubLabel = githubPresent ? extractHandle(githubPresent) : null;
  const portfolioLabel = portfolioPresent ? extractHandle(portfolioPresent) : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ ...styles.name, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</Text>
          {role && <Text style={{ ...styles.role, fontFamily: pdfFontFamily, color: primaryColor }}>{role}</Text>}
          <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
            {mobile && <Text style={styles.contact}>{mobile}</Text>}
            {mobile && email && <Text style={styles.contact}> | </Text>}
            {email && <Text style={styles.contact}>{email}</Text>}
            {(mobile || email) && linkedinPresent && <Text style={styles.contact}> | </Text>}
            {linkedinPresent && (
              <Link src={linkedinPresent} style={{ ...styles.contact, color: '#0a66c2' }}>
                {linkedinLabel}
              </Link>
            )}
            {linkedinPresent && githubPresent && <Text style={styles.contact}> | </Text>}
            {githubPresent && (
              <Link src={githubPresent} style={{ ...styles.contact, color: '#111' }}>
                {githubLabel}
              </Link>
            )}
            {githubPresent && portfolioPresent && <Text style={styles.contact}> | </Text>}
            {portfolioPresent && (
              <Link src={portfolioPresent} style={{ ...styles.contact, color: '#000' }}>
                {portfolioLabel}
              </Link>
            )}
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>OBJECTIVE</Text>
          <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
        </View>
        {personal.aboutCareerObjective ? <Text style={{ fontSize: 10, color: '#444', marginTop: 6 }}>{htmlToPlainText(personal.aboutCareerObjective)}</Text> : null}

        {(skillsLinks?.technicalSummary && skillsLinks?.technicalSummaryEnabled) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>SUMMARY</Text>
            <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>
          <View style={{ marginTop: 6 }}>
            {skillsLinks?.technicalSummary && skillsLinks?.technicalSummaryEnabled && (<Text style={{ fontSize: 10, color: '#444' }}>{htmlToPlainText(skillsLinks.technicalSummary)}</Text>)}
          </View>
        </>)}

        {(education.higherEducation.some(edu => edu.enabled) || education.preUniversityEnabled || education.sslcEnabled) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>EDUCATION</Text>
            <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>

          <View style={{ marginTop: 8 }}>
            {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
              <View key={`he-${i}`} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{edu.instituteName}</Text>
                  <Text style={{ fontSize: 11, color: '#101113ff', fontFamily: pdfFontFamilyBold }}>{formatMonthYear(edu.startYear)} — {edu.currentlyPursuing ? 'Present' : formatMonthYear(edu.endYear)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ fontSize: 11, color: '#6b7280' }}>{edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ''}</Text>
                  {edu.resultFormat && edu.result ? (
                    <Text style={{ fontSize: 11, color: '#6b7280', fontFamily: pdfFontFamilyBold }}>{edu.resultFormat}: {edu.result}</Text>
                  ) : null}
                </View>
                {edu.universityBoard ? <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{edu.universityBoard}</Text> : null}
              </View>
            ))}

            {/* Pre University (PUC/12th) */}
            {education.preUniversityEnabled && (
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{education.preUniversity.instituteName || 'Pre University'}</Text>
                  <Text style={{ fontSize: 12, color: '#101113ff', fontFamily: pdfFontFamilyBold }}>{formatMonthYear(education.preUniversity.yearOfPassing) || ''}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ fontSize: 11, color: '#6b7280' }}>Pre University (12th Standard){education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}</Text>
                  {education.preUniversity.resultFormat && education.preUniversity.result ? (
                    <Text style={{ fontSize: 11, color: '#6b7280', fontFamily: pdfFontFamilyBold }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</Text>
                  ) : null}
                </View>
              </View>
            )}

            {/* SSLC (10th) */}
            {education.sslcEnabled && (
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{education.sslc.instituteName || 'SSLC'}</Text>
                  <Text style={{ fontSize: 11, color: '#101113ff', fontFamily: pdfFontFamilyBold }}>{education.sslc.yearOfPassing ? formatMonthYear(education.sslc.yearOfPassing) : ''}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ fontSize: 11, color: '#6b7280' }}>SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}</Text>
                  {education.sslc.resultFormat && education.sslc.result ? (
                    <Text style={{ fontSize: 11, color: '#6b7280', fontFamily: pdfFontFamilyBold }}>{education.sslc.resultFormat}: {education.sslc.result}</Text>
                  ) : null}
                </View>
              </View>
            )}
          </View>
        </>)}

        {(skillsLinks.skills || []).some((s: any) => s.enabled && s.skillName) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>SKILLS</Text>
            <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>
          <View style={{ marginTop: 6 }}>
            {(() => {
              const skills = (skillsLinks.skills || []).filter((s: any) => s.enabled && s.skillName).map((s: any) => s.skillName);
              const categories: Record<string, string[]> = {
                'Programming Languages': [],
                'Web Development': [],
                'Databases': [],
                'Tools': [],
                'Others': [],
              };
              const langRegex = /(python|java|c\+\+|c#|javascript|typescript|ruby|go|php)/i;
              const webRegex = /(html|css|javascript|react|angular|vue|next|node|express)/i;
              const dbRegex = /(mysql|mongodb|postgres|postgresql|redis|sql)/i;
              const toolsRegex = /(git|docker|jenkins|kubernetes|aws|gcp|azure|terraform|ci|cd)/i;

              skills.forEach(sk => {
                if (langRegex.test(sk)) categories['Programming Languages'].push(sk);
                else if (webRegex.test(sk)) categories['Web Development'].push(sk);
                else if (dbRegex.test(sk)) categories['Databases'].push(sk);
                else if (toolsRegex.test(sk)) categories['Tools'].push(sk);
                else categories['Others'].push(sk);
              });

              return Object.entries(categories).map(([cat, items]) => items.length ? (
                <View key={cat} style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 10, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{cat}</Text>
                  <Text style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{items.join(', ')}</Text>
                </View>
              ) : null);
            })()}
          </View>
        </>)}

        {(certifications || []).some((c: any) => c.enabled && c.certificateTitle) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>CERTIFICATIONS</Text>
            <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>
          <View style={{ marginTop: 6 }}>
            {(certifications || []).filter((c: any) => c.enabled && c.certificateTitle).map((c: any, i: number) => (
              <Text key={i} style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>{c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}</Text>
            ))}
          </View>
        </>)}

        {experience.workExperiences.some((exp: any) => exp.enabled) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>EXPERIENCE</Text>
            <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>

          <View style={{ marginTop: 8 }}>
            {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
              <View key={i} style={{ marginBottom: 8 }}>
                {w.jobTitle ? (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{w.jobTitle}</Text>
                      <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 10, color: '#444', fontFamily: pdfFontFamilyBold }}>{w.companyName}</Text>
                      <Text style={{ fontSize: 10, color: '#111827' }}>{w.location}</Text>
                    </View>
                  </>
                ) : (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{w.companyName}{w.location ? `, ${w.location}` : ''}</Text>
                    <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</Text>
                  </View>
                )}

                {w.description && renderBulletedParagraph(w.description)}
              </View>
            ))}
          </View>
        </>)}

        {projects.some((p: any) => p.enabled) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>ACADEMIC PROJECTS</Text>
            <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>
          <View style={{ marginTop: 8 }}>
            {projects.filter((p: any) => p.enabled).map((p: any, i: number) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{p.projectTitle}</Text>
                  <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</Text>
                </View>
                {p.description && renderBulletedParagraph(p.description)}
                {p.rolesResponsibilities && renderBulletedParagraph(p.rolesResponsibilities)}
              </View>
            ))}
          </View>
        </>)}

        {/* Footer */}
        <View style={{
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
        </View>
      </Page>
    </Document>
  );
};

export default Template15PDF;