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
interface Props { data: ResumeData; primaryColor?: string; }
const AiTemplate6PDF: React.FC<Props> = ({ data, primaryColor = '#4338ca' }) => {
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
      <Page size="A4" style={{ paddingTop: 0, paddingBottom: 24, paddingLeft: 0, paddingRight: 0, fontSize: 9, fontFamily: 'Helvetica' }}>
        {/* Top padding on every page after the first — the accent bar sits flush
            against the page edge by design for page 1, but continuation pages need
            breathing room so wrapped content doesn't stick to the top edge. */}
        <View fixed render={({ pageNumber }) => (pageNumber > 1 ? <View style={{ height: 24 }} /> : null)} />
        {/* Thin top accent bar */}
        <View style={{ height: 6, backgroundColor: primaryColor }} />
        <View style={{ paddingHorizontal: 40, paddingTop: 20 }}>
          {/* Header — centered, clean */}
          <View style={{ textAlign: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#111', letterSpacing: 2 }}>
              {(personal.firstName || '').toUpperCase()} {((personal.middleName || '') + ' ').toUpperCase()}{(personal.lastName || '').toUpperCase()}
            </Text>
            {experience.jobRole && <Text style={{ fontSize: 10, color: '#666', marginTop: 3, letterSpacing: 1 }}>{experience.jobRole}</Text>}
            <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 8, marginBottom: 4 }} />
            <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
              {contactParts.map((c, i) => (
                <Text key={`c-${i}`}>{i > 0 ? '  •  ' : ''}{c}</Text>
              ))}
              {linkFields.map((f, i) => (
                <Text key={f.key}>
                  {(contactParts.length > 0 || i > 0) ? '  •  ' : ''}
                  <Link src={f.href} style={{ color: '#666', textDecoration: 'none' }}>{f.href}</Link>
                </Text>
              ))}
            </Text>
          </View>
          {/* Two-column layout for main content */}
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            {/* Left column — 65% */}
            <View style={{ flex: 65, paddingRight: 16 }}>
              {/* Summary */}
              {personal.aboutCareerObjective && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Profile</Text>
                  <View style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                  <Text style={{ fontSize: 9, color: '#333', lineHeight: 1.5 }}>{htmlToPlain(personal.aboutCareerObjective)}</Text>
                </View>
              )}
              {/* Experience */}
              {experience.workExperiences.some(w => w.enabled) && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Experience</Text>
                  <View style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                  {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
                    <View key={i} style={{ marginBottom: 10 }}>
                      <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{w.jobTitle}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 9, color: primaryColor }}>{w.companyName}</Text>
                        <Text style={{ fontSize: 8, color: '#777' }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</Text>
                      </View>
                      {w.description && renderBullets(w.description)}
                    </View>
                  ))}
                </View>
              )}
              {/* Projects */}
              {projects.some(p => p.enabled) && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Projects</Text>
                  <View style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                  {projects.filter(p => p.enabled).map((p: any, i) => (
                    <View key={i} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{p.projectTitle}</Text>
                        {(p.startDate || p.endDate || p.currentlyWorking) ? <Text style={{ fontSize: 8.5, color: '#9ca3af' }}>{fmtDate(p.startDate)}{(p.currentlyWorking || p.endDate) ? ` – ${p.currentlyWorking ? 'Present' : fmtDate(p.endDate)}` : ''}</Text> : null}
                      </View>
                      {p.description && renderBullets(p.description)}
                      {p.rolesResponsibilities && renderBullets(p.rolesResponsibilities)}
                    </View>
                  ))}
                </View>
              )}
            </View>
            {/* Right column — 35% */}
            <View style={{ flex: 35, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#e5e7eb' }}>
              {/* Education */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Education</Text>
                <View style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
                  <View key={i} style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{edu.degree}</Text>
                    <Text style={{ fontSize: 8, color: '#555' }}>{edu.instituteName}</Text>
                    <Text style={{ fontSize: 7, color: '#777' }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</Text>
                  </View>
                ))}
                {education.preUniversityEnabled && education.preUniversity?.instituteName && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>Pre University</Text>
                    <Text style={{ fontSize: 8, color: '#555' }}>{education.preUniversity.instituteName}</Text>
                    <Text style={{ fontSize: 7, color: '#777' }}>{fmtYear(education.preUniversity.yearOfPassing)}</Text>
                  </View>
                )}
                {education.sslcEnabled && education.sslc?.instituteName && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>SSLC</Text>
                    <Text style={{ fontSize: 8, color: '#555' }}>{education.sslc.instituteName}</Text>
                    <Text style={{ fontSize: 7, color: '#777' }}>{fmtYear(education.sslc.yearOfPassing)}</Text>
                  </View>
                )}
              </View>
              {/* Skills */}
              {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Skills</Text>
                  <View style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                  {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
                    <Text key={i} style={{ fontSize: 8, color: '#333', marginBottom: 2 }}>• {s.skillName}</Text>
                  ))}
                </View>
              )}
              {/* Certifications */}
              {certifications.some(c => c.enabled && c.certificateTitle) && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Certifications</Text>
                  <View style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                  {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
                    <Text key={i} style={{ fontSize: 8, color: '#333', marginBottom: 2 }}>• {c.certificateTitle}</Text>
                  ))}
                </View>
              )}
              {languages.length > 0 && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Languages</Text>
                  <View style={{ height: 1, backgroundColor: primaryColor, marginBottom: 6 }} />
                  {languages.map((l, i) => <Text key={i} style={{ fontSize: 8, color: '#333', marginBottom: 2 }}>• {l}</Text>)}
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
export default AiTemplate6PDF;
