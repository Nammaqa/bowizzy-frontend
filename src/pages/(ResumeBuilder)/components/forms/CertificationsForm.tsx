import React, { useState, useEffect, useRef } from "react";
import type { Certificate } from "src/types/resume";
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormSection,
  AddButton,
} from "@/pages/(ResumeBuilder)/components/ui";
import { Upload, X, Save } from "lucide-react";
import RichTextEditor from "@/pages/(ResumeBuilder)/components/ui/RichTextEditor";
import {
  saveCertificateDetails,
  updateCertificateDetails,
  deleteCertificate,
} from "@/services/certificateService";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { deleteFromCloudinary } from "@/utils/deleteFromCloudinary";

interface CertificationsFormProps {
  data: Certificate[];
  onChange: (data: Certificate[]) => void;
  userId: string;
  token: string;
}

const certificateTypes = [
  { value: "Technical", label: "Technical" },
  { value: "Professional", label: "Professional" },
  { value: "Academic", label: "Academic" },
  { value: "Language", label: "Language" },
  { value: "Industry", label: "Industry" },
  { value: "Other", label: "Other" },
];

export const CertificationsForm: React.FC<CertificationsFormProps> = ({
  data,
  onChange,
  userId,
  token,
}) => {
  const [collapsedStates, setCollapsedStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // State for tracking feedback
  const [certFeedback, setCertFeedback] = useState<Record<string, string>>({});
  const [hiddenSaveIds, setHiddenSaveIds] = useState<Set<string>>(new Set());

  // Refs for tracking initial data and file inputs
  const initialCertificatesRef = useRef<Record<string, Certificate>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Initialize refs on mount and when data changes from parent
  useEffect(() => {
    data.forEach((cert) => {
      if (!initialCertificatesRef.current[cert.id]) {
        initialCertificatesRef.current[cert.id] = { ...cert };
      }
    });
  }, [data]);

  // Check if a specific certificate has changes
  const getCertificateChangedStatus = (current: Certificate): boolean => {
    const initial = initialCertificatesRef.current[current.id];

    if (!initial) {
      return !!(current.certificateTitle || current.certificateType);
    }

    return (
      current.certificateType !== (initial.certificateType || "") ||
      current.certificateTitle !== (initial.certificateTitle || "") ||
      current.domain !== (initial.domain || "") ||
      current.providedBy !== (initial.providedBy || "") ||
      current.date !== (initial.date || "") ||
      current.description !== (initial.description || "") ||
      current.uploadedFile !== initial.uploadedFile ||
      current.certificateUrl !== (initial.certificateUrl || "")
    );
  };

  const toggleCollapse = (id: string) => {
    setCollapsedStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const validateCertificateTitle = (value: string) => {
    if (value && !/^[a-zA-Z0-9\s.,-:()]+$/.test(value)) {
      return "Invalid characters in certificate title";
    }
    if (value && !/[a-zA-Z]/.test(value)) {
      return "Certificate Title must include at least one letter";
    }
    return "";
  };

  const validateDomain = (value: string) => {
    if (value && !/^[a-zA-Z0-9\s.,-/&]+$/.test(value)) {
      return "Invalid characters in domain";
    }
    if (value && !/[a-zA-Z]/.test(value)) {
      return "Domain must include at least one letter";
    }
    return "";
  };

  const validateProvider = (value: string) => {
    if (value && !/^[a-zA-Z0-9\s.,&'-]+$/.test(value)) {
      return "Invalid characters in provider name";
    }
    if (value && !/[a-zA-Z]/.test(value)) {
      return "Provider must include at least one letter";
    }
    return "";
  };

  const validateFile = (file: File) => {
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      return "Only PDF, JPG, and JPEG files are allowed";
    }

    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }

    return "";
  };

  const updateCertificate = (
    id: string,
    field: string,
    value: string | boolean
  ) => {
    onChange(
      data.map((cert) => (cert.id === id ? { ...cert, [field]: value } : cert))
    );

    if (field === "certificateTitle" && typeof value === "string") {
      const error = validateCertificateTitle(value);
      setErrors((prev) => ({
        ...prev,
        [`cert-${id}-certificateTitle`]: error,
      }));
    } else if (field === "domain" && typeof value === "string") {
      const error = validateDomain(value);
      setErrors((prev) => ({ ...prev, [`cert-${id}-domain`]: error }));
    } else if (field === "providedBy" && typeof value === "string") {
      const error = validateProvider(value);
      setErrors((prev) => ({ ...prev, [`cert-${id}-providedBy`]: error }));
    } else if (field === "date" && typeof value === "string") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const error = value && value > currentMonth ? "Date cannot be in the future" : "";
      setErrors((prev) => ({ ...prev, [`cert-${id}-date`]: error }));
    }
  };

  const handleFileUpload = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors((prev) => ({ ...prev, [`cert-${id}-file`]: error }));
      return;
    }

    // Perform cloud delete of any existing file, then upload new file
    const existing = data.find((c) => c.id === id);
    (async () => {
      try {
        if (existing?.cloudDeleteToken) {
          await deleteFromCloudinary(existing.cloudDeleteToken as string);
        }
      } catch (err) {
        console.warn("Cloudinary delete failed:", err);
      }

      try {
        const uploadRes = await uploadToCloudinary(file);
        if (!uploadRes?.url) {
          setErrors((prev) => ({ ...prev, [`cert-${id}-file`]: "Upload failed" }));
          return;
        }

        onChange(
          data.map((cert) =>
            cert.id === id
              ? {
                  ...cert,
                  uploadedFile: null,
                  uploadedFileName: file.name,
                  certificateUrl: uploadRes.url,
                  uploadedFileType: file.type,
                  cloudDeleteToken: uploadRes.deleteToken,
                }
              : cert
          )
        );

        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`cert-${id}-file`];
          return newErrors;
        });
      } catch (err) {
        console.error("Upload to Cloudinary failed:", err);
        setErrors((prev) => ({ ...prev, [`cert-${id}-file`]: "Upload failed" }));
      }
    })();
  };

  const handleFileDrop = (id: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors((prev) => ({ ...prev, [`cert-${id}-file`]: error }));
      return;
    }

    const existing = data.find((c) => c.id === id);
    (async () => {
      try {
        if (existing?.cloudDeleteToken) {
          await deleteFromCloudinary(existing.cloudDeleteToken as string);
        }
      } catch (err) {
        console.warn("Cloudinary delete failed:", err);
      }

      try {
        const uploadRes = await uploadToCloudinary(file);
        if (!uploadRes?.url) {
          setErrors((prev) => ({ ...prev, [`cert-${id}-file`]: "Upload failed" }));
          return;
        }

        onChange(
          data.map((cert) =>
            cert.id === id
              ? {
                  ...cert,
                  uploadedFile: null,
                  uploadedFileName: file.name,
                  certificateUrl: uploadRes.url,
                  uploadedFileType: file.type,
                  cloudDeleteToken: uploadRes.deleteToken,
                }
              : cert
          )
        );

        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`cert-${id}-file`];
          return newErrors;
        });
      } catch (err) {
        console.error("Upload to Cloudinary failed:", err);
        setErrors((prev) => ({ ...prev, [`cert-${id}-file`]: "Upload failed" }));
      }
    })();
  };

  const clearFile = (id: string) => {
    const cert = data.find((c) => c.id === id);
    if (!cert) return;

    (async () => {
      try {
        if (cert.cloudDeleteToken) {
          await deleteFromCloudinary(cert.cloudDeleteToken as string);
        }
      } catch (err) {
        console.warn("Cloudinary delete failed:", err);
      }

      onChange(
        data.map((c) =>
          c.id === id
            ? {
                ...c,
                uploadedFile: null,
                uploadedFileName: "",
                certificateUrl: "",
                uploadedFileType: "",
                cloudDeleteToken: undefined,
              }
            : c
        )
      );
    })();
  };

  // Handler for saving individual Certificate card (PUT/POST call)
  const handleSaveCertificate = async (certificate: Certificate) => {
    const isNew = !certificate.certificate_id;

    // Check local validation errors
    if (
      errors[`cert-${certificate.id}-certificateTitle`] ||
      errors[`cert-${certificate.id}-file`] ||
      errors[`cert-${certificate.id}-date`]
    )
      return;

    // Check if there are actually changes to save
    if (!getCertificateChangedStatus(certificate) && !isNew) {
      setCertFeedback((prev) => ({
        ...prev,
        [certificate.id]: "No changes to save.",
      }));
      setTimeout(
        () =>
          setCertFeedback((prev) => {
            const updated = { ...prev };
            delete updated[certificate.id];
            return updated;
          }),
        3000
      );
      return;
    }

    // Skip saving empty new cards
    if (!certificate.certificateTitle && isNew) {
      setCertFeedback((prev) => ({
        ...prev,
        [certificate.id]: "Certificate Title is required to save.",
      }));
      setTimeout(
        () =>
          setCertFeedback((prev) => {
            const updated = { ...prev };
            delete updated[certificate.id];
            return updated;
          }),
        3000
      );
      return;
    }

    try {
      // Construct FormData
      const formData = new FormData();
      formData.append("certificate_type", certificate.certificateType || "");
      formData.append("certificate_title", certificate.certificateTitle || "");
      formData.append("domain", certificate.domain || "");
      formData.append("certificate_provided_by", certificate.providedBy || "");
      formData.append("date", certificate.date || "");
      formData.append("description", certificate.description || "");

      // Handle file upload
      if (certificate.uploadedFile) {
        formData.append("file", certificate.uploadedFile);
      } else if (certificate.certificateUrl) {
        formData.append("file_url", certificate.certificateUrl);
      }

      let response: any;

      if (isNew) {
        // POST for new certificate
        response = await saveCertificateDetails(userId, token, formData);

        const finalCertData = Array.isArray(response) ? response[0] : response;
        const newCertificateId = finalCertData?.certificate_id;

        if (newCertificateId) {
          const updatedCertificate: Certificate = {
            ...certificate,
            certificate_id: newCertificateId,
            uploadedFile: null,
            certificateUrl:
              finalCertData.file_url || certificate.certificateUrl,
            uploadedFileName: finalCertData.file_url
              ? finalCertData.file_url.split("/").pop()
              : certificate.uploadedFileName,
          };

          // Update local state and refs
          const updatedCertificates = data.map((c) =>
            c.id === certificate.id ? updatedCertificate : c
          );
          onChange(updatedCertificates);
          initialCertificatesRef.current[certificate.id] = updatedCertificate;

          setCertFeedback((prev) => ({
            ...prev,
            [certificate.id]: "Saved successfully!",
          }));
        } else {
          console.warn(
            "POST successful but failed to retrieve new certificate_id."
          );
          setCertFeedback((prev) => ({
            ...prev,
            [certificate.id]:
              "Saved successfully, but ID retrieval failed (relying on next step sync).",
          }));
        }
      } else {
        // PUT for existing certificate
        const initial = initialCertificatesRef.current[certificate.id];

        // Build minimal FormData with only changed fields
        const minimalFormData = new FormData();
        let hasChanges = false;

        if (certificate.certificateType !== (initial?.certificateType || "")) {
          minimalFormData.append(
            "certificate_type",
            certificate.certificateType
          );
          hasChanges = true;
        }
        if (
          certificate.certificateTitle !== (initial?.certificateTitle || "")
        ) {
          minimalFormData.append(
            "certificate_title",
            certificate.certificateTitle
          );
          hasChanges = true;
        }
        if (certificate.domain !== (initial?.domain || "")) {
          minimalFormData.append("domain", certificate.domain);
          hasChanges = true;
        }
        if (certificate.providedBy !== (initial?.providedBy || "")) {
          minimalFormData.append(
            "certificate_provided_by",
            certificate.providedBy
          );
          hasChanges = true;
        }
        if (certificate.date !== (initial?.date || "")) {
          minimalFormData.append("date", certificate.date);
          hasChanges = true;
        }
        if (certificate.description !== (initial?.description || "")) {
          minimalFormData.append("description", certificate.description);
          hasChanges = true;
        }

        // Handle file changes
        if (
          certificate.uploadedFile &&
          certificate.uploadedFile !== initial?.uploadedFile
        ) {
          minimalFormData.append("file", certificate.uploadedFile);
          hasChanges = true;
        } else if (
          certificate.certificateUrl !== (initial?.certificateUrl || "")
        ) {
          minimalFormData.append("file_url", certificate.certificateUrl || "");
          hasChanges = true;
        }

        if (hasChanges) {
          response = await updateCertificateDetails(
            userId,
            token,
            certificate.certificate_id!,
            minimalFormData
          );

          const finalCertData = Array.isArray(response)
            ? response[0]
            : response;
          const updatedCertificate: Certificate = {
            ...certificate,
            uploadedFile: null,
            certificateUrl:
              finalCertData?.file_url || certificate.certificateUrl,
            uploadedFileName: finalCertData?.file_url
              ? finalCertData.file_url.split("/").pop()
              : certificate.uploadedFileName,
          };

          // Update local state and refs
          const updatedCertificates = data.map((c) =>
            c.id === certificate.id ? updatedCertificate : c
          );
          onChange(updatedCertificates);
          initialCertificatesRef.current[certificate.id] = updatedCertificate;

          setCertFeedback((prev) => ({
            ...prev,
            [certificate.id]: "Updated successfully!",
          }));
        }
      }

      // Clear general feedback after 3 seconds and hide save button
      setHiddenSaveIds(prev => new Set([...prev, certificate.id]));
      setTimeout(() => {
        setCertFeedback((prev) => {
          const updated = { ...prev };
          delete updated[certificate.id];
          return updated;
        });
        setHiddenSaveIds(prev => {
          const updated = new Set(prev);
          updated.delete(certificate.id);
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error("Error saving certificate:", error);
      const feedback = isNew ? "Failed to save." : "Failed to update.";
      setCertFeedback((prev) => ({
        ...prev,
        [certificate.id]: feedback,
      }));
      setTimeout(
        () =>
          setCertFeedback((prev) => {
            const updated = { ...prev };
            delete updated[certificate.id];
            return updated;
          }),
        3000
      );
    }
  };

  // Handler for clearing individual card data (reverting to initial values)
  const resetCertificate = (id: string) => {
    const initial = initialCertificatesRef.current[id];
    if (!initial) return;

    const updatedCertificates = data.map((cert) =>
      cert.id === id
        ? {
            ...cert,
            certificateType: initial.certificateType || "",
            certificateTitle: initial.certificateTitle || "",
            domain: initial.domain || "",
            providedBy: initial.providedBy || "",
            date: initial.date || "",
            description: initial.description || "",
            uploadedFile: null,
            uploadedFileName:
              initial.uploadedFileName ||
              (initial.certificateUrl
                ? initial.certificateUrl.split("/").pop()
                : ""),
            certificateUrl: initial.certificateUrl || "",
          }
        : cert
    );

    onChange(updatedCertificates);

    // Clear errors for this certificate
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`cert-${id}-certificateTitle`];
      delete newErrors[`cert-${id}-domain`];
      delete newErrors[`cert-${id}-providedBy`];
      delete newErrors[`cert-${id}-file`];
      delete newErrors[`cert-${id}-date`];
      return newErrors;
    });
    setCertFeedback((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const addCertificate = () => {
    const newCert: Certificate = {
      id: Date.now().toString(),
      certificateType: "",
      certificateTitle: "",
      domain: "",
      providedBy: "",
      date: "",
      description: "",
      certificateUrl: "",
      enabled: true,
    };
    onChange([...data, newCert]);
  };

  const removeCertificate = async (id: string) => {
    if (data.length <= 1) return;

    const certificate = data.find((c) => c.id === id);
    if (!certificate) return;

    // If there is a Cloudinary asset associated, try deleting it first from Cloudinary
    if (certificate.cloudDeleteToken) {
      try {
        await deleteFromCloudinary(certificate.cloudDeleteToken as string);
      } catch (err) {
        // Log and continue - backend may also clean up or token may be stale
        console.warn("Cloudinary delete on removeCertificate failed:", err);
      }
    }

    if (certificate.certificate_id) {
      try {
        await deleteCertificate(userId, token, certificate.certificate_id);
        setCertFeedback((prev) => ({
          ...prev,
          [certificate.id]: "Deleted successfully!",
        }));
        setTimeout(
          () =>
            setCertFeedback((prev) => {
              const updated = { ...prev };
              delete updated[certificate.id];
              return updated;
            }),
          3000
        );
      } catch (error) {
        console.error("Error deleting certificate:", error);
        setCertFeedback((prev) => ({
          ...prev,
          [certificate.id]: "Failed to delete.",
        }));
        setTimeout(
          () =>
            setCertFeedback((prev) => {
              const updated = { ...prev };
              delete updated[certificate.id];
              return updated;
            }),
          3000
        );
        return; // Stop removal if API call fails
      }
    }

    onChange(data.filter((cert) => cert.id !== id));
    delete initialCertificatesRef.current[id];

    setCollapsedStates((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`cert-${id}-certificateTitle`];
      delete newErrors[`cert-${id}-domain`];
      delete newErrors[`cert-${id}-providedBy`];
      delete newErrors[`cert-${id}-file`];
      return newErrors;
    });
  };

  const toggleCertificate = (id: string, enabled: boolean) => {
    onChange(
      data.map((cert) => (cert.id === id ? { ...cert, enabled } : cert))
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {data.map((cert, index) => {
        const changed = getCertificateChangedStatus(cert);
        const feedback = certFeedback[cert.id];

        return (
          <FormSection
            key={cert.id}
            title={`Certificate ${data.length > 1 ? index + 1 : ""}`}
            showToggle={true}
            enabled={cert.enabled}
            onToggle={(enabled) => toggleCertificate(cert.id, enabled)}
            onRemove={
              data.length > 1 ? () => removeCertificate(cert.id) : undefined
            }
            showActions={true}
            isCollapsed={collapsedStates[cert.id] !== undefined ? collapsedStates[cert.id] : true}
            onCollapseToggle={() => toggleCollapse(cert.id)}
          >
            <FormInput
              label="Certificate Title"
              placeholder="Enter Certificate Title"
              value={cert.certificateTitle}
              onChange={(v) =>
                updateCertificate(cert.id, "certificateTitle", v)
              }
              error={errors[`cert-${cert.id}-certificateTitle`]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* <FormSelect
                label="Certificate Type"
                placeholder="Select Certificate Type"
                value={cert.certificateType}
                onChange={(v) =>
                  updateCertificate(cert.id, "certificateType", v)
                }
                options={certificateTypes}
              /> */}
              <FormInput
                label="Date"
                placeholder="Select Date"
                value={cert.date}
                onChange={(v) => updateCertificate(cert.id, "date", v)}
                type="month"
                max={new Date().toISOString().slice(0, 7)}
                error={errors[`cert-${cert.id}-date`]}
              />
            </div>

            {/* <div className="mt-4">
              <FormInput
                label="Domain"
                placeholder="Enter Domain"
                value={cert.domain}
                onChange={(v) => updateCertificate(cert.id, "domain", v)}
                error={errors[`cert-${cert.id}-domain`]}
              />
            </div> */}

            <div className="mt-4">
              <FormInput
                label="Certificate Provided By"
                placeholder="Certificate Provided By"
                value={cert.providedBy}
                onChange={(v) => updateCertificate(cert.id, "providedBy", v)}
                error={errors[`cert-${cert.id}-providedBy`]}
              />
            </div>

            <div className="mt-4">
              <div className="flex flex-col gap-1">
                <label className="font-medium">Description</label>
                <RichTextEditor
                  placeholder="Provide Description..."
                  value={cert.description}
                  onChange={(v) => updateCertificate(cert.id, "description", v)}
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-4 hidden">
              <label className="text-xs text-gray-600 font-medium mb-2 block">
                Upload Certificate Image
              </label>

              {!cert.certificateUrl && !cert.uploadedFileName ? (
                <>
                  <div
                    onDrop={(e) => handleFileDrop(cert.id, e)}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() =>
                      document.getElementById(`file-input-${cert.id}`)?.click()
                    }
                    className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-orange-300 transition-colors cursor-pointer ${
                      errors[`cert-${cert.id}-file`]
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Drag and drop or upload certificate.. (pdf, jpg, jpeg
                        format only)
                      </p>
                    </div>
                    <input
                      id={`file-input-${cert.id}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(cert.id, e)}
                      className="hidden"
                      ref={(el) => {
                        fileInputRefs.current[cert.id] = el;
                      }}
                    />
                  </div>
                  {errors[`cert-${cert.id}-file`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[`cert-${cert.id}-file`]}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Upload className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-700 truncate">
                      {cert.certificateUrl ? (
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-xs text-gray-700 truncate"
                        >
                          {cert.uploadedFileName || cert.certificateUrl.split("/").pop()}
                        </a>
                      ) : (
                        cert.uploadedFileName
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => clearFile(cert.id)}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-600 cursor-pointer" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
              {feedback && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    feedback.includes("successfully")
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {feedback}
                </span>
              )}
              {changed && !hiddenSaveIds.has(cert.id) && (
                <button
                  type="button"
                  onClick={() => handleSaveCertificate(cert)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                  title={
                    cert.certificate_id
                      ? "Update changes"
                      : "Save new certificate"
                  }
                >
                  <Save className="w-4 h-4" strokeWidth={2} />
                  Save
                </button>
              )}
            </div>
          </FormSection>
        );
      })}

      <div className="bg-white border border-gray-200 rounded-xl">
        <AddButton onClick={addCertificate} label="Add Certificate" />
      </div>
    </div>
  );
};

export default CertificationsForm;
