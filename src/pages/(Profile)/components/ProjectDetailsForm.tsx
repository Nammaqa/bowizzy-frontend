import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Trash2, Plus, Save } from "lucide-react";
import {
  getProjectsByUserId,
  saveProjectsDetails,
  updateProjectDetails,
  deleteProject,
} from "@/services/projectService";
import RichTextEditor from "@/pages/(ResumeBuilder)/components/ui/RichTextEditor";

interface ProjectDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
  userId: string;
  token: string;
}

interface Project {
  id: string; // Client-side unique ID
  projectTitle: string;
  projectType: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
  rolesAndResponsibilities: string;
  isExpanded: boolean;
  project_id?: number; // Database ID
}

const PROJECT_TITLE_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 500;
const ROLES_MAX_LENGTH = 500;
const MIN_YEAR = 1960;

export default function ProjectDetailsForm({
  onNext,
  onBack,
  initialData = {},
  userId,
  token,
}: ProjectDetailsFormProps) {
  // Initialize projects, ensuring at least one card is present
  const initialProjects: Project[] =
    initialData.projects && initialData.projects.length > 0
      ? initialData.projects.map((p: any) => ({
        ...p,
        id: p.id || p.project_id?.toString() || Date.now().toString(),
        currentlyWorking: p.currentlyWorking ?? p.currently_working ?? false,
        isExpanded: p.isExpanded ?? false,
      }))
      : [
        {
          id: "1",
          projectTitle: "",
          projectType: "",
          startDate: "",
          endDate: "",
          currentlyWorking: false,
          description: "",
          rolesAndResponsibilities: "",
          isExpanded: true,
        },
      ];

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState("");

  // State for tracking changes and feedback
  const [projectChanges, setProjectChanges] = useState<
    Record<string, string[]>
  >({});
  const [projectFeedback, setProjectFeedback] = useState<
    Record<string, string>
  >({});

  // Refs for tracking initial data and deleted IDs
  const initialProjectsRef = useRef<Record<string, Project>>({});
  const deletedProjectIds = useRef<number[]>([]);

  // Initialize refs on mount
  useEffect(() => {
    projects.forEach((p) => {
      initialProjectsRef.current[p.id] = { ...p };
    });
  }, []);

  // Check Project changes
  useEffect(() => {
    const changes: Record<string, string[]> = {};
    projects.forEach((current) => {
      const initial = initialProjectsRef.current[current.id];
      const changedFields: string[] = [];

      // Compare fields
      if (current.projectTitle !== (initial?.projectTitle || ""))
        changedFields.push("projectTitle");
      if (current.projectType !== (initial?.projectType || ""))
        changedFields.push("projectType");
      if (current.startDate !== (initial?.startDate || ""))
        changedFields.push("startDate");
      if (current.endDate !== (initial?.endDate || ""))
        changedFields.push("endDate");
      if (current.currentlyWorking !== (initial?.currentlyWorking || false))
        changedFields.push("currentlyWorking");

      if (current.description !== (initial?.description || ""))
        changedFields.push("description");
      if (
        current.rolesAndResponsibilities !==
        (initial?.rolesAndResponsibilities || "")
      )
        changedFields.push("rolesAndResponsibilities");

      if (changedFields.length > 0) {
        changes[current.id] = changedFields;
      } else if (!current.project_id && current.projectTitle) {
        // Treat new/unsaved card as 'changed' if title is filled
        changes[current.id] = ["new"];
      }
    });
    setProjectChanges(changes);
  }, [projects]);

  // Validation functions
  const validateProjectTitle = (value: string) => {
    if (value && !/^[a-zA-Z0-9\s.,-]+$/.test(value)) {
      return "Invalid characters in project title";
    }
    if (value && value.length > PROJECT_TITLE_MAX_LENGTH) {
      return `Project title cannot exceed ${PROJECT_TITLE_MAX_LENGTH} characters`;
    }
    return "";
  };

  const stripHtml = (val?: string) => {
    if (!val) return "";
    return val.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  };

  const validateNotNumericOnly = (value: string) => {
    const text = stripHtml(value);
    if (!text) return "";
    if (/^\d+$/.test(text)) {
      return "This field cannot be numbers only; include letters or punctuation.";
    }
    return "";
  };

  const validateMaxLength = (value: string, max: number, label: string) => {
    const text = stripHtml(value);
    if (text.length > max) {
      return `${label} cannot exceed ${max} characters`;
    }
    return "";
  };

  const validateDescription = (value: string) => {
    const numericError = validateNotNumericOnly(value);
    if (numericError) return numericError;
    return validateMaxLength(value, DESCRIPTION_MAX_LENGTH, "Description");
  };

  const validateRoles = (value: string) => {
    const numericError = validateNotNumericOnly(value);
    if (numericError) return numericError;
    return validateMaxLength(
      value,
      ROLES_MAX_LENGTH,
      "Roles & Responsibilities"
    );
  };

  const validateDateRange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      if (endDate < startDate) {
        return "End date cannot be before start date";
      }
    }
    return "";
  };

  const getCurrentYear = (): number => new Date().getFullYear();

  const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const getMinMonth = (): string => `${MIN_YEAR}-01`;

  const validateMonthFormat = (value: string) => {
    if (!value || value === "") return "";
    if (!/^\d{4}-\d{2}$/.test(value)) {
      return "Please select a valid month (YYYY-MM)";
    }
    const [y, m] = value.split("-");
    if (y.length !== 4) return "Year must be 4 digits";
    const yearNum = parseInt(y, 10);
    const monthNum = parseInt(m, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12)
      return "Invalid month";
    const currentYear = getCurrentYear();
    if (isNaN(yearNum) || yearNum < MIN_YEAR || yearNum > currentYear) {
      return `Year must be between ${MIN_YEAR} and ${currentYear}`;
    }
    return "";
  };

  // Helper to format date for API payload (YYYY-MM to YYYY-MM-01)
  const normalizeMonthToDate = (val: string): string | null => {
    if (!val) return null;
    if (typeof val === "string" && /^\d{4}-\d{2}$/.test(val))
      return `${val}-01`;
    return val;
  };

  // Prevent manual keyboard typing into month inputs; only allow navigation
  // and the native date picker to set the value.
  const blockManualDateTyping = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const allowedKeys = [
      "Tab",
      "Shift",
      "Escape",
      "Enter",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ];
    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  // Run full mandatory-field validation for a project whose title is filled
  const validateMandatoryFields = (project: Project) => {
    const fieldErrors: Record<string, string> = {};
    if (!project.projectTitle) return fieldErrors;

    if (!project.projectType) {
      fieldErrors.projectType = "Project type is required";
    }
    if (!project.startDate) {
      fieldErrors.startDate = "Start date is required";
    }
    if (!project.currentlyWorking && !project.endDate) {
      fieldErrors.endDate = "End date is required";
    }
    if (!stripHtml(project.description)) {
      fieldErrors.description = "Description is required";
    }
    if (!stripHtml(project.rolesAndResponsibilities)) {
      fieldErrors.rolesAndResponsibilities =
        "Roles & Responsibilities is required";
    }
    return fieldErrors;
  };

  // Handler for individual Project card changes
  const handleProjectChange = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value, isExpanded: true };

    if (field === "currentlyWorking") {
      updated[index].currentlyWorking = Boolean(value);
      if (value === true) {
        updated[index].endDate = "";
        setErrors((prev) => {
          const next = { ...prev };
          delete next[`project-${index}-endDate`];
          return next;
        });
      }
    }

    setProjects(updated);

    // Validation logic
    if (field === "projectTitle" && typeof value === "string") {
      const error = validateProjectTitle(value);
      setErrors((prev) => ({
        ...prev,
        [`project-${index}-projectTitle`]: error,
      }));

      // Once the title is cleared, the card is fully optional again —
      // drop any lingering "required" errors on its other fields so an
      // empty-title card never blocks the user from moving on.
      if (!value) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[`project-${index}-projectType`];
          delete next[`project-${index}-startDate`];
          delete next[`project-${index}-endDate`];
          delete next[`project-${index}-description`];
          delete next[`project-${index}-rolesAndResponsibilities`];
          return next;
        });
      }
    } else if (field === "description" && typeof value === "string") {
      const err = validateDescription(value);
      setErrors((prev) => ({ ...prev, [`project-${index}-description`]: err }));
    } else if (field === "rolesAndResponsibilities" && typeof value === "string") {
      const err = validateRoles(value);
      setErrors((prev) => ({ ...prev, [`project-${index}-rolesAndResponsibilities`]: err }));
    } else if (field === "startDate" && typeof value === "string") {
      const fmtError = validateMonthFormat(value);
      if (fmtError) {
        setErrors((prev) => ({ ...prev, [`project-${index}-startDate`]: fmtError }));
      } else {
        setErrors((prev) => {
          const updatedErr = { ...prev };
          delete updatedErr[`project-${index}-startDate`];
          return updatedErr;
        });
      }
      const rangeError = updated[index].currentlyWorking
        ? ""
        : validateDateRange(value, updated[index].endDate);
      setErrors((prev) => ({ ...prev, [`project-${index}-endDate`]: rangeError }));
    } else if (field === "endDate" && typeof value === "string") {
      const fmtError = validateMonthFormat(value);
      if (fmtError) {
        setErrors((prev) => ({ ...prev, [`project-${index}-endDate`]: fmtError }));
      } else {
        setErrors((prev) => {
          const updatedErr = { ...prev };
          delete updatedErr[`project-${index}-endDate`];
          return updatedErr;
        });
        const rangeError = validateDateRange(updated[index].startDate, value);
        setErrors((prev) => ({ ...prev, [`project-${index}-endDate`]: rangeError }));
      }
    } else if (field === "currentlyWorking" && value === false && updated[index].projectTitle) {
      setErrors((prev) => ({
        ...prev,
        [`project-${index}-endDate`]: updated[index].endDate ? "" : "End date is required",
      }));
    }
  };

  // Handler for saving individual Project card (PUT/POST call)
  const handleSaveProject = async (project: Project) => {
    const isNew = !project.project_id;
    const projectChangesList = projectChanges[project.id];
    const index = projects.findIndex((p) => p.id === project.id);
    const prefix = `project-${index}`;

    // Check local validation errors
    if (
      errors[`${prefix}-projectTitle`] ||
      errors[`${prefix}-startDate`] ||
      errors[`${prefix}-endDate`] ||
      errors[`${prefix}-description`] ||
      errors[`${prefix}-rolesAndResponsibilities`]
    )
      return;

    // Mandatory field validation: once a title is present, every other
    // field on the card becomes required.
    const mandatoryErrors = validateMandatoryFields(project);
    if (Object.keys(mandatoryErrors).length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        Object.entries(mandatoryErrors).forEach(([field, msg]) => {
          next[`project-${index}-${field}`] = msg;
        });
        return next;
      });
      setProjectFeedback((prev) => ({
        ...prev,
        [project.id]:
          "Please fill all required fields before saving.",
      }));
      setTimeout(
        () =>
          setProjectFeedback((prev) => {
            const updated = { ...prev };
            delete updated[project.id];
            return updated;
          }),
        3000
      );
      return;
    }

    try {
      let payload: Record<string, any> = {};

      if (isNew) {
        // New record, construct full payload for POST
        const projectPayload = {
          project_title: project.projectTitle || "",
          project_type: project.projectType || "",
          start_date: normalizeMonthToDate(project.startDate),
          end_date: project.currentlyWorking ? null : normalizeMonthToDate(project.endDate),
          currently_working: project.currentlyWorking,
          description: project.description || "",
          roles_responsibilities: project.rolesAndResponsibilities || "",
        };

        // Skip saving empty new cards
        if (!project.projectTitle) {
          setProjectFeedback((prev) => ({
            ...prev,
            [project.id]: "Project Title is required to save.",
          }));
          setTimeout(
            () =>
              setProjectFeedback((prev) => {
                const updated = { ...prev };
                delete updated[project.id];
                return updated;
              }),
            3000
          );
          return;
        }

        // Validate description / roles are not numeric-only and within length limits
        const descError = validateDescription(project.description);
        const rolesError = validateRoles(project.rolesAndResponsibilities);
        if (descError || rolesError) {
          setErrors((prev) => ({
            ...prev,
            [`project-${index}-description`]: descError,
            [`project-${index}-rolesAndResponsibilities`]: rolesError,
          }));
          setProjectFeedback((prev) => ({
            ...prev,
            [project.id]: "Please correct highlighted errors before saving.",
          }));
          setTimeout(() =>
            setProjectFeedback((prev) => {
              const updated = { ...prev };
              delete updated[project.id];
              return updated;
            }),
            3000
          );
          return;
        }

        const response = await saveProjectsDetails(userId, token, [
          projectPayload,
        ]);

        // The API POST response is an array of created objects
        const newProjectId = response?.[0]?.project_id;

        if (newProjectId) {
          const updatedProject: Project = {
            ...project,
            project_id: newProjectId,
          };

          // Update local state and refs
          setProjects((prev) =>
            prev.map((p) => (p.id === project.id ? updatedProject : p))
          );
          initialProjectsRef.current[project.id] = updatedProject;

          setProjectFeedback((prev) => ({
            ...prev,
            [project.id]: "Saved successfully!",
          }));
        } else {
          console.warn(
            "POST successful but failed to retrieve new project_id."
          );
          setProjectFeedback((prev) => ({
            ...prev,
            [project.id]:
              "Saved successfully, but ID retrieval failed (relying on next step sync).",
          }));
        }

        setProjectChanges((prev) => {
          const updated = { ...prev };
          delete updated[project.id];
          return updated;
        });
      } else {
        // Existing record (PUT logic)
        if (!projectChangesList || projectChangesList.length === 0) {
          setProjectFeedback((prev) => ({
            ...prev,
            [project.id]: "No changes to save.",
          }));
          setTimeout(
            () =>
              setProjectFeedback((prev) => {
                const updated = { ...prev };
                delete updated[project.id];
                return updated;
              }),
            3000
          );
          return;
        }

        const minimalPayload: Record<string, any> = {};

        projectChangesList.forEach((field) => {
          switch (field) {
            case "projectTitle":
              minimalPayload.project_title = project.projectTitle;
              break;
            case "projectType":
              minimalPayload.project_type = project.projectType;
              break;
            case "startDate":
              minimalPayload.start_date = normalizeMonthToDate(
                project.startDate
              );
              break;
            case "endDate":
              minimalPayload.end_date = project.currentlyWorking ? null : normalizeMonthToDate(project.endDate);
              break;
            case "currentlyWorking":
              minimalPayload.currently_working = project.currentlyWorking;
              break;
            case "description":
              minimalPayload.description = project.description;
              break;
            case "rolesAndResponsibilities":
              minimalPayload.roles_responsibilities =
                project.rolesAndResponsibilities;
              break;

          }
        });

        minimalPayload.end_date = project.currentlyWorking ? null : normalizeMonthToDate(project.endDate);

        // Validate description / roles are not numeric-only and within length limits
        const descError = validateDescription(project.description);
        const rolesError = validateRoles(project.rolesAndResponsibilities);
        if (descError || rolesError) {
          setErrors((prev) => ({
            ...prev,
            [`project-${index}-description`]: descError,
            [`project-${index}-rolesAndResponsibilities`]: rolesError,
          }));
          setProjectFeedback((prev) => ({
            ...prev,
            [project.id]: "Please correct highlighted errors before saving.",
          }));
          setTimeout(() =>
            setProjectFeedback((prev) => {
              const updated = { ...prev };
              delete updated[project.id];
              return updated;
            }),
            3000
          );
          return;
        }

        await updateProjectDetails(
          userId,
          token,
          project.project_id!,
          minimalPayload
        );

        // Update local state and refs
        initialProjectsRef.current[project.id] = { ...project };
        setProjectChanges((prev) => {
          const updated = { ...prev };
          delete updated[project.id];
          return updated;
        });
        setProjectFeedback((prev) => ({
          ...prev,
          [project.id]: "Updated successfully!",
        }));
      }

      // Clear general feedback after 3 seconds
      setTimeout(() => {
        setProjectFeedback((prev) => {
          const updated = { ...prev };
          delete updated[project.id];
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error("Error saving project:", error);
      const feedback = isNew ? "Failed to save." : "Failed to update.";
      setProjectFeedback((prev) => ({ ...prev, [project.id]: feedback }));
      setTimeout(
        () =>
          setProjectFeedback((prev) => {
            const updated = { ...prev };
            delete updated[project.id];
            return updated;
          }),
        3000
      );
    }
  };

  // Handler for expanding/collapsing individual card
  const toggleExpand = (index: number) => {
    const updated = [...projects];
    updated[index] = {
      ...updated[index],
      isExpanded: !updated[index].isExpanded,
    };
    setProjects(updated);
  };

  // Handler for clearing individual card data (reverting to initial values)
  const resetProject = (index: number) => {
    const project = projects[index];
    const initial = initialProjectsRef.current[project.id];
    const updated = [...projects];

    updated[index] = {
      ...project,
      projectTitle: initial?.projectTitle || "",
      projectType: initial?.projectType || "",
      startDate: initial?.startDate || "",
      endDate: initial?.endDate || "",
      currentlyWorking: initial?.currentlyWorking || false,
      description: initial?.description || "",
      rolesAndResponsibilities: initial?.rolesAndResponsibilities || "",
    };

    setProjects(updated);

    // Clear changes and errors for this project
    setProjectChanges((prev) => {
      const updatedChanges = { ...prev };
      delete updatedChanges[project.id];
      return updatedChanges;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`project-${index}-projectTitle`];
      delete newErrors[`project-${index}-startDate`];
      delete newErrors[`project-${index}-endDate`];
      delete newErrors[`project-${index}-description`];
      delete newErrors[`project-${index}-rolesAndResponsibilities`];
      delete newErrors[`project-${index}-projectType`];
      return newErrors;
    });
    setProjectFeedback((prev) => {
      const updated = { ...prev };
      delete updated[project.id];
      return updated;
    });
  };

  // Handler for creating a new empty card
  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      projectTitle: "",
      projectType: "",
      startDate: "",
      endDate: "",
      currentlyWorking: false,
      description: "",
      rolesAndResponsibilities: "",
      isExpanded: true,
    };
    setProjects([...projects, newProject]);
  };

  // Handler for removing an experience card and performing DELETE API call if necessary
  const removeProject = async (index: number) => {
    const project = projects[index];

    if (projects.length === 1) return;

    if (project.project_id) {
      try {
        await deleteProject(userId, token, project.project_id);
        deletedProjectIds.current.push(project.project_id);
        setProjectFeedback((prev) => ({
          ...prev,
          [project.id]: "Deleted successfully!",
        }));
        setTimeout(
          () =>
            setProjectFeedback((prev) => {
              const updated = { ...prev };
              delete updated[project.id];
              return updated;
            }),
          3000
        );
      } catch (error) {
        console.error("Error deleting project:", error);
        setProjectFeedback((prev) => ({
          ...prev,
          [project.id]: "Failed to delete.",
        }));
        setTimeout(
          () =>
            setProjectFeedback((prev) => {
              const updated = { ...prev };
              delete updated[project.id];
              return updated;
            }),
          3000
        );
        return; // Stop removal if API call fails
      }
    }

    // Remove from state and clear associated data/errors
    const id = project.id;
    setProjects(projects.filter((_, i) => i !== index));
    delete initialProjectsRef.current[id];
    setProjectChanges((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Clear errors for removed project
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`project-${index}-`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  // Check if there are any unsaved changes in any section
  const hasUnsavedChanges = Object.keys(projectChanges).length > 0;

  // Final submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 0️⃣ Projects are optional. If no card has a title and nothing has
    // ever been saved to the database for this section, skip every
    // validation step and let the user proceed straight to the next
    // profile section.
    const hasAnyProjectData = projects.some(
      (p) => (p.projectTitle && p.projectTitle.trim() !== "") || p.project_id
    );
    if (!hasAnyProjectData) {
      setSubmitError("");
      onNext({
        projects: [],
        deletedProjectIds: deletedProjectIds.current,
      });
      return;
    }

    // 1️⃣ Validation errors check — only fields on cards that actually have
    // a project title filled in can block submission. An untitled card is
    // entirely optional, so any leftover errors on it are ignored here.
    const blockingValidationError = Object.entries(errors).some(
      ([key, err]) => {
        if (!err) return false;
        const match = key.match(/^project-(\d+)-/);
        if (!match) return true;
        const idx = parseInt(match[1], 10);
        return !!projects[idx]?.projectTitle;
      }
    );
    if (blockingValidationError) {
      setSubmitError("Please fix validation errors before proceeding.");
      return;
    }

    // 2️⃣ Mandatory fields check for any card with a title filled in
    const mandatoryFieldErrors: Record<string, string> = {};
    let hasMandatoryErrors = false;
    projects.forEach((project, index) => {
      const mandatoryErrors = validateMandatoryFields(project);
      Object.entries(mandatoryErrors).forEach(([field, msg]) => {
        mandatoryFieldErrors[`project-${index}-${field}`] = msg;
        hasMandatoryErrors = true;
      });
    });
    if (hasMandatoryErrors) {
      setErrors((prev) => ({ ...prev, ...mandatoryFieldErrors }));
      setSubmitError(
        "Please fill all required fields for each project that has a title before proceeding."
      );
      return;
    }

    // 3️⃣ Unsaved changes check
    if (hasUnsavedChanges) {
      let message = "Please save your changes before proceeding:\n\n";

      projects.forEach((project, index) => {
        if (projectChanges[project.id]) {
          message += `• Project ${index + 1} (unsaved changes)\n`;
        }
      });

      setSubmitError(message);
      return;
    }

    // 4️⃣ Filter empty cards
    const validProjects = projects.filter(
      (p) => p.projectTitle || p.project_id
    );

    setSubmitError("");

    onNext({
      projects: validProjects,
      deletedProjectIds: deletedProjectIds.current,
    });
  };
  // Render function for all project cards
  const renderProjectCard = (project: Project, index: number) => {
    const changed = projectChanges[project.id]?.length > 0;
    const feedback = projectFeedback[project.id];
    const isMandatory = !!project.projectTitle;
    const descriptionLength = stripHtml(project.description).length;
    const rolesLength = stripHtml(project.rolesAndResponsibilities).length;

    return (
      <div
        key={project.id}
        className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-hidden"
      >
        {/* Header — no Save button here anymore */}
        <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
            Project {index + 1}
          </h3>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => toggleExpand(index)}
              className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronDown
                className={`w-3 h-3 text-gray-600 transition-transform cursor-pointer ${!project.isExpanded ? "rotate-180" : ""
                  }`}
                strokeWidth={2.5}
              />
            </button>
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeProject(index)}
                className="w-5 h-5 flex items-center justify-center rounded border-2 border-red-500 hover:bg-red-50 transition-colors"
                title="Delete this project"
              >
                <Trash2
                  className="w-3 h-3 text-red-500 cursor-pointer"
                  strokeWidth={2.5}
                />
              </button>
            )}
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 text-sm ${feedback.includes("successfully")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
              }`}
          >
            {feedback}
          </div>
        )}

        {/* Content */}
        {project.isExpanded && (
          <div className="p-4 sm:p-5 md:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Project Title */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Project Title
                </label>
                <input
                  type="text"
                  value={project.projectTitle}
                  onChange={(e) =>
                    handleProjectChange(index, "projectTitle", e.target.value)
                  }
                  maxLength={PROJECT_TITLE_MAX_LENGTH}
                  placeholder="Enter Project Title"
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors[`project-${index}-projectTitle`]
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                    }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors[`project-${index}-projectTitle`] ? (
                    <p className="text-xs text-red-500">
                      {errors[`project-${index}-projectTitle`]}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    {project.projectTitle.length}/{PROJECT_TITLE_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* Project Type, Start Date, End Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Project Type */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Project Type{isMandatory && <span className="text-red-500"> *</span>}
                  </label>
                  <div className="relative">
                    <select
                      value={project.projectType}
                      onChange={(e) =>
                        handleProjectChange(
                          index,
                          "projectType",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm appearance-none bg-white pr-8 ${errors[`project-${index}-projectType`]
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                        }`}
                    >
                      <option value="">Select Project Type</option>
                      <option value="Personal">Personal</option>
                      <option value="Academic">Academic</option>
                      <option value="Professional">Professional</option>
                      <option value="Open Source">Open Source</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors[`project-${index}-projectType`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[`project-${index}-projectType`]}
                    </p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Start Date{isMandatory && <span className="text-red-500"> *</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="month"
                      value={project.startDate}
                      onChange={(e) =>
                        handleProjectChange(index, "startDate", e.target.value)
                      }
                      onKeyDown={blockManualDateTyping}
                      onPaste={(e) => e.preventDefault()}
                      placeholder="Select Start Date"
                      min={getMinMonth()}
                      max={getCurrentMonth()}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm pr-8 ${errors[`project-${index}-startDate`]
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                        }`}
                    />
                  </div>
                  {errors[`project-${index}-startDate`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[`project-${index}-startDate`]}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    End Date{isMandatory && !project.currentlyWorking && <span className="text-red-500"> *</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="month"
                      value={project.currentlyWorking ? "" : project.endDate}
                      onChange={(e) =>
                        handleProjectChange(index, "endDate", e.target.value)
                      }
                      onKeyDown={blockManualDateTyping}
                      onPaste={(e) => e.preventDefault()}
                      placeholder="Select End Date"
                      min={getMinMonth()}
                      max={getCurrentMonth()}
                      disabled={project.currentlyWorking}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm pr-8 disabled:bg-gray-100 ${errors[`project-${index}-endDate`]
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                        }`}
                    />
                  </div>
                  {errors[`project-${index}-endDate`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[`project-${index}-endDate`]}
                    </p>
                  )}
                </div>
              </div>

              <label className="mt-3 inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={project.currentlyWorking}
                  onChange={(e) =>
                    handleProjectChange(index, "currentlyWorking", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
                Currently pursuing
              </label>

              {/* Description */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Description{isMandatory && <span className="text-red-500"> *</span>}
                </label>
                <RichTextEditor
                  value={project.description}
                  onChange={(value) =>
                    handleProjectChange(index, "description", value)
                  }
                  placeholder="Provide Description of your project.."
                  rows={6}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors[`project-${index}-description`] ? (
                    <p className="text-xs text-red-500">
                      {errors[`project-${index}-description`]}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span
                    className={`text-[10px] sm:text-xs ${descriptionLength > DESCRIPTION_MAX_LENGTH
                      ? "text-red-500"
                      : "text-gray-400"
                      }`}
                  >
                    {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* Roles & Responsibilities */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Roles & Responsibilities{isMandatory && <span className="text-red-500"> *</span>}
                </label>
                <RichTextEditor
                  value={project.rolesAndResponsibilities}
                  onChange={(value) =>
                    handleProjectChange(
                      index,
                      "rolesAndResponsibilities",
                      value
                    )
                  }
                  placeholder="Provide your roles & responsibilities in the project.."
                  rows={6}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors[`project-${index}-rolesAndResponsibilities`] ? (
                    <p className="text-xs text-red-500">
                      {errors[`project-${index}-rolesAndResponsibilities`]}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span
                    className={`text-[10px] sm:text-xs ${rolesLength > ROLES_MAX_LENGTH
                      ? "text-red-500"
                      : "text-gray-400"
                      }`}
                  >
                    {rolesLength}/{ROLES_MAX_LENGTH}
                  </span>
                </div>
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
                  onClick={() => handleSaveProject(project)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                  aria-label="Save project changes"
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
    // Try to scroll the nearest scrollable parent, fallback to window
    setTimeout(() => {
      let scrolled = false;
      let el = document.getElementById("project-details-form-root");
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
      id="project-details-form-root"
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
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Error
            </h3>

            <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">
              {submitError}
            </p>

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
        <div className="mb-4 md:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1">
            Step 4: Projects
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Showcase academic or personal projects that demonstrate your skills
            and problem-solving ability.
          </p>
        </div>

        {/* Project Cards */}
        {projects.map((project, index) => renderProjectCard(project, index))}

        {/* Add Project Button */}
        <button
          type="button"
          onClick={addProject}
          className="flex items-center gap-2 px-4 py-2.5 text-orange-400 hover:text-orange-500 font-medium text-sm transition-colors mb-4 md:mb-5 cursor-pointer"
        >
          <Plus className="w-4 h-4 cursor-pointer" />
          Add Project
        </button>

        {/* Validation Feedback & Action Buttons */}
        <div className="flex flex-col gap-4">

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
      </div>
    </form>
  );
}
