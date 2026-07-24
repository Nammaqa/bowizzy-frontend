import React, { useState, useEffect, useRef, useCallback } from "react";
import type { ExperienceDetails, WorkExperience as WET } from "src/types/resume";
import {
  FormInput,
  FormSelect,
  FormSection,
  AddButton,
  ToggleSwitch,
} from "@/pages/(ResumeBuilder)/components/ui";
import RichTextEditor from "@/pages/(ResumeBuilder)/components/ui/RichTextEditor";
import { ChevronDown, Trash2, Plus, Save } from "lucide-react";
import {
  updateExperienceDetails,
  saveExperienceDetails,
  deleteExperience,
  updateJobRole,
} from "@/services/experienceService";

interface WorkExperience extends WET {
  experience_id?: number | null;
  isExpanded?: boolean;
}

interface ExperienceDetailsFormProps {
  data: ExperienceDetails;
  onChange: (data: ExperienceDetails) => void;
  userId: string;
  token: string;
  experienceDataIdMap: Record<string, number>;
  setExperienceDataIdMap: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  deleteExperienceIds: number[];
  setDeleteExperienceIds: React.Dispatch<React.SetStateAction<number[]>>;
}

const employmentTypes = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Internship", label: "Internship" },
  { value: "Freelance", label: "Freelance" },
];

const workModes = [
  { value: "On-site", label: "On-site" },
  { value: "Remote", label: "Remote" },
  { value: "Hybrid", label: "Hybrid" },
];

const locations = [
  { value: "Bengaluru", label: "Bengaluru" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Delhi", label: "Delhi" },
  { value: "Chennai", label: "Chennai" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Pune", label: "Pune" },
  { value: "New York", label: "New York" },
  { value: "San Francisco", label: "San Francisco" },
];

const normalizeMonthToDate = (val: string): string | null => {
  if (!val) return null;
  if (typeof val === "string" && /^\d{4}-\d{2}$/.test(val))
    return `${val}-01`;
  return val;
};

export const ExperienceDetailsForm: React.FC<ExperienceDetailsFormProps> = ({
  data,
  onChange,
  userId,
  token,
  experienceDataIdMap,
  setExperienceDataIdMap,
  deleteExperienceIds,
  setDeleteExperienceIds,
}) => {
  const [jobRole, setJobRole] = useState(data.jobRole || "");
  const [jobRoleExpanded, setJobRoleExpanded] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [jobRoleFeedback, setJobRoleFeedback] = useState("");
  const [experienceFeedback, setExperienceFeedback] = useState<Record<string, string>>({});
  const [hiddenSaveIds, setHiddenSaveIds] = useState<Set<string>>(new Set());

  const initialDataRef = useRef(data);
  const initialJobRole = useRef(data.jobRole || "");
  const deletedExperienceIdsRef = useRef(deleteExperienceIds);

  const getCurrentExperiences = useCallback((): WorkExperience[] => {
    return data.workExperiences.map(exp => ({
      ...exp,
      experience_id: experienceDataIdMap[exp.id] || null,
      isExpanded: exp.isExpanded ?? false,
    })) as WorkExperience[];
  }, [data.workExperiences, experienceDataIdMap]);

  const workExperiences = getCurrentExperiences();

  const setWorkExperiences = (updatedExperiences: WorkExperience[]) => {
    onChange({
      ...data,
      workExperiences: updatedExperiences.map(exp => ({ ...exp, experience_id: undefined, isExpanded: exp.isExpanded })) as WET[],
    });

    const newMap = updatedExperiences.reduce((acc, exp) => {
      if (exp.experience_id) acc[exp.id] = exp.experience_id;
      return acc;
    }, {} as Record<string, number>);
    setExperienceDataIdMap(newMap);
  };


  const toggleCollapse = (id: string) => {
    const updated = workExperiences.map(exp =>
      exp.id === id ? { ...exp, isExpanded: !exp.isExpanded } : exp
    );
    setWorkExperiences(updated);
  };

  const hasJobRoleChanged = jobRole !== initialJobRole.current;

  const getExperienceChangedStatus = useCallback((current: WorkExperience): boolean => {
    const initial = initialDataRef.current.workExperiences.find(i => i.id === current.id);

    if (!initial) {
      return !!(current.companyName || current.jobTitle);
    }

    const initialExpWithId = {
      ...initial,
      experience_id: experienceDataIdMap[initial.id]
    } as WorkExperience;

    return (
      current.companyName !== initialExpWithId.companyName ||
      current.jobTitle !== initialExpWithId.jobTitle ||
      current.employmentType !== initialExpWithId.employmentType ||
      current.location !== initialExpWithId.location ||
      current.workMode !== initialExpWithId.workMode ||
      current.startDate !== initialExpWithId.startDate ||
      current.endDate !== initialExpWithId.endDate ||
      current.description !== initialExpWithId.description ||
      current.currentlyWorking !== (initialExpWithId.currentlyWorking || false)
    );
  }, [experienceDataIdMap]);

  const hasUnsavedChanges = hasJobRoleChanged || workExperiences.some(getExperienceChangedStatus);


  const validateCompanyName = (value: string) => {
    if (value && value.length > 100) {
      return "Company name must not exceed 100 characters";
    }
    if (value && !/^[a-zA-Z0-9\s.,&'-]+$/.test(value)) {
      return "Invalid characters in company name";
    }
    if (value && !/[a-zA-Z]/.test(value)) {
      return "Company name must include at least one letter";
    }
    return "";
  };

  const validateJobTitle = (value: string) => {
    if (value && value.length > 100) {
      return "Job title must not exceed 100 characters";
    }
    if (value && !/^[a-zA-Z0-9\s./-]+$/.test(value)) {
      return "Invalid characters in job title";
    }
    if (value && !/[a-zA-Z]/.test(value)) {
      return "Job title must contain at least one letter";
    }
    return "";
  };
  const validateDescription = (value: string) => {
    // Strip HTML tags from the rich text value so the limit reflects
    // visible characters rather than markup.
    const plainText = value ? value.replace(/<[^>]*>/g, "") : "";
    if (plainText.length > 500) {
      return "Description must not exceed 500 characters";
    }
    return "";
  };
  const validateDateRange = (startDate: string, endDate: string) => {
    const currentYear = new Date().getFullYear();

    if (startDate) {
      const startYearNum = parseInt(startDate.split("-")[0], 10);
      if (startYearNum < 1960) {
        return "Start date must be later than 1960";
      }
    }
    if (endDate) {
      const endYearNum = parseInt(endDate.split("-")[0], 10);
      if (endYearNum < 1960) {
        return "End date must be later than 1960";
      }
      if (endYearNum > currentYear) {
        return "End date cannot be later than the current year";
      }
    }
    if (startDate && endDate) {
      if (endDate < startDate) {
        return "End date cannot be before start date";
      }
    }
    return "";
  };
  const getCurrentMonthStr = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const handleJobRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setJobRole(e.target.value);
    onChange({ ...data, jobRole: e.target.value });
  };

  const handleSaveJobRole = async () => {
    if (!hasJobRoleChanged) {
      setJobRoleFeedback("No changes to save.");
      setTimeout(() => setJobRoleFeedback(""), 3000);
      return;
    }

    try {
      await updateJobRole(userId, token, { job_role: jobRole });

      initialJobRole.current = jobRole;
      setJobRoleFeedback("Job Role updated successfully!");
      setTimeout(() => setJobRoleFeedback(""), 3000);
    } catch (error) {
      console.error("Error saving Job Role:", error);
      setJobRoleFeedback("Failed to update Job Role.");
      setTimeout(() => setJobRoleFeedback(""), 3000);
    }
  };

  const updateWorkExperience = (
    id: string,
    field: string,
    value: string | boolean
  ) => {
    const index = workExperiences.findIndex(exp => exp.id === id);
    if (index === -1) return;

    const updated = [...workExperiences];
    const sanitizeMonthInput = (val: string) => {
      if (!val) return "";
      const cleaned = val.replace(/[^0-9-]/g, "");
      if (cleaned.includes("-")) {
        return cleaned.slice(0, 7);
      }
      return cleaned.slice(0, 4);
    };

    let sanitizedVal: string | undefined;

    if ((field === "startDate" || field === "endDate") && typeof value === "string") {
      sanitizedVal = sanitizeMonthInput(value);
      updated[index] = { ...updated[index], [field]: sanitizedVal };
    } else if (field === "companyName" && typeof value === "string") {
      updated[index] = { ...updated[index], [field]: value.slice(0, 100) };
    } else if (field === "jobTitle" && typeof value === "string") {
      updated[index] = { ...updated[index], [field]: value.slice(0, 100) };
    } else if (field === "description" && typeof value === "string") {
      // Clamp on the plain-text length, but keep the original (HTML) value
      // up to the point where the visible character count hits 500.
      let clamped = value;
      const plainLength = value.replace(/<[^>]*>/g, "").length;
      if (plainLength > 500) {
        clamped = value.slice(0, 500);
      }
      updated[index] = { ...updated[index], [field]: clamped };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    if (field === "currentlyWorking" && value === true) {
      updated[index].endDate = "";
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[`exp-${id}-endDate`];
        return newErrors;
      });
    }

    setWorkExperiences(updated);

    const updatedExp = updated[index];

    if (field === "companyName" && typeof value === "string") {
      const error = validateCompanyName(updatedExp.companyName);
      setErrors((prev) => ({ ...prev, [`exp-${id}-companyName`]: error }));
    } else if (field === "jobTitle" && typeof value === "string") {
      const error = validateJobTitle(updatedExp.jobTitle);
      setErrors((prev) => ({ ...prev, [`exp-${id}-jobTitle`]: error }));
    } else if (field === "description" && typeof value === "string") {
      const error = validateDescription(updatedExp.description);
      setErrors((prev) => ({ ...prev, [`exp-${id}-description`]: error }));
    } else if (
      (field === "startDate" || field === "endDate") &&
      typeof value === "string"
    ) {
      if (sanitizedVal !== undefined) {
        if (!sanitizedVal.includes("-") && sanitizedVal.length !== 4) {
          const which = field === "startDate" ? `exp-${id}-startDate` : `exp-${id}-endDate`;
          setErrors((prev) => ({ ...prev, [which]: "Enter 4-digit year (YYYY)" }));
        } else {
          const which = field === "startDate" ? `exp-${id}-startDate` : `exp-${id}-endDate`;
          setErrors((prev) => {
            const updatedErr = { ...prev };
            delete updatedErr[which];
            return updatedErr;
          });
        }
      }

      const error = validateDateRange(updatedExp.startDate, updatedExp.endDate);
      setErrors((prev) => ({ ...prev, [`exp-${id}-endDate`]: error }));
    }
  };

  const handleSaveExperience = async (exp: WorkExperience) => {
    const isNew = !exp.experience_id;

    if (!getExperienceChangedStatus(exp) && !isNew) {
      setExperienceFeedback(prev => ({ ...prev, [exp.id]: "No changes to save." }));
      setTimeout(() => setExperienceFeedback(prev => { const updated = { ...prev }; delete updated[exp.id]; return updated; }), 3000);
      return;
    }

    if (!exp.companyName || !exp.jobTitle) {
      setExperienceFeedback(prev => ({ ...prev, [exp.id]: "Company Name and Job Title are required to save." }));
      setTimeout(() => setExperienceFeedback(prev => { const updated = { ...prev }; delete updated[exp.id]; return updated; }), 3000);
      return;
    }

    const index = workExperiences.findIndex((e) => e.id === exp.id);
    const prefix = `exp-${exp.id}`;

    if (
      errors[`${prefix}-companyName`] ||
      errors[`${prefix}-jobTitle`] ||
      errors[`${prefix}-endDate`]
    ) return;

    try {
      let response: any;
      let feedbackMessage = "";

      const experiencePayload = {
        company_name: exp.companyName || "",
        job_title: exp.jobTitle || "",
        employment_type: exp.employmentType || "",
        location: exp.location || "",
        work_mode: exp.workMode || "",
        start_date: normalizeMonthToDate(exp.startDate),
        end_date: exp.currentlyWorking ? null : normalizeMonthToDate(exp.endDate),
        currently_working_here: !!exp.currentlyWorking,
        description: exp.description || "",
      };

      if (isNew) {
        const postPayload = {
          job_role: jobRole,
          experiences: [experiencePayload]
        };
        response = await saveExperienceDetails(userId, token, postPayload);

        const newExperienceId = response?.experiences?.[0]?.experience_id;

        if (newExperienceId) {
          const updatedExp = { ...exp, experience_id: newExperienceId };
          setWorkExperiences(workExperiences.map((e) => (e.id === exp.id ? updatedExp : e)));

          const exists = initialDataRef.current.workExperiences.some(e => e.id === exp.id);
          const nextWorkExperiences = exists
            ? initialDataRef.current.workExperiences.map(e => e.id === exp.id ? updatedExp : e)
            : [...initialDataRef.current.workExperiences, updatedExp];

          initialDataRef.current = {
            ...initialDataRef.current,
            workExperiences: nextWorkExperiences
          };
          feedbackMessage = "Saved successfully!";
        } else {
          feedbackMessage = "Saved successfully, sync needed.";
        }
      } else {
        const initial = (initialDataRef.current.workExperiences.find(i => i.id === exp.id) || {
          companyName: "",
          jobTitle: "",
          employmentType: "",
          location: "",
          workMode: "",
          startDate: "",
          endDate: "",
          currentlyWorking: false,
          description: "",
        }) as WET;
        const minimalPayload: Record<string, any> = {};

        Object.keys(experiencePayload).forEach(key => {
          const apiField = key as keyof typeof experiencePayload;
          const localField = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()) as keyof WET;

          if (experiencePayload[apiField] !== (initial as any)[localField]) {
            minimalPayload[apiField] = experiencePayload[apiField];
          }
        });

        if (Object.keys(minimalPayload).length > 0) {
          await updateExperienceDetails(userId, token, exp.experience_id as number, minimalPayload);

          const exists = initialDataRef.current.workExperiences.some(e => e.id === exp.id);
          const nextWorkExperiences = exists
            ? initialDataRef.current.workExperiences.map(e => e.id === exp.id ? exp : e)
            : [...initialDataRef.current.workExperiences, exp];

          initialDataRef.current = {
            ...initialDataRef.current,
            workExperiences: nextWorkExperiences
          };
          feedbackMessage = "Updated successfully!";
        }
      }

      setExperienceFeedback(prev => ({ ...prev, [exp.id]: feedbackMessage }));

      // Hide save button after successful save
      setHiddenSaveIds(prev => new Set([...prev, exp.id]));

      setTimeout(() => {
        setExperienceFeedback(prev => { const updated = { ...prev }; delete updated[exp.id]; return updated; });
        setHiddenSaveIds(prev => {
          const updated = new Set(prev);
          updated.delete(exp.id);
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error("Error saving experience:", error);
      const feedback = isNew ? "Failed to save." : "Failed to update.";
      setExperienceFeedback(prev => ({ ...prev, [exp.id]: feedback }));
      setTimeout(() => setExperienceFeedback(prev => { const updated = { ...prev }; delete updated[exp.id]; return updated; }), 3000);
    }
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
      currentlyWorking: false,
      description: "",
      enabled: true,
      experience_id: null,
      isExpanded: true,
    };
    setWorkExperiences([...workExperiences, newExp]);
  };

  const removeWorkExperience = async (id: string) => {
    const exp = workExperiences.find(e => e.id === id);

    if (!exp || workExperiences.length === 1) return;

    if (exp.experience_id) {
      try {
        await deleteExperience(userId, token, exp.experience_id);
        deletedExperienceIdsRef.current.push(exp.experience_id);
        setDeleteExperienceIds(deletedExperienceIdsRef.current);
        setExperienceFeedback(prev => ({ ...prev, [id]: "Deleted successfully!" }));
        setTimeout(() => setExperienceFeedback(prev => { const updated = { ...prev }; delete updated[id]; return updated; }), 3000);
      } catch (error) {
        console.error("Error deleting experience:", error);
        setExperienceFeedback(prev => ({ ...prev, [id]: "Failed to delete." }));
        setTimeout(() => setExperienceFeedback(prev => { const updated = { ...prev }; delete updated[id]; return updated; }), 3000);
        return;
      }
    }

    const updatedExperiences = workExperiences.filter(e => e.id !== id);
    setWorkExperiences(updatedExperiences);

    initialDataRef.current = {
      ...initialDataRef.current,
      workExperiences: initialDataRef.current.workExperiences.filter(e => e.id !== id)
    };
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.includes(id)) delete newErrors[key];
      });
      return newErrors;
    });
  };


  const resetExperience = (id: string) => {
    const initialExp = initialDataRef.current.workExperiences.find(e => e.id === id);
    if (!initialExp) return;

    const updated = workExperiences.map(exp =>
      exp.id === id ? {
        ...exp,
        companyName: initialExp.companyName || "",
        jobTitle: initialExp.jobTitle || "",
        employmentType: initialExp.employmentType || "",
        location: initialExp.location || "",
        workMode: initialExp.workMode || "",
        startDate: initialExp.startDate || "",
        endDate: initialExp.endDate || "",
        description: initialExp.description || "",
        currentlyWorking: initialExp.currentlyWorking || false,
      } : exp
    );
    setWorkExperiences(updated);

    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.includes(id)) delete newErrors[key];
      });
      return newErrors;
    });
    setExperienceFeedback(prev => { const updated = { ...prev }; delete updated[id]; return updated; });
  };


  const toggleWorkExperience = (id: string, enabled: boolean) => {
    // Update both the workExperiences state and the data
    const updatedExperiences = workExperiences.map((exp) =>
      exp.id === id ? { ...exp, enabled } : exp
    );

    setWorkExperiences(updatedExperiences);

    // Also update the data through onChange
    onChange({
      ...data,
      workExperiences: updatedExperiences.map(exp => ({
        ...exp,
        experience_id: undefined,
        isExpanded: exp.isExpanded
      })) as WET[],
    });
  };

  const renderExperienceCard = (
    experience: WorkExperience,
    index: number,
    showDelete: boolean = false
  ) => {
    const changed = getExperienceChangedStatus(experience);
    const feedback = experienceFeedback[experience.id];

    return (
      <FormSection
        key={experience.id}
        title={`Work Experience ${workExperiences.length > 1 ? index + 1 : ""
          }`}
        showToggle={true}
        enabled={experience.enabled !== undefined ? experience.enabled : true}
        onToggle={(enabled) => toggleWorkExperience(experience.id, enabled)}
        onRemove={
          workExperiences.length > 1
            ? () => removeWorkExperience(experience.id)
            : undefined
        }
        showActions={true}
        isCollapsed={!experience.isExpanded}
        onCollapseToggle={() => toggleCollapse(experience.id)}
      >
        <FormInput
          label="Company Name"
          placeholder="Enter Company Name"
          value={experience.companyName}
          onChange={(v) => updateWorkExperience(experience.id, "companyName", v)}
          error={errors[`exp-${experience.id}-companyName`]}
          maxLength={100}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormInput
            label="Job Title / Role"
            placeholder="Enter Job Title"
            value={experience.jobTitle}
            onChange={(v) => updateWorkExperience(experience.id, "jobTitle", v)}
            error={errors[`exp-${experience.id}-jobTitle`]}
            maxLength={100}
          />
          <FormSelect
            label="Employment Type"
            placeholder="Select Employment Type"
            value={experience.employmentType}
            onChange={(v) =>
              updateWorkExperience(experience.id, "employmentType", v)
            }
            options={employmentTypes}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormSelect
            label="Location"
            placeholder="Select Location"
            value={experience.location}
            onChange={(v) => updateWorkExperience(experience.id, "location", v)}
            options={locations}
          />
          <FormSelect
            label="Work Mode"
            placeholder="Select Work Mode"
            value={experience.workMode}
            onChange={(v) => updateWorkExperience(experience.id, "workMode", v)}
            options={workModes}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="relative">
            <FormInput
              label="Start Date"
              placeholder="Select Start Date"
              value={experience.startDate}
              onChange={(v) => updateWorkExperience(experience.id, "startDate", v)}
              type="month"
              min="1960-01"
              max={getCurrentMonthStr()}
              error={errors[`exp-${experience.id}-startDate`]}
            />
          </div>
          <div className="relative">
            <FormInput
              label="End Date"
              placeholder="Select End Date"
              value={experience.currentlyWorking ? '' : experience.endDate}
              onChange={(v) => updateWorkExperience(experience.id, "endDate", v)}
              type="month"
              disabled={experience.currentlyWorking}
              min="1960-01"
              max={getCurrentMonthStr()}
              error={errors[`exp-${experience.id}-endDate`]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id={`currentlyWorking-${experience.id}`}
            checked={experience.currentlyWorking}
            onChange={(e) =>
              updateWorkExperience(
                experience.id,
                "currentlyWorking",
                e.target.checked
              )
            }
            className="w-4 h-4 text-orange-400 border-gray-300 rounded focus:ring-orange-400"
          />
          <label
            htmlFor={`currentlyWorking-${experience.id}`}
            className="text-sm text-gray-600"
          >
            Currently Working here
          </label>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <RichTextEditor
            value={experience.description}
            onChange={(v) => updateWorkExperience(experience.id, "description", v)}
            placeholder="Provide Description / Projects of your Work"
            rows={4}
          />
          <div className="flex items-center justify-between mt-1">
            {errors[`exp-${experience.id}-description`] ? (
              <p className="text-xs text-red-500">{errors[`exp-${experience.id}-description`]}</p>
            ) : <span />}
            <span className="text-xs text-gray-400">
              {experience.description ? experience.description.replace(/<[^>]*>/g, "").length : 0}/500
            </span>
          </div>
        </div>

        <div className='flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200'>
          {experienceFeedback[experience.id] && (
            <span className={`text-xs px-2 py-1 rounded-full ${experienceFeedback[experience.id].includes("successfully") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
              {experienceFeedback[experience.id]}
            </span>
          )}
          {changed && !hiddenSaveIds.has(experience.id) && (
            <button
              type="button"
              onClick={() => handleSaveExperience(experience)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
              aria-pressed="false"
              aria-label={experience.experience_id ? "Update experience changes" : "Save new experience"}
            >
              <Save className="w-4 h-4" strokeWidth={2} />
              Save
            </button>
          )}
        </div>
      </FormSection>
    );
  };

  return (
    <div className="flex flex-col gap-5">

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
            Job Role<span className="text-red-500">*</span>
          </h3>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setJobRoleExpanded(!jobRoleExpanded)}
              className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronDown
                className={`w-3 h-3 text-gray-600 transition-transform cursor-pointer ${!jobRoleExpanded ? "rotate-180" : ""
                  }`}
                strokeWidth={2.5}
              />
            </button>
          </div>
        </div>

        {jobRoleExpanded && (
          <div className="p-4 sm:p-5 md:p-6">
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              We'll use your job role to tailor resumes, prep, and interviews
              for you. Make sure it's entered correctly so everything matches.
            </p>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Job Role
              </label>
              <div className="relative">
                <select
                  value={jobRole}
                  onChange={handleJobRoleChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-xs sm:text-sm appearance-none bg-white pr-8"
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
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
              {jobRoleFeedback && (
                <span className={`text-xs px-2 py-1 rounded-full ${jobRoleFeedback.includes("successfully") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                  {jobRoleFeedback}
                </span>
              )}
              {hasJobRoleChanged && (
                <button
                  type="button"
                  onClick={handleSaveJobRole}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                  aria-pressed="false"
                  aria-label="Save Job Role"
                >
                  <Save className="w-4 h-4" strokeWidth={2} />
                  Save
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {workExperiences.map((exp, index) =>
        renderExperienceCard(exp, index, workExperiences.length > 1)
      )}

      <div className="bg-white border border-gray-200 rounded-xl">
        <AddButton onClick={addWorkExperience} label="Add Experience" />
      </div>
    </div>
  );
};

export default ExperienceDetailsForm;
