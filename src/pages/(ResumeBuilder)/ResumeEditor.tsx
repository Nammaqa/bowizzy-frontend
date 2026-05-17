import React, { useState, useEffect, useCallback, useRef } from "react";
import { Lock } from "lucide-react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import ProfileStepper from "./components/ui/ProfileStepper";
import PersonalDetailsForm from "./components/forms/PersonalDetailsForm";
import EducationDetailsForm from "./components/forms/EducationDetailsForm";
import ExperienceDetailsForm from "./components/forms/ExperienceDetailsForm";
import ProjectsForm from "./components/forms/ProjectsForm";
import SkillsLinksForm from "./components/forms/SkillsLinksForm";
import CertificationsForm from "./components/forms/CertificationsForm";
import { initialResumeData } from "../../types/resume";
import type { ResumeData } from "../../types/resume";
import DashNav from "@/components/dashnav/dashnav";
import { getTemplateById } from "@/templates/templateRegistry";
import ResumePreviewModal from "./components/ui/ResumePreviewModal";
import PageBreakMarkers from "./components/PageBreakMarkers";
import { usePageMarkers } from "@/hooks/usePageMarkers";
import { getPersonalDetailsByUserId } from "@/services/personalService";
import { getEducationByUserId } from "@/services/educationService";
import { getExperienceByUserId } from "@/services/experienceService";
import { getProjectsByUserId } from "@/services/projectService";
import { getCertificatesByUserId } from "@/services/certificateService";
import {
  getSkillsByUserId,
  getLinksByUserId,
  getTechnicalSummary,
} from "@/services/skillsLinksService";
import { getResumeTemplateById, uploadResume } from "@/services/resumeServices";

// Import print styles
import "@/styles/print.css";

const steps = [
  "Personal",
  "Education",
  "Experience",
  "Projects",
  "Skills & Links",
  "Certification",
];

const stepTitles = [
  "Step 1: Personal Details",
  "Step 2: Education Details",
  "Step 3: Experience",
  "Step 4: Projects",
  "Step 5: Skill(s) & Link(s)",
  "Step 6: Certification",
];

const nextButtonLabels = [
  "Proceed to Education",
  "Proceed to Experience",
  "Proceed to Projects",
  "Proceed to Skill(s) & Link(s)",
  "Proceed to Certification",
  "Preview Resume",
];

// Helper functions for API mapping (keep your existing mapping functions)
const mapEducationApiToLocal = (apiData: any[]) => {
  const educationData = JSON.parse(JSON.stringify(initialResumeData.education));
  const idMap: Record<string, number> = {};
  const higherEducations: any[] = [];

  apiData.forEach((item) => {
    const localId = item.education_id.toString();
    idMap[localId] = item.education_id;

    const baseData = {
      education_id: item.education_id,
      instituteName: item.institution_name || "",
      boardType: item.board_type || "",
      resultFormat: item.result_format
        ? item.result_format.charAt(0).toUpperCase() + item.result_format.slice(1)
        : "",
      result: item.result?.toString() || "",
    };

    if (item.education_type === "sslc") {
      educationData.sslc = { ...educationData.sslc, ...baseData, yearOfPassing: item.end_year || "" };
      educationData.sslcEnabled = true;
    } else if (item.education_type === "puc") {
      educationData.preUniversity = {
        ...educationData.preUniversity,
        ...baseData,
        subjectStream: item.subject_stream || "",
        yearOfPassing: item.end_year || "",
      };
      educationData.preUniversityEnabled = true;
    } else if (item.education_type === "higher") {
      higherEducations.push({
        id: localId,
        education_id: item.education_id,
        degree: item.degree || "",
        fieldOfStudy: item.field_of_study || "",
        instituteName: item.institution_name || "",
        universityBoard: item.university_name || "",
        startYear: item.start_year || "",
        endYear: item.end_year || "",
        resultFormat: item.result_format
          ? item.result_format.charAt(0).toUpperCase() + item.result_format.slice(1)
          : "",
        result: item.result?.toString() || "",
        currentlyPursuing: item.currently_working_here || false,
        enabled: true,
      });
    }
  });

  educationData.higherEducation = higherEducations;
  return { educationData, idMap, deleteIds: [] };
};

const mapExperienceApiToLocal = (apiData: any) => {
  const experiences = apiData.experiences.map((item: any) => ({
    id: item.experience_id.toString(),
    experience_id: item.experience_id,
    companyName: item.company_name || "",
    jobTitle: item.job_title || "",
    employmentType: item.employment_type || "",
    location: item.location || "",
    workMode: item.work_mode || "",
    startDate: item.start_date ? item.start_date.substring(0, 7) : "",
    endDate: item.end_date ? item.end_date.substring(0, 7) : "",
    currentlyWorking: item.currently_working_here || false,
    description: item.description || "",
    enabled: true,
  }));

  const idMap = experiences.reduce((acc: any, exp: any) => {
    acc[exp.id] = exp.experience_id;
    return acc;
  }, {});

  return {
    experienceData: {
      jobRole: apiData.job_role || "",
      workExperiences: experiences.length > 0 ? experiences : initialResumeData.experience.workExperiences,
      experienceEnabled: true,
    },
    idMap,
  };
};

const mapProjectsApiToLocal = (apiData: any[]) => {
  if (!apiData || apiData.length === 0) {
    return [{ ...initialResumeData.projects[0] }];
  }

  return apiData.map((item) => ({
    id: item.project_id.toString(),
    project_id: item.project_id,
    projectTitle: item.project_title || "",
    projectType: item.project_type || "",
    startDate: item.start_date ? item.start_date.substring(0, 7) : "",
    endDate: item.end_date ? item.end_date.substring(0, 7) : "",
    currentlyWorking: item.currently_working || false,
    description: item.description || "",
    rolesResponsibilities: item.roles_responsibilities || "",
    enabled: true,
  }));
};

const mapCertificatesApiToLocal = (apiData: any) => {
  const list = Array.isArray(apiData)
    ? apiData
    : apiData?.data || apiData?.certificates || [];

  if (!list || list.length === 0) {
    return [{ ...initialResumeData.certifications[0] }];
  }

  return list.map((item: any) => ({
    id: (item.certificate_id ?? item.id ?? Date.now()).toString(),
    certificate_id: item.certificate_id,
    certificateType: item.certificate_type || "",
    certificateTitle: item.certificate_title || "",
    domain: item.domain || "",
    providedBy: item.certificate_provided_by || "",
    date: item.date ? item.date.substring(0, 7) : "",
    description: item.description || "",
    certificateUrl: item.file_url || item.fileUrl || item.file || "",
    uploadedFileName: (item.file_url || item.fileUrl || item.file)
      ? (item.file_url || item.fileUrl || item.file).split("/").pop()
      : "",
    enabled: true,
  }));
};

const mapSkillsApiToLocal = (apiData: any[]) => {
  if (!apiData || apiData.length === 0) {
    return [{ id: "1", skillName: "", skillLevel: "", enabled: true }];
  }

  return apiData.map((item) => ({
    id: item.skill_id.toString(),
    skill_id: item.skill_id,
    skillName: item.skill_name || "",
    skillLevel: item.skill_level || "",
    enabled: true,
  }));
};

const mapLinksApiToLocal = (apiData: any[]) => {
  const linksObject: any = {
    linkedinProfile: "",
    githubProfile: "",
    portfolioUrl: "",
    portfolioDescription: "",
    publicationUrl: "",
    publicationDescription: "",
    linkedinEnabled: false,
    githubEnabled: false,
    portfolioEnabled: false,
    publicationEnabled: false,
    link_id_linkedin: undefined,
    link_id_github: undefined,
    link_id_portfolio: undefined,
    link_id_publication: undefined,
  };

  if (!apiData || apiData.length === 0) {
    return linksObject;
  }

  apiData.forEach((item) => {
    switch (item.link_type) {
      case "linkedin":
        linksObject.linkedinProfile = item.url || "";
        linksObject.linkedinEnabled = true;
        linksObject.link_id_linkedin = item.link_id?.toString();
        break;
      case "github":
        linksObject.githubProfile = item.url || "";
        linksObject.githubEnabled = true;
        linksObject.link_id_github = item.link_id?.toString();
        break;
      case "portfolio":
        linksObject.portfolioUrl = item.url || "";
        linksObject.portfolioDescription = item.description || "";
        linksObject.portfolioEnabled = true;
        linksObject.link_id_portfolio = item.link_id?.toString();
        break;
      case "publication":
        linksObject.publicationUrl = item.url || "";
        linksObject.publicationDescription = item.description || "";
        linksObject.publicationEnabled = true;
        linksObject.link_id_publication = item.link_id?.toString();
        break;
    }
  });

  return linksObject;
};
const FONT_OPTIONS = [
  { label: "Arial (Recommended)", value: "Arial, sans-serif" },
  { label: "Times New Roman (Recommended)", value: "Times New Roman, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" }
];

const COLOR_OPTIONS = [
  { label: "Black", value: "#000000" },
  { label: "Dark Gray", value: "#333333" },
  { label: "Navy Blue", value: "#1F3A8A" },
  { label: "Slate Blue", value: "#334155" },
  { label: "Dark Green", value: "#14532D" },
  { label: "Maroon", value: "#7F1D1D" }
];

export const ResumeEditor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");

  const [currentStep, setCurrentStep] = useState(0);
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: boolean }>({});
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchTimedOut, setFetchTimedOut] = useState(false);
  const [fontName, setFontName] = useState("Arial (Recommended)");
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [colorName, setColorName] = useState("Black");
  const [primaryColor, setPrimaryColor] = useState("#000000");

  const [userId, setUserId] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [personalDetailsId, setPersonalDetailsId] = useState<string | null>(null);
  const [educationDataIdMap, setEducationDataIdMap] = useState<Record<string, number>>({});
  const [deleteEducationIds, setDeleteEducationIds] = useState<number[]>([]);
  const [experienceDataIdMap, setExperienceDataIdMap] = useState<Record<string, number>>({});
  const [deleteExperienceIds, setDeleteExperienceIds] = useState<number[]>([]);
  const [technicalSummaryId, setTechnicalSummaryId] = useState<number | null>(
    null
  );

  const previewContentRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);
  const { markers, totalPages } = usePageMarkers(previewContentRef, [resumeData, selectedTemplate]);
  const DisplayComponent = selectedTemplate?.displayComponent || selectedTemplate?.component;
  // Pagination UI disabled by default to avoid triggering heavy rendering.
  // To re-enable pagination, set the initial state to `true` and uncomment
  // the Paginate toggle in the preview pane below.
  const [paginatePreview, setPaginatePreview] = useState<boolean>(false);
  const [previewPageCount, setPreviewPageCount] = useState<number>(1);
  const [previewCurrentPage, setPreviewCurrentPage] = useState<number>(1);
  const paginatedRef = useRef<{ goTo: (i: number) => void; next: () => void; prev: () => void } | null>(null);

  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const templateImportDoneRef = useRef(false);

  // Determines whether fetchAllData is allowed to run.
  // Starts as false when an external template import is expected, flipped to true once import finishes.
  const [importReady, setImportReady] = useState<boolean>(true);

  const location = useLocation();

  const applyImported = (imp: any) => {
    if (!imp) return;
    const newResume: any = { ...resumeData };

    const firstName = imp.first_name || imp.firstName || imp.personal?.first_name || imp.personal?.firstName;
    const lastName = imp.last_name || imp.lastName || imp.personal?.last_name || imp.personal?.lastName;
    const email = imp.email || imp.personal?.email;
    const mobile = imp.mobile_number || imp.personal?.mobileNumber || imp.personal?.mobile_number;
    const about = imp.summary || imp.about || imp.personal?.about || imp.personal?.summary;
    if (firstName || lastName || email || mobile || about) {
      newResume.personal = {
        ...newResume.personal,
        firstName: firstName || newResume.personal.firstName,
        lastName: lastName || newResume.personal.lastName,
        email: email || newResume.personal.email,
        mobileNumber: mobile || newResume.personal.mobileNumber,
        aboutCareerObjective: about || newResume.personal.aboutCareerObjective,
      };
    }

    if (Array.isArray(imp.experiences) && imp.experiences.length > 0) {
      newResume.experience = {
        ...newResume.experience,
        workExperiences: imp.experiences.map((it: any, idx: number) => ({
          id: `imp-${idx}`,
          experience_id: it.experience_id || undefined,
          companyName: it.company_name || it.employer || it.organization || "",
          jobTitle: it.job_title || it.title || "",
          employmentType: it.employment_type || "",
          location: it.location || it.city || "",
          workMode: it.work_mode || "",
          startDate: it.start_date ? it.start_date.substring(0, 7) : "",
          endDate: it.end_date ? it.end_date.substring(0, 7) : "",
          currentlyWorking: it.currently_working_here || false,
          description: it.description || it.responsibilities || "",
          enabled: true,
        })),
        experienceEnabled: true,
      };
    }

    if (Array.isArray(imp.education) && imp.education.length > 0) {
      const higher = imp.education.map((it: any, idx: number) => ({
        id: `imp-ed-${idx}`,
        degree: it.degree || it.qualification || "",
        fieldOfStudy: it.field_of_study || it.field || "",
        instituteName: it.institution_name || it.institution || "",
        universityBoard: it.university_name || "",
        startYear: it.start_year || "",
        endYear: it.end_year || it.year_of_passing || "",
        resultFormat: it.result_format || "",
        result: it.result || "",
        currentlyPursuing: it.currently_pursuing || false,
        enabled: true,
      }));
      newResume.education = { ...newResume.education, higherEducation: higher };
    }

    if (Array.isArray(imp.projects) && imp.projects.length > 0) {
      newResume.projects = imp.projects.map((it: any, idx: number) => ({
        id: `imp-pr-${idx}`,
        project_id: it.project_id || undefined,
        projectTitle: it.project_title || it.title || "",
        projectType: it.project_type || "",
        startDate: it.start_date ? it.start_date.substring(0, 7) : "",
        endDate: it.end_date ? it.end_date.substring(0, 7) : "",
        currentlyWorking: it.currently_working || false,
        description: it.description || "",
        rolesResponsibilities: it.roles_responsibilities || "",
        enabled: true,
      }));
    }

    if (Array.isArray(imp.skills) && imp.skills.length > 0) {
      newResume.skillsLinks = { ...newResume.skillsLinks, skills: imp.skills.map((s: any, idx: number) => ({ id: `imp-s-${idx}`, skill_id: s.skill_id, skillName: s.skill_name || s, skillLevel: s.level || s.skill_level || "", enabled: true })) };
    }

    setResumeData(newResume);
  };

  useEffect(() => {
    const imported = (location && (location as any).state && (location as any).state.importedResume) || null;
    const importedName = (location && (location as any).state && (location as any).state.resumeName) || null;
    if (imported) applyImported(imported);
  }, [location]);



  // User and token check
  useEffect(() => {
    const userDataStr = localStorage.getItem("user");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUserId(userData.user_id);
        setToken(userData.token);
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Template loading
  useEffect(() => {
    if (templateId) {
      const template = getTemplateById(templateId);
      setSelectedTemplate(template);
    }
  }, [templateId]);

  // Fetch all data
  const fetchAllData = useCallback(
    async (currentUserId: string, currentToken: string) => {
      if (!currentUserId || !currentToken) return;
      setLoading(true);

      // Overall timeout guard: ensure fetchAllData cannot hang forever if an
      // API call stalls. After TIMEOUT_MS we mark the op cancelled and clear
      // the loading UI so users aren't stuck on the spinner.
      const TIMEOUT_MS = 7000;
      let cancelled = false;
      const timeoutId = setTimeout(() => {
        cancelled = true;
        console.warn('[ResumeEditor] fetchAllData timed out');
        setLoading(false);
        setFetchTimedOut(true);
      }, TIMEOUT_MS);

      try {
        // Personal Details
        const personalResponse = await getPersonalDetailsByUserId(currentUserId, currentToken);
        if (cancelled) return;
        if (personalResponse) {
          const personalData = {
            profilePhotoUrl: personalResponse.profile_photo_url || "",
            firstName: personalResponse.first_name || "",
            middleName: personalResponse.middle_name || "",
            lastName: personalResponse.last_name || "",
            email: personalResponse.email || "",
            mobileNumber: personalResponse.mobile_number || "",
            dateOfBirth: personalResponse.date_of_birth || "",
            gender: personalResponse.gender
              ? personalResponse.gender.charAt(0).toUpperCase() + personalResponse.gender.slice(1)
              : "",
            languagesKnown: personalResponse.languages_known || [],
            address: personalResponse.address || "",
            country: personalResponse.country || "India",
            state: personalResponse.state || "",
            city: personalResponse.city || "",
            pincode: personalResponse.pincode || "",
            nationality: personalResponse.nationality || "",
            passportNumber: personalResponse.passport_number || "",
            aboutCareerObjective: personalResponse.about || "",
          };
          setResumeData((prev) => ({ ...prev, personal: personalData }));
          setPersonalDetailsId(personalResponse.personal_id || null);
        }

        // Education Details
        const educationResponse = await getEducationByUserId(currentUserId, currentToken);
        if (cancelled) return;
        if (educationResponse && educationResponse.length > 0) {
          const { educationData, idMap } = mapEducationApiToLocal(educationResponse);
          setResumeData((prev) => ({ ...prev, education: educationData }));
          setEducationDataIdMap(idMap);
        }

        // Experience Details
        const experienceResponse = await getExperienceByUserId(currentUserId, currentToken);
        if (cancelled) return;
        if (experienceResponse && experienceResponse.experiences) {
          const { experienceData, idMap } = mapExperienceApiToLocal(experienceResponse);
          setResumeData((prev) => ({ ...prev, experience: experienceData }));
          setExperienceDataIdMap(idMap);
        }

        // Projects
        const projectsResponse = await getProjectsByUserId(currentUserId, currentToken);
        if (cancelled) return;
        const projectsData = mapProjectsApiToLocal(projectsResponse);
        setResumeData((prev) => ({ ...prev, projects: projectsData }));

        // Skills
        const skillsResponse = await getSkillsByUserId(currentUserId, currentToken);
        if (cancelled) return;
        const skillsData = mapSkillsApiToLocal(skillsResponse);
        setResumeData((prev) => ({
          ...prev,
          skillsLinks: { ...prev.skillsLinks, skills: skillsData },
        }));

        // Links
        const linksResponse = await getLinksByUserId(currentUserId, currentToken);
        if (cancelled) return;
        const linksData = mapLinksApiToLocal(linksResponse);
        setResumeData((prev) => ({
          ...prev,
          skillsLinks: { ...prev.skillsLinks, links: linksData },
        }));

        // Technical Summary
        try {
          const summaryResponse = await getTechnicalSummary(currentUserId, currentToken);
          if (cancelled) return;
          if (summaryResponse && typeof summaryResponse.summary === "string") {
            setResumeData((prev) => ({
              ...prev,
              skillsLinks: {
                ...prev.skillsLinks,
                technicalSummary: summaryResponse.summary || "",
                technicalSummaryEnabled: !!summaryResponse.summary,
              },
            }));
            setTechnicalSummaryId(summaryResponse.summary_id || null);
          } else {
            console.info("No technical summary returned", summaryResponse);
            setResumeData((prev) => ({
              ...prev,
              skillsLinks: {
                ...prev.skillsLinks,
                technicalSummary: "",
                technicalSummaryEnabled: false,
              },
            }));
            setTechnicalSummaryId(null);
          }
        } catch (err) {
          console.error("Failed to fetch technical summary:", err);
        }

        try {
          const certificatesResponse = await getCertificatesByUserId(currentUserId, currentToken);
          if (cancelled) return;
          const certificatesData = mapCertificatesApiToLocal(certificatesResponse);
          setResumeData((prev) => ({ ...prev, certifications: certificatesData }));
        } catch (err) {
          console.error("Failed to fetch certificates:", err);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setLoading(false);
          setFetchTimedOut(false);
        }
      }
    },
    []
  );

  const retryFetch = () => {
    if (!userId || !token) return;
    setFetchTimedOut(false);
    fetchAllData(userId, token);
  };

  useEffect(() => {
    if (userId && token && importReady) {
      fetchAllData(userId, token);
    }
  }, [userId, token, fetchAllData, importReady]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
        setFontDropdownOpen(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setColorDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showPreviewModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
    return;
  }, [showPreviewModal]);

  // Scroll to top when step changes
  useEffect(() => {
    if (formScrollRef.current) {
      formScrollRef.current.scrollTo(0, 0);
    }
  }, [currentStep]);

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setPreviewLoading(true);
      setShowPreviewModal(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };



  const updatePersonalData = (data: typeof resumeData.personal) => {
    setResumeData({ ...resumeData, personal: data });
  };

  const updateEducationData = (data: typeof resumeData.education) => {
    setResumeData({ ...resumeData, education: data });
  };

  const updateExperienceData = (data: typeof resumeData.experience) => {
    setResumeData({ ...resumeData, experience: data });
  };

  const updateProjectsData = (data: typeof resumeData.projects) => {
    setResumeData({ ...resumeData, projects: data });
  };

  const updateSkillsLinksData = (data: typeof resumeData.skillsLinks) => {
    setResumeData({ ...resumeData, skillsLinks: data });
  };

  const updateCertificationsData = (data: typeof resumeData.certifications) => {
    setResumeData({ ...resumeData, certifications: data });
  };

  const renderCurrentForm = () => {
    if (loading) {
      if (fetchTimedOut) {
        return (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="mb-4 text-red-600">Fetching your details is taking longer than expected.</p>
              <div className="flex gap-3 justify-center">
                <button className="btn btn-primary" onClick={retryFetch}>Retry</button>
                <button className="btn" onClick={() => setFetchTimedOut(false)}>Dismiss</button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-orange-400"></div>
            <p className="mt-4 text-gray-600">Loading details...</p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <PersonalDetailsForm
            data={resumeData.personal}
            fullResumeData={resumeData}
            onChange={updatePersonalData}
            userId={userId}
            token={token}
            personalDetailsId={personalDetailsId}
            supportsPhoto={selectedTemplate?.supportsPhoto ?? false}
          />
        );
      case 1:
        return (
          <EducationDetailsForm
            data={resumeData.education}
            onChange={updateEducationData}
            userId={userId}
            token={token}
            educationDataIdMap={educationDataIdMap}
            setEducationDataIdMap={setEducationDataIdMap}
            deleteEducationIds={deleteEducationIds}
            setDeleteEducationIds={setDeleteEducationIds}
          />
        );
      case 2:
        return (
          <ExperienceDetailsForm
            data={resumeData.experience}
            onChange={updateExperienceData}
            userId={userId}
            token={token}
            experienceDataIdMap={experienceDataIdMap}
            setExperienceDataIdMap={setExperienceDataIdMap}
            deleteExperienceIds={deleteExperienceIds}
            setDeleteExperienceIds={setDeleteExperienceIds}
          />
        );
      case 3:
        return (
          <ProjectsForm
            data={resumeData.projects}
            onChange={updateProjectsData}
            userId={userId}
            token={token}
          />
        );
      case 4:
        return (
          <SkillsLinksForm
            data={resumeData.skillsLinks}
            onChange={updateSkillsLinksData}
            userId={userId}
            token={token}
            technicalSummaryId={technicalSummaryId}
          />
        );
      case 5:
        return (
          <CertificationsForm
            data={resumeData.certifications}
            onChange={updateCertificationsData}
            userId={userId}
            token={token}
          />
        );
      default:
        return null;
    }
  };

  const renderTemplatePreview = () => {
    if (!selectedTemplate) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No template selected</p>
        </div>
      );
    }

    const DisplayComponent = selectedTemplate.displayComponent || selectedTemplate.component;
    return (
      <div className="relative">
        <DisplayComponent
          data={resumeData}
          supportsPhoto={selectedTemplate.supportsPhoto ?? false}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <DashNav heading="Resume Builder" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col bg-white rounded-lg overflow-hidden m-4">
          <div className="bg-white">
            <ProfileStepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
              validationErrors={validationErrors}
            />
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="flex-1 lg:w-[50%] overflow-auto scrollbar-hide min-w-0" ref={formScrollRef}>
              <div className="p-4 md:p-6 w-full max-w-full">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-[#1A1A43]">
                    {stepTitles[currentStep]}
                  </h2>

                  {/* Style controls */}
                  <div className="flex gap-3 items-center">
                    {/* Font Selector */}
                    <div className="relative" ref={fontDropdownRef}>
                      <button
                        onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                        className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                        style={{ fontFamily: fontFamily }}
                      >
                        <span className="font-semibold">{fontName}</span>
                        <svg
                          className={`w-4 h-4 text-gray-600 transition-transform ${fontDropdownOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                      {fontDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                          <div className="p-3 max-h-80 overflow-y-auto">
                            <div className="text-xs font-semibold text-gray-500 px-3 py-2">SELECT FONT</div>
                            {FONT_OPTIONS.map((font) => (
                              <button
                                key={font.label}
                                onClick={() => {
                                  setFontName(font.label);
                                  setFontFamily(font.value);
                                  setFontDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all mb-2 font-medium ${fontName === font.label
                                    ? "bg-orange-500 text-white shadow-md"
                                    : "hover:bg-orange-50 text-gray-700 border border-transparent hover:border-orange-200"
                                  }`}
                                style={{ fontFamily: font.value }}
                              >
                                {font.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Color Selector */}
                    <div className="relative" ref={colorDropdownRef}>
                      <button
                        onClick={() => setColorDropdownOpen(!colorDropdownOpen)}
                        className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <div
                          className="w-6 h-6 rounded-lg border-2 border-white shadow-md"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <span className="font-semibold text-gray-700">{COLOR_OPTIONS.find(c => c.value === primaryColor)?.label}</span>
                        <svg
                          className={`w-4 h-4 text-gray-600 transition-transform ${colorDropdownOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                      {colorDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                          <div className="p-4">
                            <div className="text-xs font-semibold text-gray-500 px-2 pb-3">SELECT COLOR</div>
                            <div className="grid grid-cols-2 gap-3">
                              {COLOR_OPTIONS.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() => {
                                    setPrimaryColor(color.value);
                                    setColorDropdownOpen(false);
                                  }}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${primaryColor === color.value
                                      ? "bg-orange-100 border-2 border-orange-500 shadow-md"
                                      : "hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                  <div
                                    className="w-10 h-10 rounded-lg border-2 border-white shadow-md flex-shrink-0"
                                    style={{ backgroundColor: color.value }}
                                  />
                                  <span className={`text-sm font-medium ${primaryColor === color.value ? 'text-orange-700' : 'text-gray-700'}`}>
                                    {color.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">{renderCurrentForm()}</div>

                <div className="flex items-center justify-center gap-4 py-4">
                  {currentStep > 0 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="px-6 py-2.5 text-sm font-medium text-orange-500 bg-white border border-orange-400 rounded-full hover:bg-orange-50 transition-colors cursor-pointer"
                    >
                      Previous
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-orange-400 rounded-full hover:bg-orange-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={loading || (currentStep === steps.length - 1 && previewLoading)}
                  >
                    {currentStep === steps.length - 1 && previewLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      nextButtonLabels[currentStep]
                    )}
                  </button>
                </div>
              </div>
            </div>


            <div className="hidden lg:flex lg:w-[50%] bg-white overflow-auto scrollbar-hide p-4">
              <div className="flex-1 overflow-auto scrollbar-hide border border-gray-300 rounded-lg">
                <div className="relative w-full h-full flex items-start justify-center">
                  {/* Page info */}
                  {totalPages > 1 && (
                    <>
                      <div className="absolute top-2 right-4 bg-white px-3 py-1 rounded-full shadow-md text-sm font-medium z-10">
                        {paginatePreview ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button onClick={() => paginatedRef.current?.prev()} disabled={!paginatePreview} style={{ padding: '6px 8px', borderRadius: '6px' }}>‹</button>
                            <span>{previewCurrentPage}/{previewPageCount} {previewPageCount === 1 ? 'Page' : 'Pages'}</span>
                            <button onClick={() => paginatedRef.current?.next()} disabled={!paginatePreview} style={{ padding: '6px 8px', borderRadius: '6px' }}>›</button>
                          </div>
                        ) : (
                          <>{totalPages} {totalPages === 1 ? 'Page' : 'Pages'}</>
                        )}
                      </div>

                      {/* Paginate toggle disabled while we stabilize pagination behavior.
                          To re-enable, uncomment this block and set paginatePreview default to true. */}
                    </>
                  )}

                  {/* Preview content with markers */}
                  {/* Lock icon for template12 to template20 */}
                  {(() => {
                    const templateIdStr = selectedTemplate?.id || templateId;
                    const match = templateIdStr && templateIdStr.match(/^template(\d+)$/);
                    const num = match ? parseInt(match[1], 10) : null;
                    if (num && num >= 12 && num <= 20) {
                      return (
                        <div className="absolute top-4 left-4 z-20 flex items-center">
                          <Lock className="w-8 h-8 text-gray-500" />
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div
                    className="relative transform scale-75 origin-top -mt-4"
                    style={{ fontFamily: fontFamily }}
                  >
                    <div ref={previewContentRef} className="relative">
                      {selectedTemplate && (
                        <DisplayComponent
                          data={resumeData}
                          supportsPhoto={selectedTemplate.supportsPhoto ?? false}
                          fontFamily={fontFamily}
                          primaryColor={primaryColor}
                          showPageBreaks={paginatePreview && !loading}
                          onPageCountChange={(n: number) => setPreviewPageCount(n)}
                          onPageChange={(i: number) => setPreviewCurrentPage(i)}
                          pageControllerRef={paginatedRef}
                        />
                      )}
                      {/* <PageBreakMarkers markers={markers} /> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <ResumePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        resumeData={resumeData}
        templateId={templateId}
        userId={userId}
        token={token}
        resumeTemplateId={searchParams.get("resumeTemplateId")}
        editorPaginatePreview={paginatePreview}
        autoGeneratePreview={true}
        autoShowPdfPreview={true}
        onPreviewComplete={() => setPreviewLoading(false)}
        primaryColor={primaryColor}
        fontFamily={fontFamily}
      />
    </div>
  );
};

export default ResumeEditor;