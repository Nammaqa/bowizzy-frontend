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
    <View style={{ marginTop: 3 }}>
      {lines.map((line, i) => (
        <View key={i} style={{ flexDirection: 'row', marginTop: i > 0 ? 1.5 : 0 }}>
          <Text style={{ width: 10, flexShrink: 0, fontSize: 9, color: '#475569', textAlign: 'justify' }}>{line.startsWith('•') ? '•' : ''}</Text>
          <Text style={{ flex: 1, fontSize: 9, color: '#475569', lineHeight: 1.5, textAlign: 'justify' }}>{line.startsWith('•') ? line.substring(1).trim() : line}</Text>
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
const SectionTitle = ({ title, color }: { title: string; color: string }) => (
  <View style={{ marginTop: 16, marginBottom: 8 }}>
    <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1.5, color }}>{title}</Text>
    <View style={{ height: 2, backgroundColor: color, width: 40, marginTop: 3 }} />
  </View>
);
const AiTemplate8PDF: React.FC<Props> = ({ data, primaryColor = '#1e293b' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const contactParts = [personal.email, personal.mobileNumber, personal.address].filter(Boolean);
  const linkedin = normalizeProfileUrl(skillsLinks?.links?.linkedinProfile);
  const github = normalizeProfileUrl(skillsLinks?.links?.githubProfile);
  const portfolio = normalizeProfileUrl(skillsLinks?.links?.portfolioUrl);
  const languages: string[] = (personal as any).languagesKnown || [];
  return (
    <Document>
      <Page size="A4" style={{ paddingTop: 28, paddingBottom: 28, paddingLeft: 40, paddingRight: 40, fontSize: 9, fontFamily: 'Helvetica' }}>
        {/* Double-line header */}
        <View style={{ borderTopWidth: 3, borderTopColor: primaryColor, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 14, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ fontSize: 26, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: 1 }}>
                {personal.firstName} {personal.middleName || ''} {personal.lastName}
              </Text>
              {experience.jobRole && <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{experience.jobRole}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end', width: 200, flexShrink: 0 }}>
              {contactParts.map((c, i) => <Text key={i} style={{ fontSize: 8.5, color: '#475569', textAlign: 'right' }}>{c}</Text>)}
              {[linkedin, github, portfolio].filter(Boolean).map((c, i) => (
                <Link key={i} src={c} style={{ fontSize: 8, color: primaryColor, textAlign: 'right', textDecoration: 'none' }}>{c}</Link>
              ))}
            </View>
          </View>
        </View>
        {personal.aboutCareerObjective && (
          <>
            <SectionTitle title="Professional Summary" color={primaryColor} />
            <Text style={{ fontSize: 9.5, color: '#334155', lineHeight: 1.6, textAlign: 'justify' }}>{htmlToPlain(personal.aboutCareerObjective)}</Text>
          </>
        )}
        {experience.workExperiences.some(w => w.enabled) && (
          <>
            <SectionTitle title="Work Experience" color={primaryColor} />
            {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
              <View key={i} style={{ marginBottom: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#e2e8f0' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{w.jobTitle}</Text>
                  <Text style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</Text>
                </View>
                <Text style={{ fontSize: 9.5, color: primaryColor, fontFamily: 'Helvetica-Bold', marginTop: 1 }}>{w.companyName}{w.location ? `, ${w.location}` : ''}</Text>
                {w.description && renderBullets(w.description)}
              </View>
            ))}
          </>
        )}
        {projects.some(p => p.enabled) && (
          <>
            <SectionTitle title="Projects" color={primaryColor} />
            {projects.filter(p => p.enabled).map((p: any, i) => (
              <View key={i} style={{ marginBottom: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#e2e8f0' }}>
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
        <SectionTitle title="Education" color={primaryColor} />
        {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{edu.degree} — {edu.fieldOfStudy}</Text>
              <Text style={{ fontSize: 8.5, color: '#94a3b8' }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#64748b' }}>{edu.instituteName}</Text>
          </View>
        ))}
        {education.preUniversityEnabled && education.preUniversity?.instituteName && (
          <View style={{ marginBottom: 6 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>Pre University (12th)</Text>
            <Text style={{ fontSize: 9, color: '#64748b' }}>{education.preUniversity.instituteName} | {fmtYear(education.preUniversity.yearOfPassing)}</Text>
          </View>
        )}
        {education.sslcEnabled && education.sslc?.instituteName && (
          <View style={{ marginBottom: 6 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>SSLC (10th)</Text>
            <Text style={{ fontSize: 9, color: '#64748b' }}>{education.sslc.instituteName} | {fmtYear(education.sslc.yearOfPassing)}</Text>
          </View>
        )}
        {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
          <>
            <SectionTitle title="Technical Skills" color={primaryColor} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
              {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
                <View key={i} style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 3, borderWidth: 0.5, borderColor: '#cbd5e1' }}>
                  <Text style={{ fontSize: 8.5, color: primaryColor }}>{s.skillName}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        {/* Languages */}
        {languages.length > 0 && (
          <>
            <SectionTitle title="Languages" color={primaryColor} />
            <Text style={{ fontSize: 9.5, color: '#334155' }}>{languages.join(', ')}</Text>
          </>
        )}
        {certifications.some(c => c.enabled && c.certificateTitle) && (
          <>
            <SectionTitle title="Certifications" color={primaryColor} />
            {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
              <Text key={i} style={{ fontSize: 9, color: '#475569', marginBottom: 2 }}>
                • {c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}
              </Text>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
};
export default AiTemplate8PDF;
