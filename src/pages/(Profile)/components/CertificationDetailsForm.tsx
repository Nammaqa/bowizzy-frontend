import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  X,
  Save,
  Upload,
} from "lucide-react";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { deleteFromCloudinary } from "@/utils/deleteFromCloudinary";
import RichTextEditor from "@/pages/(ResumeBuilder)/components/ui/RichTextEditor";

import {
  updateCertificateDetails,
  saveCertificateDetails,
  deleteCertificate,
} from "@/services/certificateService";

interface CertificateFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
  userId: string;
  token: string;
}

interface Certificate {
  id: string;
  certificateType: string;
  certificateTitle: string;
  certificateProvidedBy: string;
  date: string;
  description: string;
  uploadedFile: File | null;
  uploadedFileName: string;
  isExpanded: boolean;
  uploadedFileUrl?: string;
  uploadedFileType?: string;
  certificate_id?: number;
  cloudDeleteToken?: string;
}

// Normalize any value to a comparable string, treating null/undefined/"" as identical
const norm = (v: any): string => (v == null ? "" : String(v));
const CERTIFICATE_PROVIDER_MAX_LENGTH = 50;
const CERTIFICATE_DESCRIPTION_MAX_LENGTH = 500;
const MIN_CERTIFICATE_YEAR = 1960;

export default function CertificationDetailsForm({
  onNext,
  onBack,
  initialData = {},
  userId,
  token,
}: CertificateFormProps) {
  const initialCertificates: Certificate[] =
    initialData.certificates && initialData.certificates.length > 0
      ? initialData.certificates.map((c: any) => ({
          ...c,
          id: c.id || c.certificate_id?.toString() || Date.now().toString(),
          // Normalize all fields so the ref and state start identical
          certificateType: c.certificateType || "",
          certificateTitle: c.certificateTitle || "",
          certificateProvidedBy: c.certificateProvidedBy || "",
          date: c.date || "",
          description: c.description || "",
          uploadedFile: null,
          uploadedFileName: c.uploadedFileName || "",
          uploadedFileUrl: c.uploadedFileUrl || "",
          uploadedFileType: c.uploadedFileType || "",
        }))
      : [
          {
            id: "1",
            certificateType: "",
            certificateTitle: "",
            certificateProvidedBy: "",
            date: "",
            description: "",
            uploadedFile: null,
            uploadedFileName: "",
            uploadedFileUrl: "",
            uploadedFileType: "",
            isExpanded: true,
          },
        ];

  const [certificates, setCertificates] =
    useState<Certificate[]>(initialCertificates);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState("");

  const [certChanges, setCertChanges] = useState<Record<string, string[]>>({});
  const [certFeedback, setCertFeedback] = useState<Record<string, string>>({});
  const initialCertsRef = useRef<Record<string, Certificate>>({});
  const deletedCertificateIds = useRef<number[]>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Initialize refs on mount with normalized copies of initial state
  useEffect(() => {
    initialCertificates.forEach((c) => {
      initialCertsRef.current[c.id] = { ...c };
    });
  }, []);

  // Change detection — uses norm() so "" vs undefined vs null never triggers a false positive
  useEffect(() => {
    const changes: Record<string, string[]> = {};

    certificates.forEach((current) => {
      const initial = initialCertsRef.current[current.id];

      // Brand-new card not yet in ref → skip (no changes to detect)
      if (!initial) return;

      const changedFields: string[] = [];

      if (norm(current.certificateType) !== norm(initial.certificateType))
        changedFields.push("certificateType");
      if (norm(current.certificateTitle) !== norm(initial.certificateTitle))
        changedFields.push("certificateTitle");
      if (norm(current.certificateProvidedBy) !== norm(initial.certificateProvidedBy))
        changedFields.push("certificateProvidedBy");
      if (norm(current.date) !== norm(initial.date))
        changedFields.push("date");
      if (norm(current.description) !== norm(initial.description))
        changedFields.push("description");

      // Only flag a file change if the user actually picked a new File object
      if (current.uploadedFile !== null && current.uploadedFile !== initial.uploadedFile)
        changedFields.push("fileUpload");
      // Flag URL change only when it meaningfully differs (e.g. file was cleared)
      else if (norm(current.uploadedFileUrl) !== norm(initial.uploadedFileUrl))
        changedFields.push("uploadedFileUrl");

      if (changedFields.length > 0) {
        changes[current.id] = changedFields;
      }
    });

    setCertChanges(changes);
  }, [certificates]);

  const validateCertificateTitle = (value: string) => {
    if (!value) return "";
    if (!/[a-zA-Z]/.test(value)) {
      return "Certificate title must contain at least one letter";
    }
    if (!/^[a-zA-Z0-9\s.,-:()&]+$/.test(value)) {
      return "Invalid characters in certificate title";
    }
    return "";
  };

  const validateProvider = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return "";
    if (trimmedValue.length > CERTIFICATE_PROVIDER_MAX_LENGTH) {
      return `Certificate provided by cannot exceed ${CERTIFICATE_PROVIDER_MAX_LENGTH} characters`;
    }
    if (!/^[a-zA-Z\s.,&'\-]+$/.test(trimmedValue)) {
      return "Invalid characters in provider name (no numbers allowed)";
    }
    return "";
  };

  const getPlainTextFromHtml = (value: string) =>
    value.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();

  const validateDescription = (value: string) => {
    const text = getPlainTextFromHtml(value);
    if (text.length > CERTIFICATE_DESCRIPTION_MAX_LENGTH) {
      return `Description cannot exceed ${CERTIFICATE_DESCRIPTION_MAX_LENGTH} characters`;
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

  const getTodayDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getMaxCertificateDate = (): string => {
    return getTodayDate();
  };

  const blockManualDateTyping = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "Tab",
      "Shift",
      "Escape",
      "Enter",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "PageUp",
      "PageDown",
    ];
    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const validateDateValue = (value: string) => {
    if (!value || value === "") return "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Please select a valid date";
    const [y, m, d] = value.split("-");
    if (y.length !== 4) return "Year must be 4 digits";
    const yearNum = parseInt(y, 10);
    const monthNum = parseInt(m, 10);
    const dayNum = parseInt(d, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return "Invalid month";
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return "Invalid day";
    if (yearNum <= MIN_CERTIFICATE_YEAR || yearNum >= new Date().getFullYear()) {
      return `Year must be greater than ${MIN_CERTIFICATE_YEAR} and less than the current year`;
    }
    if (value > getTodayDate()) return "Cannot select a future date";
    return "";
  };

  const handleCertificateChange = (
    index: number,
    field: string,
    value: string | boolean | File | null
  ) => {
    const updated = [...certificates];
    updated[index] = { ...updated[index], [field]: value };
    setCertificates(updated);

    if (field === "certificateTitle" && typeof value === "string") {
      const error = validateCertificateTitle(value);
      setErrors((prev) => ({ ...prev, [`cert-${index}-certificateTitle`]: error }));
    } else if (field === "date" && typeof value === "string") {
      const error = validateDateValue(value);
      setErrors((prev) => ({ ...prev, [`cert-${index}-date`]: error }));
    } else if (field === "certificateProvidedBy" && typeof value === "string") {
      const error = validateProvider(value);
      setErrors((prev) => ({ ...prev, [`cert-${index}-certificateProvidedBy`]: error }));
    } else if (field === "description" && typeof value === "string") {
      const error = validateDescription(value);
      setErrors((prev) => ({ ...prev, [`cert-${index}-description`]: error }));
    }
  };

  const toggleExpand = (index: number) => {
    const updated = [...certificates];
    updated[index] = { ...updated[index], isExpanded: !updated[index].isExpanded };
    setCertificates(updated);
  };

  const resetCertificate = (index: number) => {
    const initial = initialCertsRef.current[certificates[index].id];
    const updated = [...certificates];

    updated[index] = {
      ...updated[index],
      certificateType: initial?.certificateType || "",
      certificateTitle: initial?.certificateTitle || "",
      certificateProvidedBy: initial?.certificateProvidedBy || "",
      date: initial?.date || "",
      description: initial?.description || "",
      uploadedFile: null,
      uploadedFileName:
        initial?.uploadedFileName ||
        (initial?.uploadedFileUrl ? initial.uploadedFileUrl.split("/").pop() : ""),
      uploadedFileUrl: initial?.uploadedFileUrl || "",
      uploadedFileType: initial?.uploadedFileType || "",
    };
    setCertificates(updated);

    setCertChanges((prev) => {
      const newChanges = { ...prev };
      delete newChanges[updated[index].id];
      return newChanges;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`cert-${index}-certificateTitle`];
      delete newErrors[`cert-${index}-file`];
      delete newErrors[`cert-${index}-date`];
      return newErrors;
    });
    setCertFeedback((prev) => {
      const newFeedback = { ...prev };
      delete newFeedback[updated[index].id];
      return newFeedback;
    });
  };

  const addCertificate = () => {
    const newId = Date.now().toString();
    const newCert: Certificate = {
      id: newId,
      certificateType: "",
      certificateTitle: "",
      certificateProvidedBy: "",
      date: "",
      description: "",
      uploadedFile: null,
      uploadedFileName: "",
      uploadedFileUrl: "",
      uploadedFileType: "",
      isExpanded: true,
    };
    setCertificates([...certificates, newCert]);
    // Register in ref immediately so change detection skips it until user edits
    initialCertsRef.current[newId] = { ...newCert };
  };

  const removeCertificate = async (index: number) => {
    const cert = certificates[index];

    if (certificates.length === 1) return;

    if (cert.certificate_id) {
      try {
        await deleteCertificate(userId, token, cert.certificate_id);
        deletedCertificateIds.current.push(cert.certificate_id);
        setCertFeedback((prev) => ({ ...prev, [cert.id]: "Deleted successfully!" }));
      } catch (error) {
        setCertFeedback((prev) => ({ ...prev, [cert.id]: "Failed to delete." }));
        setTimeout(
          () =>
            setCertFeedback((prev) => {
              const updated = { ...prev };
              delete updated[cert.id];
              return updated;
            }),
          3000
        );
        return;
      }
    }

    const id = cert.id;
    setCertificates(certificates.filter((_, i) => i !== index));
    delete initialCertsRef.current[id];
    setCertChanges((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleFileUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors((prev) => ({ ...prev, [`cert-${index}-file`]: error }));
      return;
    }

    const existingCert = certificates[index];

    if (existingCert.cloudDeleteToken) {
      await deleteFromCloudinary(existingCert.cloudDeleteToken);
    }

    const uploadRes = await uploadToCloudinary(file);

    if (!uploadRes?.url) {
      setErrors((prev) => ({ ...prev, [`cert-${index}-file`]: "Upload failed" }));
      return;
    }

    const updated = [...certificates];
    updated[index] = {
      ...updated[index],
      uploadedFile: null,
      uploadedFileName: file.name,
      uploadedFileUrl: uploadRes.url,
      uploadedFileType: file.type,
      cloudDeleteToken: uploadRes.deleteToken,
    };
    setCertificates(updated);

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`cert-${index}-file`];
      return newErrors;
    });
  };

  const handleFileDrop = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors((prev) => ({ ...prev, [`cert-${index}-file`]: error }));
      return;
    }

    const updated = [...certificates];
    updated[index] = {
      ...updated[index],
      uploadedFile: file,
      uploadedFileName: file.name,
      uploadedFileType: file.type,
    };
    setCertificates(updated);

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`cert-${index}-file`];
      return newErrors;
    });
  };

  const clearFile = async (index: number) => {
    const updated = [...certificates];
    updated[index] = {
      ...updated[index],
      uploadedFile: null,
      uploadedFileName: "",
      uploadedFileUrl: "",
      uploadedFileType: "",
    };
    setCertificates(updated);

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`cert-${index}-file`];
      return newErrors;
    });
  };

  const handleSaveCertificate = async (cert: Certificate, index: number) => {
    const isNew = !cert.certificate_id;
    const certId = cert.id;
    const changes = certChanges[certId];

    const providerError = validateProvider(cert.certificateProvidedBy || "");
    const dateError = validateDateValue(cert.date || "");
    const descriptionError = validateDescription(cert.description || "");

    if (providerError) {
      setErrors((prev) => ({ ...prev, [`cert-${index}-certificateProvidedBy`]: providerError }));
    }
    if (dateError) {
      setErrors((prev) => ({ ...prev, [`cert-${index}-date`]: dateError }));
    }
    if (descriptionError) {
      setErrors((prev) => ({ ...prev, [`cert-${index}-description`]: descriptionError }));
    }

    const updatedLocalErrors = [
      errors[`cert-${index}-certificateTitle`],
      errors[`cert-${index}-file`],
      providerError,
      dateError,
      descriptionError,
    ].filter(Boolean);

    if (updatedLocalErrors.length > 0) return;

    if (!changes || changes.length === 0) {
      setCertFeedback((prev) => ({ ...prev, [certId]: "No changes to save." }));
      setTimeout(
        () =>
          setCertFeedback((prev) => {
            const updated = { ...prev };
            delete updated[certId];
            return updated;
          }),
        3000
      );
      return;
    }

    let formDataToSend = new FormData();
    formDataToSend.append("certificate_type", cert.certificateType || "");
    formDataToSend.append("certificate_title", cert.certificateTitle || "");
    formDataToSend.append("certificate_provided_by", cert.certificateProvidedBy || "");
    formDataToSend.append("date", cert.date || "");
    formDataToSend.append("description", cert.description || "");

    if (cert.uploadedFile && changes.includes("fileUpload")) {
      try {
        formDataToSend.append("file", cert.uploadedFile);
      } catch (error) {
        setCertFeedback((prev) => ({ ...prev, [certId]: "File processing failed." }));
        setTimeout(
          () =>
            setCertFeedback((prev) => {
              const updated = { ...prev };
              delete updated[certId];
              return updated;
            }),
          3000
        );
        return;
      }
    }

    if (changes.includes("uploadedFileUrl") || (cert.uploadedFileUrl && !cert.uploadedFile)) {
      formDataToSend.append("file_url", cert.uploadedFileUrl || "");
    }

    try {
      let response;
      if (isNew) {
        response = await saveCertificateDetails(userId, token, formDataToSend);
      } else {
        response = await updateCertificateDetails(userId, token, cert.certificate_id!, formDataToSend);
      }

      const finalCertData = Array.isArray(response) ? response[0] : response;
      let updatedCert: Certificate;

      if (finalCertData.certificate_id) {
        updatedCert = {
          ...cert,
          certificate_id: finalCertData.certificate_id,
          uploadedFile: null,
          uploadedFileUrl: finalCertData.file_url || cert.uploadedFileUrl,
          uploadedFileType: finalCertData.file_type || cert.uploadedFileType,
          uploadedFileName: finalCertData.file_url
            ? finalCertData.file_url.split("/").pop()
            : cert.uploadedFileName,
        };
        setCertFeedback((prev) => ({
          ...prev,
          [certId]: isNew ? "Saved successfully!" : "Updated successfully!",
        }));
      }

      if (updatedCert) {
        setCertificates((prev) => {
          const updated = prev.map((c) => (c.id === cert.id ? updatedCert : c));
          initialCertsRef.current[cert.id] = { ...updatedCert };
          return updated;
        });
      }

      setCertChanges((prev) => {
        const updated = { ...prev };
        delete updated[certId];
        return updated;
      });
      setTimeout(
        () =>
          setCertFeedback((prev) => {
            const updated = { ...prev };
            delete updated[certId];
            return updated;
          }),
        3000
      );
    } catch (error) {
      console.error("Error saving certificate:", error);
      const feedback = isNew ? "Failed to save." : "Failed to update.";
      setCertFeedback((prev) => ({ ...prev, [certId]: feedback }));
      setTimeout(
        () =>
          setCertFeedback((prev) => {
            const updated = { ...prev };
            delete updated[certId];
            return updated;
          }),
        3000
      );
    }
  };

  const hasUnsavedChanges = Object.keys(certChanges).length > 0;

  // Certificates are fully optional — always allow proceeding
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasUnsavedChanges) {
      let message = "Please save your changes before proceeding:\n\n";
      certificates.forEach((cert, index) => {
        if (certChanges[cert.id]) {
          message += `• Certificate ${index + 1} (unsaved changes)\n`;
        }
      });
      setSubmitError(message);
      return;
    }

    // Filter out completely empty certificates — optional, so empty ones are simply dropped
    const validCertificates = certificates.filter(
      (c) => c.certificateTitle || c.certificate_id
    );

    onNext({
      certificates: validCertificates,
      deletedCertificateIds: deletedCertificateIds.current,
    });
  };

  const renderCertificateCard = (certificate: Certificate, index: number) => {
    const changed = certChanges[certificate.id]?.length > 0;
    const feedback = certFeedback[certificate.id];

    return (
      <div
        key={certificate.id}
        className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
            Certificate - {index + 1}
          </h3>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => toggleExpand(index)}
              className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronDown
                className={`w-3 h-3 text-gray-600 cursor-pointer transition-transform ${
                  !certificate.isExpanded ? "rotate-180" : ""
                }`}
                strokeWidth={2.5}
              />
            </button>
            {certificates.length > 1 && (
              <button
                type="button"
                onClick={() => removeCertificate(index)}
                className="w-5 h-5 flex items-center justify-center rounded border-2 border-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-red-500 cursor-pointer" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {certificate.isExpanded && (
          <div className="p-4 sm:p-5 md:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Certificate Type and Certificate Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Certificate Type */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Certificate Type
                  </label>
                  <div className="relative">
                    <select
                      value={certificate.certificateType}
                      onChange={(e) =>
                        handleCertificateChange(index, "certificateType", e.target.value)
                      }
                      className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-xs sm:text-sm appearance-none bg-white pr-8"
                    >
                      <option value="">Select Certificate Type</option>
                      <option value="Course Completion">Course Completion</option>
                      <option value="Professional Certification">Professional Certification</option>
                      <option value="Achievement">Achievement</option>
                      <option value="Training">Training</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Certificate Title */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Certificate Title
                  </label>
                  <input
                    type="text"
                    value={certificate.certificateTitle}
                    onChange={(e) =>
                      handleCertificateChange(index, "certificateTitle", e.target.value)
                    }
                    placeholder="Enter Certificate Title"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${
                      errors[`cert-${index}-certificateTitle`]
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                    }`}
                  />
                  {errors[`cert-${index}-certificateTitle`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[`cert-${index}-certificateTitle`]}
                    </p>
                  )}
                </div>
              </div>

              {/* Certificate Provided By, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                {/* Certificate Provided By */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Certificate Provided By
                  </label>
                  <input
                    type="text"
                    value={certificate.certificateProvidedBy}
                    onChange={(e) =>
                      handleCertificateChange(index, "certificateProvidedBy", e.target.value)
                    }
                    maxLength={CERTIFICATE_PROVIDER_MAX_LENGTH}
                    placeholder="Certificate Provided By"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${
                      errors[`cert-${index}-certificateProvidedBy`]
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                    }`}
                  />
                  {errors[`cert-${index}-certificateProvidedBy`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[`cert-${index}-certificateProvidedBy`]}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Date (Month & Year)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={certificate.date}
                      onChange={(e) =>
                        handleCertificateChange(index, "date", e.target.value)
                      }
                      placeholder="Select Month and Year"
                      onKeyDown={blockManualDateTyping}
                      onPaste={(e) => e.preventDefault()}
                      className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-xs sm:text-sm pr-8"
                      min="1960-01-01"
                      max={getMaxCertificateDate()}
                    />
                  </div>
                  {errors[`cert-${index}-date`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[`cert-${index}-date`]}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    {getPlainTextFromHtml(certificate.description).length}/{CERTIFICATE_DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>
                <RichTextEditor
                  value={certificate.description}
                  onChange={(value) =>
                    handleCertificateChange(index, "description", value)
                  }
                  placeholder="Provide Description..."
                  rows={5}
                />
                {errors[`cert-${index}-description`] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[`cert-${index}-description`]}
                  </p>
                )}
              </div>

              {/* Upload Certificate */}
              <div className="hidden">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Upload Certificate
                </label>

                {!certificate.uploadedFileName ? (
                  <>
                    <input
                      id={`file-input-${index}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(index, e)}
                      className="hidden"
                      ref={(el) => {
                        fileInputRefs.current[certificate.id] = el;
                      }}
                    />
                    <div
                      onDrop={(e) => handleFileDrop(index, e)}
                      onDragOver={(e) => e.preventDefault()}
                      className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center hover:border-orange-400 transition-colors cursor-pointer ${
                        errors[`cert-${index}-file`] ? "border-red-500" : "border-gray-300"
                      }`}
                      onClick={() => fileInputRefs.current[certificate.id]?.click()}
                    >
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2 cursor-pointer" />
                      <p className="text-xs sm:text-sm text-gray-600">
                        Drag and drop or upload certificate... (pdf, jpg, jpeg format only)
                      </p>
                    </div>
                    {errors[`cert-${index}-file`] && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors[`cert-${index}-file`]}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Upload className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 truncate">
                        {certificate.uploadedFileName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearFile(index)}
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
                    onClick={() => handleSaveCertificate(certificate, index)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                    aria-label="Save certificate changes"
                  >
                    <Save className="w-4 h-4" strokeWidth={2} />
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    setTimeout(() => {
      let scrolled = false;
      let el = document.getElementById("certification-details-form-root");
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
    <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <form id="certification-details-form-root" onSubmit={handleSubmit}>
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
              Step 6: Certificates
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Provide certificate details (if any) related to your job role.
            </p>
          </div>

          {/* Certificate Cards */}
          {certificates.map((certificate, index) =>
            renderCertificateCard(certificate, index)
          )}

          {/* Add Certificate Button */}
          <button
            type="button"
            onClick={addCertificate}
            className="flex items-center gap-2 px-4 py-2.5 text-orange-400 hover:text-orange-500 font-medium text-sm transition-colors mb-4 md:mb-5 cursor-pointer"
          >
            <Plus className="w-4 h-4 cursor-pointer" />
            Add Certificate
          </button>

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
              style={{
                background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)",
              }}
              className="px-6 sm:px-8 py-2.5 sm:py-3 text-white rounded-xl font-medium text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}