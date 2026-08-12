import React from 'react';
import DOMPurify from 'dompurify';
import { Document, Page, View, Text, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';
import { renderPdfRichBullets } from '@/templates/utils/richTextPdf';
import { ContinuationSpacer } from '@/templates/utils/pdfContinuationSpacer';
import { trimTrailingHtml } from '@/templates/utils/richTextHtml';

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 24, paddingLeft: 36, paddingRight: 36, fontSize: 10 },
  header: { textAlign: 'center', marginBottom: 6 },
  name: { fontSize: 28, marginBottom: 4 },
  role: { fontSize: 12, marginTop: 2 },
  contact: { fontSize: 10, color: '#6b7280' },
  divider: { height: 1, marginTop: 12, marginBottom: 0, width: '100%' },
  sectionHeading: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  itemTitle: { fontSize: 10, flexGrow: 1, flexShrink: 1, marginRight: 8 },
  itemSub: { fontSize: 10, color: '#111827', flexShrink: 0 },
  bullet: { fontSize: 10, color: '#444', marginTop: 4 },
});

type RichTextSegment = {
  text: string;
  bold: boolean;
};

const decodeHtmlEntities = (text: string) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const htmlToRichTextLines = (html?: string): RichTextSegment[][] => {
  if (!html) return [];

  const sanitized = DOMPurify.sanitize(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<p[^>]*>/gi, '');

  const lines: RichTextSegment[][] = [];
  let currentLine: RichTextSegment[] = [];
  let boldDepth = 0;

  const addText = (rawText: string) => {
    const decoded = decodeHtmlEntities(rawText);
    const parts = decoded.split(/\r?\n/);

    parts.forEach((part, index) => {
      if (part) {
        currentLine.push({ text: part, bold: boldDepth > 0 });
      }

      if (index < parts.length - 1) {
        if (currentLine.some((segment) => segment.text.trim())) {
          lines.push(currentLine);
        }
        currentLine = [];
      }
    });
  };

  sanitized.split(/(<\/?(?:strong|b)\b[^>]*>|<[^>]+>)/gi).forEach((part) => {
    if (!part) return;

    if (/^<\s*(strong|b)\b/i.test(part)) {
      boldDepth += 1;
      return;
    }

    if (/^<\s*\/\s*(strong|b)\s*>/i.test(part)) {
      boldDepth = Math.max(0, boldDepth - 1);
      return;
    }

    if (/^<[^>]+>$/.test(part)) return;

    addText(part);
  });

  if (currentLine.some((segment) => segment.text.trim())) {
    lines.push(currentLine);
  }

  return lines;
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
  const start = formatMonthYear(edu?.startYear || edu?.startDate || '');
  const end = formatMonthYear(edu?.endYear || edu?.yearOfPassing || '');
  if (start && end) return `${start} — ${end}`;
  return start || end || '';
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

  const renderBulletedParagraph = (html?: string) =>
    renderPdfRichBullets(html, {
      fontSize: 10,
      color: '#444',
      lineHeight: 1.4,
      marginTop: 4,
      boldFontFamily: pdfFontFamilyBold,
      textAlign: 'justify',
    });

  const renderRichText = (html?: string, style: Record<string, string | number> = {}) => {
    const lines = htmlToRichTextLines(html);
    if (lines.length === 0) return null;

    return lines.map((line, lineIndex) => (
      <Text key={lineIndex} style={{ ...style, marginTop: lineIndex === 0 ? 0 : 2 }}>
        {line.map((segment, segmentIndex) => (
          <Text
            key={segmentIndex}
            style={segment.bold ? { fontFamily: pdfFontFamilyBold } : undefined}
          >
            {segment.text}
          </Text>
        ))}
      </Text>
    ));
  };

  const role = (experience && (experience as any).jobRole) || (experience.workExperiences && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle) && experience.workExperiences.find((w: any) => w.enabled && w.jobTitle).jobTitle) || '';

  const mobile = personal.mobileNumber;
  const email = personal.email;
  const linksEnabled = skillsLinks?.linksEnabled ?? true;
  const linkedinPresent = linksEnabled && (skillsLinks?.links?.linkedinEnabled ?? true) ? (skillsLinks?.links?.linkedinProfile || (personal as any).linkedinProfile) : null;
  const githubPresent = linksEnabled && (skillsLinks?.links?.githubEnabled ?? true) ? (skillsLinks?.links?.githubProfile || (personal as any).githubProfile) : null;
  const portfolioPresent = linksEnabled && (skillsLinks?.links?.portfolioEnabled ?? true) ? skillsLinks?.links?.portfolioUrl : null;
  const publicationPresent = linksEnabled && (skillsLinks?.links?.publicationEnabled ?? true) ? skillsLinks?.links?.publicationUrl : null;
  const hasHigherEducation = education.higherEducation.some((edu: any) => edu.enabled);
  const hasPreUniversity = Boolean(education.preUniversityEnabled && (education.preUniversity?.instituteName || education.preUniversity?.subjectStream || education.preUniversity?.boardType || education.preUniversity?.yearOfPassing || education.preUniversity?.result));
  const hasSSLC = Boolean(education.sslcEnabled && (education.sslc?.instituteName || education.sslc?.boardType || education.sslc?.yearOfPassing || education.sslc?.result));

  const normalizeLinkUrl = (url?: string | null) => {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

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
  const publicationLabel = publicationPresent ? extractHandle(publicationPresent) : null;
  const contactLinks = [
    linkedinPresent && { href: normalizeLinkUrl(linkedinPresent), label: linkedinLabel },
    githubPresent && { href: normalizeLinkUrl(githubPresent), label: githubLabel },
    portfolioPresent && { href: normalizeLinkUrl(portfolioPresent), label: portfolioLabel },
    publicationPresent && { href: normalizeLinkUrl(publicationPresent), label: publicationLabel },
  ].filter(Boolean) as Array<{ href: string; label: string | null }>;

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily: pdfFontFamily }]}>
        <ContinuationSpacer />
        <View style={styles.header}>
          <Text style={{ ...styles.name, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{personal.firstName} {(personal.middleName || '')} {personal.lastName}</Text>
          {role && <Text style={{ ...styles.role, fontFamily: pdfFontFamily, color: primaryColor }}>{role}</Text>}
          <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
            {mobile && <Text style={styles.contact}>{mobile}</Text>}
            {mobile && email && <Text style={styles.contact}> | </Text>}
            {email && <Text style={styles.contact}>{email}</Text>}
            {(mobile || email) && contactLinks.length > 0 && <Text style={styles.contact}> | </Text>}
            {contactLinks.map((link, index) => (
              <React.Fragment key={`${link.href}-${index}`}>
                {index > 0 && <Text style={styles.contact}> | </Text>}
                <Link src={link.href} style={{ ...styles.contact, textDecoration: 'none' }}>
                  {link.label || link.href}
                </Link>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>OBJECTIVE</Text>
          <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
        </View>
        {personal.aboutCareerObjective ? (
          <View style={{ marginTop: 6 }}>
            {renderRichText(trimTrailingHtml(personal.aboutCareerObjective), { fontSize: 10, color: '#444', textAlign: 'justify' })}
          </View>
        ) : null}

        {(skillsLinks?.technicalSummary && skillsLinks?.technicalSummaryEnabled) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>TECHNICAL SUMMARY</Text>
            <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>
          <View style={{ marginTop: 6 }}>
            {skillsLinks?.technicalSummary && skillsLinks?.technicalSummaryEnabled && renderPdfRichBullets(skillsLinks.technicalSummary, {
              fontSize: 10,
              color: '#444',
              lineHeight: 1.4,
              marginTop: 0,
              boldFontFamily: pdfFontFamilyBold,
              textAlign: 'justify',
              forceBullets: true,
            })}
          </View>
        </>)}

        {(hasHigherEducation || hasPreUniversity || hasSSLC) && (<>
          <View style={{ marginTop: 12 }}>
            <Text style={{ ...styles.sectionHeading, fontFamily: pdfFontFamilyBold, color: primaryColor }}>EDUCATION</Text>
            <View style={{ height: 1, backgroundColor: primaryColor, width: '100%', marginTop: 4, marginBottom: 0 }} />
          </View>

          <View style={{ marginTop: 8 }}>
            {education.higherEducation.filter(edu => edu.enabled).reverse().map((edu: any, i: number) => (
              <View key={`he-${i}`} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{edu.instituteName}</Text>
                    <Text style={{ fontSize: 10, color: '#101113ff', fontFamily: pdfFontFamilyBold }}>{edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatResumeEducationDateRange(edu)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ fontSize: 10, color: '#6b7280' }}>{edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ''}</Text>
                  {edu.resultFormat && edu.result ? (
                    <Text style={{ fontSize: 10, color: '#6b7280', fontFamily: pdfFontFamilyBold }}>{edu.resultFormat}: {edu.result}</Text>
                  ) : null}
                </View>
                {edu.universityBoard ? <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{edu.universityBoard}</Text> : null}
              </View>
            ))}

            {/* Pre University (PUC/12th) */}
            {hasPreUniversity && (
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{education.preUniversity.instituteName || 'Pre University'}</Text>
                  <Text style={{ fontSize: 10, color: '#101113ff', fontFamily: pdfFontFamilyBold }}>{formatResumeEducationDateRange(education.preUniversity)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ fontSize: 10, color: '#6b7280' }}>Pre University (12th Standard){education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}</Text>
                  {education.preUniversity.resultFormat && education.preUniversity.result ? (
                    <Text style={{ fontSize: 10, color: '#6b7280', fontFamily: pdfFontFamilyBold }}>{education.preUniversity.resultFormat}: {education.preUniversity.result}</Text>
                  ) : null}
                </View>
              </View>
            )}

            {/* SSLC (10th) */}
            {hasSSLC && (
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold }}>{education.sslc.instituteName || 'SSLC'}</Text>
                  <Text style={{ fontSize: 10, color: '#101113ff', fontFamily: pdfFontFamilyBold }}>{formatResumeEducationDateRange(education.sslc)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ fontSize: 10, color: '#6b7280' }}>SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}</Text>
                  {education.sslc.resultFormat && education.sslc.result ? (
                    <Text style={{ fontSize: 10, color: '#6b7280', fontFamily: pdfFontFamilyBold }}>{education.sslc.resultFormat}: {education.sslc.result}</Text>
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
                      <Text style={{ fontSize: 10, fontFamily: pdfFontFamilyBold, color: primaryColor, flexGrow: 1, flexShrink: 1, marginRight: 8 }}>{w.jobTitle}</Text>
                      <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatMonthYear(w.startDate)} — {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 10, color: '#444', fontFamily: pdfFontFamilyBold, flexGrow: 1, flexShrink: 1, marginRight: 8 }}>{w.companyName}</Text>
                      <Text style={{ fontSize: 10, color: '#111827', flexShrink: 0 }}>{w.location}</Text>
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
                  <Text style={{ ...styles.itemTitle, fontFamily: pdfFontFamilyBold, color: primaryColor }}>{p.projectTitle}</Text>
                  <Text style={{ ...styles.itemSub, fontFamily: pdfFontFamilyBold }}>{formatMonthYear(p.startDate)} — {p.currentlyWorking ? 'Present' : formatMonthYear(p.endDate)}</Text>
                </View>
                {p.description && renderBulletedParagraph(p.description)}
                {p.rolesResponsibilities && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 10, fontFamily: pdfFontFamilyBold, color: '#111827' }}>Roles & Responsibilities:</Text>
                    {renderBulletedParagraph(p.rolesResponsibilities)}
                  </View>
                )}
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

export default Template15PDF;
