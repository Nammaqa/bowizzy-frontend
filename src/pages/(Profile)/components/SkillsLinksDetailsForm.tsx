import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, ChevronDown, X, Save } from "lucide-react";
import {
  updateSkillDetails,
  saveSkillsDetails,
  deleteSkill,
  updateLinkDetails,
  saveLinksDetails,
  deleteLink,
} from "@/services/skillsLinksService";
import RichTextEditor from "@/pages/(ResumeBuilder)/components/ui/RichTextEditor";

interface SkillsLinksFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
  userId: string;
  token: string;
}

interface Skill {
  id: string;
  skillName: string;
  skillLevel: string;
  skill_id?: number;
}

interface Link {
  id: string;
  linkedinProfile: string;
  githubProfile: string;
  portfolioUrl: string;
  portfolioDescription: string;
  publicationUrl: string;
  publicationDescription: string;

  link_id_linkedin?: string;
  link_id_github?: string;
  link_id_portfolio?: string;
  link_id_publication?: string;
}

export default function SkillsLinksDetailsForm({
  onNext,
  onBack,
  initialData = {},
  userId,
  token,
}: SkillsLinksFormProps) {
  // Handler for initializing skills, ensuring two empty rows initially
  const initialSkills: Skill[] =
    initialData.skills && initialData.skills.length > 0
      ? initialData.skills.map((s: any) => ({
        ...s,
        id: s.id || s.skill_id?.toString() || Date.now().toString(),
      }))
      : [
        { id: "1", skillName: "", skillLevel: "" },
      ];

  const [skills, setSkills] = useState<Skill[]>(initialSkills);

  // Handler for initializing links, ensuring one block initially
  const initialLinks: Link[] =
    initialData.links && initialData.links.length > 0
      ? initialData.links
      : [
        {
          id: "1",
          linkedinProfile: "",
          githubProfile: "",
          portfolioUrl: "",
          portfolioDescription: "",
          publicationUrl: "",
          publicationDescription: "",
        },
      ];

  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [hasAttemptedProceed, setHasAttemptedProceed] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [skillsExpanded, setSkillsExpanded] = useState(true);
  const [linksExpanded, setLinksExpanded] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // --- Change Tracking / Feedback ---
  const [skillChanges, setSkillChanges] = useState<Record<string, string[]>>({});
  const [linkChanges, setLinkChanges] = useState<Record<string, string[]>>({});
  const [skillFeedback, setSkillFeedback] = useState<Record<string, string>>({});
  const [linkFeedback, setLinkFeedback] = useState<Record<string, string>>({});

  const initialSkillsRef = useRef<Record<string, Skill>>({});
  const initialLinksRef = useRef<Record<string, Link>>({});
  const deletedSkillIds = useRef<number[]>([]);
  const deletedLinkIds = useRef<number[]>([]);

  // Handler for initializing refs on mount
  useEffect(() => {
    skills.forEach((s) => {
      initialSkillsRef.current[s.id] = { ...s };
    });
    links.forEach((l) => {
      initialLinksRef.current[l.id] = { ...l };
    });
  }, []);

  // Handler for checking Skill changes
  useEffect(() => {
    const changes: Record<string, string[]> = {};
    skills.forEach((current) => {
      const initial = initialSkillsRef.current[current.id];
      const changedFields: string[] = [];

      if (current.skillName !== (initial?.skillName || ""))
        changedFields.push("skillName");
      if (current.skillLevel !== (initial?.skillLevel || ""))
        changedFields.push("skillLevel");

      if (changedFields.length > 0) {
        changes[current.id] = changedFields;
      } else if (!current.skill_id && current.skillName) {
        changes[current.id] = ["new"];
      }
    });
    setSkillChanges(changes);
  }, [skills]);

  // Handler for checking Link changes (only for the single links object)
  useEffect(() => {
    const changes: Record<string, string[]> = {};
    const current = links[0];
    const initial = initialLinksRef.current[current?.id];

    if (current && initial) {
      const changedFields = [];
      if (current.linkedinProfile !== (initial.linkedinProfile || ""))
        changedFields.push("linkedinProfile");
      if (current.githubProfile !== (initial.githubProfile || ""))
        changedFields.push("githubProfile");
      if (current.portfolioUrl !== (initial.portfolioUrl || ""))
        changedFields.push("portfolioUrl");
      if (current.portfolioDescription !== (initial.portfolioDescription || ""))
        changedFields.push("portfolioDescription");
      if (current.publicationUrl !== (initial.publicationUrl || ""))
        changedFields.push("publicationUrl");
      if (current.publicationDescription !== (initial.publicationDescription || ""))
        changedFields.push("publicationDescription");

      if (changedFields.length > 0) {
        changes[current.id] = changedFields;
      }
    }
    setLinkChanges(changes);
  }, [links]);

  // Validation functions
  const validateSkillName = (value: string) => {
    if (value && !/^[a-zA-Z0-9\s.+#-]+$/.test(value)) {
      return "Invalid characters in skill name";
    }
    if (value && !/[A-Za-z]/.test(value)) {
      return "Skill must contain at least one letter";
    }
    if (value && value.length > 13) {
      return "Max 13 characters allowed";
    }
    return "";
  };

  // Handler for validating URLs
  const validateUrl = (value: string, type: string) => {
    if (!value) return "";

    const urlPattern =
      /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\w\-\.,@?^=%&:/~\+#]*[\w\-@?^=%&/~\+#])?$/i;

    if (!urlPattern.test(value)) {
      return `Invalid ${type} URL format`;
    }

    if (type === "LinkedIn" && value && !value.toLowerCase().includes("linkedin.com")) {
      return "Please enter a valid LinkedIn URL";
    }

    if (type === "GitHub" && value && !value.toLowerCase().includes("github.com")) {
      return "Please enter a valid GitHub URL";
    }

    return "";
  };

  // --- SKILLS HANDLERS ---

  const handleSkillChange = (index: number, field: string, value: string) => {
    if (field === "skillName" && value.length > 13) return;

    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    setSkills(updated);

    if (field === "skillName") {
      const error = validateSkillName(value);
      setErrors((prev) => {
        const next = { ...prev, [`skill-${index}-skillName`]: error };
        if (value.trim()) delete next.skills;
        return next;
      });
    } else if (field === "skillLevel") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`skill-${index}-skillLevel`];
        return next;
      });
    }
  };

  const handleSaveAllSkills = async () => {
    const changesToSave = Object.keys(skillChanges);
    if (changesToSave.length === 0) {
      setSkillFeedback({ ["1"]: "No changes to save." });
      setTimeout(() => setSkillFeedback({}), 3000);
      return;
    }

    let hasError = false;
    skills.forEach((s, index) => {
      if (!s.skillName || !s.skillName.trim()) {
        setErrors((prev) => ({ ...prev, [`skill-${index}-skillName`]: "Skill Name is required" }));
        hasError = true;
      }
      if (!s.skillLevel) {
        setErrors((prev) => ({ ...prev, [`skill-${index}-skillLevel`]: "Skill Level is required" }));
        hasError = true;
      }
    });
    if (hasError) {
      setSkillFeedback({ ["1"]: "Please provide both name and level for all skills." });
      setTimeout(() => setSkillFeedback({}), 3000);
      return;
    }

    const updatePromises = [];
    const createPayloads = [];
    let successCount = 0;
    let failCount = 0;

    for (const skill of skills) {
      const changes = skillChanges[skill.id];
      const isNew = !skill.skill_id;

      if (!changes && !isNew) continue;
      if (isNew && !skill.skillName) continue;

      const index = skills.indexOf(skill);
      if (errors[`skill-${index}-skillName`]) {
        failCount++;
        continue;
      }

      if (isNew) {
        createPayloads.push({
          skill_name: skill.skillName,
          skill_level: skill.skillLevel,
        });
      } else {
        const minimalPayload: Record<string, any> = {};
        if (changes) {
          changes.forEach((field) => {
            if (field === "skillName") minimalPayload.skill_name = skill.skillName;
            if (field === "skillLevel") minimalPayload.skill_level = skill.skillLevel;
          });
        }
        updatePromises.push(
          updateSkillDetails(userId, token, skill.skill_id!, minimalPayload)
            .then(() => {
              successCount++;
              initialSkillsRef.current[skill.id] = { ...skill };
            })
            .catch(() => failCount++)
        );
      }
    }

    await Promise.all(updatePromises);

    if (createPayloads.length > 0) {
      try {
        const response = await saveSkillsDetails(userId, token, createPayloads);
        if (response && Array.isArray(response)) {
          response.forEach((newSkill) => {
            successCount++;
            setSkills((prev) =>
              prev.map((s) => {
                if (s.skillName === newSkill.skill_name && !s.skill_id) {
                  const updatedSkill = { ...s, skill_id: newSkill.skill_id };
                  initialSkillsRef.current[s.id] = updatedSkill;
                  return updatedSkill;
                }
                return s;
              })
            );
          });
        }
      } catch {
        failCount += createPayloads.length;
      }
    }

    const finalMessage =
      failCount === 0
        ? "All skills updated successfully!"
        : "Skills update failed for some entries.";

    setSkillChanges({});
    setSkillFeedback({ ["1"]: finalMessage });
    setTimeout(() => setSkillFeedback({}), 3000);
  };

  const removeSkill = async (index: number) => {
    const skill = skills[index];

    if (skills.length <= 1) return;

    if (skill.skill_id) {
      try {
        await deleteSkill(userId, token, skill.skill_id);
        deletedSkillIds.current.push(skill.skill_id);
        setSkillFeedback((prev) => ({
          ...prev,
          [skill.id]: "Deleted successfully!",
        }));
      } catch (error) {
        setSkillFeedback((prev) => ({
          ...prev,
          [skill.id]: "Failed to delete.",
        }));
        setTimeout(
          () =>
            setSkillFeedback((prev) => {
              const updated = { ...prev };
              delete updated[skill.id];
              return updated;
            }),
          3000
        );
        return;
      }
    }

    const id = skill.id;
    setSkills(skills.filter((_, i) => i !== index));
    delete initialSkillsRef.current[id];
    setSkillChanges((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const addSkill = () => {
    const newId = Date.now().toString();
    setSkills([...skills, { id: newId, skillName: "", skillLevel: "" }]);
    setSkillChanges((prev) => ({ ...prev, [newId]: ["new"] }));
  };

  const resetSkills = () => {
    const initialValues = Object.values(initialSkillsRef.current);
    setSkills(
      initialValues.length > 0
        ? initialValues.map((s) => ({ ...s }))
        : initialSkills
    );
    setSkillChanges({});
    setSkillFeedback({});
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith("skill-")) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const toggleSkillsExpand = () => {
    setSkillsExpanded(!skillsExpanded);
  };

  // --- LINKS HANDLERS ---

  const handleLinkChange = (linkIndex: number, field: string, value: string) => {
    const updated = [...links];
    updated[linkIndex] = { ...updated[linkIndex], [field]: value };
    setLinks(updated);

    if (field === "linkedinProfile") {
      const error = validateUrl(value, "LinkedIn");
      setErrors((prev) => {
        const next = { ...prev, [`link-${linkIndex}-linkedinProfile`]: error };
        if (value.trim()) {
          delete next.linkedinProfile;
        }
        return next;
      });
    } else if (field === "githubProfile") {
      const error = validateUrl(value, "GitHub");
      setErrors((prev) => ({
        ...prev,
        [`link-${linkIndex}-githubProfile`]: error,
      }));
    } else if (field === "publicationUrl") {
      const error = validateUrl(value, "Publication");
      setErrors((prev) => ({
        ...prev,
        [`link-${linkIndex}-publicationUrl`]: error,
      }));
    }
  };

  const clearLinkField = (linkIndex: number, field: string) => {
    const updated = [...links];
    updated[linkIndex] = { ...updated[linkIndex], [field]: "" };
    setLinks(updated);

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`link-${linkIndex}-${field}`];
      return newErrors;
    });
  };

  const cleanUrl = (url: string) =>
    url.replace(/^https?:\/\//i, "").replace(/^www\./i, "");

  const handleSaveAllLinks = async () => {
    const link = links[0];
    const changes = linkChanges[link.id];

    if (!changes || changes.length === 0) {
      setLinkFeedback({ [link.id]: "No changes to save." });
      setTimeout(() => setLinkFeedback({}), 3000);
      return;
    }

    let successCount = 0;
    let failCount = 0;
    const promises = [];
    const fieldsToSync = [
      { field: "linkedinProfile", dbId: "link_id_linkedin", apiType: "linkedin" },
      { field: "githubProfile", dbId: "link_id_github", apiType: "github" },
      {
        field: "portfolioUrl",
        dbId: "link_id_portfolio",
        apiType: "portfolio",
      },
    ];

    for (const { field, dbId, apiType } of fieldsToSync) {
      let url = link[field as keyof Link] as string;
      if (url) {
        url = cleanUrl(url);
        link[field as keyof Link] = url;
      }
      const dbIdValue = link[dbId as keyof Link];
      const description = null;
      const linkIndex = 0;

      if (errors[`link-${linkIndex}-${field}`]) {
        failCount++;
        continue;
      }

      if (url) {
        const payload = {
          url,
          link_type: apiType,
          description: description || null,
        };
        if (dbIdValue) {
          promises.push(
            updateLinkDetails(userId, token, dbIdValue as string, payload)
              .then(() => {
                successCount++;
                initialLinksRef.current[link.id] = { ...link };
              })
              .catch(() => failCount++)
          );
        } else {
          promises.push(
            saveLinksDetails(userId, token, [payload])
              .then((response) => {
                const newLinkId = response?.[0]?.link_id;
                if (newLinkId) {
                  link[dbId as keyof Link] = newLinkId.toString();
                  initialLinksRef.current[link.id] = { ...link };
                  successCount++;
                }
              })
              .catch(() => failCount++)
          );
        }
      } else if (!url && dbIdValue) {
        promises.push(
          deleteLink(userId, token, dbIdValue as string)
            .then(() => {
              link[dbId as keyof Link] = undefined;
              link[field as keyof Link] = "";
              successCount++;
            })
            .catch(() => failCount++)
        );
      }
    }

    await Promise.all(promises);
    setLinkChanges({});
    setLinks([...links]);

    const finalMessage =
      failCount === 0
        ? "All links updated successfully!"
        : "Link update failed for some entries.";

    setLinkFeedback({ [link.id]: finalMessage });
    setTimeout(() => setLinkFeedback({}), 3000);
  };

  const resetLinks = () => {
    const currentLinks = links[0] || initialLinks[0];
    const initial = initialLinksRef.current[currentLinks.id];

    setLinks([
      {
        id: currentLinks.id,
        linkedinProfile: initial?.linkedinProfile || "",
        githubProfile: initial?.githubProfile || "",
        portfolioUrl: initial?.portfolioUrl || "",
        portfolioDescription: initial?.portfolioDescription || "",
        publicationUrl: initial?.publicationUrl || "",
        publicationDescription: initial?.publicationDescription || "",
        link_id_linkedin: initial?.link_id_linkedin,
        link_id_github: initial?.link_id_github,
        link_id_portfolio: initial?.link_id_portfolio,
        link_id_publication: initial?.link_id_publication,
      },
    ]);

    setLinkChanges({});
    setLinkFeedback({});
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith("link-")) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const toggleLinksExpand = () => {
    setLinksExpanded(!linksExpanded);
  };

  const hasUnsavedChanges =
    Object.keys(skillChanges).length > 0 || Object.keys(linkChanges).length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedProceed(true);

    let hasError = false;
    skills.forEach((s, index) => {
      if (!s.skillName || !s.skillName.trim()) {
        setErrors((prev) => ({ ...prev, [`skill-${index}-skillName`]: "Skill Name is required" }));
        hasError = true;
      }
      if (!s.skillLevel) {
        setErrors((prev) => ({ ...prev, [`skill-${index}-skillLevel`]: "Skill Level is required" }));
        hasError = true;
      }
    });

    const hasCompleteSkill = skills.some((s) => s.skillName && s.skillName.trim() && s.skillLevel);
    if (!hasCompleteSkill || hasError) {
      setErrors((prev) => ({ ...prev, skills: "At least one complete skill (with name and level) is required, and all added skills must be complete." }));
      setSkillsExpanded(true);
      const firstSkill = document.querySelector(
        '#skills-links-details-form-root input[aria-required="true"]'
      ) as HTMLInputElement | null;
      if (firstSkill) firstSkill.focus();
      return;
    }

    const hasLinkedIn = links.some((l) => l.linkedinProfile && l.linkedinProfile.trim());
    if (!hasLinkedIn) {
      setErrors((prev) => ({ ...prev, [`link-0-linkedinProfile`]: "LinkedIn Profile is required" }));
      setLinksExpanded(true);
      const ln = document.querySelector(
        '#skills-links-details-form-root input[placeholder^="Enter LinkedIn"]'
      ) as HTMLInputElement | null;
      if (ln) ln.focus();
      return;
    }

    if (hasUnsavedChanges) {
      let message = "Please save your changes before proceeding:\n\n";
      if (Object.keys(skillChanges).length > 0) message += "• Skills (unsaved changes)\n";
      if (Object.keys(linkChanges).length > 0) message += "• Links (unsaved changes)\n";
      setSubmitError(message);
      return;
    }

    const validSkills = skills.filter((s) => s.skillName || s.skill_id);
    onNext({
      skills: validSkills,
      links: links,
      deletedSkillIds: deletedSkillIds.current,
      deletedLinkIds: deletedLinkIds.current,
    });
  };

  const renderLinkField = (
    link: Link,
    linkIndex: number,
    label: string,
    fieldName: keyof Link,
    dbIdField: keyof Link,
    isTextArea: boolean = false
  ) => {
    const urlField = link[fieldName] as string;

    const isDescriptionField =
      fieldName === "portfolioDescription" || fieldName === "publicationDescription";

    return (
      <div key={fieldName} className={isTextArea ? "sm:col-span-2" : ""}>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
          {label}{" "}
          {fieldName === "linkedinProfile" && <span className="text-red-500">*</span>}
        </label>
        {isDescriptionField ? (
          <RichTextEditor
            value={urlField}
            onChange={(value) => handleLinkChange(linkIndex, fieldName as string, value)}
            placeholder={`Enter ${label}...`}
            rows={5}
          />
        ) : (
          <div className="relative">
            <input
              type="text"
              value={urlField}
              onChange={(e) => handleLinkChange(linkIndex, fieldName as string, e.target.value)}
              required={fieldName === "linkedinProfile"}
              aria-required={fieldName === "linkedinProfile"}
              aria-invalid={!!errors[`link-${linkIndex}-${fieldName}`]}
              placeholder={`Enter ${label}...`}
              className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm pr-8 ${errors[`link-${linkIndex}-${fieldName}`]
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                }`}
            />
            {urlField && (
              <button
                type="button"
                onClick={() => clearLinkField(linkIndex, fieldName as string)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                title="Clear field"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            )}
          </div>
        )}
        {errors[`link-${linkIndex}-${fieldName}`] && (
          <p className="mt-1 text-xs text-red-500">
            {errors[`link-${linkIndex}-${fieldName}`]}
          </p>
        )}
      </div>
    );
  };

  useEffect(() => {
    setTimeout(() => {
      let scrolled = false;
      let el = document.getElementById("skills-links-details-form-root");
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
      id="skills-links-details-form-root"
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
        <div className="mb-4 md:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1">
            Step 5: Links & Skills
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Add portfolio links, profile links, publication links and key skills related to your
            job role.
          </p>
        </div>

        {/* --- SKILLS SECTION --- */}
        <div className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-hidden">
          {/* Skills Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
              Skills <span className="text-red-500">*</span>
            </h3>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={toggleSkillsExpand}
                className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ChevronDown
                  className={`w-3 h-3 text-gray-600 cursor-pointer transition-transform ${!skillsExpanded ? "rotate-180" : ""
                    }`}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </div>

          {/* Skills Content */}
          {skillsExpanded && (
            <div className="p-4 sm:p-5 md:p-6">
              <div className="space-y-3">
                {skills.map((skill, index) => {
                  const feedback = skillFeedback[skill.id];
                  return (
                    <div key={skill.id}>
                      {feedback && (
                        <p
                          className={`mb-2 p-1 text-xs rounded ${feedback.includes("successfully")
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                            }`}
                        >
                          {feedback}
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                        {/* Skill Name */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            Skill
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={skill.skillName}
                              onChange={(e) =>
                                handleSkillChange(index, "skillName", e.target.value)
                              }
                              aria-required={true}
                              aria-invalid={
                                !!(
                                  errors[`skill-${index}-skillName`] || errors.skills
                                )
                              }
                              placeholder="Enter Skill Name..."
                              className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm pr-8 ${errors[`skill-${index}-skillName`] || errors.skills
                                  ? "border-red-500 focus:ring-red-400"
                                  : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                                }`}
                            />
                          </div>
                          {errors[`skill-${index}-skillName`] && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors[`skill-${index}-skillName`]}
                            </p>
                          )}
                        </div>

                        {/* Skill Level */}
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                              Skill Level
                            </label>
                            <div className="relative">
                              <select
                                value={skill.skillLevel}
                                onChange={(e) =>
                                  handleSkillChange(index, "skillLevel", e.target.value)
                                }
                                className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm appearance-none bg-white pr-8 ${
                                  errors[`skill-${index}-skillLevel`] || errors.skills
                                    ? "border-red-500 focus:ring-red-400"
                                    : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                                }`}
                              >
                                <option value="">Select Skill Level</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Expert">Expert</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                            {errors[`skill-${index}-skillLevel`] && (
                              <p className="mt-1 text-xs text-red-500">
                                {errors[`skill-${index}-skillLevel`]}
                              </p>
                            )}
                          </div>

                          {skills.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSkill(index)}
                              className="w-9 h-9 flex items-center justify-center rounded border-2 border-red-500 hover:bg-red-50 transition-colors flex-shrink-0 cursor-pointer"
                              title="Delete this skill"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {errors.skills && (
                  <p className="mt-1 text-xs text-red-500">{errors.skills}</p>
                )}

                {/* Add Skill Button */}
                <button
                  type="button"
                  onClick={addSkill}
                  className="flex items-center gap-2 px-4 py-2 text-orange-400 hover:text-orange-500 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 cursor-pointer" />
                  Add Skill
                </button>
              </div>

              {/* Skills Save Row — inside the expanded content div */}
              <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
                {Object.values(skillFeedback).some((f) => f) && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${Object.values(skillFeedback).every((f) => f.includes("success"))
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                      }`}
                  >
                    {Object.values(skillFeedback).filter((f) => f).join(" | ")}
                  </span>
                )}
                {Object.keys(skillChanges).length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveAllSkills}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                    aria-label="Save skill changes"
                  >
                    <Save className="w-4 h-4" strokeWidth={2} />
                    Save
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- LINKS SECTION --- */}
        {links.map((link, linkIndex) => (
          <div
            key={link.id}
            className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-hidden"
          >
            {/* Links Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                Links
              </h3>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={toggleLinksExpand}
                  className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ChevronDown
                    className={`w-3 h-3 text-gray-600 cursor-pointer transition-transform ${!linksExpanded ? "rotate-180" : ""
                      }`}
                    strokeWidth={2.5}
                  />
                </button>
              </div>
            </div>

            {/* Links Content */}
            {linksExpanded && (
              <div className="p-4 sm:p-5 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderLinkField(link, linkIndex, "LinkedIn Profile", "linkedinProfile", "link_id_linkedin")}
                  {renderLinkField(link, linkIndex, "GitHub Profile", "githubProfile", "link_id_github")}
                  {renderLinkField(link, linkIndex, "Portfolio URL", "portfolioUrl", "link_id_portfolio")}
                </div>

                {/* Links Save Row — inside the expanded content div */}
                <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
                  {linkFeedback[link.id] && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${linkFeedback[link.id].includes("success")
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        }`}
                    >
                      {linkFeedback[link.id]}
                    </span>
                  )}
                  {Object.keys(linkChanges).length > 0 && (
                    <button
                      type="button"
                      onClick={handleSaveAllLinks}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                      aria-label="Save link changes"
                    >
                      <Save className="w-4 h-4" strokeWidth={2} />
                      Save
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          {hasAttemptedProceed &&
          !skills.some((s) => s.skillName && s.skillName.trim()) ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">Missing mandatory field:</p>
              <ul className="text-xs text-red-700 space-y-1 ml-4 mt-1">
                <li>• Skills (at least 1 skill is required)</li>
              </ul>
            </div>
          ) : null}

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
              className="px-6 sm:px-8 py-2.5 sm:py-3 text-white rounded-xl font-medium text-xs sm:text-sm transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              Proceed to next
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
