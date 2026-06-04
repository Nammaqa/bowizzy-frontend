import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData } from '@/types/resume';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
  },
  twoColumnContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  leftColumn: {
    width: '60%',
    paddingRight: 20,
  },
  rightColumn: {
    width: '40%',
    paddingLeft: 20,
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004b87',
    marginBottom: 2,
    letterSpacing: 1,
  },
  jobTitle: {
    fontSize: 12,
    color: '#444',
    fontWeight: 500,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#004b87',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#004b87',
  },
  section: {
    marginBottom: 16,
  },
  educationItem: {
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 9,
    color: '#999',
  },
  itemCoursework: {
    fontSize: 9,
    color: '#999',
    marginTop: 4,
  },
  experienceItem: {
    marginBottom: 12,
  },
  experienceTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  experienceDate: {
    fontSize: 9,
    color: '#999',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    color: '#444',
    lineHeight: 1.5,
  },
  listItem: {
    fontSize: 10,
    color: '#444',
    marginBottom: 4,
    paddingLeft: 0,
    marginLeft: 0,
  },
  contactInfo: {
    fontSize: 10,
    color: '#444',
    lineHeight: 1.6,
  },
});

interface Template7PDFProps {
  data: ResumeData;
}

const Template7PDF: React.FC<Template7PDFProps> = ({ data }) => {
  const { personal, education, experience, projects, skillsLinks, certifications } = data;

  const htmlToText = (s?: string) => {
    if (!s) return '';
    try {
      return String(s)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim();
    } catch (e) {
      return s || '';
    }
  };

  const sanitizeLine = (line?: string) => {
    if (!line) return '';
    try {
      return String(line).replace(/^\s*>+\s*/, '');
    } catch (e) {
      return line || '';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Full Width */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {(personal.firstName || '').toUpperCase()} {(personal.middleName || '').toUpperCase()} {(personal.lastName || '').toUpperCase()}
          </Text>
          <Text style={styles.jobTitle}>{experience.jobRole}</Text>
        </View>

        {/* Two Column Container */}
        <View style={styles.twoColumnContainer}>
          {/* Left Column */}
          <View style={styles.leftColumn}>

          {/* Profile */}
          {personal.aboutCareerObjective && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile</Text>
              <Text style={styles.description}>{htmlToText(personal.aboutCareerObjective)}</Text>
            </View>
          )}

          {/* Education */}
          {education.higherEducation.some(edu => edu.enabled) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Education</Text>
              {education.higherEducation.filter(edu => edu.enabled).map((edu, i) => (
                <View key={i} style={styles.educationItem}>
                  <Text style={styles.itemTitle}>{edu.instituteName}</Text>
                  <Text style={styles.itemSubtitle}>{edu.degree}</Text>
                  <Text style={styles.itemDate}>
                    {edu.startYear} - {edu.currentlyPursuing ? 'Present' : edu.endYear}
                  </Text>
                
                </View>
              ))}
              {/* Pre University */}
              {education.preUniversityEnabled && education.preUniversity.instituteName && (
                <View style={styles.educationItem}>
                  <Text style={styles.itemTitle}>{education.preUniversity.instituteName}</Text>
                  <Text style={styles.itemSubtitle}>Pre University - {education.preUniversity.boardType}</Text>
                  <Text style={styles.itemDate}>{education.preUniversity.yearOfPassing}</Text>
                </View>
              )}

              {/* SSLC */}
              {education.sslcEnabled && education.sslc.instituteName && (
                <View style={styles.educationItem}>
                  <Text style={styles.itemTitle}>{education.sslc.instituteName}</Text>
                  <Text style={styles.itemSubtitle}>SSLC - {education.sslc.boardType}</Text>
                  <Text style={styles.itemDate}>{education.sslc.yearOfPassing}</Text>
                </View>
              )}
            </View>
          )}

          {/* Experience */}
          {experience.workExperiences.some(exp => exp.enabled) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experience</Text>
              {experience.workExperiences.filter(w => w.enabled).map((w, i) => (
                <View key={i} style={styles.experienceItem}>
                  <Text style={styles.experienceTitle}>{w.jobTitle} | {w.companyName}</Text>
                  <Text style={styles.experienceDate}>
                    {w.startDate} - {w.currentlyWorking ? 'Present' : w.endDate}
                  </Text>
                  {w.description && (
                    <Text style={styles.description}>{htmlToText(w.description)}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Right Column */}
        <View style={styles.rightColumn}>
          {/* Languages */}
          {personal.languagesKnown && personal.languagesKnown.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Languages</Text>
              {personal.languagesKnown.map((lang, i) => (
                <Text key={i} style={styles.listItem}>• {lang}</Text>
              ))}
            </View>
          )}

          {/* Skills */}
          {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills</Text>
              {skillsLinks.skills.filter(s => s.enabled && s.skillName).map((s, i) => (
                <Text key={i} style={styles.listItem}>• {s.skillName}</Text>
              ))}
            </View>
          )}

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.contactInfo}>
              {personal.mobileNumber && <Text>{personal.mobileNumber}{'\n'}</Text>}
              {personal.email && <Text>{personal.email}{'\n'}</Text>}
              {personal.address && <Text>{personal.address}</Text>}
            </Text>
          </View>

          {/* Projects (after Contact) */}
          {projects && projects.length > 0 && projects.some(p => p.enabled && p.projectTitle) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projects</Text>
              {projects.filter(p => p.enabled && p.projectTitle).map((p, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{p.projectTitle}</Text>
                    <Text style={styles.itemDate}>{p.startDate} - {p.currentlyWorking ? 'Present' : p.endDate}</Text>
                  </View>
                  {p.description && htmlToText(p.description).split(/\n|\r\n/).map((line, idx) => {
                    const clean = sanitizeLine(line).trim();
                    return clean ? <Text key={idx} style={styles.listItem}>• {clean}</Text> : null;
                  })}

                  {p.rolesResponsibilities && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Roles & Responsibilities:</Text>
                      {htmlToText(p.rolesResponsibilities).split(/\n|\r\n/).map((line, idx) => {
                        const clean = sanitizeLine(line).trim();
                        return clean ? <Text key={idx} style={styles.listItem}>• {clean}</Text> : null;
                      })}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Licenses */}
          {certifications.length > 0 && certifications.some(c => c.enabled) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Licenses</Text>
              {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
                <Text key={i} style={styles.listItem}>• {c.certificateTitle}</Text>
              ))}
            </View>
          )}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default Template7PDF;
