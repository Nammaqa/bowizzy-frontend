import React from "react";
import DOMPurify from 'dompurify';
import { Document, Page, Text, View, StyleSheet, Svg, Path, Image } from "@react-pdf/renderer";
import type { ResumeData } from "@/types/resume";
import { formatEducationDateRange as formatResumeEducationDateRange, formatEducationMonthYear as formatResumeEducationMonthYear } from '@/templates/utils/educationDates';
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
    textAlign: 'justify',
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
    textAlign: 'justify',
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

  // Pick the standard PDF font matching the requested bold/italic combination.
  // react-pdf ships Times and Helvetica in all four variants.
  const getPdfFontVariant = (bold: boolean, italic: boolean) => {
    if (pdfFontFamily === 'Helvetica') {
      if (bold && italic) return 'Helvetica-BoldOblique';
      if (bold) return 'Helvetica-Bold';
      if (italic) return 'Helvetica-Oblique';
      return 'Helvetica';
    }
    if (bold && italic) return 'Times-BoldItalic';
    if (bold) return 'Times-Bold';
    if (italic) return 'Times-Italic';
    return 'Times-Roman';
  };

  const decodeHtmlEntities = (value: string) =>
    value
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&'); // keep last so "&amp;lt;" doesn't double-decode

  const stripTags = (html: string) => decodeHtmlEntities(html.replace(/<[^>]+>/g, '')).trim();

  // Tags that may carry inline formatting are kept; every other tag is dropped.
  const INLINE_TAG_PATTERN = 'b|strong|i|em|u|span|font';
  const stripNonInlineTags = (html: string) =>
    html.replace(new RegExp(`<(?!\\/?(?:${INLINE_TAG_PATTERN})\\b)[^>]*>`, 'gi'), '');

  const VOID_TAGS = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'source']);

  // Some editors emit <span style="font-weight:700"> instead of <b>.
  const readStyleFlags = (rawTag: string) => {
    const styleMatch =
      rawTag.match(/style\s*=\s*"([^"]*)"/i) || rawTag.match(/style\s*=\s*'([^']*)'/i);
    const css = (styleMatch?.[1] || '').toLowerCase();
    return {
      bold: /font-weight\s*:\s*(bold(er)?|[6-9]00)/.test(css),
      italic: /font-style\s*:\s*italic/.test(css),
      underline: /text-decoration[^:]*:[^;]*underline/.test(css),
    };
  };

  type InlineSegment = { text: string; bold: boolean; italic: boolean; underline: boolean };

  /** Split a fragment of inline HTML into runs that each carry their own styling. */
  const parseInlineSegments = (html: string): InlineSegment[] => {
    const segments: InlineSegment[] = [];
    const stack: { tag: string; bold: boolean; italic: boolean; underline: boolean }[] = [];
    const activeFlags = () => ({
      bold: stack.some((entry) => entry.bold),
      italic: stack.some((entry) => entry.italic),
      underline: stack.some((entry) => entry.underline),
    });

    const pushText = (raw: string) => {
      if (!raw) return;
      const text = decodeHtmlEntities(raw);
      if (!text) return;
      segments.push({ text, ...activeFlags() });
    };

    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(html)) !== null) {
      pushText(html.slice(lastIndex, match.index));

      const rawTag = match[0];
      const tag = match[1].toLowerCase();
      const isClosing = rawTag.startsWith('</');

      if (isClosing) {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].tag === tag) {
            stack.splice(i, 1);
            break;
          }
        }
      } else if (!VOID_TAGS.has(tag) && !/\/>\s*$/.test(rawTag)) {
        const flags = readStyleFlags(rawTag);
        stack.push({
          tag,
          bold: flags.bold || tag === 'b' || tag === 'strong',
          italic: flags.italic || tag === 'i' || tag === 'em',
          underline: flags.underline || tag === 'u',
        });
      }

      lastIndex = tagRegex.lastIndex;
    }

    pushText(html.slice(lastIndex));
    return segments;
  };

  /** Render one line of inline HTML as styled <Text> runs. */
  const renderInlineRuns = (html: string) =>
    parseInlineSegments(html).map((segment, idx) => (
      <Text
        key={idx}
        style={{
          fontFamily: getPdfFontVariant(segment.bold, segment.italic),
          ...(segment.underline ? { textDecoration: 'underline' as const } : {}),
        }}
      >
        {segment.text}
      </Text>
    ));

  /** Break rich text into bullet items (from <li>) or plain lines, keeping inline tags. */
  const splitIntoBlocks = (sanitized: string): { html: string; bullet: boolean }[] => {
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const items: { html: string; bullet: boolean }[] = [];
    let match: RegExpExecArray | null;

    while ((match = liRegex.exec(sanitized)) !== null) {
      const inner = stripNonInlineTags(match[1] || '').trim();
      if (stripTags(inner)) items.push({ html: inner, bullet: true });
    }

    if (items.length > 0) return items;

    const withBreaks = sanitized
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6])>/gi, '\n');

    return stripNonInlineTags(withBreaks)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => stripTags(line))
      .map((html) => ({ html, bullet: false }));
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

  /**
   * Renders rich text (bold / italic / underline / bullets) authored in the
   * resume builder's editor. Inline formatting is preserved by emitting one
   * styled <Text> run per formatting change.
   */
  const renderBulletedParagraph = (
    html?: string,
    textStyle?: { fontSize?: number; lineHeight?: number; color?: string }
  ) => {
    if (!html) return null;
    const sanitized = DOMPurify.sanitize(html || '');
    const blocks = splitIntoBlocks(sanitized);
    if (blocks.length === 0) return null;

    const fontSize = textStyle?.fontSize ?? 10;
    const color = textStyle?.color ?? '#000000';
    const isBulleted = blocks[0].bullet;
    const lineHeight = textStyle?.lineHeight ?? (isBulleted ? 1.3 : 1.35);

    if (isBulleted) {
      return (
        <View style={{ marginTop: 6, width: '100%' }}>
          {blocks.map((block, idx) => (
            <View
              key={idx}
              style={{ flexDirection: 'row', marginTop: idx > 0 ? 4 : 0, alignItems: 'flex-start', width: '100%' }}
            >
              <Text style={{ width: 10, color, fontSize, flexShrink: 0 }}>•</Text>
              <Text style={{ flex: 1, color, fontSize, lineHeight, textAlign: 'justify', fontFamily: pdfFontFamily }}>
                {renderInlineRuns(block.html)}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={{ marginTop: 6, width: '100%' }}>
        {blocks.map((block, idx) => (
          <View key={idx} style={{ marginTop: idx > 0 ? 6 : 0, width: '100%' }}>
            <Text style={{ color, fontSize, lineHeight, textAlign: 'justify', fontFamily: pdfFontFamily }}>
              {renderInlineRuns(block.html)}
            </Text>
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

  const formatEducationDateRange = (edu: any) => {
    const start = formatMonthYear(edu?.startYear || edu?.startDate || '');
    const end = formatMonthYear(edu?.endYear || edu?.yearOfPassing || '');
    if (start && end) return `${start} - ${end}`;
    return start || end || '';
  };

  // Always show both start and end for a degree when both exist (no single-date collapse).
  const formatHigherEducationRange = (edu: any) => {
    const start = formatResumeEducationMonthYear(edu?.startYear || edu?.startDate || '');
    const end = formatResumeEducationMonthYear(edu?.endYear || edu?.yearOfPassing || edu?.endDate || '');
    if (start && end) return `${start} - ${end}`;
    return start || end || '';
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
            <View style={{ marginBottom: 12 }} minPresenceAhead={60}>
              <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>CAREER OBJECTIVE</Text>
              <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 6 }} />
              {renderBulletedParagraph(personal.aboutCareerObjective, { fontSize: 11, lineHeight: 1.6 })}
            </View>
          )}

          {/* Experience */}
          {experience.workExperiences.filter((w: any) => w.enabled).length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <View minPresenceAhead={90}>
                <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>EXPERIENCE</Text>
                <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
              </View>
              {experience.workExperiences.filter((w: any) => w.enabled).map((w: any, i: number) => (
                <View key={i} style={{ marginBottom: 12 }} wrap={false}>
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
                      {renderBulletedParagraph(w.description)}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {(education.higherEducation.some(edu => edu.enabled) || education.preUniversityEnabled || education.sslcEnabled) && (
            <View style={{ marginBottom: 12 }}>
              <View minPresenceAhead={70}>
                <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>EDUCATION</Text>
                <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
              </View>

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
                    <View key={idx} style={{ marginBottom: 8 }} wrap={false}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000', flex: 1, marginRight: 8 }}>{edu.instituteName}</Text>
                        <Text style={{ fontSize: 10, color: '#000000', fontFamily: pdfFontFamilyBold }}>
                              {edu.currentlyPursuing ? `${formatResumeEducationMonthYear(edu.startYear || edu.startDate)} - Present` : formatHigherEducationRange(edu)}
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
                <View style={{ marginBottom: 8 }} wrap={false}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000', flex: 1, marginRight: 8 }}>{education.preUniversity.instituteName || 'Pre University'}</Text>
                      <Text style={{ fontSize: 10, color: '#000000', fontFamily: pdfFontFamilyBold }}>{formatResumeEducationDateRange(education.preUniversity)}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#000000', fontFamily: pdfFontFamily, marginTop: 3 }}>
                    Pre University (12th Standard){education.preUniversity.boardType ? ` — ${education.preUniversity.boardType}` : ''} {education.preUniversity.subjectStream ? ` — ${education.preUniversity.subjectStream}` : ''}
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
                <View style={{ marginBottom: 8 }} wrap={false}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000', flex: 1, marginRight: 8 }}>{education.sslc.instituteName || 'SSLC'}</Text>
                      <Text style={{ fontSize: 10, color: '#000000', fontFamily: pdfFontFamilyBold }}>{formatResumeEducationDateRange(education.sslc)}</Text>
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
              <View minPresenceAhead={100}>
                <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>PROJECTS</Text>
                <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
              </View>
              {projects.filter((p: any) => p.enabled).map((proj: any, idx: number) => (
                <View key={idx} style={{ marginBottom: 12 }} wrap={false}>
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
                      {renderBulletedParagraph(proj.description)}
                    </View>
                  ) : null}
                  {/* Roles & Responsibilities */}
                  {proj.rolesResponsibilities && proj.rolesResponsibilities.replace(/<[^>]*>/g, '').trim() ? (
                    <View style={{ marginTop: 3 }}>
                      <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000', marginBottom: 2 }}>Role:</Text>
                      <View style={{ marginLeft: 8 }}>
                        {renderBulletedParagraph(proj.rolesResponsibilities)}
                      </View>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Certifications */}
          {certifications.filter((c: any) => c.enabled && c.certificateTitle && c.certificateTitle.trim()).length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <View minPresenceAhead={60}>
                <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>TECHNICAL CERTIFICATIONS</Text>
                <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
              </View>
              {certifications.filter((c: any) => c.enabled && c.certificateTitle && c.certificateTitle.trim()).map((cert: any, idx: number) => (
                <View key={idx} style={{ marginBottom: 8 }} wrap={false}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 11, fontFamily: pdfFontFamilyBold, color: '#000000', flex: 1, marginRight: 8 }}>{cert.certificateTitle}</Text>
                    <Text style={{ fontSize: 10, color: '#000000', fontFamily: pdfFontFamilyBold }}>{cert.date}</Text>
                  </View>
                  {cert.description ? renderBulletedParagraph(cert.description) : null}
                </View>
              ))}
            </View>
          )}

          {/* Technical Summary */}
          {skillsLinks.technicalSummaryEnabled &&
            skillsLinks.technicalSummary &&
            skillsLinks.technicalSummary.replace(/<[^>]*>/g, '').trim() !== '' && (
              <View style={{ marginBottom: 12 }} minPresenceAhead={60}>
                <Text style={{ fontSize: 13, fontFamily: pdfFontFamilyBold, color: primaryColor, letterSpacing: 1.2, marginBottom: 4 }}>TECHNICAL SUMMARY</Text>
                <View style={{ height: 1, backgroundColor: '#333333', width: '100%', marginBottom: 8 }} />
                {renderBulletedParagraph(skillsLinks.technicalSummary)}
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