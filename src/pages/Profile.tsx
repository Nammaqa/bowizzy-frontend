import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Clipboard,
  Brain,
  Award,
  Search,
  Bell,
  Share2,
  Menu,
  X,
} from "lucide-react";
import DashNav from "@/components/dashnav/dashnav";
import { useNavigate } from "react-router-dom";
import { getProfileProgress } from "@/services/dashboardServices";
import { uploadResume } from "@/services/resumeServices";

const items = [
  { title: "Personal Details", Icon: User, step: 0 },
  { title: "Education Details", Icon: GraduationCap, step: 1 },
  { title: "Experience", Icon: Briefcase, step: 2 },
  { title: "Project Details", Icon: Clipboard, step: 3 },
  { title: "Skills & Links", Icon: Brain, step: 4 },
  { title: "Certifications", Icon: Award, step: 5 },
];

export default function Profile() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeButton, setActiveButton] = useState("add");
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [fileError, setFileError] = useState("");
  const [profileProgress, setProfileProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Fetch profile progress on component mount
  useEffect(() => {
    const fetchProfileProgress = async () => {
      try {
        setLoading(true);

        console.log("Fetching profile progress...");
        const userData = JSON.parse(localStorage.getItem("user"));

        const userId = userData?.user_id;
        const token = userData?.token;

        if (userId && token) {
          const data = await getProfileProgress(userId, token);
          setProfileProgress(data);
        }
      } catch (error) {
        console.error("Error fetching profile progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileProgress();
  }, []);

  // Validation function for file
  const validateFile = (file) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return "Only PDF and Word documents (.doc, .docx) are allowed";
    }

    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    return "";
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];

    if (file) {
      const error = validateFile(file);

      if (error) {
        setFileError(error);
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setFileError("");
      console.log("File selected:", file.name);
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (file) {
      const error = validateFile(file);

      if (error) {
        setFileError(error);
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setFileError("");
      console.log("File dropped:", file.name);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleFileRemove = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setFileError("");

    const fileInput = document.getElementById(
      "file-upload-input"
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleAddDetailsMyself = () => {
    navigate("/profile/form");
  };

  const handleEnterDataManually = () => {
    console.log("navigating");
    navigate("/profile/form");
  };

  const handleUploadResumeClick = () => {
    setActiveButton("upload");
    setShowUploadSection(true);
  };

  const handleSubmit = async () => {
    if (!selectedFile || submitting) return;

    setSubmitting(true);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.user_id;
      const token = user?.token;

      if (!userId || !token) {
        alert("User not logged in");
        setSubmitting(false);
        return;
      }

      console.log("Uploading resume to server…");

      const response = await uploadResume(userId, selectedFile, token);

      console.log("Upload response →", response);

      if (response.status === 200 || response.status === 201) {
        navigate("/profile/parsing", {
          state: { file: selectedFile, uploadSuccess: true },
        });
      }
    } catch (error) {
      console.error("Upload failed →", error);
      navigate("/profile/parsing", { state: { uploadSuccess: false } });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBrowseClick = () => {
    document.getElementById("file-upload-input").click();
  };

  const handleCardClick = (step) => {
    navigate("/profile/form", { state: { step } });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden font-['Baloo_2']">
        <DashNav heading="Profile" />
        <div className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Check if profile completion is greater than 50%
  const showDashboard = profileProgress && profileProgress.percentage > 50;

  return (
    <div className="flex flex-col h-screen overflow-hidden font-['Baloo_2']">
      <DashNav heading="Profile" />

      {showDashboard ? (
        // Profile Dashboard View (when > 50% complete)
        <div className="flex-1 bg-gray-50 overflow-auto px-4 sm:px-6 py-4">
          {/* PAGE TITLE */}
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
            User Profile
          </h2>

          {/* INFO BANNER */}
          <div className="bg-white border rounded-xl p-4 sm:p-5 mb-6 shadow-sm text-gray-700 leading-relaxed text-sm sm:text-base">
            Providing your details in profile helps us personalize every step —
            from building the right resume to preparing you for interviews that
            matter. Add or Edit details by clicking on a particular section.
          </div>

          {/* CARD GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((it, idx) => {
              const Icon = it.Icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition flex flex-col items-center justify-center p-6 cursor-pointer h-[276px]"
                  onClick={() => handleCardClick(it.step)}
                >
                  <div className="rounded-full bg-white p-4 shadow flex items-center justify-center">
                    <Icon className="w-7 h-7 text-orange-500" />
                  </div>
                  <p className="mt-3 text-gray-700 font-medium text-sm text-center">
                    {it.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Original Profile Setup View (when <= 50% complete)
        <div className="flex-1 bg-gray-50 overflow-hidden">
          <div className="bg-white rounded-lg m-3 md:m-5 h-[calc(100vh-110px)] overflow-auto flex flex-col">
            <div className="flex-1 max-w-5xl mx-auto text-center px-4 sm:px-6 md:px-8 flex flex-col justify-center py-8">
              <h1 className="text-2xl sm:text-3xl md:text-[2.5rem] font-semibold text-gray-900 mb-4 md:mb-5 leading-tight">
                Complete your profile to get personalized jobs, resumes, and
                prep.
              </h1>

              <p className="text-sm sm:text-base text-gray-700 mb-4 md:mb-5 font-normal">
                Add your profile details manually or upload your resume to
                auto-fill the information.
              </p>

              <p className="text-xs sm:text-[0.85rem] text-gray-600 mb-6 md:mb-10 max-w-4xl mx-auto leading-relaxed">
                If you choose to upload your resume, please note: details will
                be extracted automatically, but you'll still need to review and
                verify them for accuracy. If the resume is not in a structured
                format, some fields may not be captured. Supported formats: PDF
                and Word documents.
              </p>

              <div className="flex flex-col items-center gap-4 md:gap-5">
                {/* Combined Button with Sliding Animation */}
                <div
                  className="relative bg-white border-2 border-gray-300 rounded-full shadow-sm w-full max-w-[580px]"
                  style={{ height: "58px" }}
                >
                  {/* Sliding Orange Background */}
                  <div
                    className={`absolute top-0 h-full bg-orange-400 rounded-full transition-all duration-300 ease-in-out ${activeButton === "upload"
                      ? "left-1/2 w-1/2"
                      : "left-0 w-1/2"
                      }`}
                    style={{ zIndex: 0 }}
                  />

                  {/* Buttons Container */}
                  <div className="relative flex h-full" style={{ zIndex: 1 }}>
                    {/* Add Details Myself Button */}
                    <button
                      onClick={handleAddDetailsMyself}
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm md:text-[15px] transition-colors duration-300 rounded-l-full cursor-pointer px-2 ${activeButton === "add" ? "text-white" : "text-gray-800"
                        }`}
                    >
                      <FileText
                        size={16}
                        className="sm:w-[18px] sm:h-[18px] flex-shrink-0"
                      />
                      <span className="whitespace-nowrap">
                        Add Details Myself
                      </span>
                    </button>

                    {/* Upload Resume Button */}
                    {/* <button
                      onClick={handleUploadResumeClick}
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm md:text-[15px] transition-colors duration-300 rounded-r-full cursor-pointer px-2 ${
                        activeButton === "upload"
                          ? "text-white"
                          : "text-gray-800"
                      }`}
                    >
                      <Upload
                        size={16}
                        className="sm:w-[18px] sm:h-[18px] flex-shrink-0"
                      />
                      <span className="whitespace-nowrap hidden sm:inline">
                        Upload Resume (PDF/Word)
                      </span>
                      <span className="whitespace-nowrap sm:hidden">
                        Upload Resume
                      </span>
                    </button> */}
                    <button
  onClick={handleUploadResumeClick}
  className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm md:text-[15px] transition-colors duration-300 rounded-r-full cursor-pointer px-2 ${
    activeButton === "upload" ? "text-white" : "text-gray-800"
  }`}
>
  <Upload size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
  <span className="whitespace-nowrap hidden sm:inline">Upload Resume (PDF)</span>
  <span className="whitespace-nowrap sm:hidden">Upload Resume</span>
</button>
                  </div>
                </div>

                {/* Upload Section */}
                {showUploadSection && (
                  <div className="flex flex-col items-center w-full max-w-xl mt-2 px-2 sm:px-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                      {/* File Upload/Drop Area */}
                      <div
                        onClick={handleBrowseClick}
                        onDrop={handleFileDrop}
                        onDragOver={handleDragOver}
                        className={`flex-1 border-2 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between gap-2 cursor-pointer transition-colors ${fileError
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center min-w-0 pr-2">
                          {selectedFile ? (
                            <FileText
                              size={16}
                              className={`sm:w-[18px] sm:h-[18px] flex-shrink-0 mr-2 ${fileError ? "text-red-600" : "text-gray-600"
                                }`}
                            />
                          ) : (
                            <Upload
                              size={16}
                              className={`sm:w-[18px] sm:h-[18px] flex-shrink-0 mr-2 ${fileError ? "text-red-600" : "text-gray-600"
                                }`}
                            />
                          )}

                          <span
                            className={`text-xs sm:text-sm md:text-[15px] truncate ${fileError ? "text-red-600" : "text-gray-600"
                              }`}
                          >
                            {selectedFile
                              ? selectedFile.name
                              : "Browse or Drop your resume"}
                          </span>
                        </div>

                        {/* Remove File Button */}
                        {selectedFile && (
                          <button
                            onClick={handleFileRemove}
                            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
                            aria-label="Remove selected file"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      <input
                        id="file-upload-input"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={!selectedFile || submitting}
                        className={`px-6 sm:px-8 py-3.5 rounded-2xl font-medium text-sm sm:text-[15px] transition-colors duration-300 shadow-sm ${!selectedFile || submitting
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-orange-400 hover:bg-orange-500 text-white cursor-pointer"
                          }`}
                      >
                        {submitting ? "Submitting..." : "Submit"}
                      </button>
                    </div>

                    {/* Error Message */}
                    {fileError && (
                      <p className="mt-2 text-xs sm:text-sm text-red-500 text-center">
                        {fileError}
                      </p>
                    )}
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
