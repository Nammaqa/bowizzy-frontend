import React from 'react';
import { Document, Page, View, Text, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';
import { normalizeProfileUrl } from '../linkUtils';
const htmlToPlain = (html?: string) => {
  if (!html) return '';
  let t = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>|<\/li>/gi, '\n').replace(/<li>/gi, '• ').replace(/<[^>]+>/g, '');
  return t.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
};
const renderBullets = (html?: string) => {
  if (!html) return null;
  const lines = htmlToPlain(html).split('\n').filter(l => l.trim());
  return (
    <View style={{ marginTop: 2 }}>
      {lines.map((line, i) => (
        <View key={i} style={{ flexDirection: 'row', marginTop: i > 0 ? 1 : 0 }}>
          <Text style={{ width: 10, flexShrink: 0, fontSize: 9, color: '#333' }}>{line.startsWith('•') ? '•' : ''}</Text>
          <Text style={{ flex: 1, fontSize: 9, color: '#333', lineHeight: 1.5 }}>{line.startsWith('•') ? line.substring(1).trim() : line}</Text>
        </View>
      ))}
    </View>
  );
};
const fmtDate = (s?: string) => {
  if (!s) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = String(s).match(/^(\d{4})-(\d{2})/);
  if (m) { const mm = parseInt(m[2], 10); return mm >= 1 && mm <= 12 ? `${months[mm - 1]} ${m[1]}` : m[1]; }
  return String(s);
};
const fmtYear = (s?: string) => { if (!s) return ''; const m = String(s).match(/(\d{4})/); return m ? m[1] : String(s); };
const fmtResult = (result?: string, format?: string) => {
  if (!result) return '';
  if (!format) return result;
  return format.toLowerCase() === 'percentage' ? `${result}%` : `${format}: ${result}`;
};
const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 24, paddingLeft: 0, paddingRight: 0, fontSize: 9, fontFamily: 'Helvetica' },
  header: { backgroundColor: '#1e3a5f', paddingVertical: 24, paddingHorizontal: 40, color: '#fff' },
  name: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 10, color: '#c4d9f2', marginTop: 4 },
  content: { paddingHorizontal: 40, paddingTop: 16 },
  sectionHeading: { fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase', marginTop: 14, marginBottom: 2 },
  divider: { height: 1.5, width: '100%', marginBottom: 6 },
  body: { fontSize: 9, color: '#333', lineHeight: 1.5, textAlgin: 'justify' },
  itemTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  itemSub: { fontSize: 9, color: '#555' },
});
interface Props { data: ResumeData; primaryColor?: string; }
const AiTemplate2PDF: React.FC<Props> = ({ data, primaryColor = '#1e3a5f' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const contactParts = [personal.email, personal.mobileNumber, personal.address].filter(Boolean);
  const linkedin = normalizeProfileUrl(skillsLinks?.links?.linkedinProfile);
  const github = normalizeProfileUrl(skillsLinks?.links?.githubProfile);
  const portfolio = normalizeProfileUrl(skillsLinks?.links?.portfolioUrl);
  const languages: string[] = (personal as any).languagesKnown || [];
  const linkFields = [
    { key: 'li', href: linkedin },
    { key: 'gh', href: github },
    { key: 'pf', href: portfolio },
  ].filter((f) => f.href);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Colored header band */}
        <View style={{ ...styles.header, backgroundColor: primaryColor }}>
          <Text style={styles.name}>{personal.firstName} {personal.middleName || ''} {personal.lastName}</Text>
          <Text style={styles.subtitle}>
            {contactParts.map((c, i) => (
              <Text key={`c-${i}`}>{i > 0 ? '  •  ' : ''}{c}</Text>
            ))}
            {linkFields.map((f, i) => (
              <Text key={f.key}>
                {(contactParts.length > 0 || i > 0) ? '  •  ' : ''}
                <Link src={f.href} style={{ color: '#c4d9f2', textDecoration: 'none' }}>{f.href}</Link>
              </Text>
            ))}
          </Text>
        </View>
        <View style={styles.content}>
          {/* Summary */}
          {personal.aboutCareerObjective && (
            <>
              <Text style={{ ...styles.sectionHeading, color: primaryColor }}>Professional Summary</Text>
              <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
              <Text style={styles.body}>{htmlToPlain(personal.aboutCareerObjective)}</Text>
            </>
          )}
          {/* Experience */}
          {experience.workExperiences.some(w => w.enabled) && (
            <>
              <Text style={{ ...styles.sectionHeading, color: primaryColor }}>Work Experience</Text>
              <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
              {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.itemTitle}>{w.jobTitle}</Text>
                    <Text style={styles.itemSub}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</Text>
                  </View>
                  <Text style={styles.itemSub}>{w.companyName}{w.location ? `, ${w.location}` : ''}</Text>
                  {w.description && renderBullets(w.description)}
                </View>
              ))}
            </>
          )}
          {/* Projects */}
          {projects.some(p => p.enabled) && (
            <>
              <Text style={{ ...styles.sectionHeading, color: primaryColor }}>Projects</Text>
              <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
              {projects.filter(p => p.enabled).map((p: any, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.itemTitle}>{p.projectTitle}</Text>
                    {(p.startDate || p.endDate || p.currentlyWorking) ? <Text style={{ fontSize: 8.5, color: '#9ca3af' }}>{fmtDate(p.startDate)}{(p.currentlyWorking || p.endDate) ? ` – ${p.currentlyWorking ? 'Present' : fmtDate(p.endDate)}` : ''}</Text> : null}
                  </View>
                  {p.description && renderBullets(p.description)}
                  {p.rolesResponsibilities && renderBullets(p.rolesResponsibilities)}
                </View>
              ))}
            </>
          )}
          {/* Education */}
          <Text style={{ ...styles.sectionHeading, color: primaryColor }}>Education</Text>
          <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
          {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.itemTitle}>{edu.degree} — {edu.fieldOfStudy}</Text>
                <Text style={styles.itemSub}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</Text>
              </View>
              <Text style={styles.itemSub}>{edu.instituteName}</Text>
              {edu.universityBoard ? <Text style={styles.itemSub}>{edu.universityBoard}</Text> : null}
              {edu.result ? <Text style={styles.itemSub}>{fmtResult(edu.result, edu.resultFormat)}</Text> : null}
            </View>
          ))}
          {education.preUniversityEnabled && education.preUniversity?.instituteName && (
            <View style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.itemTitle}>Pre University (12th)</Text>
                <Text style={styles.itemSub}>{fmtYear(education.preUniversity.yearOfPassing)}</Text>
              </View>
              <Text style={styles.itemSub}>{education.preUniversity.instituteName}</Text>
              {education.preUniversity.result ? <Text style={styles.itemSub}>{fmtResult(education.preUniversity.result, education.preUniversity.resultFormat)}</Text> : null}
            </View>
          )}
          {education.sslcEnabled && education.sslc?.instituteName && (
            <View style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.itemTitle}>SSLC (10th)</Text>
                <Text style={styles.itemSub}>{fmtYear(education.sslc.yearOfPassing)}</Text>
              </View>
              <Text style={styles.itemSub}>{education.sslc.instituteName}</Text>
              {education.sslc.result ? <Text style={styles.itemSub}>{fmtResult(education.sslc.result, education.sslc.resultFormat)}</Text> : null}
            </View>
          )}
          {/* Skills */}
          {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
            <>
              <Text style={{ ...styles.sectionHeading, color: primaryColor }}>Skills</Text>
              <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
              <Text style={styles.body}>{skillsLinks.skills.filter(s => s.enabled && s.skillName).map(s => s.skillName).join(', ')}</Text>
            </>
          )}
          {/* Languages */}
          {languages.length > 0 && (
            <>
              <Text style={{ ...styles.sectionHeading, color: primaryColor }}>Languages</Text>
              <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
              <Text style={styles.body}>{languages.join(', ')}</Text>
            </>
          )}
          {/* Certifications */}
          {certifications.some(c => c.enabled && c.certificateTitle) && (
            <>
              <Text style={{ ...styles.sectionHeading, color: primaryColor }}>Certifications</Text>
              <View style={{ ...styles.divider, backgroundColor: primaryColor }} />
              <Text style={styles.body}>{certifications.filter(c => c.enabled && c.certificateTitle).map(c => c.certificateTitle).join(', ')}</Text>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
};
export default AiTemplate2PDF;
