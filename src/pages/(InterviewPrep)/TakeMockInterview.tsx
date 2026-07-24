import { useState, useEffect } from "react";
import api from "@/api";
import DashNav from "@/components/dashnav/dashnav";
import PersonalDetails from "./components/PersonalDetails";
import EducationDetails from "./components/EducationDetails";
import EducationDetailsForm from "@/pages/(Profile)/components/EducationDetailsForm";
import ExperienceDetailsForm from "@/pages/(Profile)/components/ExperienceDetailsForm";
import BankDetails from "./components/BankDetails";
import VerificationSubmitted from "./components/VerificationSubmitted";
import VerifiedDashboard from "./components/VerifiedDashboard";
import InterviewDetailsView from "./components/InterviewDetailsView";
import ProgressStepper from "./components/ProgressStepper";

interface Interview {
  id: string;
  title: string;
  experience: string;
  date: string;
  time: string;
  credits?: number;
  priority?: string;
}

const TakeMockInterview = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isVerified, setIsVerified] = useState<boolean | null>(null); // null = checking, true/false = known
  const [hasBankDetails, setHasBankDetails] = useState<boolean | null>(null); // null = checking, true/false = known
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [viewType, setViewType] = useState<'scheduled' | 'available' | 'saved' | null>(null);
  type FormDataType = {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    linkedin_url: string;
    photo: any;
    educations: any[];
    experiences: any[];
    accountHolderName: string;
    bankName: string;
    branchName: string;
    accountNumber: string;
    confirmAccountNumber: string;
    ifscCode: string;
    accountType: string;
    // `education` holds the structured education form returned from the API when loaded
    education?: any;
    // optional extra fields used later
    jobRole?: string;
  };

  const [formData, setFormData] = useState<FormDataType>({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    linkedin_url: "",
    photo: null,
    educations: [],
    experiences: [],
    accountHolderName: "",
    bankName: "",
    branchName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    accountType: "",
  });

  useEffect(() => {
    const fetchEducation = async () => {
      try {
        const parsed = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = parsed?.user_id;
        const token = parsed?.token;
        if (!userId || !token) return;

        const { getEducationByUserId } = await import("@/services/educationService");
        const apiData = await getEducationByUserId(userId, token);
        if (!apiData || !Array.isArray(apiData)) return;

        // Map API education array into the UI-friendly educations array
        const formatYearForInput = (yearValue: any) => {
          if (!yearValue) return "";
          if (typeof yearValue === "string" && yearValue.includes("-")) {
            const parts = yearValue.split("-");
            if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
          }
          const year = typeof yearValue === "number" ? yearValue : parseInt(yearValue, 10);
          return isNaN(year) ? "" : `${year}-01`;
        };

        const educationForm: any = {
          sslc: {},
          pu: {},
          higherEducations: [],
          extraEducations: [],
        };

        apiData.forEach((edu: any) => {
          if (edu.education_type === "sslc") {
            educationForm.sslc = {
              institutionName: edu.institution_name || "",
              boardType: edu.board_type || "",
              yearOfPassing: formatYearForInput(edu.end_year),
              resultFormat: edu.result_format
                ? edu.result_format.charAt(0).toUpperCase() + edu.result_format.slice(1)
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
                ? edu.result_format.charAt(0).toUpperCase() + edu.result_format.slice(1)
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
                ? edu.result_format.charAt(0).toUpperCase() + edu.result_format.slice(1)
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

        // Convert to the local EducationDetails expected array shape
        const mapped: any[] = [];
        if (educationForm.sslc && Object.keys(educationForm.sslc).length > 0) {
          mapped.push({
            standard: "SSC/10th Standard*",
            instituteName: educationForm.sslc.institutionName || "",
            markType: educationForm.sslc.resultFormat || "",
            yearOfPassing: educationForm.sslc.yearOfPassing || "",
            grade: educationForm.sslc.result || "",
            board: educationForm.sslc.boardType || "",
            isExpanded: mapped.length === 0,
          });
        }

        if (educationForm.pu && Object.keys(educationForm.pu).length > 0) {
          mapped.push({
            standard: "PUC/Diploma / (10th+2)*",
            instituteName: educationForm.pu.institutionName || "",
            markType: educationForm.pu.resultFormat || "",
            yearOfPassing: educationForm.pu.yearOfPassing || "",
            grade: educationForm.pu.result || "",
            board: educationForm.pu.boardType || "",
            isExpanded: mapped.length === 0,
          });
        }

        const higherList = [...(educationForm.higherEducations || []), ...(educationForm.extraEducations || [])];
        higherList.forEach((he: any, idx: number) => {
          mapped.push({
            standard: he.degree || "Higher Education*",
            instituteName: he.institutionName || "",
            markType: he.resultFormat || "",
            yearOfPassing: he.endYear || he.startYear || "",
            grade: he.result || "",
            board: he.universityName || he.universityBoard || "",
            isExpanded: mapped.length === 0,
          });
        });

        setFormData((prev) => ({ ...prev, educations: mapped, education: educationForm }));
      } catch (err) {
        console.error("Error fetching educations:", err);
      }
    };

    if (currentStep === 2) fetchEducation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Run verification check once on mount
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const parsed = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = parsed?.user_id;
        const token = parsed?.token;
        if (!userId || !token) {
          setIsVerified(false);
          return;
        }

        const resp = await api.get(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = resp?.data || {};
        const verified = payload?.is_verified ?? payload?.user?.is_verified ?? payload?.isVerified ?? false;
        setIsVerified(!!verified);
      } catch (err) {
        console.error("Error fetching verification status:", err);
        setIsVerified(false);
      }
    };

    checkVerification();
  }, []);

  // Check for bank details
  useEffect(() => {
    const checkBankDetails = async () => {
      try {
        const parsed = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = parsed?.user_id;
        const token = parsed?.token;
        if (!userId || !token) {
          setHasBankDetails(false);
          return;
        }

        const resp = await api.get(`/users/${userId}/mock-interview/bank-details`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = resp?.data || {};
        const hasBankDetails = payload?.hasBankDetails ?? false;
        setHasBankDetails(!!hasBankDetails);
      } catch (err) {
        console.error("Error fetching bank details status:", err);
        setHasBankDetails(false);
      }
    };

    checkBankDetails();
  }, []);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(5);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleViewDetails = (interview: Interview, type: 'scheduled' | 'available' | 'saved') => {
    setSelectedInterview(interview);
    setViewType(type);
  };

  const handleBack = () => {
    setSelectedInterview(null);
    setViewType(null);
  };

  const handleBookInterview = () => {
    // Here you can add logic to move the interview to scheduled
    // For now, just go back to dashboard
    handleBack();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Step 1: Personal Details";
      case 2:
        return "Step 2: Education Details";
      case 3:
        return "Step 3: Work Experience";
      case 4:
        return "Step 4: Bank Details";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Provide your details as per your official records.";
      case 2:
        return "Please enter your educational qualifications. Only provide as mandatory.";
      case 3:
        return "Please enter your work experience details.";
      case 4:
        return "We require your bank details to pay you when you successfully complete an interview.";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col h-screen font-['Baloo_2'] overflow-hidden">
      <DashNav heading="Take Mock Interview" />

      <div className="flex-1 overflow-auto bg-[#F0F0F0] p-2 sm:p-4 lg:p-6">
        <div className="w-full mx-auto min-w-0">
          {hasBankDetails === null ? (
            <div className="p-4 text-center text-gray-500">Checking verification...</div>
          ) : hasBankDetails ? (
            isVerified ? (
              selectedInterview ? (
                <InterviewDetailsView
                  interview={selectedInterview}
                  onBack={handleBack}
                  viewType={viewType}
                  onBook={handleBookInterview}
                />
              ) : (
                <VerifiedDashboard onViewDetails={handleViewDetails} />
              )
            ) : (
              <VerificationSubmitted />
            )
          ) : (
            <>
              {/* Header Section removed: back-arrow button hidden */}

              {currentStep < 5 ? (
                <div className="bg-white rounded-md p-6">
                  <h3 className="text-[#FF8351] text-lg font-semibold mb-2">
                    User Verification
                  </h3>
                  <p className="text-sm text-gray-600 mb-8">
                    To join as an interviewer, your profile and experience will
                    be verified. This helps us maintain trust and connect
                    candidates with genuine professionals.
                  </p>

                  <ProgressStepper
                    currentStep={currentStep}
                    onStepClick={(step: number) => {
                      // Prevent skipping more than one step forward
                      if (step <= currentStep) {
                        setCurrentStep(step);
                      } else if (step === currentStep + 1) {
                        setCurrentStep(step);
                      }
                    }}
                  />

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-6"></div>

                  {/* Step Content */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#3A3A3A] mb-2">
                      {getStepTitle()}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      {getStepDescription()}
                    </p>

                    {currentStep === 1 && (
                      <PersonalDetails
                        formData={formData}
                        setFormData={setFormData}
                        onNext={handleNext}
                      />
                    )}

                    {currentStep === 2 && (
                      (formData.education && Object.keys(formData.education).length > 0) ? (
                        <EducationDetailsForm
                          key={JSON.stringify(formData.education)}
                          initialData={formData.education}
                          hideIntro={true}
                          hideHeader={true}
                          userId={JSON.parse(localStorage.getItem("user") || "{}")?.user_id}
                          token={JSON.parse(localStorage.getItem("user") || "{}")?.token}
                          onNext={(data: any) => {
                            setFormData((prev) => ({ ...prev, education: data }));
                            handleNext();
                          }}
                          onBack={handlePrevious}
                        />
                      ) : (
                        <div className="p-4 text-center text-gray-500">Loading education...</div>
                      )
                    )}

                    {currentStep === 3 && (
                      <>
                        <ExperienceDetailsForm
                          userId={JSON.parse(localStorage.getItem("user") || "{}")?.user_id}
                          token={JSON.parse(localStorage.getItem("user") || "{}")?.token}
                          hideHeader={true}
                          hideJobRole={true}
                          onNext={(data: any) => {
                            setFormData((prev) => ({ ...prev, experiences: data.workExperiences || [], jobRole: data.jobRole || "" }));
                            handleNext();
                          }}
                          onBack={handlePrevious}
                        />
                      </>
                    )}

                    {currentStep === 4 && (
                      <BankDetails
                        formData={formData}
                        setFormData={setFormData}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <VerificationSubmitted />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeMockInterview;