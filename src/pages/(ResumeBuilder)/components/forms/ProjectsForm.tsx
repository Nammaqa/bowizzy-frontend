import React, { useState, useEffect, useRef } from "react";
import type { Project } from "src/types/resume";
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormSection,
  AddButton,
} from "@/pages/(ResumeBuilder)/components/ui";
import RichTextEditor from "@/pages/(ResumeBuilder)/components/ui/RichTextEditor";
import { Save, RotateCcw, Sparkles, Loader2, X } from "lucide-react";
import {
  saveProjectsDetails,
  updateProjectDetails,
  deleteProject,
} from "@/services/projectService";
import { enhanceRolesResponsibilities } from "@/utils/enhanceRolesResponsibilities";

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
  userId: string;
  token: string;
}

const projectTypes = [
  { value: "Personal", label: "Personal" },
  { value: "Academic", label: "Academic" },
  { value: "Professional", label: "Professional" },
  { value: "Open Source", label: "Open Source" },
  { value: "Freelance", label: "Freelance" },
  { value: "Research", label: "Research" },
];

export const ProjectsForm: React.FC<ProjectsFormProps> = ({
  data,
  onChange,
  userId,
  token,
}) => {
  // Collapse state for each project
  const [collapsedStates, setCollapsedStates] = useState<{
    [key: string]: boolean;
  }>({});

  // Validation errors state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // State for tracking feedback
  // State for tracking feedback
  const [projectFeedback, setProjectFeedback] = useState<
    Record<string, string>
  >({});
  const [hiddenSaveIds, setHiddenSaveIds] = useState<Set<string>>(new Set());

  const [enhancingProjectId, setEnhancingProjectId] = useState<string | null>(null);
  const [enhanceRolesError, setEnhanceRolesError] = useState<Record<string, string>>({});
  const [enhancedRolesVersions, setEnhancedRolesVersions] = useState<Record<string, { precise: string; technical: string }>>({});

  // Refs for tracking initial data
  const initialProjectsRef = useRef<Record<string, Project>>({});

  // Initialize refs on mount and when data changes from parent
  useEffect(() => {
    data.forEach((p) => {
      if (!initialProjectsRef.current[p.id]) {
        initialProjectsRef.current[p.id] = { ...p };
      }
    });
  }, [data]);

  // Check if a specific project has changes
  const getProjectChangedStatus = (current: Project): boolean => {
    const initial = initialProjectsRef.current[current.id];

    if (!initial) {
      if (current.project_id) {
        initialProjectsRef.current[current.id] = { ...current };
        return false;
      }
      return !!(
        current.projectTitle ||
        current.projectType ||
        current.startDate ||
        current.endDate ||
        current.currentlyWorking ||
        current.description ||
        current.rolesResponsibilities
      );
    }

    return (
      current.projectTitle !== (initial.projectTitle || "") ||
      current.projectType !== (initial.projectType || "") ||
      current.startDate !== (initial.startDate || "") ||
      current.endDate !== (initial.endDate || "") ||
      current.currentlyWorking !== (initial.currentlyWorking || false) ||
      current.description !== (initial.description || "") ||
      current.rolesResponsibilities !== (initial.rolesResponsibilities || "")
    );
  };

  const toggleCollapse = (id: string) => {
    setCollapsedStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Validation functions
  const validateProjectTitle = (value: string) => {
    if (value && !/^[a-zA-Z0-9\s.,-]+$/.test(value)) {
      return "Invalid characters in project title";
    }
    if (value && !/[a-zA-Z]/.test(value)) {
      return "Project title must include at least one letter";
    }
    if (value && value.length < 5) {
      return "Project title must be at least 5 characters";
    }
    if (value && value.length > 50) {
      return "Project title must not exceed 50 characters";
    }
    return "";
  };

  const validateDateRange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      if (endDate < startDate) {
        return "End date cannot be before start date";
      }
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

  const updateProject = (
    id: string,
    field: string,
    value: string | boolean
  ) => {
    const updatedProjects = data.map((proj) =>
      proj.id === id ? { ...proj, [field]: value } : proj
    );

    onChange(updatedProjects);

    // Find the updated project for validation
    const updatedProj = updatedProjects.find((proj) => proj.id === id);

    // Validate fields
    if (field === "projectTitle" && typeof value === "string") {
      const error = validateProjectTitle(value);
      setErrors((prev) => ({ ...prev, [`project-${id}-projectTitle`]: error }));
    } else if (
      field === "startDate" &&
      typeof value === "string" &&
      updatedProj
    ) {
      const error = validateDateRange(value, updatedProj.endDate);
      setErrors((prev) => ({ ...prev, [`project-${id}-endDate`]: error }));
    } else if (
      field === "endDate" &&
      typeof value === "string" &&
      updatedProj
    ) {
      const error = validateDateRange(updatedProj.startDate, value);
      setErrors((prev) => ({ ...prev, [`project-${id}-endDate`]: error }));
    }

    // Clear end date error if currently working is checked
    if (field === "currentlyWorking" && value === true) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`project-${id}-endDate`];
        return newErrors;
      });
    }
    // If projectType is changed, ensure it's not purely numeric
    if (field === "projectType" && typeof value === "string") {
      if (value && !/[a-zA-Z]/.test(value)) {
        setErrors((prev) => ({ ...prev, [`project-${id}-projectType`]: "Project type must include at least one letter" }));
      } else {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[`project-${id}-projectType`];
          return updated;
        });
      }
    }
  };

  // Handler for saving individual Project card (PUT/POST call)
  const handleSaveProject = async (project: Project) => {
    const isNew = !project.project_id;

    // Check local validation errors
    if (
      errors[`project-${project.id}-projectTitle`] ||
      errors[`project-${project.id}-endDate`]
    )
      return;

    // Check if there are actually changes to save
    if (!getProjectChangedStatus(project) && !isNew) {
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

    try {
      if (isNew) {
        // New record, construct full payload for POST
        const projectPayload = {
          project_title: project.projectTitle || "",
          project_type: project.projectType || "",
          start_date: normalizeMonthToDate(project.startDate),
          end_date: normalizeMonthToDate(project.endDate),
          currently_working: project.currentlyWorking,
          description: project.description || "",
          roles_responsibilities: project.rolesResponsibilities || "",
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
          const updatedProjects = data.map((p) =>
            p.id === project.id ? updatedProject : p
          );
          onChange(updatedProjects);
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
      } else {
        // Existing record (PUT logic)
        const initial = initialProjectsRef.current[project.id];
        const minimalPayload: Record<string, any> = {};

        // Build minimal payload with only changed fields
        if (project.projectTitle !== (initial?.projectTitle || "")) {
          minimalPayload.project_title = project.projectTitle;
        }
        if (project.projectType !== (initial?.projectType || "")) {
          minimalPayload.project_type = project.projectType;
        }
        if (project.startDate !== (initial?.startDate || "")) {
          minimalPayload.start_date = normalizeMonthToDate(project.startDate);
        }
        if (project.endDate !== (initial?.endDate || "")) {
          minimalPayload.end_date = normalizeMonthToDate(project.endDate);
        }
        if (project.description !== (initial?.description || "")) {
          minimalPayload.description = project.description;
        }
        if (
          project.rolesResponsibilities !==
          (initial?.rolesResponsibilities || "")
        ) {
          minimalPayload.roles_responsibilities = project.rolesResponsibilities;
        }
        if (project.currentlyWorking !== (initial?.currentlyWorking || false)) {
          minimalPayload.currently_working = project.currentlyWorking;
        }

        // Handle date logic when currentlyWorking changes
        if (minimalPayload.currently_working === true) {
          minimalPayload.end_date = null;
        } else if (minimalPayload.currently_working === false) {
          minimalPayload.end_date = normalizeMonthToDate(project.endDate);
        }

        if (Object.keys(minimalPayload).length > 0) {
          await updateProjectDetails(
            userId,
            token,
            project.project_id!,
            minimalPayload
          );

          // Update local state and refs
          initialProjectsRef.current[project.id] = { ...project };
          setProjectFeedback((prev) => ({
            ...prev,
            [project.id]: "Updated successfully!",
          }));
        }
      }

      // Clear general feedback after 3 seconds and hide save button
      setHiddenSaveIds(prev => new Set([...prev, project.id]));
      setTimeout(() => {
        setProjectFeedback((prev) => {
          const updated = { ...prev };
          delete updated[project.id];
          return updated;
        });
        setHiddenSaveIds(prev => {
          const updated = new Set(prev);
          updated.delete(project.id);
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

  // Handler for clearing individual card data (reverting to initial values)
  const resetProject = (id: string) => {
    const initial = initialProjectsRef.current[id];
    if (!initial) return;

    const updatedProjects = data.map((proj) =>
      proj.id === id
        ? {
          ...proj,
          projectTitle: initial.projectTitle || "",
          projectType: initial.projectType || "",
          startDate: initial.startDate || "",
          endDate: initial.endDate || "",
          currentlyWorking: initial.currentlyWorking || false,
          description: initial.description || "",
          rolesResponsibilities: initial.rolesResponsibilities || "",
        }
        : proj
    );

    onChange(updatedProjects);

    // Clear errors for this project
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`project-${id}-projectTitle`];
      delete newErrors[`project-${id}-endDate`];
      return newErrors;
    });
    setProjectFeedback((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      projectTitle: "",
      projectType: "",
      startDate: "",
      endDate: "",
      currentlyWorking: false,
      description: "",
      rolesResponsibilities: "",
      enabled: true,
    };
    onChange([...data, newProject]);
  };

  const removeProject = async (id: string) => {
    if (data.length <= 1) return;

    const project = data.find((p) => p.id === id);
    if (!project) return;

    if (project.project_id) {
      try {
        await deleteProject(userId, token, project.project_id);
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
    onChange(data.filter((proj) => proj.id !== id));
    delete initialProjectsRef.current[id];

    // Clean up collapsed state
    setCollapsedStates((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });

    // Clean up errors for removed project
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`project-${id}-projectTitle`];
      delete newErrors[`project-${id}-endDate`];
      return newErrors;
    });
  };

  const getPlainText = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  };

  const handleEnhanceRoles = async (project: Project) => {
    const hasInput = getPlainText(project.rolesResponsibilities ?? "").length > 0;
    if (!hasInput) return;
    setEnhancingProjectId(project.id);
    setEnhanceRolesError((prev) => ({ ...prev, [project.id]: "" }));
    setEnhancedRolesVersions((prev) => { const u = { ...prev }; delete u[project.id]; return u; });
    try {
      const result = await enhanceRolesResponsibilities(
        project.rolesResponsibilities,
        project.projectTitle,
        project.projectType,
        project.description
      );
      setEnhancedRolesVersions((prev) => ({ ...prev, [project.id]: result }));
    } catch (err: any) {
      setEnhanceRolesError((prev) => ({ ...prev, [project.id]: err.message || "Failed to enhance. Please try again." }));
    } finally {
      setEnhancingProjectId(null);
    }
  };

  const handleApplyRolesVersion = (projectId: string, type: "precise" | "technical") => {
    const versions = enhancedRolesVersions[projectId];
    if (!versions) return;
    // Convert bullet plain text to HTML list items
    const html = versions[type]
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => `<div>${line.trim()}</div>`)
      .join("");
    updateProject(projectId, "rolesResponsibilities", html);
    setEnhancedRolesVersions((prev) => { const u = { ...prev }; delete u[projectId]; return u; });
    setEnhanceRolesError((prev) => ({ ...prev, [projectId]: "" }));
  };

  const handleDismissRolesVersions = (projectId: string) => {
    setEnhancedRolesVersions((prev) => { const u = { ...prev }; delete u[projectId]; return u; });
    setEnhanceRolesError((prev) => ({ ...prev, [projectId]: "" }));
  };

  const toggleProject = (id: string, enabled: boolean) => {
    onChange(
      data.map((proj) => (proj.id === id ? { ...proj, enabled } : proj))
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {data.map((project, index) => {
        const changed = getProjectChangedStatus(project);
        const feedback = projectFeedback[project.id];

        return (
          <FormSection
            key={project.id}
            title={`Project ${data.length > 1 ? index + 1 : ""}`}
            showToggle={true}
            enabled={project.enabled}
            onToggle={(enabled) => toggleProject(project.id, enabled)}
            onRemove={
              data.length > 1 ? () => removeProject(project.id) : undefined
            }
            showActions={true}
            isCollapsed={collapsedStates[project.id] !== undefined ? collapsedStates[project.id] : true}
            onCollapseToggle={() => toggleCollapse(project.id)}
          >
            <FormInput
              label="Project Title"
              placeholder="Enter Project Title"
              value={project.projectTitle}
              onChange={(v) => updateProject(project.id, "projectTitle", v)}
              error={errors[`project-${project.id}-projectTitle`]}
              max="50"
              min="5"
            />

            <div className="mt-4">
              <FormSelect
                label="Project Type"
                placeholder="Select Project Type"
                value={project.projectType}
                onChange={(v) => updateProject(project.id, "projectType", v)}
                options={projectTypes}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormInput
                label="Start Date"
                placeholder="Select Start Date"
                value={project.startDate}
                onChange={(v) => updateProject(project.id, "startDate", v)}
                type="month"
              />
              <FormInput
                label="End Date"
                placeholder="Select End Date"
                value={project.endDate}
                onChange={(v) => updateProject(project.id, "endDate", v)}
                type="month"
                disabled={project.currentlyWorking}
                error={errors[`project-${project.id}-endDate`]}
              />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id={`currentlyWorking-${project.id}`}
                checked={project.currentlyWorking}
                onChange={(e) =>
                  updateProject(
                    project.id,
                    "currentlyWorking",
                    e.target.checked
                  )
                }
                className="w-4 h-4 text-orange-400 border-gray-300 rounded focus:ring-orange-400"
              />
              <label
                htmlFor={`currentlyWorking-${project.id}`}
                className="text-sm text-gray-600"
              >
                Currently Working
              </label>
            </div>

            <div className="mt-4">
              <div className="flex flex-col gap-1">
                <label className="font-medium">Description</label>
                <RichTextEditor
                  value={project.description}
                  onChange={(v) => updateProject(project.id, "description", v)}
                  placeholder="Provide Description of your project.."
                  rows={4}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                  <label className="font-medium">Roles & Responsibilities</label>
                  <button
                    type="button"
                    onClick={() => handleEnhanceRoles(project)}
                    disabled={!getPlainText(project.rolesResponsibilities ?? "").length || enhancingProjectId === project.id}
                    title={!getPlainText(project.rolesResponsibilities ?? "").length ? "Add some text to enable AI enhancement" : "Enhance with AI"}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                      ${getPlainText(project.rolesResponsibilities ?? "").length && enhancingProjectId !== project.id
                        ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm hover:from-violet-600 hover:to-purple-700 cursor-pointer"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    {enhancingProjectId === project.id
                      ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                      : <Sparkles className="w-4 h-4" strokeWidth={2} />
                    }
                    {enhancingProjectId === project.id ? "Enhancing..." : "Enhance with AI"}
                  </button>
                </div>
                <RichTextEditor
                  value={project.rolesResponsibilities}
                  onChange={(v) => {
                    updateProject(project.id, "rolesResponsibilities", v);
                    if (enhancedRolesVersions[project.id]) {
                      setEnhancedRolesVersions((prev) => { const u = { ...prev }; delete u[project.id]; return u; });
                    }
                  }}
                  placeholder="Provide your roles & responsibilities..."
                  rows={4}
                />

                {/* Error */}
                {enhanceRolesError[project.id] && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-red-500 text-xs mt-0.5">⚠</span>
                    <p className="text-xs text-red-600 flex-1">{enhanceRolesError[project.id]}</p>
                    <button type="button" onClick={() => setEnhanceRolesError((prev) => ({ ...prev, [project.id]: "" }))} className="text-red-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* AI Results Panel */}
                {enhancedRolesVersions[project.id] && (
                  <div className="mt-4 border border-purple-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-purple-200">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" strokeWidth={2} />
                        <span className="text-sm font-semibold text-purple-800">AI Enhanced Versions</span>
                      </div>
                      <button type="button" onClick={() => handleDismissRolesVersions(project.id)} className="text-purple-400 hover:text-purple-700 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-4 flex flex-col gap-4 bg-white">
                      {/* Precise */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Precise</span>
                            <span className="text-xs text-gray-400">— Concise action bullets</span>
                          </div>
                          <button type="button" onClick={() => handleApplyRolesVersion(project.id, "precise")} className="text-xs px-3 py-1 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition-colors cursor-pointer">
                            Use This
                          </button>
                        </div>
                        <div className="p-3">
                          {enhancedRolesVersions[project.id].precise.split("\n").filter(l => l.trim()).map((line, i) => (
                            <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>
                          ))}
                        </div>
                      </div>

                      {/* Technical */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Technical</span>
                            <span className="text-xs text-gray-400">— Detailed tech breakdown</span>
                          </div>
                          <button type="button" onClick={() => handleApplyRolesVersion(project.id, "technical")} className="text-xs px-3 py-1 bg-emerald-500 text-white rounded-md font-medium hover:bg-emerald-600 transition-colors cursor-pointer">
                            Use This
                          </button>
                        </div>
                        <div className="p-3">
                          {enhancedRolesVersions[project.id].technical.split("\n").filter(l => l.trim()).map((line, i) => (
                            <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 text-center">Click "Use This" to apply a version, or dismiss to keep your current text.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
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
              {changed && !hiddenSaveIds.has(project.id) && (
                <button
                  type="button"
                  onClick={() => handleSaveProject(project)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                  title={
                    project.project_id ? "Update changes" : "Save new project"
                  }
                >
                  <Save className="w-4 h-4" strokeWidth={2} />
                  Save
                </button>
              )}
              <button
                type="button"
                onClick={() => resetProject(project.id)}
                className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
                title="Reset to saved values"
              >
                <RotateCcw
                  className="w-3 h-3 text-gray-600 cursor-pointer"
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </FormSection>
        );
      })}

      <div className="bg-white border border-gray-200 rounded-xl">
        <AddButton onClick={addProject} label="Add Project" />
      </div>
    </div>
  );
};

export default ProjectsForm;
