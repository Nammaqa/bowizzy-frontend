import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashNav from "@/components/dashnav/dashnav";
import ProfileStepper from "./components/ProfileStepper";
import PersonalDetailsForm from "./components/PersonalDetailsForm";
import EducationDetailsForm from "./components/EducationDetailsForm";
import ExperienceDetailsForm from "./components/ExperienceDetailsForm";
import ProjectDetailsForm from "./components/ProjectDetailsForm";
import SkillsLinksDetailsForm from "./components/SkillsLinksDetailsForm";
import CertificationDetailsForm from "./components/CertificationDetailsForm";
import {
  getPersonalDetailsByUserId,
  updatePersonalDetails,
} from "@/services/personalService";
import { getEducationByUserId } from "@/services/educationService";
import { getExperienceByUserId } from "@/services/experienceService"; 
import { getProjectsByUserId } from "@/services/projectService"; 
import { getSkillsByUserId, getLinksByUserId } from "@/services/skillsLinksService"; 
import { getCertificatesByUserId } from "@/services/certificateService"; 
import { getProfileProgress } from "@/services/dashboardServices"; 

export default function ProfileForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    personal: {},
    education: {},
    experience: {},
    projects: {},
    skills: {},
    certification: {},
  });
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const [personalDetailsId, setPersonalDetailsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [profileCompletionPercentage, setProfileCompletionPercentage] = useState<number | null>(null);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionError, setCompletionError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const parsedData = JSON.parse(localStorage.getItem("user"));
  const userId = parsedData?.user_id;
  const token = parsedData?.token;

  // Set initial step from navigation state if provided
  useEffect(() => {
    const passedStep = (location.state as any)?.step;
    if (typeof passedStep === "number" && passedStep >= 0 && passedStep <= 5) {
      setCurrentStep(passedStep);
    }
  }, [location.state]);

  const steps = [
    "Personal",
    "Education",
    "Experience",
    "Projects",
    "Skills & Links",
    "Certification",
  ];

  // Handler for fetching all profile data
  const fetchAllProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingError(null);
      console.log("Fetching profile data for user:", userId);

      // Fetch personal details
      // Fetch personal details
      try {
        const personalData = await getPersonalDetailsByUserId(userId, token);
        if (personalData && personalData.personal_id) {
          setPersonalDetailsId(personalData.personal_id);
        }
        setFormData((prev) => ({
          ...prev,
          personal: mapPersonalDetailsFromAPI(personalData),
        }));
      } catch (error) {
        console.log("No existing personal details found or error:", error);
      }

      // Fetch education details
      try {
        const educationData = await getEducationByUserId(userId, token);
        if (educationData && Array.isArray(educationData)) {
          setFormData((prev) => ({
            ...prev,
            education: mapEducationDetailsFromAPI(educationData),
          }));
        }
      } catch (error) {
        console.log("No existing education details found or error:", error);
      }

      // Fetch experience details
      try {
        const response = await getExperienceByUserId(userId, token);
        if (
          response &&
          response.experiences &&
          Array.isArray(response.experiences)
        ) {
          setFormData((prev) => ({
            ...prev,
            experience: mapExperienceDetailsFromAPI(
              response.experiences,
              response.job_role
            ),
          }));
        }
      } catch (error) {
        console.log("No existing experience details found or error:", error);
      }

      // Fetch projects
      try {
        const projectsData = await getProjectsByUserId(userId, token);
        if (projectsData && Array.isArray(projectsData)) {
          setFormData((prev) => ({
            ...prev,
            projects: mapProjectDetailsFromAPI(projectsData),
          }));
        }
      } catch (error) {
        console.log("No existing projects found or error:", error);
      }

      // Fetch skills and links
      try {
        const skillsData = await getSkillsByUserId(userId, token); 
        const linksData = await getLinksByUserId(userId, token); 

        setFormData((prev) => ({
          ...prev,
          skills: mapSkillsAndLinksFromAPI(skillsData, linksData), 
        }));
      } catch (error) {
        console.log("No existing skills/links found or error:", error);
      }

      // Fetch certifications
      try {
        const certificationsData = await getCertificatesByUserId(userId, token); 
        if (certificationsData && Array.isArray(certificationsData)) {
          setFormData((prev) => ({
            ...prev,
            certification: mapCertificateDetailsFromAPI(certificationsData), 
          }));
        }
      } catch (error) {
        console.log("No existing certifications found or error:", error);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setLoadingError("Failed to load profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  // Handler for fetching all profile data on mount and whenever the education step is opened
  useEffect(() => {
    if (!userId || !token) return;
    void fetchAllProfileData();
  }, [userId, token, fetchAllProfileData]);

  useEffect(() => {
    if (!userId || !token || currentStep !== 1) return;
    void fetchAllProfileData();
  }, [currentStep, userId, token, fetchAllProfileData]);

  // Map API response to form structure (Personal)
  const mapPersonalDetailsFromAPI = (apiData) => {
    const formatDateForInput = (isoDateString) => {
      if (!isoDateString) return "";
      return isoDateString.substring(0, 10);
    };

    return {
      firstName: apiData.first_name || "",
      middleName: apiData.middle_name || "",
      lastName: apiData.last_name || "",
      email: apiData.email || "",
      mobileNumber: apiData.mobile_number || "",
      dateOfBirth: formatDateForInput(apiData.date_of_birth) || "",
      gender: apiData.gender
        ? apiData.gender.charAt(0).toUpperCase() + apiData.gender.slice(1)
        : "Male",
      languages: apiData.languages_known || [],
      address: apiData.address || "",
      country: apiData.country || "",
      state: apiData.state || "",
      city: apiData.city || "",
      pincode: apiData.pincode || "",
      nationality: apiData.nationality || "",
      passportNumber: apiData.passport_number || "",
      uploadedPhotoURL: apiData.profile_photo_url || "",
      profilePhotoPreview: apiData.profile_photo_url || "",
      profilePhoto: apiData.profile_photo_url,
      personal_id: apiData.personal_id,
    };
  };

  // Map Education Details from API
  const mapEducationDetailsFromAPI = (apiDataArray) => {
    const educationForm = {
      sslc: {},
      pu: {},
      higherEducations: [],
      extraEducations: [],
    };

    const formatYearForInput = (yearValue) => {
      if (!yearValue) return "";

      if (typeof yearValue === "string" && yearValue.includes("-")) {
        const parts = yearValue.split("-");
        if (parts.length >= 2) {
          return `${parts[0]}-${parts[1]}`;
        }
      }

      const year =
        typeof yearValue === "number" ? yearValue : parseInt(yearValue, 10);
      return isNaN(year) ? "" : `${year}-01`;
    };

    apiDataArray.forEach((edu) => {
      if (edu.education_type === "sslc") {
        educationForm.sslc = {
          institutionName: edu.institution_name || "",
          boardType: edu.board_type || "",
          yearOfPassing: formatYearForInput(edu.end_year),
          resultFormat: edu.result_format
            ? edu.result_format.charAt(0).toUpperCase() +
              edu.result_format.slice(1)
            : "Percentage",
          result: edu.result || "",
          education_id: edu.education_id,
        };
      } else if (edu.education_type === "puc") {
        educationForm.pu = {
          institutionName: edu.institution_name || "",
          boardType: edu.board_type || "",
          subjectStream: edu.subject_stream || "",
          yearOfPassing: formatYearForInput(edu.end_year),
          resultFormat: edu.result_format
            ? edu.result_format.charAt(0).toUpperCase() +
              edu.result_format.slice(1)
            : "Percentage",
          result: edu.result || "",
          education_id: edu.education_id,
        };
      } else if (edu.education_type === "higher") {
        const higherEdu = {
          id: edu.education_id?.toString() || Date.now().toString(),
          degree: edu.degree || "",
          fieldOfStudy: edu.field_of_study || "",
          institutionName: edu.institution_name || "",
          universityName: edu.university_name || "",
          universityBoard: edu.university_name || "",
          startYear: formatYearForInput(edu.start_year),
          endYear: formatYearForInput(edu.end_year),
          currentlyPursuing: edu.currently_pursuing || false,
          resultFormat: edu.result_format
            ? edu.result_format.charAt(0).toUpperCase() +
              edu.result_format.slice(1)
            : "CGPA",
          result: edu.result || "",
          education_id: edu.education_id,
        };
        educationForm.higherEducations.push(higherEdu);
      }
    });

    if (educationForm.higherEducations.length > 1) {
      educationForm.extraEducations = educationForm.higherEducations.splice(1);
    }

    return educationForm;
  };

  // Map Experience Details from API
  const mapExperienceDetailsFromAPI = (apiDataArray, jobRoleFromAPI) => {
    const experienceForm = {
      jobRole: jobRoleFromAPI || "",
      workExperiences: [],
    };

    const formatDateForInput = (isoDateString) => {
      if (!isoDateString) return "";
      return isoDateString.substring(0, 7);
    };

    if (apiDataArray.length > 0) {
      experienceForm.workExperiences = apiDataArray.map((exp) => ({
        id: exp.experience_id?.toString() || Date.now().toString(),
        companyName: exp.company_name || "",
        jobTitle: exp.job_title || "",
        employmentType: exp.employment_type || "",
        location: exp.location || "",
        workMode: exp.work_mode || "",
        startDate: formatDateForInput(exp.start_date),
        endDate: formatDateForInput(exp.end_date),
        description: exp.description || "",
        currentlyWorking: exp.currently_working_here || false,
        experience_id: exp.experience_id,
        isExpanded: false,
      }));
    }

    if (experienceForm.workExperiences.length === 0) {
      experienceForm.workExperiences.push({
        id: "1",
        jobRole: "",
        companyName: "",
        jobTitle: "",
        employmentType: "",
        location: "",
        workMode: "",
        startDate: "",
        endDate: "",
        description: "",
        currentlyWorking: false,
        isExpanded: true,
      });
    } else {
      experienceForm.workExperiences[0].isExpanded = true;
    }

    return experienceForm;
  };

  // Map Project Details from API
  const mapProjectDetailsFromAPI = (apiDataArray) => {
    const projectForm = {
      projects: [],
    };

    const formatDateForInput = (isoDateString) => {
      if (!isoDateString) return "";
      return isoDateString.substring(0, 7);
    };

    if (apiDataArray.length > 0) {
      projectForm.projects = apiDataArray.map((p) => ({
        id: p.project_id?.toString() || Date.now().toString(),
        projectTitle: p.project_title || "",
        projectType: p.project_type || "",
        startDate: formatDateForInput(p.start_date),
        endDate: formatDateForInput(p.end_date),
        currentlyWorking: p.currently_working || false,
        description: p.description || "",
        rolesAndResponsibilities: p.roles_responsibilities || "",
        project_id: p.project_id,
        isExpanded: false,
      }));
    }

    if (projectForm.projects.length === 0) {
      projectForm.projects.push({
        id: "1",
        projectTitle: "",
        projectType: "",
        startDate: "",
        endDate: "",
        currentlyWorking: false,
        description: "",
        rolesAndResponsibilities: "",
        isExpanded: true,
      });
    } else {
      projectForm.projects[0].isExpanded = true;
    }

    return projectForm;
  };
  
  // Map Skills and Links Details from API
  const mapSkillsAndLinksFromAPI = (skillsDataArray, linksDataArray) => {
    const skillsForm = {
      skills: [],
      links: [],
    };
    
    // Map Skills
    if (skillsDataArray && Array.isArray(skillsDataArray)) {
      skillsForm.skills = skillsDataArray.map((s) => ({
        id: s.skill_id?.toString() || Date.now().toString(),
        skillName: s.skill_name || "",
        skillLevel: s.skill_level || "",
        skill_id: s.skill_id,
      }));
    }

    if (skillsForm.skills.length === 0) {
      skillsForm.skills.push({ id: "1", skillName: "", skillLevel: "" });
    }

    // Map Links
    const consolidatedLinks = {
        id: "1",
        linkedinProfile: "",
        githubProfile: "",
        portfolioUrl: "",
        portfolioDescription: "",
        publicationUrl: "",
        publicationDescription: "",
        link_id_linkedin: "",
        link_id_github: "",
        link_id_portfolio: "",
        link_id_publication: "",
    };

    if (linksDataArray && Array.isArray(linksDataArray)) {
        linksDataArray.forEach(l => {
            const id = l.link_id?.toString();
            if (l.link_type === 'linkedin' && l.url) {
                consolidatedLinks.linkedinProfile = l.url;
                consolidatedLinks.link_id_linkedin = id;
            } else if (l.link_type === 'github' && l.url) {
                consolidatedLinks.githubProfile = l.url;
                consolidatedLinks.link_id_github = id;
            } else if (l.link_type === 'portfolio' && l.url) {
                consolidatedLinks.portfolioUrl = l.url;
                consolidatedLinks.portfolioDescription = l.description || "";
                consolidatedLinks.link_id_portfolio = id;
            } else if (l.link_type === 'publication' && l.url) {
                consolidatedLinks.publicationUrl = l.url;
                consolidatedLinks.publicationDescription = l.description || "";
                consolidatedLinks.link_id_publication = id;
            }
        });
    }
    
    skillsForm.links.push(consolidatedLinks);

    return skillsForm;
  };

  // NEW: Map Certificate Details from API
  const mapCertificateDetailsFromAPI = (apiDataArray) => {
    const certForm = {
      certificates: [],
    };

    const formatDateForInput = (isoDateString) => {
      if (!isoDateString) return "";
      return isoDateString.substring(0, 10); // YYYY-MM-DD format
    };

    if (apiDataArray.length > 0) {
      certForm.certificates = apiDataArray.map((c) => ({
        id: c.certificate_id?.toString() || Date.now().toString(),
        certificateType: c.certificate_type || "",
        certificateTitle: c.certificate_title || "",
        domain: c.domain || "",
        certificateProvidedBy: c.certificate_provided_by || "",
        date: formatDateForInput(c.date) || "",
        description: c.description || "",
        uploadedFileUrl: c.file_url || "", 
        uploadedFileName: c.file_url ? c.file_url.split('/').pop() : "",
        uploadedFile: null, 
        isExpanded: false,
        certificate_id: c.certificate_id,
      }));
    }

    if (certForm.certificates.length === 0) {
      certForm.certificates.push({
        id: "1",
        certificateType: "",
        certificateTitle: "",
        domain: "",
        certificateProvidedBy: "",
        date: "",
        description: "",
        uploadedFile: null,
        uploadedFileName: "",
        isExpanded: true,
      });
    } else {
      certForm.certificates[0].isExpanded = true;
    }

    return certForm;
  };


  // Validation function to check if step has any validation errors
  const validateStepData = (stepIndex: number, data: any): boolean => {
    if (!data || Object.keys(data).length === 0) {
      return false;
    }

    switch (stepIndex) {
      case 0: // Personal Details
        if (!data.firstName || !data.lastName) {
          return false;
        }
        if (!Array.isArray(data.languages) || data.languages.length === 0) {
          return false;
        }
        if (
          !data.address ||
          !data.country ||
          !data.state ||
          !data.city ||
          !data.pincode ||
          !data.nationality
        ) {
          return false;
        }
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          return false;
        }
        if (
          data.mobileNumber &&
          !/^[0-9]{10,15}$/.test(data.mobileNumber.replace(/[\s-]/g, ""))
        ) {
          return false;
        }
        break;

      case 1: // Education
        const higherList = [
          ...(data.higherEducations || []),
          ...(data.extraEducations || []),
        ];
        break;

      case 2: // Experience
        if (isCurrentlyPursuingEducation(formData.education)) {
          return true;
        }
        if (!data.jobRole) {
          return false;
        }
        break;

      case 3: // Projects
        // Projects are optional, so an empty selection should still allow
        // the user to move to the next profile step.
        return true;

      case 4: // Skills & Links
        // Access skills and links arrays directly
        const skillsArray = data.skills || [];
        const linksArray = data.links || [];

        const hasValidSkill = skillsArray.some(
          (skill: any) => skill.skillName && skill.skillName.trim() && skill.skillLevel
        );
        if (!hasValidSkill) {
          return false;
        }
        
        const hasLinkedIn = linksArray.some(
          (link: any) => link.linkedinProfile && link.linkedinProfile.trim()
        );
        if (!hasLinkedIn) {
          return false;
        }
        break;

      case 5: // Certification
        // Certificates are optional - always return true
        return true;
    }

    return true;
  };

  const fetchProfileCompletion = async () => {
    if (!userId || !token) {
      setCompletionError("Unable to determine profile completion.");
      return;
    }

    setCompletionLoading(true);
    setCompletionError("");

    try {
      const progress = await getProfileProgress(userId, token);
      if (progress && typeof progress.percentage === "number") {
        setProfileCompletionPercentage(progress.percentage);
      } else if (progress && progress.percentage) {
        setProfileCompletionPercentage(Number(progress.percentage));
      } else {
        setProfileCompletionPercentage(0);
      }
    } catch (error) {
      console.error("Error fetching profile completion:", error);
      setCompletionError("Unable to fetch profile completion. Please try again.");
      setProfileCompletionPercentage(null);
    } finally {
      setCompletionLoading(false);
    }
  };

  const openCompletionModal = async () => {
    await fetchProfileCompletion();
    setShowCompletionModal(true);
  };

  const handleNext = async (data: any) => {
    const stepKeys = [
      "personal",
      "education",
      "experience",
      "projects",
      "skills",
      "certification",
    ];

    const updatedFormData = {
      ...formData,
      [stepKeys[currentStep]]: data,
    };

    setFormData(updatedFormData);

    const isValid = validateStepData(currentStep, data);
    setValidationErrors((prev) => ({
      ...prev,
      [stepKeys[currentStep]]: !isValid,
    }));

    if (!isValid) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final step - show completion modal before navigating
    await openCompletionModal();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const closeCompletionModal = () => {
    setShowCompletionModal(false);
  };

  const handleConfirmDashboard = () => {
    setShowCompletionModal(false);
    navigate("/dashboard");
  };

  const isCurrentlyPursuingEducation = (educationData: any) => {
    const higherList = [
      ...(educationData?.higherEducations || []),
      ...(educationData?.extraEducations || []),
    ];

    return higherList.some((edu: any) => edu.currentlyPursuing);
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading profile data...</div>
        </div>
      );
    }

    if (loadingError) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-lg text-red-500 mb-4">{loadingError}</div>
          <button
            onClick={fetchAllProfileData}
            className="px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <PersonalDetailsForm
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={(data: any) => {
              setFormData((prev) => ({
                ...prev,
                personal: data,
              }));
            }}
            initialData={formData.personal}
            userId={userId}
            token={token}
            personalDetailsId={personalDetailsId}
          />
        );
      case 1:
        return (
          <EducationDetailsForm
            onNext={handleNext}
            onBack={handleBack}
            initialData={formData.education}
            userId={userId}
            token={token}
          />
        );
      case 2:
        return (
          <ExperienceDetailsForm
            onNext={handleNext}
            onBack={handleBack}
            initialData={formData.experience}
            userId={userId}
            token={token}
            isOptional={isCurrentlyPursuingEducation(formData.education)}
          />
        );
      case 3:
        return (
          <ProjectDetailsForm
            onNext={handleNext}
            onBack={handleBack}
            initialData={formData.projects}
            userId={userId}
            token={token}
          />
        );
      case 4:
        return (
          <SkillsLinksDetailsForm
            onNext={handleNext}
            onBack={handleBack}
            initialData={formData.skills}
            userId={userId} 
            token={token} 
          />
        );
      case 5:
        return (
          <CertificationDetailsForm
            onNext={handleNext}
            onBack={handleBack}
            initialData={formData.certification}
            userId={userId} 
            token={token} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden font-['Baloo_2']">
      <DashNav heading="Profile" />

      <div className="flex-1 bg-gray-50 overflow-hidden">
        <div className="bg-white rounded-lg м-3 md:m-5 h-[calc(100vh-110px)] overflow-auto flex flex-col">
          <div className="border-b border-gray-200 px-4 sm:px-6 md:px-8 py-4 md:py-5">
            <p className="text-sm sm:text-base text-gray-700 mb-3 md:mb-4">
              Providing your details in profile helps us personalize every step
              - from building the right resume to preparing you for interviews
              that matter.
            </p>

            <ProfileStepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
          </div>

          <div className="flex-1 overflow-auto">{renderStepContent()}</div>
        </div>
      </div>

      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Profile Completion
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Review your completion percentage before going to the dashboard.
              </p>
            </div>
            <div className="px-6 py-6">
              {completionLoading ? (
                <div className="text-center text-gray-600">Fetching completion...</div>
              ) : completionError ? (
                <div className="text-sm text-red-600">{completionError}</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-3xl bg-orange-50 p-4">
                    <p className="text-sm text-gray-700">Your profile is</p>
                    <p className="text-4xl font-bold text-orange-600">
                      {profileCompletionPercentage ?? 0}%
                    </p>
                    <p className="text-sm text-gray-500">
                      This reflects the percentage of profile details completed.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-100 p-4">
                    <p className="text-sm text-gray-700">
                      Complete more sections to improve your dashboard recommendations.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 px-6 py-4 border-t border-gray-200 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCompletionModal}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDashboard}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
