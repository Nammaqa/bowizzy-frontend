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
          <Text style={{ width: 10, flexShrink: 0, fontSize: 9, color: '#4b5563' }}>{line.startsWith('•') ? '•' : ''}</Text>
          <Text style={{ flex: 1, fontSize: 9, color: '#4b5563', lineHeight: 1.5 }}>{line.startsWith('•') ? line.substring(1).trim() : line}</Text>
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
const SectionHeader = ({ title, color }: { title: string; color: string }) => (
  <>
    <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 3, textTransform: 'uppercase', color, marginTop: 16, marginBottom: 2 }}>{title}</Text>
    <View style={{ height: 0.5, backgroundColor: '#d1d5db', marginBottom: 8 }} />
  </>
);
const AiTemplate7PDF: React.FC<Props> = ({ data, primaryColor = '#374151' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const contactParts = [personal.email, personal.mobileNumber, personal.address].filter(Boolean);
  const linkedin = normalizeProfileUrl(skillsLinks?.links?.linkedinProfile);
  const github = normalizeProfileUrl(skillsLinks?.links?.githubProfile);
  const portfolio = normalizeProfileUrl(skillsLinks?.links?.portfolioUrl);
  const languages: string[] = (personal as any).languagesKnown || [];
  return (
    <Document>
      <Page size="A4" style={{ paddingTop: 36, paddingBottom: 28, paddingLeft: 44, paddingRight: 44, fontSize: 9, fontFamily: 'Helvetica' }}>
        {/* Header */}
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: 0.5 }}>
            {personal.firstName} {personal.middleName || ''} {personal.lastName}
          </Text>
          {experience.jobRole && <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{experience.jobRole}</Text>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
            {contactParts.map((c, i) => <Text key={i} style={{ fontSize: 8.5, color: '#6b7280' }}>{c}</Text>)}
            {linkedin && <Link src={linkedin} style={{ fontSize: 8.5, color: primaryColor, textDecoration: 'none' }}>{linkedin}</Link>}
            {github && <Link src={github} style={{ fontSize: 8.5, color: primaryColor, textDecoration: 'none' }}>{github}</Link>}
            {portfolio && <Link src={portfolio} style={{ fontSize: 8.5, color: primaryColor, textDecoration: 'none' }}>{portfolio}</Link>}
          </View>
        </View>
        <View style={{ height: 1.5, backgroundColor: primaryColor, marginBottom: 10 }} />
        {personal.aboutCareerObjective && (
          <>
            <SectionHeader title="Summary" color={primaryColor} />
            <Text style={{ fontSize: 9.5, color: '#374151', lineHeight: 1.6 }}>{htmlToPlain(personal.aboutCareerObjective)}</Text>
          </>
        )}
        {experience.workExperiences.some(w => w.enabled) && (
          <>
            <SectionHeader title="Experience" color={primaryColor} />
            {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#111827' }}>{w.jobTitle}</Text>
                  <Text style={{ fontSize: 8.5, color: '#9ca3af' }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</Text>
                </View>
                <Text style={{ fontSize: 9.5, color: primaryColor, fontFamily: 'Helvetica-Bold', marginTop: 1 }}>{w.companyName}{w.location ? ` · ${w.location}` : ''}</Text>
                {w.description && renderBullets(w.description)}
              </View>
            ))}
          </>
        )}
        {projects.some(p => p.enabled) && (
          <>
            <SectionHeader title="Projects" color={primaryColor} />
            {projects.filter(p => p.enabled).map((p: any, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: '#111827' }}>{p.projectTitle}</Text>
                  {(p.startDate || p.endDate || p.currentlyWorking) ? <Text style={{ fontSize: 8.5, color: '#9ca3af' }}>{fmtDate(p.startDate)}{(p.currentlyWorking || p.endDate) ? ` – ${p.currentlyWorking ? 'Present' : fmtDate(p.endDate)}` : ''}</Text> : null}
                </View>
                {p.description && renderBullets(p.description)}
                {p.rolesResponsibilities && renderBullets(p.rolesResponsibilities)}
              </View>
            ))}
          </>
        )}
        <SectionHeader title="Education" color={primaryColor} />
        {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>

              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111827' }}>{edu.degree} — {edu.fieldOfStudy}</Text>

              <Text style={{ fontSize: 8.5, color: '#9ca3af' }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>{edu.instituteName}</Text>
              {edu.universityBoard ? <Text style={{ fontSize: 9, color: '#6b7280' }}>{edu.universityBoard}</Text> : null}
            </View>
          </View>
        ))}
        {education.preUniversityEnabled && education.preUniversity?.instituteName && (
          <View style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111827' }}>Pre University (12th)</Text>
              <Text style={{ fontSize: 8.5, color: '#9ca3af' }}>{fmtYear(education.preUniversity.yearOfPassing)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>{education.preUniversity.instituteName}</Text>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>{education.preUniversity.boardType}</Text>
            </View>
          </View>
        )}
        {education.sslcEnabled && education.sslc?.instituteName && (
          <View style={{ marginBottom: 6 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#111827' }}>SSLC (10th)</Text>
            <Text style={{ fontSize: 9, color: '#6b7280' }}>{education.sslc.instituteName} | {fmtYear(education.sslc.yearOfPassing)}</Text>
          </View>
        )}
        {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
          <>
            <SectionHeader title="Skills" color={primaryColor} />
            <Text style={{ fontSize: 9.5, color: '#4b5563', lineHeight: 1.6 }}>
              {skillsLinks.skills.filter(s => s.enabled && s.skillName).map(s => s.skillName).join('  ·  ')}
            </Text>
          </>
        )}
        {languages.length > 0 && (
          <>
            <SectionHeader title="Languages" color={primaryColor} />
            <Text style={{ fontSize: 9.5, color: '#4b5563' }}>{languages.join('  ·  ')}</Text>
          </>
        )}
        {certifications.some(c => c.enabled && c.certificateTitle) && (
          <>
            <SectionHeader title="Certifications" color={primaryColor} />
            {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
              <Text key={i} style={{ fontSize: 9, color: '#4b5563', marginBottom: 2 }}>
                {c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}
              </Text>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
};
export default AiTemplate7PDF;
