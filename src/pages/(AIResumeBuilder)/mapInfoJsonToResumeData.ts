import type { ResumeData } from "@/types/resume";
import { dropIncompleteSchoolEducation } from "./educationFilters";

/**
 * Maps the infoJson from an AI session to the ResumeData structure
 * used by the existing template components.
 */
export function mapInfoJsonToResumeData(info: any): ResumeData {
  if (!info) {
    return getEmptyResumeData();
  }

  const pd = info.personal_details || {};
  const we = info.work_experience || {};
  const projects = info.projects || [];
  // Sessions saved before school records were filtered still carry an "NA"
  // SSLC/PUC entry, so drop them here too rather than only at review time —
  // otherwise `preUniversityEnabled` below turns the placeholder into a
  // rendered "Pre University (12th) / NA" row.
  const eduList = dropIncompleteSchoolEducation(info.education || []);
  const certs = info.certificates || [];
  const links = info.links || [];
  // `technical_summary_generated` is the field the JD review form edits, so it
  // must win — the raw `enhanced_technical_summary` survives on the object and
  // would otherwise mask the user's edit.
  const techSummary = info.technical_summary_generated || info.enhanced_technical_summary || info.technical_summary || "";

  // Extract linkedin/github from links array (first of each type)
  const linkedinLink = links.find((l: any) => l.link_type === "linkedin");
  const githubLink = links.find((l: any) => l.link_type === "github");
  const portfolioLink = links.find((l: any) => l.link_type === "portfolio");

  // Parse education into sslc, puc, higher (include "other" as higher education)
  const sslcEdu = eduList.find((e: any) => e.education_type === "sslc");
  const pucEdu = eduList.find((e: any) => e.education_type === "puc");
  const higherEdus = eduList.filter(
    (e: any) => !["sslc", "puc"].includes(e.education_type)
  );

  // Merge user skills + AI-generated skills
  const rawSkills: any[] = info.skills || [];
  const aiSkills: any[] = info.ai_skills || [];
  const allSkills = [...rawSkills, ...aiSkills];

  return {
    personal: {
      profilePhotoUrl: pd.profile_photo_url || "",
      firstName: pd.first_name || "",
      middleName: pd.middle_name || "",
      lastName: pd.last_name || "",
      email: pd.email || "",
      mobileNumber: pd.mobile_number || "",
      dateOfBirth: pd.date_of_birth || "",
      gender: pd.gender || "",
      languagesKnown: pd.languages_known || [],
      address: pd.address || "",
      country: pd.country || "",
      city: pd.city || "",
      nationality: pd.nationality || "",
      state: pd.state || "",
      pincode: pd.pincode || "",
      passportNumber: pd.passport_number || "",
      aboutCareerObjective: techSummary,
    },
    education: {
      sslc: {
        education_id: sslcEdu?.education_id || null,
        instituteName: sslcEdu?.institution_name || "",
        boardType: sslcEdu?.board_type || "",
        yearOfPassing: sslcEdu?.end_year || "",
        resultFormat: sslcEdu?.result_format || "",
        result: sslcEdu?.result || "",
      },
      sslcEnabled: !!sslcEdu,
      preUniversity: {
        education_id: pucEdu?.education_id || null,
        instituteName: pucEdu?.institution_name || "",
        boardType: pucEdu?.board_type || "",
        subjectStream: pucEdu?.subject_stream || "",
        yearOfPassing: pucEdu?.end_year || "",
        resultFormat: pucEdu?.result_format || "",
        result: pucEdu?.result || "",
      },
      preUniversityEnabled: !!pucEdu,
      higherEducation: higherEdus.map((edu: any, i: number) => ({
        education_id: edu.education_id || null,
        id: `he-${i}`,
        degree: edu.degree || "",
        fieldOfStudy: edu.field_of_study || "",
        instituteName: edu.institution_name || "",
        universityBoard: edu.university_name || "",
        startYear: edu.start_year || "",
        endYear: edu.end_year || "",
        currentlyPursuing: edu.currently_pursuing || false,
        resultFormat: edu.result_format || "",
        result: edu.result || "",
        enabled: true,
      })),
    },
    experience: {
      jobRole: we.job_role || "",
      workExperiences: (we.experiences || []).map((exp: any, i: number) => ({
        experience_id: exp.experience_id || null,
        id: `we-${i}`,
        companyName: exp.company_name || "",
        jobTitle: exp.job_title || "",
        employmentType: exp.employment_type || "",
        location: exp.location || "",
        workMode: exp.work_mode || "",
        startDate: exp.start_date || "",
        endDate: exp.end_date || "",
        currentlyWorking: exp.currently_working_here || false,
        description: Array.isArray(exp.enhanced_description)
          ? exp.enhanced_description.map((d: string) => `• ${d}`).join("\n")
          : exp.enhanced_description || exp.description || "",
        enabled: true,
      })),
    },
    projects: projects.map((p: any, i: number) => ({
      project_id: p.project_id || null,
      id: `proj-${i}`,
      projectTitle: p.project_title || "",
      projectType: p.project_type || "",
      startDate: p.start_date || "",
      endDate: p.end_date || "",
      currentlyWorking: p.currently_working || false,
      description: Array.isArray(p.enhanced_description)
        ? p.enhanced_description.map((d: string) => `• ${d}`).join("\n")
        : p.enhanced_description || p.description || "",
      rolesResponsibilities: Array.isArray(p.roles_responsibilities)
        ? p.roles_responsibilities.map((r: string) => `• ${r}`).join("\n")
        : p.roles_responsibilities || "",
      enabled: true,
    })),
    skillsLinks: {
      skills: allSkills.map((s: any, i: number) => ({
        id: `skill-${i}`,
        skillName: s.skill_name || "",
        skillLevel: s.skill_level === "N/A" ? "" : (s.skill_level || ""),
        enabled: true,
      })),
      links: {
        linkedinProfile: linkedinLink?.url || pd.linkedin_url || "",
        linkedinEnabled: !!(linkedinLink?.url || pd.linkedin_url),
        githubProfile: githubLink?.url || "",
        githubEnabled: !!githubLink?.url,
        portfolioUrl: portfolioLink?.url || "",
        portfolioEnabled: !!portfolioLink?.url,
        portfolioDescription: "",
        publicationUrl: "",
        publicationEnabled: false,
        publicationDescription: "",
      },
      linksEnabled: true,
      technicalSummary: techSummary,
      technicalSummaryEnabled: !!techSummary,
    },
    certifications: certs.map((c: any, i: number) => ({
      certificate_id: c.certificate_id || null,
      id: `cert-${i}`,
      certificateType: c.certificate_type || "",
      certificateTitle: c.certificate_title || c.title || "",
      domain: c.domain || "",
      providedBy: c.certificate_provided_by || c.provided_by || "",
      date: c.date || "",
      description: c.description || "",
      certificateUrl: c.certificate_url || "",
      enabled: true,
    })),
  };
}

function getEmptyResumeData(): ResumeData {
  return {
    personal: {
      profilePhotoUrl: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      dateOfBirth: "",
      gender: "",
      languagesKnown: [],
      address: "",
      country: "",
      city: "",
      nationality: "",
      state: "",
      pincode: "",
      passportNumber: "",
      aboutCareerObjective: "",
    },
    education: {
      sslc: { instituteName: "", boardType: "", yearOfPassing: "", resultFormat: "", result: "" },
      sslcEnabled: false,
      preUniversity: { instituteName: "", boardType: "", subjectStream: "", yearOfPassing: "", resultFormat: "", result: "" },
      preUniversityEnabled: false,
      higherEducation: [],
    },
    experience: { jobRole: "", workExperiences: [] },
    projects: [],
    skillsLinks: {
      skills: [],
      links: {
        linkedinProfile: "", linkedinEnabled: false,
        githubProfile: "", githubEnabled: false,
        portfolioUrl: "", portfolioEnabled: false, portfolioDescription: "",
        publicationUrl: "", publicationEnabled: false, publicationDescription: "",
      },
      linksEnabled: false,
      technicalSummary: "",
      technicalSummaryEnabled: false,
    },
    certifications: [],
  };
}
