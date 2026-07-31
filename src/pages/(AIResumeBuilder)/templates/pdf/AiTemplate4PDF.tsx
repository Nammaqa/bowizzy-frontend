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
          <Text style={{ width: 10, flexShrink: 0, fontSize: 9, color: '#333', textAlign: 'justify' }}>{line.startsWith('•') ? '•' : ''}</Text>
          <Text style={{ flex: 1, fontSize: 9, color: '#333', lineHeight: 1.5, textAlign: 'justify' }}>{line.startsWith('•') ? line.substring(1).trim() : line}</Text>
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
const AiTemplate4PDF: React.FC<Props> = ({ data, primaryColor = '#b91c1c' }) => {
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
      <Page size="A4" style={{ paddingTop: 32, paddingBottom: 24, paddingLeft: 40, paddingRight: 40, fontSize: 9, fontFamily: 'Helvetica' }}>
        {/* Header — left aligned with accent underline */}
        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 30, fontFamily: 'Helvetica-Bold', color: primaryColor, letterSpacing: 0.5 }}>
            {personal.firstName} {personal.middleName || ''} {personal.lastName}
          </Text>
          {experience.jobRole && (
            <Text style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{experience.jobRole}</Text>
          )}
          <View style={{ height: 3, backgroundColor: primaryColor, width: 60, marginTop: 6 }} />
          <Text style={{ fontSize: 9, color: '#555', marginTop: 6 }}>
            {contactParts.map((c, i) => (
              <Text key={`c-${i}`}>{i > 0 ? '  |  ' : ''}{c}</Text>
            ))}
            {linkFields.map((f, i) => (
              <Text key={f.key}>
                {(contactParts.length > 0 || i > 0) ? '  |  ' : ''}
                <Link src={f.href} style={{ color: '#555', textDecoration: 'none' }}>{f.href}</Link>
              </Text>
            ))}
          </Text>
        </View>
        {/* Summary */}
        {personal.aboutCareerObjective && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', color: primaryColor }}>Summary</Text>
            <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 2, marginBottom: 6 }} />
            <Text style={{ fontSize: 9, color: '#333', lineHeight: 1.5, textAlign: 'justify' }}>{htmlToPlain(personal.aboutCareerObjective)}</Text>
          </View>
        )}
        {/* Experience */}
        {experience.workExperiences.some(w => w.enabled) && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', color: primaryColor }}>Experience</Text>
            <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 2, marginBottom: 6 }} />
            {experience.workExperiences.filter(w => w.enabled).map((w: any, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{w.jobTitle} — {w.companyName}</Text>
                  <Text style={{ fontSize: 9, color: '#555' }}>{fmtDate(w.startDate)} – {w.currentlyWorking ? 'Present' : fmtDate(w.endDate)}</Text>
                </View>
                {w.location && <Text style={{ fontSize: 9, color: '#777', marginTop: 1 }}>{w.location}</Text>}
                {w.description && renderBullets(w.description)}
              </View>
            ))}
          </View>
        )}
        {/* Projects */}
        {projects.some(p => p.enabled) && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', color: primaryColor }}>Projects</Text>
            <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 2, marginBottom: 6 }} />
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
        {/* Education */}
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', color: primaryColor }}>Education</Text>
          <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 2, marginBottom: 6 }} />
          {education.higherEducation.filter(e => e.enabled).reverse().map((edu: any, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{edu.degree} — {edu.fieldOfStudy}</Text>
                <Text style={{ fontSize: 9, color: '#555' }}>{fmtYear(edu.startYear)} – {edu.currentlyPursuing ? 'Present' : fmtYear(edu.endYear)}</Text>
              </View>
              <Text style={{ fontSize: 9, color: '#555' }}>{edu.instituteName}</Text>
              {edu.universityBoard ? <Text style={{ fontSize: 9, color: '#555' }}>{edu.universityBoard}</Text> : null}
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
        </View>
        {/* Skills */}
        {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', color: primaryColor }}>Skills</Text>
            <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 2, marginBottom: 6 }} />
            <Text style={{ fontSize: 9, color: '#333' }}>{skillsLinks.skills.filter(s => s.enabled && s.skillName).map(s => s.skillName).join(', ')}</Text>
          </View>
        )}
        {/* Languages */}
        {languages.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', color: primaryColor }}>Languages</Text>
            <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 2, marginBottom: 6 }} />
            <Text style={{ fontSize: 9, color: '#333' }}>{languages.join(', ')}</Text>
          </View>
        )}
        {/* Certifications */}
        {certifications.some(c => c.enabled && c.certificateTitle) && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', color: primaryColor }}>Certifications</Text>
            <View style={{ height: 1.5, backgroundColor: primaryColor, width: '100%', marginTop: 2, marginBottom: 6 }} />
            <Text style={{ fontSize: 9, color: '#333' }}>{certifications.filter(c => c.enabled && c.certificateTitle).map(c => c.certificateTitle).join(', ')}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
export default AiTemplate4PDF;
