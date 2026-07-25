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
import { getTemplateById, getAllTemplates } from "@/templates/templateRegistry";
import { LayoutTemplate, Heart, X } from "lucide-react";

// Preview images for the template picker modal
import template11Img from "@/templates/preview/imgs/template11.jpg";
import template12Img from "@/templates/preview/imgs/template12.png";
import template13Img from "@/templates/preview/imgs/template13.png";
import template14Img from "@/templates/preview/imgs/template14.png";
import template15Img from "@/templates/preview/imgs/template15.png";
import template16Img from "@/templates/preview/imgs/template16.png";
import template17Img from "@/templates/preview/imgs/template17.png";
import template18Img from "@/templates/preview/imgs/template18.png";
import template19Img from "@/templates/preview/imgs/template19.png";
import template20Img from "@/templates/preview/imgs/template20.png";
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
import api from "@/api";

// Import print styles
import "@/styles/print.css";

const TEMPLATE_PICKER_PREVIEW_IMAGES: Record<number, string> = {
  11: template11Img,
  12: template12Img,
  13: template13Img,
  14: template14Img,
  15: template15Img,
  16: template16Img,
  17: template17Img,
  18: template18Img,
  19: template19Img,
  20: template20Img,
};

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
      educationData.sslc = { ...educationData.sslc, ...baseData, startYear: item.start_year || "", endYear: item.end_year || "", yearOfPassing: item.end_year || "" };
      educationData.sslcEnabled = true;
    } else if (item.education_type === "puc") {
      educationData.preUniversity = {
        ...educationData.preUniversity,
        ...baseData,
        subjectStream: item.subject_stream || "",
        startYear: item.start_year || "",
        endYear: item.end_year || "",
        yearOfPassing: item.end_year || "",
      };
      educationData.preUniversityEnabled = true;
    } else if (item.education_type === "higher") {
      const currentlyPursuing = item.currently_pursuing ?? item.currently_working_here ?? false;

      higherEducations.push({
        id: localId,
        education_id: item.education_id,
        degree: item.degree || "",
        fieldOfStudy: item.field_of_study || "",
        instituteName: item.institution_name || "",
        universityBoard: item.university_name || "",
        startYear: item.start_year || "",
        endYear: currentlyPursuing ? "" : item.end_year || "",
        resultFormat: item.result_format
          ? item.result_format.charAt(0).toUpperCase() + item.result_format.slice(1)
          : "",
        result: item.result?.toString() || "",
        currentlyPursuing,
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
  const [enhanceStatus, setEnhanceStatus] = useState<{isBonus_enhance_used: boolean; enhance_usage_left: number; purchased_credits?: number | string} | null>(null);
  const [purchasedCreditsBalance, setPurchasedCreditsBalance] = useState<number>(0);
  const [redeemingEnhance, setRedeemingEnhance] = useState(false);
  const [showPurchasedCreditsModal, setShowPurchasedCreditsModal] = useState(false);
  const [selectedPurchasedCredits, setSelectedPurchasedCredits] = useState(1);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const allTemplates = getAllTemplates();

  const previewContentRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);
  const { markers, totalPages } = usePageMarkers(previewContentRef, [resumeData, selectedTemplate]);
  const DisplayComponent = selectedTemplate?.displayComponent || selectedTemplate?.component;
  const disableAiEnhance = templateId === "template11";
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
  // Starts as false when a template import is expected, flipped to true once import finishes.
  const [importReady, setImportReady] = useState<boolean>(() => {
    const rtId = new URLSearchParams(window.location.search).get("resumeTemplateId");
    if (rtId && !sessionStorage.getItem(`imported_template_${rtId}`)) return false;
    return true;
  });

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

  // If navigated here from 'Edit', the data is already stored in the user profile database.
  // We do not need to re-extract the PDF, just set importReady so fetchAllData can load the profile.
  useEffect(() => {
    if (templateImportDoneRef.current) return;
    templateImportDoneRef.current = true;
    setImportReady(true);
  }, []);

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

  const fetchEnhanceStatus = useCallback(async (currentUserId: string, currentToken: string) => {
    try {
      const [enhanceResponse, profileResponse] = await Promise.all([
        api.get(`/users/${currentUserId}/check-enhance-used`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        }),
        api.get('/personal-details/profile-data', {
          headers: { Authorization: `Bearer ${currentToken}` }
        })
      ]);

      if (enhanceResponse.data) {
        setEnhanceStatus({
          isBonus_enhance_used: enhanceResponse.data.isBonus_enhance_used,
          enhance_usage_left: enhanceResponse.data.enhance_usage_left,
          purchased_credits: enhanceResponse.data.purchased_credits ?? enhanceResponse.data.purchasedCredits ?? enhanceResponse.data.purchased_credits_balance ?? 0,
        });
      }

      const profileData = profileResponse?.data ?? profileResponse;
      const profilePurchasedCredits = Number(profileData?.purchased_credits ?? profileData?.credits ?? 0);
      setPurchasedCreditsBalance(Number.isFinite(profilePurchasedCredits) ? profilePurchasedCredits : 0);
    } catch (err) {
      console.error("Failed to fetch enhance status:", err);
    }
  }, []);

  useEffect(() => {
    if (userId && token) {
      fetchEnhanceStatus(userId, token);
    }
  }, [userId, token, fetchEnhanceStatus]);

  const handleRedeemEnhance = async () => {
    if (!userId || !token) return;
    setRedeemingEnhance(true);
    try {
      await api.post(`/users/${userId}/redeem-enhance-with-bonus`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchEnhanceStatus(userId, token);
      window.dispatchEvent(new CustomEvent("credits:refresh", { detail: { reason: "redeem_enhance" } }));
    } catch (err) {
      console.error("Failed to redeem enhance with bonus:", err);
    } finally {
      setRedeemingEnhance(false);
    }
  };

  const handleRedeemEnhanceWithPurchasedCredits = () => {
    if (!userId || !token) return;

    const purchasedCredits = Number(purchasedCreditsBalance || enhanceStatus?.purchased_credits || 0);
    const maxCredits = Math.min(50, Math.max(1, Math.floor(purchasedCredits || 1)));
    setSelectedPurchasedCredits(maxCredits);
    setShowPurchasedCreditsModal(true);
  };

  const confirmPurchasedCreditRedeem = async () => {
    if (!userId || !token) return;

    setRedeemingEnhance(true);
    try {
      await api.post(`/users/${userId}/redeem-enhance-with-purchased-credits`, {
        credits: selectedPurchasedCredits,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowPurchasedCreditsModal(false);
      await fetchEnhanceStatus(userId, token);
      window.dispatchEvent(new CustomEvent("credits:refresh", { detail: { reason: "redeem_enhance_purchased" } }));
    } catch (err) {
      console.error("Failed to redeem enhance with purchased credits:", err);
    } finally {
      setRedeemingEnhance(false);
    }
  };

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

  const handleSaveAndExit = async () => {
    try {
      if (resumeData && userId && token) {
        await uploadResume(userId, new Blob([JSON.stringify(resumeData)]), token);
      }
    } catch (error) {
      console.error("Error saving resume:", error);
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
            disableAiEnhance={disableAiEnhance}
            enhanceStatus={enhanceStatus}
            onRedeemEnhance={handleRedeemEnhance}
            onRedeemEnhanceWithPurchasedCredits={handleRedeemEnhanceWithPurchasedCredits}
            onEnhanceStatusChange={setEnhanceStatus}
            redeemingEnhance={redeemingEnhance}
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
            disableAiEnhance={disableAiEnhance}
            enhanceStatus={enhanceStatus}
            onRedeemEnhance={handleRedeemEnhance}
            onRedeemEnhanceWithPurchasedCredits={handleRedeemEnhanceWithPurchasedCredits}
            onEnhanceStatusChange={setEnhanceStatus}
            redeemingEnhance={redeemingEnhance}
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
            disableAiEnhance={disableAiEnhance}
            enhanceStatus={enhanceStatus}
            onRedeemEnhance={handleRedeemEnhance}
            onRedeemEnhanceWithPurchasedCredits={handleRedeemEnhanceWithPurchasedCredits}
            onEnhanceStatusChange={setEnhanceStatus}
            redeemingEnhance={redeemingEnhance}
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
        <div className="flex-1 flex flex-col bg-white rounded-lg overflow-hidden ">
          <div className="bg-white">
            <ProfileStepper
              steps={steps}
              currentStep={currentStep}
              validationErrors={validationErrors}
            />
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="flex-1 lg:w-[50%] overflow-auto scrollbar-hide min-w-0" ref={formScrollRef}>
              <div className="p-4 md:p-6 w-full max-w-full">
                {/* LHS header: title row + controls row stacked to prevent overflow */}
                <div className="mb-5 space-y-3">
                  {/* Row 1 — step title */}
                  <h2 className="text-lg font-semibold text-[#1A1A43] truncate">
                    {stepTitles[currentStep]}
                  </h2>

                  {/* Row 2 — compact toolbar controls */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Choose Template */}
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="border border-orange-400 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white hover:bg-orange-50 text-orange-500 transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                    >
                      <LayoutTemplate className="w-3.5 h-3.5 shrink-0" />
                      Choose Template
                    </button>

                    {/* Font Selector */}
                    <div className="relative" ref={fontDropdownRef}>
                      <button
                        onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium bg-white hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                        style={{ fontFamily: fontFamily }}
                      >
                        <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                        <span className="font-semibold max-w-[90px] truncate">{fontName.split(' ')[0]}</span>
                        <svg
                          className={`w-3 h-3 text-gray-500 transition-transform shrink-0 ${fontDropdownOpen ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {fontDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                          <div className="p-3 max-h-72 overflow-y-auto">
                            <div className="text-xs font-semibold text-gray-400 px-2 pb-2 uppercase tracking-wide">Select Font</div>
                            {FONT_OPTIONS.map((font) => (
                              <button
                                key={font.label}
                                onClick={() => {
                                  setFontName(font.label);
                                  setFontFamily(font.value);
                                  setFontDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all mb-1 font-medium ${
                                  fontName === font.label
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'hover:bg-orange-50 text-gray-700'
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
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium bg-white hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                      >
                        <div
                          className="w-4 h-4 rounded border border-gray-300 shadow-sm shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <span className="font-semibold text-gray-700">
                          {COLOR_OPTIONS.find(c => c.value === primaryColor)?.label}
                        </span>
                        <svg
                          className={`w-3 h-3 text-gray-500 transition-transform shrink-0 ${colorDropdownOpen ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {colorDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                          <div className="p-3">
                            <div className="text-xs font-semibold text-gray-400 px-2 pb-2 uppercase tracking-wide">Select Color</div>
                            <div className="grid grid-cols-2 gap-2">
                              {COLOR_OPTIONS.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() => {
                                    setPrimaryColor(color.value);
                                    setColorDropdownOpen(false);
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all ${
                                    primaryColor === color.value
                                      ? 'bg-orange-50 border-2 border-orange-500'
                                      : 'hover:bg-gray-50 border border-gray-200'
                                  }`}
                                >
                                  <div
                                    className="w-7 h-7 rounded border border-gray-200 shrink-0"
                                    style={{ backgroundColor: color.value }}
                                  />
                                  <span className={`text-xs font-medium ${
                                    primaryColor === color.value ? 'text-orange-700' : 'text-gray-700'
                                  }`}>
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


            <div className="hidden lg:flex lg:w-[50%] bg-white overflow-hidden p-4">
              <div className="flex-1 flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white min-w-0">
                {/* RHS toolbar */}
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200 shrink-0 min-h-[48px]">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500 font-medium">Preview</span>
                  </div>
                  <div>
                    {totalPages > 1 && (
                      <div className="bg-white px-3 py-1 rounded-full shadow-sm text-xs font-medium text-gray-600 border border-gray-200">
                        {paginatePreview ? (
                          <div className="flex gap-1.5 items-center">
                            <button onClick={() => paginatedRef.current?.prev()} disabled={!paginatePreview} className="px-1 rounded">‹</button>
                            <span>{previewCurrentPage}/{previewPageCount} {previewPageCount === 1 ? 'Page' : 'Pages'}</span>
                            <button onClick={() => paginatedRef.current?.next()} disabled={!paginatePreview} className="px-1 rounded">›</button>
                          </div>
                        ) : (
                          <>{totalPages} {totalPages === 1 ? 'Page' : 'Pages'}</>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Scaled resume preview — overflow-hidden prevents bleed */}
                <div className="flex-1 overflow-auto scrollbar-hide bg-gray-50/50">
                  <div className="w-full flex justify-center items-start p-4">
                    <div
                      className="origin-top shrink-0"
                      style={{
                        transform: 'scale(0.68)',
                        transformOrigin: 'top center',
                        fontFamily: fontFamily,
                        width: '794px',          /* A4 width */
                        marginBottom: '-26%',    /* compensate scale shrink so container height follows */
                      }}
                    >
                      <div ref={previewContentRef}>
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
                      </div>
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
        onSaveAndExit={handleSaveAndExit}
        onSaveAndDownloadComplete={() => navigate("/ResumeBuilder")}
        primaryColor={primaryColor}
        fontFamily={fontFamily}
      />

      {showPurchasedCreditsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">Redeem with purchased credits</h3>
            <p className="mt-2 text-sm text-gray-600">
              Choose how many purchased credits to use for this enhancement. The amount is capped at 50.
            </p>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                <span>Credits to use</span>
                <span className="text-orange-600">{selectedPurchasedCredits}</span>
              </div>
              <input
                type="range"
                min={1}
                max={Math.min(50, Math.max(1, Number(purchasedCreditsBalance || enhanceStatus?.purchased_credits || 0)))}
                value={selectedPurchasedCredits}
                onChange={(e) => setSelectedPurchasedCredits(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-orange-100 accent-orange-500"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>1</span>
                <span>Max {Math.min(50, Math.max(1, Number(purchasedCreditsBalance || enhanceStatus?.purchased_credits || 0)))}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPurchasedCreditsModal(false)}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPurchasedCreditRedeem}
                disabled={redeemingEnhance}
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {redeemingEnhance ? "Redeeming..." : "Redeem"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Picker Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTemplateModal(false)}
          />

          {/* Modal panel */}
          <div className="relative z-[301] w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div>
                <h2 className="text-xl font-bold text-[#1A1A43]">Choose a Template</h2>
                <p className="text-sm text-gray-500 mt-0.5">Select a template to switch — your data will be preserved</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {allTemplates.map((template) => {
                  const tNum = parseInt(template.id.replace("template", ""), 10);
                  const previewSrc = TEMPLATE_PICKER_PREVIEW_IMAGES[tNum] || template.thumbnail;
                  const isActive = template.id === templateId;

                  return (
                    <div
                      key={template.id}
                      onClick={() => {
                        navigate(`/resume-editor?templateId=${template.id}`);
                        setShowTemplateModal(false);
                      }}
                      className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-[1.02] ${
                        isActive
                          ? "ring-2 ring-orange-500 shadow-lg"
                          : "ring-1 ring-gray-200"
                      }`}
                    >
                      {/* Thumbnail */}
                      <img
                        src={previewSrc}
                        alt={template.name}
                        className="w-full h-48 object-cover object-top bg-gray-50"
                      />

                      {/* Hover overlay with CTA */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <span className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg shadow-md">
                          {isActive ? "Current Template" : "Use This Template"}
                        </span>
                      </div>

                      {/* Active badge */}
                      {isActive && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Active
                        </div>
                      )}

                      {/* Label */}
                      <div className="px-3 py-2 bg-white">
                        <div className="flex items-center gap-1.5">
                          <Heart size={10} className="text-orange-500 shrink-0" />
                          <span className="text-xs font-semibold text-[#1A1A43] truncate">
                            {template.label || template.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeEditor;
