import React from "react";
import DOMPurify from 'dompurify';
import { Document, Page, Text, View, StyleSheet, Svg, Path, Image } from "@react-pdf/renderer";
import type { ResumeData } from "@/types/resume";
import logo from '@/assets/bowizzy.png';

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 12,
    paddingLeft: 0,
    paddingRight: 0,
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 6,
    paddingLeft: 36,
    paddingRight: 36,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  nameSection: {
    flexDirection: "column",
    flex: 1,
    alignItems: 'flex-start',
    width: '100%'
  },
  name: {
    fontSize: 28,
    color: "#111827",
    marginBottom: 8,
    lineHeight: 1.2,
    textAlign: 'left',
    width: '100%',
    alignSelf: 'flex-start'
  },
  jobTitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  contactLine: {
    fontSize: 11,
    color: "#111827",
    marginTop: 8,
    letterSpacing: 0.2,
    textAlign: 'left',
    width: '100%'
  },
  contactSection: {
    flexDirection: "column",
    alignItems: "flex-end",
    fontSize: 9,
    color: "#4b5563",
    minWidth: 180,
  },
  objective: {
    fontSize: 10,
    color: '#444',
    marginTop: 6,
  },
  linkText: {
    fontSize: 9,
    color: '#06090fff',
    marginTop: 6,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 11,
    color: "#111827",
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 10,
    color: "#111827",
    marginBottom: 0,
  },
  itemSubtitle: {
    fontSize: 10,
    color: "#4a5568",
    marginBottom: 0,
  },
  itemDate: {
    fontSize: 9,
    color: "#111827",
  },
  bulletText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: 'normal',
    marginBottom: 4,
  }
});

interface Template11PDFProps {
  data: ResumeData;
  primaryColor?: string;
  fontFamily?: string;
}

const Template11PDF: React.FC<Template11PDFProps> = ({ data, primaryColor = '#111827', fontFamily = 'Times-Roman' }) => {
  const {
    personal,
    education,
    experience,
    projects,
    skillsLinks,
    certifications,
  } = data;

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

  // Map CSS font families to react-pdf bold fonts
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
    } catch (e) {
      return withBreaks.replace(/<[^>]+>/g, '').trim();
    }
    return withBreaks.replace(/<[^>]+>/g, '').trim();
  };

  // Build contact parts including optional links — respects enabled flags
  const contactParts = (() => {
    const parts: string[] = [];
    if (personal.email) parts.push(personal.email);
    if (personal.mobileNumber) parts.push(personal.mobileNumber);
    if (personal.address) parts.push(personal.address);
    const links = skillsLinks?.links || {} as any;
    if (links.linkedinEnabled && links.linkedinProfile) parts.push(links.linkedinProfile);
    if (links.githubEnabled && links.githubProfile) parts.push(links.githubProfile);
    if (links.portfolioEnabled && links.portfolioUrl) parts.push(links.portfolioUrl);
    if (links.publicationEnabled && links.publicationUrl) parts.push(links.publicationUrl);
    return parts.filter(Boolean);
  })();

  const renderBulletedParagraph = (html?: string, textStyle?: any) => {
    if (!html) return null;
    const sanitized = DOMPurify.sanitize(html || '');

    // Try to extract list items first
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const items: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = liRegex.exec(sanitized)) !== null) {
      let inner = m[1] || '';
      inner = inner.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
      if (inner) items.push(inner);
    }

    // If we found list items, render them as bullets
    if (items.length > 0) {
      return (
        <View style={{ marginTop: 6, width: '100%' }}>
          {items.map((it, idx) => (
            <View key={idx} style={{ flexDirection: 'row', marginTop: idx > 0 ? 4 : 0, alignItems: 'flex-start', width: '100%' }}>
              <Text style={{ width: 10, color: '#000000', fontSize: 10, flexShrink: 0 }}>•</Text>
              <Text style={{ flex: 1, color: '#000000', fontSize: 10, lineHeight: 1.3, textAlign: 'justify' }}>{it}</Text>
            </View>
          ))}
        </View>
      );
    }

    // Fallback: convert paragraphs and line breaks into lines
    let text = sanitized
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .trim();

    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);

    return (
      <View style={{ marginTop: 6, width: '100%' }}>
        {lines.map((line: string, idx: number) => (
          <View key={idx} style={{ marginTop: idx > 0 ? 6 : 0, width: '100%' }}>
            <Text style={{ color: '#000000', fontSize: 10, lineHeight: 1.35, textAlign: 'justify' }}>{line}</Text>
          </View>
        ))}
      </View>
    );
  };

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

  const getFullDegreeName = (degree: string) => degreeMap[degree] || degree;

  const formatMonthYear = (s?: string) => {
    if (!s) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    try {
      const str = String(s).trim();
      const ymdMatch = str.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
      if (ymdMatch) {
        const year = ymdMatch[1];
        const mm = parseInt(ymdMatch[2], 10);
        const mon = months[mm - 1] || String(mm).padStart(2, '0');
        return `${year} ${mon}`;
      }
      const mYMatch = str.match(/^(\d{2})\/(\d{4})$/);
      if (mYMatch) {
        const mm = parseInt(mYMatch[1], 10);
        const year = mYMatch[2];
        const mon = months[mm - 1] || String(mm).padStart(2, '0');
        return `${mon} ${year}`;
      }
      const monthNameMatch = str.match(/^[A-Za-z]{3,}\s+\d{4}$/);
      if (monthNameMatch) return str;
      const yearOnly = str.match(/^(\d{4})$/);
      if (yearOnly) return yearOnly[1];
      return str;
    } catch (e) {
      return String(s);
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Tiled Watermark Pattern — Diagonal Staggered */}
        {(() => {
          const positions = [];
          for (let row = 0; row < 12; row++) {
            for (let col = 0; col < 6; col++) {
              positions.push({
                top: row * 85 - 20,
                left: col * 140 - 40 + (row % 2 === 0 ? 0 : 70),
              });
            }
          }
          return positions.map((pos, i) => (
            <View key={i} style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: -1 }} fixed>
              <Image src={logo} style={{ width: 80, opacity: 0.2, transform: "rotate(-30deg)" }} />
            </View>
          ));
        })()}


        {/* ── Header ── */}
        <View style={{ paddingTop: 18, paddingBottom: 6, paddingLeft: 36, paddingRight: 36 }}>
          <Text style={{ fontSize: 36, fontFamily: pdfFontFamilyBold, color: primaryColor, marginBottom: 0, lineHeight: 1, textAlign: 'left' }}>
            {personal.firstName}{personal.middleName ? ' ' + personal.middleName : ''}{personal.lastName ? ' ' + personal.lastName : ''}
          </Text>
          <Text style={{ fontSize: 11, color: primaryColor, marginTop: 8, textAlign: 'left' }}>
            {contactParts.join(' | ')}
          </Text>
        </View>

        {/* ── Content ── */}
        <View style={{ paddingLeft: 36, paddingRight: 36, paddingBottom: 36 }}>

          {/* Career Objective */}
          {personal.aboutCareerObjective && personal.aboutCareerObjective.trim() !== '' && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>CAREER OBJECTIVE</Text>
              <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 6 }} />
              <Text style={{ fontSize: 11, color: '#000000', fontFamily: pdfFontFamily, lineHeight: 1.6 }}>
                {htmlToPlainText(personal.aboutCareerObjective)}
              </Text>
            </View>
          )}

          {/* Experience */}
          {experience.workExperiences.filter((w: any) => w.enabled).length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>EXPERIENCE</Text>
              <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
              {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, fontFamily: pdfFontFamilyBold, color: '#111827', flex: 1, marginRight: 8 }}>{w.companyName}</Text>
                    <Text style={{ fontSize: 11, color: '#111827', fontFamily: pdfFontFamilyBold, textAlign: 'right' }}>
                      {formatMonthYear(w.startDate)} - {w.currentlyWorking ? 'Present' : formatMonthYear(w.endDate)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: '#000000', fontFamily: pdfFontFamilyBold, flex: 1, marginRight: 8 }}>{w.jobTitle}</Text>
                    {w.location ? <Text style={{ fontSize: 11, color: '#000000', fontFamily: pdfFontFamilyBold, textAlign: 'right' }}>{w.location}</Text> : null}
                  </View>
                  {w.description ? (
                    <View style={{ width: '100%' }}>
                      {renderBulletedParagraph(w.description, { fontSize: 11, color: '#000000' })}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {(education.higherEducation.some(edu => edu.enabled) || education.preUniversityEnabled || education.sslcEnabled) && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>EDUCATION</Text>
              <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />

              {education.higherEducation.some(edu => edu.enabled) && (
                <>
                  {[...education.higherEducation].filter((edu: any) => edu.enabled).sort((a: any, b: any) => {
                    const parseYearKey = (val: string) => {
                      if (!val) return -Infinity;
                      const parts = val.split('-');
                      const y = parseInt(parts[0], 10) || 0;
                      const m = parseInt(parts[1], 10) || 0;
                      return y * 100 + m;
                    };
                    const aKey = parseYearKey(a.endYear || a.startYear || '');
                    const bKey = parseYearKey(b.endYear || b.startYear || '');
                    return aKey - bKey;
                  }).map((edu: any, idx: number) => (
                    <View key={idx} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000', flex: 1, marginRight: 8 }}>{edu.instituteName}</Text>
                        <Text style={{ fontSize: 10, color: '#000000', fontFamily: pdfFontFamilyBold }}>
                          {formatMonthYear(edu.startYear)} - {edu.currentlyPursuing ? 'Present' : formatMonthYear(edu.endYear)}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: '#000000', fontFamily: pdfFontFamily, marginTop: 3 }}>
                        {getFullDegreeName(edu.degree)}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                      </Text>
                      {edu.resultFormat && edu.result ? (
                        <Text style={{ fontSize: 10, color: '#000000', fontFamily: pdfFontFamily, marginTop: 3 }}>
                          {edu.resultFormat}: {edu.result}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </>
              )}

              {/* Pre University */}
              {education.preUniversityEnabled && (
                <View style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000', flex: 1, marginRight: 8 }}>{education.preUniversity.instituteName || 'Pre University'}</Text>
                    <Text style={{ fontSize: 10, color: '#000000', fontFamily: pdfFontFamilyBold }}>{formatMonthYear(education.preUniversity.yearOfPassing) || ''}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#000000', fontFamily: pdfFontFamily, marginTop: 3 }}>
                    Pre University (12th Standard){education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}
                  </Text>
                  {education.preUniversity.resultFormat && education.preUniversity.result ? (
                    <Text style={{ fontSize: 10, color: '#000000', fontFamily: pdfFontFamily, marginTop: 3 }}>
                      {education.preUniversity.resultFormat}: {education.preUniversity.result}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* SSLC */}
              {education.sslcEnabled && (
                <View style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000', flex: 1, marginRight: 8 }}>{education.sslc.instituteName || 'SSLC'}</Text>
                    <Text style={{ fontSize: 10, color: '#000000', fontFamily: pdfFontFamilyBold }}>{education.sslc.yearOfPassing || ''}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#000000', fontFamily: pdfFontFamily, marginTop: 3 }}>
                    SSLC (10th Standard){education.sslc.boardType ? ` — ${education.sslc.boardType}` : ''}
                  </Text>
                  {education.sslc.resultFormat && education.sslc.result ? (
                    <Text style={{ fontSize: 11, color: '#000000', fontFamily: pdfFontFamily, marginTop: 3 }}>
                      {education.sslc.resultFormat}: {education.sslc.result}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          )}

          {/* Projects */}
          {projects && projects.filter((p: any) => p.enabled).length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>PROJECTS</Text>
              <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
              {projects.filter((p: any) => p.enabled).map((proj: any, idx: number) => (
                <View key={idx} style={{ marginBottom: 12 }}>
                  {/* Title + dates */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                    <Text style={{ fontSize: 12, fontFamily: pdfFontFamilyBold, color: '#111827', flex: 1, marginRight: 8 }}>{proj.projectTitle}</Text>
                    <Text style={{ fontSize: 11, color: '#111827', fontFamily: pdfFontFamilyBold, textAlign: 'right' }}>
                      {formatMonthYear(proj.startDate)}{' – '}{proj.currentlyWorking ? 'Present' : formatMonthYear(proj.endDate)}
                    </Text>
                  </View>
                  {/* Project type */}
                  {proj.projectType ? (
                    <Text style={{ fontSize: 10, color: '#555555', fontFamily: pdfFontFamily, marginBottom: 4 }}>{proj.projectType}</Text>
                  ) : null}
                  {/* Description */}
                  {proj.description && proj.description.replace(/<[^>]*>/g, '').trim() ? (
                    <View style={{ marginBottom: 4 }}>
                      {renderBulletedParagraph(proj.description, { fontSize: 11, color: '#000000' })}
                    </View>
                  ) : null}
                  {/* Roles & Responsibilities */}
                  {proj.rolesResponsibilities && proj.rolesResponsibilities.replace(/<[^>]*>/g, '').trim() ? (
                    <View style={{ marginTop: 3 }}>
                      <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000', marginBottom: 2 }}>Role:</Text>
                      <View style={{ marginLeft: 8 }}>
                        {renderBulletedParagraph(proj.rolesResponsibilities, { fontSize: 11, color: '#000000' })}
                      </View>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Certifications */}
          {certifications.filter((c: any) => c.enabled).length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>TECHNICAL CERTIFICATIONS</Text>
              <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
              {certifications.filter((c: any) => c.enabled).map((cert: any, idx: number) => (
                <View key={idx} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000', flex: 1, marginRight: 8 }}>{cert.certificateTitle}</Text>
                    <Text style={{ fontSize: 10, color: '#000000', fontFamily: pdfFontFamilyBold }}>{cert.date}</Text>
                  </View>
                  {cert.description ? (
                    <Text style={{ fontSize: 11, color: '#000000', fontFamily: pdfFontFamily, marginTop: 3 }}>
                      {htmlToPlainText(cert.description)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Technical Summary */}
          {skillsLinks.technicalSummaryEnabled &&
            skillsLinks.technicalSummary &&
            skillsLinks.technicalSummary.replace(/<[^>]*>/g, '').trim() !== '' && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>TECHNICAL SUMMARY</Text>
                <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
                <Text style={{ fontSize: 11, color: '#000000', fontFamily: pdfFontFamily, lineHeight: 1.6 }}>
                  {htmlToPlainText(skillsLinks.technicalSummary)}
                </Text>
              </View>
            )}

          {/* Skills */}
          {skillsLinks.skills.filter((s: any) => s.enabled && s.skillName).length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>SKILLS</Text>
              <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {skillsLinks.skills
                  .filter((s: any) => s.enabled && s.skillName)
                  .map((s: any, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000' }}>{s.skillName}</Text>
                      {s.skillLevel ? (
                        <Text style={{ fontSize: 10, color: '#555555', fontFamily: pdfFontFamily, marginLeft: 3 }}>({s.skillLevel})</Text>
                      ) : null}
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Languages */}
          {personal.languagesKnown && personal.languagesKnown.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>LANGUAGES</Text>
              <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {personal.languagesKnown.map((lang: string, idx: number) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000' }}>{lang}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Links */}
          {skillsLinks.linksEnabled && (() => {
            const links = skillsLinks.links || {} as any;
            const activeLinks = [
              links.linkedinEnabled && links.linkedinProfile ? { label: 'LinkedIn', url: links.linkedinProfile } : null,
              links.githubEnabled && links.githubProfile ? { label: 'GitHub', url: links.githubProfile } : null,
              links.portfolioEnabled && links.portfolioUrl ? { label: 'Portfolio', url: links.portfolioUrl } : null,
              links.publicationEnabled && links.publicationUrl ? { label: 'Publication', url: links.publicationUrl } : null,
            ].filter(Boolean) as { label: string; url: string }[];

            return activeLinks.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>LINKS</Text>
                <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
                {activeLinks.map((link, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000', minWidth: 80 }}>{link.label}: </Text>
                    <Text style={{ fontSize: 11, color: '#1a56db', fontFamily: pdfFontFamily, flex: 1 }}>{link.url}</Text>
                  </View>
                ))}
              </View>
            ) : null;
          })()}

        </View>

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
          color: '#d1d1d1',
        }} fixed>
          <Text style={{ color: 'rgb(216, 211, 211)', fontSize: 10, letterSpacing: 0.5 }}>www.bowizzy.com</Text>
          <Text style={{ color: 'rgb(216, 211, 211)', fontSize: 10, letterSpacing: 0.5 }}>Powered by Wizzybox</Text>
        </View>

      </Page>
    </Document>
  );
};

export default Template11PDF;