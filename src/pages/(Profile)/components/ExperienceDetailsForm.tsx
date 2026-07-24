import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Trash2, Plus, Save } from "lucide-react";
import {
  updateExperienceDetails,
  saveExperienceDetails,
  deleteExperience,
  updateJobRole,
  getExperienceByUserId,
} from "@/services/experienceService";
import RichTextEditor from "@/pages/(ResumeBuilder)/components/ui/RichTextEditor";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_EXPERIENCE_MONTH = "1960-01";
const MAX_COMPANY_NAME_LENGTH = 100;
const MAX_JOB_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

interface ExperienceDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
  userId: string;
  token: string;
  hideHeader?: boolean;
  hideJobRole?: boolean;
}

interface WorkExperience {
  id: string;
  companyName: string;
  jobTitle: string;
  employmentType: string;
  location: string;
  workMode: string;
  startDate: string;
  endDate: string;
  description: string;
  currentlyWorking: boolean;
  isExpanded: boolean;
  experience_id?: number;
}

export default function ExperienceDetailsForm({
  onNext,
  onBack,
  initialData = {},
  userId,
  token,
  hideHeader = false,
  hideJobRole = false,
}: ExperienceDetailsFormProps) {
  const [jobRole, setJobRole] = useState(initialData.jobRole || "");
  const [jobRoleExpanded, setJobRoleExpanded] = useState(true);
  const [experienceLevel, setExperienceLevel] = useState(initialData.experienceLevel || "experienced");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState("");

  const initialExperiences: WorkExperience[] =
    initialData.workExperiences && initialData.workExperiences.length > 0
      ? initialData.workExperiences.map((exp: any) => ({
        ...exp,
        id: exp.id || exp.experience_id?.toString() || Date.now().toString(),
        isExpanded: exp.isExpanded ?? false,
      }))
      : [
        {
          id: "1",
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
        },
      ];

  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>(initialExperiences);

  const [jobRoleChanged, setJobRoleChanged] = useState(false);
  const [jobRoleFeedback, setJobRoleFeedback] = useState("");
  const [experienceChanges, setExperienceChanges] = useState<Record<string, string[]>>({});
  const [experienceFeedback, setExperienceFeedback] = useState<Record<string, string>>({});

  const initialJobRole = useRef(jobRole);
  const initialExperiencesRef = useRef<Record<string, WorkExperience>>({});
  const deletedExperienceIds = useRef<number[]>([]);

  useEffect(() => {
    workExperiences.forEach((exp) => {
      initialExperiencesRef.current[exp.id] = { ...exp };
    });
  }, []);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        if (!userId || !token) return;
        if (!initialData || !initialData.workExperiences || initialData.workExperiences.length === 0) {
          const resp = await getExperienceByUserId(userId, token);
          if (resp) {
            const fetchedJobRole = resp.job_role || "";
            const fetched = (resp.experiences || []).map((e: any) => ({
              id: e.id?.toString() || e.experience_id?.toString() || Date.now().toString(),
              companyName: e.company_name || "",
              jobTitle: e.job_title || "",
              employmentType: e.employment_type || "",
              location: e.location || "",
              workMode: e.work_mode || "",
              startDate: e.start_date ? e.start_date.substring(0, 7) : "",
              endDate: e.end_date ? e.end_date.substring(0, 7) : "",
              description: e.description || "",
              currentlyWorking: !!e.currently_working_here,
              isExpanded: false,
              experience_id: e.experience_id,
            }));

            if (fetched.length > 0) {
              setJobRole(fetchedJobRole);
              setWorkExperiences(fetched);
              fetched.forEach((exp) => {
                initialExperiencesRef.current[exp.id] = { ...exp };
              });
              initialJobRole.current = fetchedJobRole;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching experiences in form:", error);
      }
    };
    fetchExperiences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setJobRoleChanged(jobRole !== initialJobRole.current);
  }, [jobRole]);

  useEffect(() => {
    const changes: Record<string, string[]> = {};
    workExperiences.forEach((current) => {
      const initial = initialExperiencesRef.current[current.id];
      const changedFields: string[] = [];

      if (current.companyName !== (initial?.companyName || "")) changedFields.push("companyName");
      if (current.jobTitle !== (initial?.jobTitle || "")) changedFields.push("jobTitle");
      if (current.employmentType !== (initial?.employmentType || "")) changedFields.push("employmentType");
      if (current.location !== (initial?.location || "")) changedFields.push("location");
      if (current.workMode !== (initial?.workMode || "")) changedFields.push("workMode");
      if (current.startDate !== (initial?.startDate || "")) changedFields.push("startDate");
      if (current.endDate !== (initial?.endDate || "")) changedFields.push("endDate");
      if (current.description !== (initial?.description || "")) changedFields.push("description");
      if (current.currentlyWorking !== (initial?.currentlyWorking || false)) changedFields.push("currentlyWorking");

      if (changedFields.length > 0) {
        changes[current.id] = changedFields;
      } else if (!current.experience_id && (current.companyName || current.jobTitle)) {
        changes[current.id] = ["new"];
      }
    });
    setExperienceChanges(changes);
  }, [workExperiences]);

  const validateCompanyName = (value: string) => {
    if (!value.trim()) return "Company name is required";
    if (value.length > MAX_COMPANY_NAME_LENGTH) return "Max 100 characters allowed";
    const regex = /^[a-zA-Z0-9\s.,&'-]+$/;
    if (!regex.test(value)) return "Invalid company name";
    if (!/[a-zA-Z]/.test(value)) return "Company name must include a letter";
    return "";
  };

  const validateJobTitle = (value: string) => {
    if (!value.trim()) return "Job title is required";
    if (value.length > MAX_JOB_TITLE_LENGTH) return "Max 100 characters allowed";
    const regex = /^[a-zA-Z0-9\s./-]+$/;
    if (!regex.test(value)) return "Invalid job title";
    if (!/[a-zA-Z]/.test(value)) return "Job title must contain at least one letter";
    return "";
  };

  const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const getPlainTextLength = (value: string) => {
    if (!value) return 0;
    return value
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length;
  };

  const validateDescription = (value: string) => {
    if (getPlainTextLength(value) > MAX_DESCRIPTION_LENGTH) {
      return "Description must be 500 characters or less";
    }
    return "";
  };

  const validateMonthDate = (value: string, label: string) => {
    if (!value) return "";
    if (!/^\d{4}-\d{2}$/.test(value)) return `Select a valid ${label.toLowerCase()}`;

    const [year, month] = value.split("-").map(Number);
    if (year < 1960) return `${label} cannot be before 1960`;
    if (year > CURRENT_YEAR) return `${label} cannot be after ${CURRENT_YEAR}`;
    if (month < 1 || month > 12) return `Select a valid ${label.toLowerCase()}`;
    if (value > getCurrentMonth()) return `${label} cannot be in the future`;

    return "";
  };

  const validateDateRange = (startDate: string, endDate: string) => {
    const startError = validateMonthDate(startDate, "Start date");
    if (startError) return startError;

    const endError = validateMonthDate(endDate, "End date");
    if (endError) return endError;

    if (startDate && endDate && endDate < startDate) {
      return "End date cannot be before start date";
    }

    return "";
  };

  const validateExperience = (exp: WorkExperience) => {
    const nextErrors: Record<string, string> = {};

    const companyNameError = validateCompanyName(exp.companyName);
    if (companyNameError) nextErrors.companyName = companyNameError;

    const jobTitleError = validateJobTitle(exp.jobTitle);
    if (jobTitleError) nextErrors.jobTitle = jobTitleError;

    const startDateError = exp.startDate
      ? validateMonthDate(exp.startDate, "Start date")
      : "Start date is required";
    if (startDateError) nextErrors.startDate = startDateError;

    if (!exp.currentlyWorking) {
      const endDateError = !exp.endDate
        ? "End date is required"
        : startDateError
          ? validateMonthDate(exp.endDate, "End date")
          : validateDateRange(exp.startDate, exp.endDate);
      if (endDateError) nextErrors.endDate = endDateError;
    }

    const descriptionError = validateDescription(exp.description);
    if (descriptionError) nextErrors.description = descriptionError;

    return nextErrors;
  };

  const isExperienceFilled = (exp: WorkExperience) => {
    return !!(
      exp.companyName ||
      exp.jobTitle ||
      exp.employmentType ||
      exp.location ||
      exp.workMode ||
      exp.startDate ||
      exp.endDate ||
      exp.description ||
      exp.experience_id
    );
  };

  const setExperienceValidationErrors = (index: number, validationErrors: Record<string, string>) => {
    setErrors((prev) => {
      const next = { ...prev };
      ["companyName", "jobTitle", "startDate", "endDate", "description"].forEach((field) => {
        const key = `exp-${index}-${field}`;
        if (validationErrors[field]) {
          next[key] = validationErrors[field];
        } else {
          delete next[key];
        }
      });
      return next;
    });
  };

  const clampTextValue = (value: string, maxLength: number) => {
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  };

  const normalizeMonthToDate = (val: string): string | null => {
    if (!val) return null;
    if (typeof val === "string" && /^\d{4}-\d{2}$/.test(val)) return `${val}-01`;
    return val;
  };

  const handleJobRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setJobRole(val);
    if (val.trim()) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.jobRole;
        return next;
      });
      setJobRoleFeedback("");
    }
  };

  const handleSaveJobRole = async () => {
    if (!jobRoleChanged) {
      setJobRoleFeedback("No changes to save.");
      setTimeout(() => setJobRoleFeedback(""), 3000);
      return;
    }
    try {
      await updateJobRole(userId, token, { job_role: jobRole });
      initialJobRole.current = jobRole;
      setJobRoleChanged(false);
      setJobRoleFeedback("Job Role updated successfully!");
      setTimeout(() => setJobRoleFeedback(""), 3000);
    } catch (error) {
      console.error("Error saving Job Role:", error);
      setJobRoleFeedback("Failed to update Job Role.");
      setTimeout(() => setJobRoleFeedback(""), 3000);
    }
  };

  const handleExperienceChange = (index: number, field: string, value: string | boolean) => {
    const updated = [...workExperiences];
    let finalValue = value;

    if (field === "companyName" && typeof value === "string") {
      finalValue = clampTextValue(value, MAX_COMPANY_NAME_LENGTH);
    } else if (field === "jobTitle" && typeof value === "string") {
      finalValue = clampTextValue(value, MAX_JOB_TITLE_LENGTH);
    }

    updated[index] = { ...updated[index], [field]: finalValue, isExpanded: true };

    if (field === "currentlyWorking" && finalValue === true) {
      updated[index].endDate = "";
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[`exp-${index}-endDate`];
        return newErrors;
      });
    }

    setWorkExperiences(updated);

    if (field === "companyName" && typeof finalValue === "string") {
      const error = validateCompanyName(finalValue);
      setErrors((prev) => ({ ...prev, [`exp-${index}-companyName`]: error }));
    } else if (field === "jobTitle" && typeof finalValue === "string") {
      const error = validateJobTitle(finalValue);
      setErrors((prev) => ({ ...prev, [`exp-${index}-jobTitle`]: error }));
    } else if (field === "startDate" && typeof finalValue === "string") {
      const startError = validateMonthDate(finalValue, "Start date");
      const endError =
        !startError && !updated[index].currentlyWorking && updated[index].endDate
          ? validateDateRange(finalValue, updated[index].endDate)
          : "";
      setErrors((prev) => ({
        ...prev,
        [`exp-${index}-startDate`]: startError,
        [`exp-${index}-endDate`]: endError,
      }));
    } else if (field === "endDate" && typeof finalValue === "string") {
      const error = validateDateRange(updated[index].startDate, finalValue);
      setErrors((prev) => ({ ...prev, [`exp-${index}-endDate`]: error }));
    } else if (field === "description" && typeof finalValue === "string") {
      const error = validateDescription(finalValue);
      setErrors((prev) => ({ ...prev, [`exp-${index}-description`]: error }));
    }
  };

  const handleSaveExperience = async (exp: WorkExperience) => {
    const isNew = !exp.experience_id;
    const expChanges = experienceChanges[exp.id];
    const index = workExperiences.findIndex((e) => e.id === exp.id);
    const prefix = `exp-${index}`;
    const validationErrors = validateExperience(exp);

    if (Object.keys(validationErrors).length > 0) {
      setExperienceValidationErrors(index, validationErrors);
      return;
    }

    if (
      errors[`${prefix}-companyName`] ||
      errors[`${prefix}-jobTitle`] ||
      errors[`${prefix}-startDate`] ||
      errors[`${prefix}-endDate`] ||
      errors[`${prefix}-description`]
    )
      return;

    try {
      let payload: Record<string, any> = {};

      if (isNew) {
        payload = {
          job_role: jobRole,
          experiences: [
            {
              company_name: exp.companyName || "",
              job_title: exp.jobTitle || "",
              employment_type: exp.employmentType || "",
              location: exp.location || "",
              work_mode: exp.workMode || "",
              start_date: normalizeMonthToDate(exp.startDate),
              end_date: normalizeMonthToDate(exp.endDate),
              currently_working_here: exp.currentlyWorking,
              description: exp.description || "",
            },
          ],
        };

        if (!exp.companyName || !exp.jobTitle) {
          setExperienceFeedback((prev) => ({
            ...prev,
            [exp.id]: "Company Name and Job Title are required to save.",
          }));
          setTimeout(
            () =>
              setExperienceFeedback((prev) => {
                const updated = { ...prev };
                delete updated[exp.id];
                return updated;
              }),
            3000
          );
          return;
        }

        const response = await saveExperienceDetails(userId, token, payload);
        const newExperienceId = response?.experiences?.[0]?.experience_id;

        if (newExperienceId) {
          const updatedExp: WorkExperience = { ...exp, experience_id: newExperienceId };
          setWorkExperiences((prev) => prev.map((e) => (e.id === exp.id ? updatedExp : e)));
          initialExperiencesRef.current[exp.id] = updatedExp;
          setExperienceFeedback((prev) => ({ ...prev, [exp.id]: "Saved successfully!" }));
        } else {
          setExperienceFeedback((prev) => ({
            ...prev,
            [exp.id]: "Saved successfully, but ID retrieval failed (relying on next step sync).",
          }));
        }

        setExperienceChanges((prev) => {
          const updated = { ...prev };
          delete updated[exp.id];
          return updated;
        });
      } else {
        if (!expChanges || expChanges.length === 0) {
          setExperienceFeedback((prev) => ({ ...prev, [exp.id]: "No changes to save." }));
          setTimeout(
            () =>
              setExperienceFeedback((prev) => {
                const updated = { ...prev };
                delete updated[exp.id];
                return updated;
              }),
            3000
          );
          return;
        }

        const minimalPayload: Record<string, any> = {};

        expChanges.forEach((field) => {
          switch (field) {
            case "companyName": minimalPayload.company_name = exp.companyName; break;
            case "jobTitle": minimalPayload.job_title = exp.jobTitle; break;
            case "employmentType": minimalPayload.employment_type = exp.employmentType; break;
            case "location": minimalPayload.location = exp.location; break;
            case "workMode": minimalPayload.work_mode = exp.workMode; break;
            case "startDate": minimalPayload.start_date = normalizeMonthToDate(exp.startDate); break;
            case "endDate": minimalPayload.end_date = normalizeMonthToDate(exp.endDate); break;
            case "description": minimalPayload.description = exp.description; break;
            case "currentlyWorking": minimalPayload.currently_working_here = exp.currentlyWorking; break;
          }
        });

        if (minimalPayload.currently_working_here === true) {
          minimalPayload.end_date = null;
        } else if (minimalPayload.currently_working_here === false) {
          minimalPayload.end_date = normalizeMonthToDate(exp.endDate);
        }

        await updateExperienceDetails(userId, token, exp.experience_id!, minimalPayload);

        initialExperiencesRef.current[exp.id] = { ...exp };
        setExperienceChanges((prev) => {
          const updated = { ...prev };
          delete updated[exp.id];
          return updated;
        });
        setExperienceFeedback((prev) => ({ ...prev, [exp.id]: "Updated successfully!" }));
      }

      setTimeout(() => {
        setExperienceFeedback((prev) => {
          const updated = { ...prev };
          delete updated[exp.id];
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error("Error saving experience:", error);
      const feedback = isNew ? "Failed to save." : "Failed to update.";
      setExperienceFeedback((prev) => ({ ...prev, [exp.id]: feedback }));
      setTimeout(
        () =>
          setExperienceFeedback((prev) => {
            const updated = { ...prev };
            delete updated[exp.id];
            return updated;
          }),
        3000
      );
    }
  };

  const toggleExperienceExpanded = (index: number) => {
    const updated = [...workExperiences];
    updated[index] = { ...updated[index], isExpanded: !updated[index].isExpanded };
    setWorkExperiences(updated);
  };

  const resetExperience = (index: number) => {
    const exp = workExperiences[index];
    const updated = [...workExperiences];
    updated[index] = {
      ...exp,
      companyName: initialExperiencesRef.current[exp.id]?.companyName || "",
      jobTitle: initialExperiencesRef.current[exp.id]?.jobTitle || "",
      employmentType: initialExperiencesRef.current[exp.id]?.employmentType || "",
      location: initialExperiencesRef.current[exp.id]?.location || "",
      workMode: initialExperiencesRef.current[exp.id]?.workMode || "",
      startDate: initialExperiencesRef.current[exp.id]?.startDate || "",
      endDate: initialExperiencesRef.current[exp.id]?.endDate || "",
      description: initialExperiencesRef.current[exp.id]?.description || "",
      currentlyWorking: initialExperiencesRef.current[exp.id]?.currentlyWorking || false,
    };
    setWorkExperiences(updated);
    setExperienceChanges((prev) => {
      const updatedChanges = { ...prev };
      delete updatedChanges[exp.id];
      return updatedChanges;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`exp-${index}-companyName`];
      delete newErrors[`exp-${index}-jobTitle`];
      delete newErrors[`exp-${index}-startDate`];
      delete newErrors[`exp-${index}-endDate`];
      delete newErrors[`exp-${index}-description`];
      return newErrors;
    });
    setExperienceFeedback((prev) => {
      const updated = { ...prev };
      delete updated[exp.id];
      return updated;
    });
  };

  const addWorkExperience = () => {
    const newExp: WorkExperience = {
      id: Date.now().toString(),
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
    };
    setWorkExperiences([...workExperiences, newExp]);
  };

  const removeWorkExperience = async (index: number) => {
    const exp = workExperiences[index];
    if (workExperiences.length === 1) return;

    if (exp.experience_id) {
      try {
        await deleteExperience(userId, token, exp.experience_id);
        deletedExperienceIds.current.push(exp.experience_id);
        setExperienceFeedback((prev) => ({ ...prev, [exp.id]: "Deleted successfully!" }));
        setTimeout(
          () =>
            setExperienceFeedback((prev) => {
              const updated = { ...prev };
              delete updated[exp.id];
              return updated;
            }),
          3000
        );
      } catch (error) {
        console.error("Error deleting experience:", error);
        setExperienceFeedback((prev) => ({ ...prev, [exp.id]: "Failed to delete." }));
        setTimeout(
          () =>
            setExperienceFeedback((prev) => {
              const updated = { ...prev };
              delete updated[exp.id];
              return updated;
            }),
          3000
        );
        return;
      }
    }

    const id = exp.id;
    setWorkExperiences(workExperiences.filter((_, i) => i !== index));
    delete initialExperiencesRef.current[id];
    setExperienceChanges((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`exp-${index}-`)) delete newErrors[key];
      });
      return newErrors;
    });
  };

  const hasUnsavedChanges = jobRoleChanged || Object.keys(experienceChanges).length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hideJobRole && !jobRole.trim()) {
      setSubmitError("Job Role is required before proceeding.");
      setJobRoleExpanded(true);
      return;
    }

    if (experienceLevel === "intern" || experienceLevel === "experienced") {
      const validationErrors: Record<string, string> = {};

      workExperiences.forEach((exp, index) => {
        if (!isExperienceFilled(exp)) return;

        const expErrors = validateExperience(exp);
        Object.entries(expErrors).forEach(([field, message]) => {
          validationErrors[`exp-${index}-${field}`] = message;
        });
      });

      if (Object.keys(validationErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...validationErrors }));
        setSubmitError("Please fix validation errors before proceeding.");
        return;
      }
    }

    if (Object.values(errors).some((err) => err.length > 0)) {
      setSubmitError("Please fix validation errors before proceeding.");
      return;
    }

    if (hasUnsavedChanges && (experienceLevel === "intern" || experienceLevel === "experienced")) {
      let message = "Please save your changes before proceeding:\n\n";
      if (jobRoleChanged) message += "• Job Role (unsaved changes)\n";
      workExperiences.forEach((exp, index) => {
        if (experienceChanges[exp.id]) {
          message += `• Work Experience ${index + 1} (unsaved changes)\n`;
        }
      });
      if (message !== "Please save your changes before proceeding:\n\n") {
        setSubmitError(message);
        return;
      }
    } else if (jobRoleChanged) {
      setSubmitError("Please save your Job Role changes before proceeding.");
      return;
    }

    let validExperiences: WorkExperience[] = [];
    if (experienceLevel === "intern" || experienceLevel === "experienced") {
      validExperiences = workExperiences.filter((exp) => exp.companyName || exp.experience_id);
    }

    setSubmitError("");
    onNext({
      jobRole,
      experienceLevel,
      workExperiences: validExperiences,
      deletedExperienceIds: deletedExperienceIds.current,
    });
  };

  // Render function for all experience cards
  const renderExperienceCard = (
    experience: WorkExperience,
    index: number,
    showDelete: boolean = false
  ) => {
    const changed = experienceChanges[experience.id]?.length > 0;
    const feedback = experienceFeedback[experience.id];

    return (
      <div
        key={experience.id}
        className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-hidden"
      >
        {/* Header — no Save button here anymore */}
        <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
            Work Experience {index + 1}
          </h3>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => toggleExperienceExpanded(index)}
              className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronDown
                className={`w-3 h-3 text-gray-600 transition-transform cursor-pointer ${!experience.isExpanded ? "rotate-180" : ""
                  }`}
                strokeWidth={2.5}
              />
            </button>
            {showDelete && (
              <button
                type="button"
                onClick={() => removeWorkExperience(index)}
                className="w-5 h-5 flex items-center justify-center rounded border-2 border-red-500 hover:bg-red-50 transition-colors"
                title="Delete this experience"
              >
                <Trash2 className="w-3 h-3 text-red-500 cursor-pointer" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div
            className={`px-4 sm:px-5 md:px-6 py-3 text-sm ${feedback.includes("successfully")
                ? "bg-green-50 text-green-700 border-b border-green-200"
                : "bg-red-50 text-red-700 border-b border-red-200"
              }`}
          >
            {feedback}
          </div>
        )}

        {/* Content */}
        {experience.isExpanded && (
          <div className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Company Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={experience.companyName}
                  onChange={(e) => handleExperienceChange(index, "companyName", e.target.value)}
                  maxLength={MAX_COMPANY_NAME_LENGTH}
                  placeholder="Enter Company Name"
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors[`exp-${index}-companyName`]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                    }`}
                />
                {errors[`exp-${index}-companyName`] && (
                  <p className="mt-1 text-xs text-red-500">{errors[`exp-${index}-companyName`]}</p>
                )}
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Job Title/ Role
                </label>
                <input
                  type="text"
                  value={experience.jobTitle}
                  onChange={(e) => handleExperienceChange(index, "jobTitle", e.target.value)}
                  maxLength={MAX_JOB_TITLE_LENGTH}
                  placeholder="Enter Job Title"
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors[`exp-${index}-jobTitle`]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                    }`}
                />
                {errors[`exp-${index}-jobTitle`] && (
                  <p className="mt-1 text-xs text-red-500">{errors[`exp-${index}-jobTitle`]}</p>
                )}
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Employment Type
                </label>
                <div className="relative">
                  <select
                    value={experience.employmentType}
                    onChange={(e) => handleExperienceChange(index, "employmentType", e.target.value)}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-xs sm:text-sm appearance-none bg-white pr-8"
                  >
                    <option value="">Select Employment Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <select
                    value={experience.location}
                    onChange={(e) => handleExperienceChange(index, "location", e.target.value)}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-xs sm:text-sm appearance-none bg-white pr-8"
                  >
                    <option value="">Select Location</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                    <option value="Chennai">Chennai</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Work Mode */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Work Mode
                </label>
                <div className="relative">
                  <select
                    value={experience.workMode}
                    onChange={(e) => handleExperienceChange(index, "workMode", e.target.value)}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-xs sm:text-sm appearance-none bg-white pr-8"
                  >
                    <option value="">Select Work Mode</option>
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Start Date
                </label>
                <input
                  type="month"
                  value={experience.startDate}
                  onChange={(e) => handleExperienceChange(index, "startDate", e.target.value)}
                  max={getCurrentMonth()}
                  min={MIN_EXPERIENCE_MONTH}
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  required
                  placeholder="Select Start Date"
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm pr-8 ${errors[`exp-${index}-startDate`]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                    }`}
                />
                {errors[`exp-${index}-startDate`] && (
                  <p className="mt-1 text-xs text-red-500">{errors[`exp-${index}-startDate`]}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  End Date
                </label>
                <input
                  type="month"
                  value={experience.endDate}
                  onChange={(e) => handleExperienceChange(index, "endDate", e.target.value)}
                  max={getCurrentMonth()}
                  min={MIN_EXPERIENCE_MONTH}
                  onKeyDown={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  required={!experience.currentlyWorking}
                  placeholder="Select End Date"
                  disabled={experience.currentlyWorking}
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm pr-8 disabled:bg-gray-100 ${errors[`exp-${index}-endDate`]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                    }`}
                />
                {errors[`exp-${index}-endDate`] && (
                  <p className="mt-1 text-xs text-red-500">{errors[`exp-${index}-endDate`]}</p>
                )}
              </div>

              {/* Currently Working Here */}
              <div className="sm:col-span-2 flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={experience.currentlyWorking}
                    onChange={(e) =>
                      handleExperienceChange(index, "currentlyWorking", e.target.checked)
                    }
                    className="w-4 h-4 text-orange-400 border-gray-300 rounded focus:ring-orange-400"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">Currently Working here</span>
                </label>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <RichTextEditor
                  value={experience.description}
                  onChange={(value) => handleExperienceChange(index, "description", value)}
                  placeholder="Provide Description / Projects of your Work"
                  rows={6}
                />
                {errors[`exp-${index}-description`] && (
                  <p className="mt-1 text-xs text-red-500">{errors[`exp-${index}-description`]}</p>
                )}
              </div>
            </div>

            {/* ── Save row at the bottom of the expanded card ── */}
            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              {feedback && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${feedback.includes("successfully")
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                    }`}
                >
                  {feedback}
                </span>
              )}
              {changed && (
                <button
                  type="button"
                  onClick={() => handleSaveExperience(experience)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                  aria-label="Save experience changes"
                >
                  <Save className="w-4 h-4" strokeWidth={2} />
                  Save
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    setTimeout(() => {
      let scrolled = false;
      let el = document.getElementById("experience-details-form-root");
      if (el) {
        let parent = el.parentElement;
        while (parent) {
          const overflowY = window.getComputedStyle(parent).overflowY;
          if (overflowY === "auto" || overflowY === "scroll") {
            parent.scrollTop = 0;
            scrolled = true;
            break;
          }
          parent = parent.parentElement;
        }
      }
      if (!scrolled && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 100);
  }, []);

  return (
    <form
      id="experience-details-form-root"
      onSubmit={handleSubmit}
      className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6"
    >
      {submitError && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 backdrop-blur-md bg-white/10"
            onClick={() => setSubmitError("")}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-[90%] max-w-md z-50">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
            <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">{submitError}</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSubmitError("")}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Step Header */}
        {!hideHeader && (
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1">
              Step 3: Work Details
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Add your professional experience. Include company, role, and responsibilities to
              highlight your career journey. It's recommended to add work details that align with
              a single career path.
            </p>
          </div>
        )}

        {/* Job Role Section */}
        {!hideJobRole && (
          <div className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                Job Role <span className="text-red-500">*</span>
              </h3>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setJobRoleExpanded(!jobRoleExpanded)}
                  className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ChevronDown
                    className={`w-3 h-3 text-gray-600 transition-transform cursor-pointer ${!jobRoleExpanded ? "rotate-180" : ""
                      }`}
                    strokeWidth={2.5}
                  />
                </button>
              </div>
            </div>

            {jobRoleFeedback && (
              <div
                className={`p-4 text-sm ${jobRoleFeedback.includes("successfully")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                  }`}
              >
                {jobRoleFeedback}
              </div>
            )}

            {jobRoleExpanded && (
              <div className="p-4 sm:p-5 md:p-6">
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  We'll use your job role to tailor resumes, prep, and interviews for you. Make
                  sure it's entered correctly so everything matches.
                </p>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Job Role <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={jobRole}
                      onChange={handleJobRoleChange}
                      aria-required="true"
                      aria-invalid={!!errors.jobRole}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none ${errors.jobRole
                          ? "border-red-300 ring-2 ring-red-100"
                          : "border-gray-300 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        } text-xs sm:text-sm appearance-none bg-white pr-8`}
                    >
                      <option value="">Select Job Role</option>
                      <optgroup label="Software Engineering">
                        <option value="Software Engineer">Software Engineer</option>
                        <option value="Software Developer">Software Developer</option>
                        <option value="Senior Software Engineer">Senior Software Engineer</option>
                        <option value="Full Stack Developer">Full Stack Developer</option>
                        <option value="Frontend Developer">Frontend Developer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="Mobile App Developer">Mobile App Developer</option>
                        <option value="iOS Developer">iOS Developer</option>
                        <option value="Android Developer">Android Developer</option>
                        <option value="Embedded Systems Engineer">Embedded Systems Engineer</option>
                      </optgroup>
                      <optgroup label="Data & AI">
                        <option value="Data Scientist">Data Scientist</option>
                        <option value="Data Analyst">Data Analyst</option>
                        <option value="Data Engineer">Data Engineer</option>
                        <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                        <option value="AI Engineer">AI Engineer</option>
                        <option value="Deep Learning Engineer">Deep Learning Engineer</option>
                        <option value="NLP Engineer">NLP Engineer</option>
                        <option value="Business Intelligence Analyst">Business Intelligence Analyst</option>
                      </optgroup>
                      <optgroup label="Infrastructure & DevOps">
                        <option value="DevOps Engineer">DevOps Engineer</option>
                        <option value="Site Reliability Engineer">Site Reliability Engineer</option>
                        <option value="Cloud Engineer">Cloud Engineer</option>
                        <option value="Cloud Architect">Cloud Architect</option>
                        <option value="System Administrator">System Administrator</option>
                        <option value="Network Engineer">Network Engineer</option>
                        <option value="Database Administrator">Database Administrator</option>
                        <option value="Platform Engineer">Platform Engineer</option>
                      </optgroup>
                      <optgroup label="Security">
                        <option value="Security Analyst">Security Analyst</option>
                        <option value="Cybersecurity Engineer">Cybersecurity Engineer</option>
                        <option value="Penetration Tester">Penetration Tester</option>
                        <option value="Security Architect">Security Architect</option>
                        <option value="SOC Analyst">SOC Analyst</option>
                      </optgroup>
                      <optgroup label="Quality Assurance">
                        <option value="QA Engineer">QA Engineer</option>
                        <option value="Test Engineer">Test Engineer</option>
                        <option value="Automation Test Engineer">Automation Test Engineer</option>
                        <option value="Performance Test Engineer">Performance Test Engineer</option>
                        <option value="SDET">SDET</option>
                      </optgroup>
                      <optgroup label="Design">
                        <option value="UI/UX Designer">UI/UX Designer</option>
                        <option value="Product Designer">Product Designer</option>
                        <option value="Graphic Designer">Graphic Designer</option>
                        <option value="Interaction Designer">Interaction Designer</option>
                      </optgroup>
                      <optgroup label="Product & Management">
                        <option value="Product Manager">Product Manager</option>
                        <option value="Technical Lead">Technical Lead</option>
                        <option value="Engineering Manager">Engineering Manager</option>
                        <option value="Solution Architect">Solution Architect</option>
                        <option value="IT Manager">IT Manager</option>
                        <option value="Scrum Master">Scrum Master</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Project Coordinator">Project Coordinator</option>
                      </optgroup>
                      <optgroup label="Business & Analytics">
                        <option value="Business Analyst">Business Analyst</option>
                        <option value="Systems Analyst">Systems Analyst</option>
                        <option value="ERP Consultant">ERP Consultant</option>
                        <option value="Salesforce Developer">Salesforce Developer</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="Technical Writer">Technical Writer</option>
                        <option value="Support Engineer">Support Engineer</option>
                        <option value="IT Consultant">IT Consultant</option>
                        <option value="Research Engineer">Research Engineer</option>
                      </optgroup>
                    </select>
                    {errors.jobRole && (
                      <p className="mt-1 text-xs text-red-500">{errors.jobRole}</p>
                    )}
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
                  {jobRoleChanged && (
                    <button
                      type="button"
                      onClick={handleSaveJobRole}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                      aria-label="Save job role changes"
                    >
                      <Save className="w-4 h-4" strokeWidth={2} />
                      Save
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Work Experience Cards */}
        {(experienceLevel === "intern" || experienceLevel === "experienced") && (
          <>
            {workExperiences.map((exp, index) =>
              renderExperienceCard(exp, index, workExperiences.length > 1)
            )}

            <button
              type="button"
              onClick={addWorkExperience}
              className="flex items-center gap-2 px-4 py-2.5 text-orange-400 hover:text-orange-500 font-medium text-sm transition-colors mb-4 md:mb-5 cursor-pointer"
            >
              <Plus className="w-4 h-4 cursor-pointer" />
              Add Work Experience
            </button>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-orange-300 hover:border-orange-400 text-orange-400 rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Previous
          </button>
          <button
            type="submit"
            disabled={false}
            style={{
              background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)",
            }}
            className="px-6 sm:px-8 py-2.5 sm:py-3 text-white rounded-xl font-medium text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
          >
            Proceed to next
          </button>
        </div>
      </div>
    </form>
  );
}
