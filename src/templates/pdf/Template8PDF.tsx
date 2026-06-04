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
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#222',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004b87',
    marginBottom: 4,
    letterSpacing: 1,
  },
  contactRow: {
    fontSize: 9,
    color: '#666',
    flexDirection: 'row',
  },
  sectionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  labelCol: {
    width: '18%',
    paddingRight: 10,
  },
  contentCol: {
    width: '82%',
  },
  skillsContainer: {
    flexDirection: 'row',
  },
  skillsCol: {
    width: '50%',
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#004b87',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingTop: 4,
  },
  hrSection: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#444',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 9,
    color: '#666',
  },
  description: {
    fontSize: 10,
    color: '#444',
    lineHeight: 1.4,
  },
  listItem: {
    fontSize: 10,
    color: '#444',
    marginBottom: 4,
  },
});

interface Template8PDFProps {
  data: ResumeData;
}

const Template8PDF: React.FC<Template8PDFProps> = ({ data }) => {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{(personal.firstName || '') .toUpperCase()} {(personal.middleName || '').toUpperCase()} {(personal.lastName || '').toUpperCase()}</Text>
          <View style={styles.contactRow}>
            {personal.mobileNumber && <Text style={{ marginRight: 8 }}>{personal.mobileNumber}</Text>}
            {personal.email && <Text style={{ marginRight: 8 }}>{personal.email}</Text>}
            {personal.address && <Text style={{ marginRight: 8 }}>{personal.address}</Text>}
          </View>
        </View>

        {/* Summary */}
        {personal.aboutCareerObjective && (
          <View style={[styles.sectionRow, styles.hrSection]}>
            <View style={styles.labelCol}>
              <Text style={styles.label}>Summary</Text>
            </View>
            <View style={styles.contentCol}>
              <Text style={styles.description}>{htmlToText(personal.aboutCareerObjective)}</Text>
            </View>
          </View>
        )}

        {/* Work Experience */}
        {experience.workExperiences.some(exp => exp.enabled) && (
          <View style={[styles.sectionRow, styles.hrSection]}>
            <View style={styles.labelCol}>
              <Text style={styles.label}>Work Experience</Text>
            </View>
            <View style={styles.contentCol}>
              {experience.workExperiences.filter(w => w.enabled).map((w, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.itemTitle}>{w.jobTitle}</Text>
                    <Text style={styles.itemDate}>{w.startDate} - {w.currentlyWorking ? 'Present' : w.endDate}</Text>
                  </View>
                  <Text style={styles.itemSubtitle}>{w.companyName}</Text>
                  {w.description && (
                    <View>
                      {htmlToText(w.description).split('\n').map((line, idx) => (
                        line.trim() ? <Text key={idx} style={styles.listItem}>• {line.trim()}</Text> : null
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Education */}
        {education.higherEducation.some(edu => edu.enabled) && (
          <View style={[styles.sectionRow, styles.hrSection]}>
            <View style={styles.labelCol}>
              <Text style={styles.label}>Education</Text>
            </View>
            <View style={styles.contentCol}>
              {education.higherEducation.filter(edu => edu.enabled).map((edu, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.itemTitle}>{edu.degree}</Text>
                    <Text style={styles.itemDate}>{edu.startYear} - {edu.currentlyPursuing ? 'Present' : edu.endYear}</Text>
                  </View>
                  <Text style={styles.itemSubtitle}>{edu.instituteName}</Text>
                </View>
              ))}
              {/* Pre University */}
              {education.preUniversityEnabled && education.preUniversity.instituteName && (
                <View style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.itemTitle}>Pre University</Text>
                    <Text style={styles.itemDate}>{education.preUniversity.yearOfPassing}</Text>
                  </View>
                  <Text style={styles.itemSubtitle}>{education.preUniversity.instituteName}</Text>
                </View>
              )}

              {/* SSLC */}
              {education.sslcEnabled && education.sslc.instituteName && (
                <View style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.itemTitle}>SSLC</Text>
                    <Text style={styles.itemDate}>{education.sslc.yearOfPassing}</Text>
                  </View>
                  <Text style={styles.itemSubtitle}>{education.sslc.instituteName}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        

        {/* Key Skills */}
        {skillsLinks.skills.some(s => s.enabled && s.skillName) && (
          <View style={[styles.sectionRow, styles.hrSection]}>
            <View style={styles.labelCol}>
              <Text style={styles.label}>Key Skills</Text>
            </View>
            <View style={styles.contentCol}>
              <View style={styles.skillsContainer}>
                {/* Split skills into two roughly equal columns to match display */}
                {(() => {
                  const skills = skillsLinks.skills.filter((s: any) => s.enabled && s.skillName).map((s: any) => s.skillName || '');
                  const mid = Math.ceil(skills.length / 2);
                  const left = skills.slice(0, mid);
                  const right = skills.slice(mid);
                  return (
                    <>
                      <View style={styles.skillsCol}>
                        {left.map((name: string, idx: number) => (
                          <Text key={`l-${idx}`} style={styles.listItem}>• {name}</Text>
                        ))}
                      </View>
                      <View style={styles.skillsCol}>
                        {right.map((name: string, idx: number) => (
                          <Text key={`r-${idx}`} style={styles.listItem}>• {name}</Text>
                        ))}
                      </View>
                    </>
                  );
                })()}
              </View>
            </View>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && certifications.some(c => c.enabled) && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.label, { marginBottom: 6 }]}>Certifications</Text>
            {certifications.filter(c => c.enabled && c.certificateTitle).map((c, i) => (
              <Text key={i} style={styles.listItem}>• {c.certificateTitle}</Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default Template8PDF;
