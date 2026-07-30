import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';
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
const AiTemplate5PDF: React.FC<Props> = ({ data, primaryColor = '#0f766e' }) => {
  const { personal, experience, education, projects, skillsLinks, certifications } = data;
  const contactParts = [personal.email, personal.mobileNumber].filter(Boolean);
  const linkedin = skillsLinks?.links?.linkedinProfile || '';
  const github = skillsLinks?.links?.githubProfile || '';
  const portfolio = skillsLinks?.links?.portfolioUrl || '';
  const languages: string[] = (personal as any).languagesKnown || [];
  const SectionTitle = ({ title }: { title: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 6 }}>
      <View style={{ width: 4, height: 14, backgroundColor: primaryColor, marginRight: 8 }} />
      <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', color: primaryColor }}>{title}</Text>
    </View>
  );
  return (
    <Document>
      <Page size="A4" style={{ paddingTop: 32, paddingBottom: 24, paddingLeft: 40, paddingRight: 40, fontSize: 9, fontFamily: 'Helvetica' }}>
        {/* Header — split layout */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: primaryColor }}>
              {personal.firstName} {personal.middleName || ''} {personal.lastName}
            </Text>
            {experience.jobRole && <Text style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{experience.jobRole}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end', width: 200, flexShrink: 0 }}>
            {contactParts.map((c, i) => <Text key={i} style={{ fontSize: 9, color: '#555', textAlign: 'right' }}>{c}</Text>)}
            {personal.address && <Text style={{ fontSize: 9, color: '#555', textAlign: 'right', lineHeight: 1.4 }}>{personal.address}</Text>}
            {[linkedin, github, portfolio].filter(Boolean).map((c, i) => <Text key={i} style={{ fontSize: 8, color: primaryColor, textAlign: 'right' }}>{c}</Text>)}
          </View>
        </View>
        <View style={{ height: 2, backgroundColor: primaryColor, marginBottom: 4 }} />
        {/* Summary */}
        {personal.aboutCareerObjective && (
          <>
            <SectionTitle title="Professional Summary" />
            <Text style={{ fontSize: 9, color: '#333', lineHeight: 1.5 }}>{htmlToPlain(personal.aboutCareerObjective)}</Text>
          </>
        )}
        {/* Experience */}
        {experience.workExperiences.some(w => w.enabled) && (
          <>
            <SectionTitle title="Experience" />
            {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{w.jobTitle}</Text>
                  <Text style={{ fontSize: 9, color: '#555' }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</Text>
                </View>
                <Text style={{ fontSize: 9, color: primaryColor, fontFamily: 'Helvetica-Bold' }}>{w.companyName}{w.location ? ` • ${w.location}` : ''}</Text>
                {w.description && renderBullets(w.description)}
              </View>
            ))}
          </>
        )}
        {/* Projects */}
        {projects.some(p => p.enabled) && (
          <>
            <SectionTitle title="Projects" />
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
          </>
        )}
        {/* Education */}
        <SectionTitle title="Education" />
        {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{edu.degree} — {edu.fieldOfStudy}</Text>
              <Text style={{ fontSize: 9, color: '#555' }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#555' }}>{edu.instituteName}</Text>          {edu.universityBoard ? <Text style={{ fontSize: 9, color: '#555' }}>{edu.universityBoard}</Text> : null}
          </View>
        ))}
        {education.preUniversityEnabled && education.preUniversity?.instituteName && (
          <View style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>Pre University (12th)</Text>
              <Text style={{ fontSize: 9, color: '#555' }}>{fmtYear(education.preUniversity.yearOfPassing)}</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#555' }}>{education.preUniversity.instituteName}</Text>
          </View>
        )}
        {education.sslcEnabled && education.sslc?.instituteName && (
          <View style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>SSLC (10th)</Text>
              <Text style={{ fontSize: 9, color: '#555' }}>{fmtYear(education.sslc.yearOfPassing)}</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#555' }}>{education.sslc.instituteName}</Text>
          </View>
        )}
        {/* Skills */}
        {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
          <>
            <SectionTitle title="Skills" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
                <View key={i} style={{ backgroundColor: '#e6f7f5', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 3 }}>
                  <Text style={{ fontSize: 8, color: primaryColor }}>{s.skillName}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        {/* Languages */}
        {languages.length > 0 && (
          <>
            <SectionTitle title="Languages" />
            <Text style={{ fontSize: 9, color: '#333' }}>{languages.join(', ')}</Text>
          </>
        )}
        {/* Certifications */}
        {certifications.some(c => c.enabled && c.certificateTitle) && (
          <>
            <SectionTitle title="Certifications" />
            {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
              <Text key={i} style={{ fontSize: 9, color: '#333', marginBottom: 2 }}>• {c.certificateTitle}{c.providedBy ? ` — ${c.providedBy}` : ''}</Text>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
};
export default AiTemplate5PDF;
