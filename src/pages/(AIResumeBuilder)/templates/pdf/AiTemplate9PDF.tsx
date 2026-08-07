import React from 'react';
import { Document, Page, View, Text, Link } from '@react-pdf/renderer';
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
    <View style={{ marginTop: 4 }}>
      {lines.map((line, i) => (
        <View key={i} style={{ flexDirection: 'row', marginTop: i > 0 ? 2 : 0 }}>
          <Text style={{ width: 10, flexShrink: 0, fontSize: 9, color: '#475569', textAlign: 'justify' }}>{line.startsWith('•') ? '•' : ''}</Text>
          <Text style={{ flex: 1, fontSize: 9, color: '#475569', lineHeight: 1.6, textAlign: 'justify' }}>{line.startsWith('•') ? line.substring(1).trim() : line}</Text>
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
interface Props { data: ResumeData; primaryColor?: string; }
const SectionTitle = ({ title, color }: { title: string; color: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8, gap: 10 }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1.5, color }}>{title}</Text>
    <View style={{ flex: 1, height: 0.5, backgroundColor: '#e2e8f0' }} />
  </View>
);
const AiTemplate9PDF: React.FC<Props> = ({ data, primaryColor = '#334155' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const contactParts = [personal.email, personal.mobileNumber, personal.address].filter(Boolean);
  const linkedin = normalizeProfileUrl(skillsLinks?.links?.linkedinProfile);
  const github = normalizeProfileUrl(skillsLinks?.links?.githubProfile);
  const portfolio = normalizeProfileUrl(skillsLinks?.links?.portfolioUrl);
  const languages: string[] = (personal as any).languagesKnown || [];
  const initials = `${(personal.firstName || '')[0] || ''}${(personal.lastName || '')[0] || ''}`.toUpperCase();
  return (
    <Document>
      <Page size="A4" style={{ fontSize: 9, fontFamily: 'Helvetica' }}>
        {/* Top padding on every page after the first — the banner sits flush
            against the page edge by design for page 1, but continuation pages need
            breathing room so wrapped content doesn't stick to the top edge. */}
        <View fixed render={({ pageNumber }) => (pageNumber > 1 ? <View style={{ height: 24 }} /> : null)} />
        {/* Top banner */}
        <View style={{ backgroundColor: primaryColor, paddingVertical: 20, paddingHorizontal: 40, flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: primaryColor }}>{initials}</Text>
          </View>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#fff', letterSpacing: 0.5 }}>
              {personal.firstName} {personal.middleName || ''} {personal.lastName}
            </Text>
            {experience.jobRole && <Text style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>{experience.jobRole}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end', width: 200, flexShrink: 0 }}>
            {contactParts.map((c, i) => <Text key={i} style={{ fontSize: 8.5, color: '#e2e8f0', textAlign: 'right' }}>{c}</Text>)}
            {[linkedin, github, portfolio].filter(Boolean).map((c, i) => (
              <Link key={i} src={c} style={{ fontSize: 8, color: '#93c5fd', textAlign: 'right', textDecoration: 'none' }}>{c}</Link>
            ))}
          </View>
        </View>
        <View style={{ paddingHorizontal: 40, paddingTop: 12, paddingBottom: 28 }}>
          {personal.aboutCareerObjective && (
            <>
              <SectionTitle title="Profile" color={primaryColor} />
              <Text style={{ fontSize: 9.5, color: '#475569', lineHeight: 1.7, textAlign: 'justify' }}>{htmlToPlain(personal.aboutCareerObjective)}</Text>
            </>
          )}
          {experience.workExperiences.some(w => w.enabled) && (
            <>
              <SectionTitle title="Experience" color={primaryColor} />
              {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{w.jobTitle}</Text>
                    <Text style={{ fontSize: 8, color: '#94a3b8' }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</Text>
                  </View>
                  <Text style={{ fontSize: 9.5, color: primaryColor, fontFamily: 'Helvetica-Bold', marginTop: 1 }}>{w.companyName}{w.location ? ` | ${w.location}` : ''}</Text>
                  {w.description && renderBullets(w.description)}
                </View>
              ))}
            </>
          )}
          {projects.some(p => p.enabled) && (
            <>
              <SectionTitle title="Projects" color={primaryColor} />
              {projects.filter(p => p.enabled).map((p: any, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{p.projectTitle}</Text>
                    {(p.startDate || p.endDate || p.currentlyWorking) ? <Text style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtDate(p.startDate)}{(p.currentlyWorking || p.endDate) ? ` – ${p.currentlyWorking ? 'Present' : fmtDate(p.endDate)}` : ''}</Text> : null}
                  </View>
                  {p.description && renderBullets(p.description)}
                  {p.rolesResponsibilities && renderBullets(p.rolesResponsibilities)}
                </View>
              ))}
            </>
          )}
          {/* Two-column: Education + Skills — kept as a single unbreakable
              block so the two independently-flowing columns can't get
              split at different points by a page break (which misaligns
              them relative to each other). */}
          <View style={{ flexDirection: 'row', gap: 30, marginTop: 4 }} wrap={false}>
            <View style={{ flex: 1 }}>
              <SectionTitle title="Education" color={primaryColor} />
              {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
                <View key={i} style={{ marginBottom: 7 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{edu.degree} — {edu.fieldOfStudy}</Text>
                  <Text style={{ fontSize: 9, color: '#64748b' }}>{edu.instituteName}</Text>
                  {edu.universityBoard ? <Text style={{ fontSize: 9, color: '#64748b' }}>{edu.universityBoard}</Text> : null}
                  <Text style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</Text>
                  {edu.result ? <Text style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtResult(edu.result, edu.resultFormat)}</Text> : null}
                </View>
              ))}
              {education.preUniversityEnabled && education.preUniversity?.instituteName && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>Pre University (12th)</Text>
                  <Text style={{ fontSize: 9, color: '#64748b' }}>{education.preUniversity.instituteName}</Text>
                  <Text style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtYear(education.preUniversity.yearOfPassing)}</Text>
                  {education.preUniversity.result ? <Text style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtResult(education.preUniversity.result, education.preUniversity.resultFormat)}</Text> : null}
                </View>
              )}
              {education.sslcEnabled && education.sslc?.instituteName && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>SSLC (10th)</Text>
                  <Text style={{ fontSize: 9, color: '#64748b' }}>{education.sslc.instituteName}</Text>
                  <Text style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtYear(education.sslc.yearOfPassing)}</Text>
                  {education.sslc.result ? <Text style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtResult(education.sslc.result, education.sslc.resultFormat)}</Text> : null}
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
                <>
                  <SectionTitle title="Skills" color={primaryColor} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
                      <View key={i} style={{ backgroundColor: primaryColor, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10 }}>
                        <Text style={{ fontSize: 8, color: '#fff' }}>{s.skillName}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {certifications.some(c => c.enabled && c.certificateTitle) && (
                <>
                  <SectionTitle title="Certifications" color={primaryColor} />
                  {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
                    <Text key={i} style={{ fontSize: 9, color: '#475569', marginBottom: 3 }}>
                      • {c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}
                    </Text>
                  ))}
                </>
              )}
              {languages.length > 0 && (
                <>
                  <SectionTitle title="Languages" color={primaryColor} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {languages.map((l, i) => (
                      <View key={i} style={{ backgroundColor: primaryColor, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10 }}>
                        <Text style={{ fontSize: 8, color: '#fff' }}>{l}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
export default AiTemplate9PDF;
