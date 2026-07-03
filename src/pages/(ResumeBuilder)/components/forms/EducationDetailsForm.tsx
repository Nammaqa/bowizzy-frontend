import React, { useState, useEffect, useRef, useCallback } from "react";
import type {
  EducationDetails,
  HigherEducation as HET,
} from "src/types/resume";
import {
  FormInput,
  FormSelect,
  FormSection,
  AddButton,
} from "@/pages/(ResumeBuilder)/components/ui";
import { Save, ChevronDown, Trash2 } from "lucide-react";
import {
  updateEducationDetails,
  saveEducationDetails,
  deleteEducation,
} from "@/services/educationService";

interface HigherEducation extends HET {
  education_id?: number | null;
}

interface EducationDetailsFormProps {
  data: EducationDetails;
  onChange: (data: EducationDetails) => void;
  userId: string;
  token: string;
  educationDataIdMap: Record<string, number>;
  setEducationDataIdMap: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  deleteEducationIds: number[];
  setDeleteEducationIds: React.Dispatch<React.SetStateAction<number[]>>;
}

const boardTypes = [
  { value: "CBSE", label: "CBSE" },
  { value: "ICSE", label: "ICSE" },
  { value: "State Board", label: "State Board" },
  { value: "IB", label: "International Baccalaureate" },
];

const subjectStreams = [
  { value: "Science", label: "Science" },
  { value: "Commerce", label: "Commerce" },
  { value: "Arts", label: "Arts" },
  { value: "Vocational", label: "Vocational" },
];

const resultFormats = [
  { value: "Percentage", label: "Percentage" },
  { value: "Cgpa", label: "Cgpa" },
  { value: "GPA", label: "GPA" },
  { value: "Grade", label: "Grade" },
];

const degrees = [
  { value: "B.Tech", label: "B.Tech" },
  { value: "B.E", label: "B.E" },
  { value: "B.Sc", label: "B.Sc" },
  { value: "B.A", label: "B.A" },
  { value: "B.Com", label: "B.Com" },
  { value: "BBA", label: "BBA" },
  { value: "BCA", label: "BCA" },
  { value: "B.Arch", label: "B.Arch" },
  { value: "B.Des", label: "B.Des" },
  { value: "B.Pharm", label: "B.Pharm" },
  { value: "B.Ed", label: "B.Ed" },
  { value: "MBBS", label: "MBBS" },
  { value: "BDS", label: "BDS" },
  { value: "LLB", label: "LLB" },
  { value: "BHM", label: "BHM" },
  { value: "M.Tech", label: "M.Tech" },
  { value: "M.Sc", label: "M.Sc" },
  { value: "M.A", label: "M.A" },
  { value: "M.Com", label: "M.Com" },
  { value: "MCA", label: "MCA" },
  { value: "MBA", label: "MBA" },
  { value: "M.Arch", label: "M.Arch" },
  { value: "M.Des", label: "M.Des" },
  { value: "M.Pharm", label: "M.Pharm" },
  { value: "M.Ed", label: "M.Ed" },
  { value: "LLM", label: "LLM" },
  { value: "Diploma", label: "Diploma" },
  { value: "PG Diploma", label: "PG Diploma" },
  { value: "PhD", label: "PhD" },
];

export const branchesByDegree: Record<string, string[]> = {
  Diploma: [
    "Mechanical",
    "Civil",
    "Electrical",
    "Electronics",
    "Computer",
    "IT",
    "Automobile",
  ],
  "B.Tech": [
    "Computer Science",
    "Information Technology",
    "AI & Data Science",
    "Electronics & Communication",
    "Electrical",
    "Mechanical",
    "Civil",
    "Cyber Security",
  ],
  "B.E": [
    "Computer Science",
    "Information Technology",
    "Electronics & Communication",
    "Electrical",
    "Mechanical",
    "Civil",
  ],
  "B.Sc": [
    "Computer Science",
    "IT",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Statistics",
    "Biotechnology",
  ],
  "B.A": [
    "English",
    "History",
    "Economics",
    "Political Science",
    "Psychology",
    "Sociology",
  ],
  "B.Com": ["General", "Accounting", "Finance", "Banking", "Taxation"],
  "M.Tech": [
    "CSE",
    "Data Science",
    "VLSI",
    "Structural Engineering",
    "Power Systems",
    "Thermal Engineering",
  ],
  "M.Sc": [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Data Science",
  ],
  MBA: [
    "Finance",
    "Marketing",
    "HR",
    "Operations",
    "Business Analytics",
    "International Business",
  ],
  PhD: [
    "Computer Science",
    "Engineering",
    "Management",
    "Science",
    "Arts",
    "Commerce",
  ],
  BBA: [
    "General Management",
    "Finance",
    "Marketing",
    "HR",
    "International Business",
    "Entrepreneurship",
  ],
  BCA: [
    "Computer Applications",
    "Data Science",
    "Cloud Computing",
    "Cybersecurity",
  ],
  "B.Arch": [
    "Architecture",
    "Urban Planning",
    "Interior Design",
    "Landscape Architecture",
  ],
  "B.Des": [
    "Fashion Design",
    "Graphic Design",
    "Product Design",
    "Interior Design",
    "UI/UX Design",
  ],
  "B.Pharm": [
    "Pharmaceutics",
    "Pharmacology",
    "Pharmaceutical Chemistry",
    "Clinical Pharmacy",
  ],
  "B.Ed": [
    "Primary Education",
    "Secondary Education",
    "Special Education",
    "Physical Education",
  ],
  MBBS: [
    "General Medicine",
    "Surgery",
    "Pediatrics",
    "Obstetrics & Gynecology",
    "Orthopedics",
  ],
  BDS: ["Oral Medicine", "Orthodontics", "Prosthodontics", "Oral Surgery"],
  LLB: [
    "Corporate Law",
    "Criminal Law",
    "Constitutional Law",
    "Intellectual Property Law",
    "International Law",
  ],
  BHM: ["Hotel Management", "Hospitality", "Food & Beverage", "Travel & Tourism"],
  "M.A": [
    "English",
    "History",
    "Economics",
    "Political Science",
    "Psychology",
    "Sociology",
    "Journalism",
  ],
  "M.Com": ["Accounting", "Finance", "Taxation", "Banking", "Business Management"],
  MCA: [
    "Computer Applications",
    "Data Science",
    "Cloud Computing",
    "Cybersecurity",
    "Software Engineering",
  ],
  "M.Arch": [
    "Architecture",
    "Urban Design",
    "Sustainable Architecture",
    "Interior Architecture",
  ],
  "M.Des": [
    "Industrial Design",
    "Communication Design",
    "Fashion Design",
    "UI/UX Design",
  ],
  "M.Pharm": [
    "Pharmaceutics",
    "Pharmacology",
    "Pharmaceutical Chemistry",
    "Clinical Pharmacy",
  ],
  "M.Ed": [
    "Educational Administration",
    "Curriculum & Instruction",
    "Special Education",
    "Educational Psychology",
  ],
  LLM: [
    "Corporate Law",
    "Criminal Law",
    "Constitutional Law",
    "International Law",
    "Intellectual Property Law",
  ],
  "PG Diploma": [
    "Data Science",
    "Business Analytics",
    "Digital Marketing",
    "Financial Management",
    "HR Management",
    "Supply Chain Management",
  ],
};

const buildYear = (val: string | null | undefined): string | number | null => {
  if (val === undefined || val === null || val === "") return null;

  if (typeof val === "string") {
    if (val.includes("-")) {
      const parts = val.split("-");
      if (parts.length >= 2) {
        return `${parts[0]}-${parts[1]}`;
      }
      return parts[0];
    }
  }

  return val;
};

export const EducationDetailsForm: React.FC<EducationDetailsFormProps> = ({
  data,
  onChange,
  userId,
  token,
  educationDataIdMap,
  setEducationDataIdMap,
  deleteEducationIds,
  setDeleteEducationIds,
}) => {
  const [sslcCollapsed, setSslcCollapsed] = useState(false);
  const [preUniversityCollapsed, setPreUniversityCollapsed] = useState(false);
  const [expandedEducationIds, setExpandedEducationIds] = useState<Set<string>>(
    () => new Set(data.higherEducation.map((e) => e.id))
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [sslcFeedback, setSslcFeedback] = useState("");
  const [puFeedback, setPuFeedback] = useState("");
  const [higherEduFeedback, setHigherEduFeedback] = useState<Record<string, string>>({});
  const [hiddenSaveIds, setHiddenSaveIds] = useState<Set<string>>(new Set());
  const [lastModifiedEducationId, setLastModifiedEducationId] = useState<string | null>(null);

  const initialDataRef = useRef(data);

  const hasSslcChanged = useCallback(() => {
    const current = data.sslc;
    const initial = initialDataRef.current.sslc;

    return (
      data.sslcEnabled !== initialDataRef.current.sslcEnabled ||
      current.instituteName !== initial.instituteName ||
      current.boardType !== initial.boardType ||
      current.resultFormat !== initial.resultFormat ||
      current.yearOfPassing !== initial.yearOfPassing ||
      current.result !== initial.result
    );
  }, [data.sslc, data.sslcEnabled]);

  const hasPuChanged = useCallback(() => {
    const current = data.preUniversity;
    const initial = initialDataRef.current.preUniversity;

    return (
      data.preUniversityEnabled !== initialDataRef.current.preUniversityEnabled ||
      current.instituteName !== initial.instituteName ||
      current.boardType !== initial.boardType ||
      current.subjectStream !== initial.subjectStream ||
      current.yearOfPassing !== initial.yearOfPassing ||
      current.resultFormat !== initial.resultFormat ||
      current.result !== initial.result
    );
  }, [data.preUniversity, data.preUniversityEnabled]);

  const getHigherEduChangedStatus = useCallback(
    (edu: HigherEducation): boolean => {
      const initial = initialDataRef.current.higherEducation.find(
        (i) => i.id === edu.id
      );

      if (!initial) {
        return !!(edu.degree || edu.fieldOfStudy || edu.instituteName || edu.result);
      }

      return (
        edu.degree !== initial.degree ||
        (edu.fieldOfStudy || "") !== (initial.fieldOfStudy || "") ||
        edu.instituteName !== initial.instituteName ||
        edu.universityBoard !== initial.universityBoard ||
        edu.startYear !== initial.startYear ||
        edu.endYear !== initial.endYear ||
        edu.resultFormat !== initial.resultFormat ||
        edu.result !== initial.result ||
        edu.currentlyPursuing !== (initial as HigherEducation).currentlyPursuing
      );
    },
    [data.higherEducation]
  );

  const hasAnyHigherEduChanged = useCallback(() => {
    return data.higherEducation.some(getHigherEduChangedStatus);
  }, [data.higherEducation, getHigherEduChangedStatus]);

  const toggleHigherEducation = (id: string, enabled: boolean) => {
    onChange({
      ...data,
      higherEducation: data.higherEducation.map((edu) =>
        edu.id === id ? { ...edu, enabled } : edu
      ) as HigherEducation[],
    });
  };

  const toggleCollapseEducation = (id: string) => {
    setExpandedEducationIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const getMaxEndDate = () => {
    const now = new Date();
    const futureYear = now.getFullYear() + 4;
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${futureYear}-${month}`;
  };

  const validateField = (
    name: string,
    value: string | boolean,
    resultFormat?: string
  ) => {
    if (typeof value !== "string") return "";

    const validateResult = (val: string, format?: string) => {
      if (!val || !format) return "";

      const lowerFormat = format.toLowerCase();

      if (lowerFormat === "percentage" || lowerFormat === "cgpa" || lowerFormat === "gpa") {
        if (val.startsWith("-")) return "Must be a positive number";
      }

      if (lowerFormat === "percentage") {
        const num = parseFloat(val);
        if (isNaN(num)) return "Enter valid percentage";
        if (!/^\d+(\.\d{1,2})?$/.test(val))
          return "Enter valid percentage (e.g., 85 or 85.5)";
        if (num < 0 || num > 100) return "Percentage must be between 0 and 100";
      }

      if (lowerFormat === "cgpa") {
        const num = parseFloat(val);
        if (isNaN(num)) return "Enter valid CGPA";
        if (!/^\d+(\.\d{1,2})?$/.test(val))
          return "Enter valid CGPA (e.g., 8.5)";
        if (num < 0 || num > 10) return "CGPA must be between 0 and 10";
      }

      if (lowerFormat === "gpa") {
        const num = parseFloat(val);
        if (isNaN(num)) return "Enter valid GPA";
        if (!/^\d+(\.\d{1,2})?$/.test(val))
          return "Enter valid GPA (e.g., 8.5)";
        if (num < 0 || num > 10) return "GPA must be between 0 and 10";
      }

      if (lowerFormat === "grade") {
        const grade = val.trim();
        if (!/^(?:A1|A2|B1|B2|C1|C2|D|E)$/i.test(grade))
          return "Enter valid grade (A1, A2, B1, B2, C1, C2, D, E)";
      }

      return "";
    };

    const validateInstitutionName = (val: string) => {
      if (!val || !val.trim()) return "Institution name is required";
      if (val.trim().length <= 5) {
        return "Institution name must be more than 5 characters";
      }
      const regex = /^[a-zA-Z0-9\s.,&'\-()]+$/;
      if (!regex.test(val)) return "Invalid institution name";
      if (!/[a-zA-Z]/.test(val)) return "Institution name must include a letter";
      if (val.length > 50) return "Max 50 characters allowed";
      if (val.split(/\s+/).some((word) => word.length > 15))
        return "Each word must be 15 characters or less";
      return "";
    };

    const validateUniversityBoard = (val: string) => {
      if (!val || !val.trim()) return "University/Board is required";
      const regex = /^[a-zA-Z\s]+$/;
      if (!regex.test(val)) return "Only letters and spaces allowed";
      if (val.length > 50) return "Max 50 characters allowed";
      return "";
    };

    const validateMonthFormat = (val: string) => {
      if (!val || val === "") return "";
      if (!/^\d{4}-\d{2}$/.test(val))
        return "Please select a valid month (YYYY-MM)";
      const [y, m] = val.split("-");
      if (y.length !== 4) return "Year must be 4 digits";
      const yearNum = parseInt(y, 10);
      if (yearNum < 1960) return "Year must be 1960 or later";
      const monthNum = parseInt(m, 10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12)
        return "Invalid month";

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      if (yearNum > currentYear || (yearNum === currentYear && monthNum > currentMonth)) {
        return "Cannot be a future date";
      }

      return "";
    };

    const validateYearOrMonth = (val: string, fieldName?: string) => {
      if (!val || val === "") return "";
      if (!/^\d{4}-\d{2}$/.test(val))
        return "Please select a valid month (YYYY-MM)";
      const [y, m] = val.split("-");
      if (y.length !== 4) return "Year must be 4 digits";
      const yearNum = parseInt(y, 10);
      if (yearNum < 1961 && fieldName === "startYear")
        return "Start year must be greater than 1960";
      if (yearNum < 1960) return "Year must be 1960 or later";
      const monthNum = parseInt(m, 10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12)
        return "Invalid month";

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      if (fieldName === "endYear" || fieldName === "yearOfPassing") {
        if (yearNum > currentYear || (yearNum === currentYear && monthNum > currentMonth)) {
          return "Cannot be a future date";
        }
      }

      return "";
    };

    if (name.endsWith(".instituteName")) return validateInstitutionName(value);
    if (name.endsWith(".universityBoard")) return validateUniversityBoard(value);
    if (
      name.endsWith(".yearOfPassing") ||
      name.endsWith(".startYear") ||
      name.endsWith(".endYear")
    ) {
      const fieldName = name.endsWith(".startYear")
        ? "startYear"
        : name.endsWith(".endYear")
        ? "endYear"
        : "yearOfPassing";
      return validateYearOrMonth(value, fieldName);
    }
    if (name.endsWith(".resultFormat"))
      return value.trim() ? "" : "Select result format";
    if (name.endsWith(".result")) {
      if (!value.trim()) return "Result is required";
      return validateResult(value, resultFormat);
    }

    return "";
  };

  const validateDateRange = (
    startYear: string,
    endYear: string,
    isCurrentlyPursuing = false
  ) => {
    if (isCurrentlyPursuing) return "";

    if (endYear) {
      const endYearNum = parseInt(endYear.split("-")[0], 10);
      if (endYearNum < 1960) return "End year must be 1960 or later";
    }

    if (startYear && endYear && endYear < startYear) {
      return "End year cannot be before start year";
    }

    return "";
  };

  const handleResetSslc = () => {
    const initial = initialDataRef.current.sslc;
    onChange({
      ...data,
      sslc: { ...initial },
      sslcEnabled: initialDataRef.current.sslcEnabled,
    });
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated["sslc.result"];
      delete updated["sslc.instituteName"];
      return updated;
    });
    setSslcFeedback("");
  };

  const handleResetPu = () => {
    const initial = initialDataRef.current.preUniversity;
    onChange({
      ...data,
      preUniversity: { ...initial },
      preUniversityEnabled: initialDataRef.current.preUniversityEnabled,
    });
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated["preUniversity.result"];
      delete updated["preUniversity.instituteName"];
      return updated;
    });
    setPuFeedback("");
  };

  const handleResetHigherEducation = (id: string) => {
    const initial = initialDataRef.current.higherEducation.find(
      (e) => e.id === id
    );
    if (!initial) return;

    onChange({
      ...data,
      higherEducation: data.higherEducation.map((edu) =>
        edu.id === id ? { ...initial } : edu
      ),
    });
    setLastModifiedEducationId(null);

    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[`higherEducation.${id}.result`];
      delete updated[`higherEducation.${id}.instituteName`];
      delete updated[`higherEducation.${id}.universityBoard`];
      delete updated[`higherEducation.${id}.endYear`];
      return updated;
    });
    setHigherEduFeedback((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleSaveSslc = async () => {
    const currentData = data.sslc;
    const initialData = initialDataRef.current.sslc;
    const education_id = initialDataRef.current.sslc.education_id;
    const isEnabled = data.sslcEnabled;

    if (errors["sslc.result"] || errors["sslc.instituteName"]) return;

    const ssclResultFormatError = validateField(
      "sslc.resultFormat",
      currentData.resultFormat,
      currentData.resultFormat
    );
    const ssclResultError = validateField(
      "sslc.result",
      currentData.result,
      currentData.resultFormat
    );
    if (ssclResultFormatError || ssclResultError) {
      setErrors((prev) => ({
        ...prev,
        "sslc.resultFormat": ssclResultFormatError,
        "sslc.result": ssclResultError,
      }));
      return;
    }

    try {
      if (education_id && !isEnabled && !hasSslcChanged()) {
        await deleteEducation(userId, token, education_id);
        const clearedData = {
          instituteName: "",
          boardType: "",
          resultFormat: "",
          yearOfPassing: "",
          result: "",
          education_id: null,
        };
        onChange({ ...data, sslc: clearedData, sslcEnabled: false });
        initialDataRef.current = {
          ...initialDataRef.current,
          sslc: clearedData,
          sslcEnabled: false,
        };
        setSslcFeedback("SSLC details cleared successfully!");
        setTimeout(() => setSslcFeedback(""), 3000);
        return;
      }

      if (!isEnabled || (!hasSslcChanged() && education_id)) {
        setSslcFeedback("No changes detected to save.");
        setTimeout(() => setSslcFeedback(""), 3000);
        return;
      }

      const payload = {
        education_type: "sslc",
        institution_name: currentData.instituteName || "",
        board_type: currentData.boardType || "",
        end_year: buildYear(currentData.yearOfPassing),
        result_format: (currentData.resultFormat || "").toLowerCase(),
        result: currentData.result || "",
      };

      let response: any;
      let feedbackMessage = "";

      if (education_id) {
        const updatePayload: Record<string, any> = {};
        if (currentData.instituteName !== initialData.instituteName)
          updatePayload.institution_name = currentData.instituteName;
        if (currentData.boardType !== initialData.boardType)
          updatePayload.board_type = currentData.boardType;
        if (currentData.yearOfPassing !== initialData.yearOfPassing)
          updatePayload.end_year = buildYear(currentData.yearOfPassing);
        if (currentData.resultFormat !== initialData.resultFormat)
          updatePayload.result_format = (currentData.resultFormat || "").toLowerCase();
        if (currentData.result !== initialData.result)
          updatePayload.result = currentData.result;

        if (Object.keys(updatePayload).length > 0) {
          response = await updateEducationDetails(
            userId,
            token,
            education_id,
            updatePayload
          );
          feedbackMessage = "SSLC details updated successfully!";
        }
      } else {
        const newPayload = [{ ...payload }];
        response = await saveEducationDetails(userId, token, newPayload);

        if (response && response.length > 0 && response[0].education_id) {
          const newId = response[0].education_id;
          onChange({ ...data, sslc: { ...currentData, education_id: newId } });
        }
        feedbackMessage = "SSLC details saved successfully!";
      }

      initialDataRef.current = {
        ...initialDataRef.current,
        sslc: {
          ...currentData,
          education_id: education_id || response?.[0]?.education_id || null,
        },
        sslcEnabled: data.sslcEnabled,
      };
      setSslcFeedback(feedbackMessage);
      setHiddenSaveIds((prev) => new Set([...prev, "sslc"]));

      setTimeout(() => {
        setSslcFeedback("");
        setHiddenSaveIds((prev) => {
          const updated = new Set(prev);
          updated.delete("sslc");
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error("Error saving SSLC:", error);
      setSslcFeedback("Failed to save SSLC details");
      setTimeout(() => setSslcFeedback(""), 3000);
    }
  };

  const handleSavePu = async () => {
    const currentData = data.preUniversity;
    const initialData = initialDataRef.current.preUniversity;
    const education_id = initialDataRef.current.preUniversity.education_id;
    const isEnabled = data.preUniversityEnabled;

    if (
      errors["preUniversity.result"] ||
      errors["preUniversity.instituteName"]
    )
      return;

    const puResultFormatError = validateField(
      "preUniversity.resultFormat",
      currentData.resultFormat,
      currentData.resultFormat
    );
    const puResultError = validateField(
      "preUniversity.result",
      currentData.result,
      currentData.resultFormat
    );
    if (puResultFormatError || puResultError) {
      setErrors((prev) => ({
        ...prev,
        "preUniversity.resultFormat": puResultFormatError,
        "preUniversity.result": puResultError,
      }));
      return;
    }

    try {
      if (education_id && !isEnabled && !hasPuChanged()) {
        await deleteEducation(userId, token, education_id);
        const clearedData = {
          instituteName: "",
          boardType: "",
          subjectStream: "",
          resultFormat: "",
          yearOfPassing: "",
          result: "",
          education_id: null,
        };
        onChange({
          ...data,
          preUniversity: clearedData,
          preUniversityEnabled: false,
        });
        initialDataRef.current = {
          ...initialDataRef.current,
          preUniversity: clearedData,
          preUniversityEnabled: false,
        };
        setPuFeedback("Pre University details cleared successfully!");
        setTimeout(() => setPuFeedback(""), 3000);
        return;
      }

      if (!isEnabled || (!hasPuChanged() && education_id)) {
        setPuFeedback("No changes detected to save.");
        setTimeout(() => setPuFeedback(""), 3000);
        return;
      }

      const payload = {
        education_type: "puc",
        institution_name: currentData.instituteName || "",
        board_type: currentData.boardType || "",
        subject_stream: currentData.subjectStream || "",
        end_year: buildYear(currentData.yearOfPassing),
        result_format: (currentData.resultFormat || "").toLowerCase(),
        result: currentData.result || "",
      };

      let response: any;
      let feedbackMessage = "";

      if (education_id) {
        const updatePayload: Record<string, any> = {};
        if (currentData.instituteName !== initialData.instituteName)
          updatePayload.institution_name = currentData.instituteName;
        if (currentData.boardType !== initialData.boardType)
          updatePayload.board_type = currentData.boardType;
        if (currentData.subjectStream !== initialData.subjectStream)
          updatePayload.subject_stream = currentData.subjectStream;
        if (currentData.yearOfPassing !== initialData.yearOfPassing)
          updatePayload.end_year = buildYear(currentData.yearOfPassing);
        if (currentData.resultFormat !== initialData.resultFormat)
          updatePayload.result_format = (
            currentData.resultFormat || ""
          ).toLowerCase();
        if (currentData.result !== initialData.result)
          updatePayload.result = currentData.result;

        if (Object.keys(updatePayload).length > 0) {
          response = await updateEducationDetails(
            userId,
            token,
            education_id,
            updatePayload
          );
          feedbackMessage = "Pre University details updated successfully!";
        }
      } else {
        const newPayload = [{ ...payload }];
        response = await saveEducationDetails(userId, token, newPayload);

        if (response && response.length > 0 && response[0].education_id) {
          const newId = response[0].education_id;
          onChange({
            ...data,
            preUniversity: { ...currentData, education_id: newId },
          });
        }
        feedbackMessage = "Pre University details saved successfully!";
      }

      initialDataRef.current = {
        ...initialDataRef.current,
        preUniversity: {
          ...currentData,
          education_id: education_id || response?.[0]?.education_id || null,
        },
        preUniversityEnabled: data.preUniversityEnabled,
      };
      setPuFeedback(feedbackMessage);
      setHiddenSaveIds((prev) => new Set([...prev, "preUniversity"]));

      setTimeout(() => {
        setPuFeedback("");
        setHiddenSaveIds((prev) => {
          const updated = new Set(prev);
          updated.delete("preUniversity");
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error("Error saving PU:", error);
      setPuFeedback("Failed to save Pre University details");
      setTimeout(() => setPuFeedback(""), 3000);
    }
  };

  const handleSaveHigherEducation = async (edu: HigherEducation) => {
    const index = data.higherEducation.findIndex((e) => e.id === edu.id);
    if (index === -1) return;

    const hasChanged = getHigherEduChangedStatus(edu);
    const isNew = !edu.education_id;

    if (
      errors[`higherEducation.${edu.id}.result`] ||
      errors[`higherEducation.${edu.id}.instituteName`] ||
      errors[`higherEducation.${edu.id}.universityBoard`] ||
      errors[`higherEducation.${edu.id}.endYear`]
    )
      return;

    const higherResultFormatError = validateField(
      `higherEducation.${edu.id}.resultFormat`,
      edu.resultFormat,
      edu.resultFormat
    );
    const higherResultError = validateField(
      `higherEducation.${edu.id}.result`,
      edu.result,
      edu.resultFormat
    );
    if (higherResultFormatError || higherResultError) {
      setErrors((prev) => ({
        ...prev,
        [`higherEducation.${edu.id}.resultFormat`]: higherResultFormatError,
        [`higherEducation.${edu.id}.result`]: higherResultError,
      }));
      return;
    }

    try {
      if (
        !edu.degree &&
        !edu.fieldOfStudy &&
        !edu.instituteName &&
        !edu.education_id
      ) {
        setHigherEduFeedback((prev) => ({
          ...prev,
          [edu.id]: "Cannot save empty record.",
        }));
        setTimeout(
          () =>
            setHigherEduFeedback((prev) => {
              const updated = { ...prev };
              delete updated[edu.id];
              return updated;
            }),
          3000
        );
        return;
      }

      if (!hasChanged && !isNew) {
        setHigherEduFeedback((prev) => ({
          ...prev,
          [edu.id]: "No changes to save.",
        }));
        setTimeout(
          () =>
            setHigherEduFeedback((prev) => {
              const updated = { ...prev };
              delete updated[edu.id];
              return updated;
            }),
          3000
        );
        return;
      }

      let response: any;
      let feedbackMessage = "";

      const payload = {
        education_type: "higher",
        degree: edu.degree || "",
        field_of_study: edu.fieldOfStudy || "",
        institution_name: edu.instituteName || "",
        university_name: edu.universityBoard || "",
        start_year: buildYear(edu.startYear),
        end_year: buildYear(edu.endYear),
        result_format: (edu.resultFormat || "").toLowerCase(),
        result: edu.result || "",
        currently_pursuing: !!edu.currentlyPursuing,
      };

      const clearOtherCurrentlyPursuingRecords = async () => {
        if (!edu.currentlyPursuing) return;

        const otherCurrentRecords = data.higherEducation.filter((item) => {
          const initial =
            initialDataRef.current.higherEducation.find(
              (initialItem) => initialItem.id === item.id
            ) || ({} as HigherEducation);

          return (
            item.id !== edu.id &&
            item.education_id &&
            (item.currentlyPursuing || initial.currentlyPursuing)
          );
        });

        await Promise.all(
          otherCurrentRecords.map((item) =>
            updateEducationDetails(userId, token, item.education_id as number, {
              currently_pursuing: false,
            })
          )
        );
      };

      if (isNew) {
        response = await saveEducationDetails(userId, token, [{ ...payload }]);

        if (response && response.length > 0 && response[0].education_id) {
          const newId = response[0].education_id;
          await clearOtherCurrentlyPursuingRecords();

          const updatedEducation = data.higherEducation.map((e) =>
            e.id === edu.id
              ? { ...e, education_id: newId }
              : edu.currentlyPursuing
                ? { ...e, currentlyPursuing: false }
                : e
          );
          onChange({ ...data, higherEducation: updatedEducation });
          setEducationDataIdMap((prev) => ({ ...prev, [edu.id]: newId }));

          const updatedRefEducation =
            initialDataRef.current.higherEducation.map((e) =>
              e.id === edu.id
                ? { ...e, education_id: newId }
                : edu.currentlyPursuing
                  ? { ...e, currentlyPursuing: false }
                  : e
            );
          initialDataRef.current = {
            ...initialDataRef.current,
            higherEducation: updatedRefEducation,
          };
        }

        feedbackMessage = "Saved successfully!";
      } else {
        const initial =
          initialDataRef.current.higherEducation.find(
            (i) => i.id === edu.id
          ) || ({} as HigherEducation);
        const updatePayload: Record<string, any> = {};

        if (edu.degree !== initial.degree) updatePayload.degree = edu.degree;
        if ((edu.fieldOfStudy || "") !== (initial.fieldOfStudy || ""))
          updatePayload.field_of_study = edu.fieldOfStudy || "";
        if (edu.instituteName !== initial.instituteName)
          updatePayload.institution_name = edu.instituteName;
        if (edu.universityBoard !== initial.universityBoard)
          updatePayload.university_name = edu.universityBoard;
        if (edu.startYear !== initial.startYear)
          updatePayload.start_year = buildYear(edu.startYear);
        if (edu.endYear !== initial.endYear)
          updatePayload.end_year = buildYear(edu.endYear);
        if (edu.resultFormat !== initial.resultFormat)
          updatePayload.result_format = (edu.resultFormat || "").toLowerCase();
        if (edu.result !== initial.result) updatePayload.result = edu.result;
        if (edu.currentlyPursuing !== initial.currentlyPursuing)
          updatePayload.currently_pursuing = edu.currentlyPursuing;

        if (Object.keys(updatePayload).length > 0) {
          response = await updateEducationDetails(
            userId,
            token,
            edu.education_id as number,
            updatePayload
          );

          await clearOtherCurrentlyPursuingRecords();

          const updatedEducation = data.higherEducation.map((e) =>
            e.id === edu.id
              ? { ...edu }
              : edu.currentlyPursuing
                ? { ...e, currentlyPursuing: false }
                : e
          );
          onChange({ ...data, higherEducation: updatedEducation });

          const updatedRefEducation =
            initialDataRef.current.higherEducation.map((e) =>
              e.id === edu.id
                ? { ...edu }
                : edu.currentlyPursuing
                  ? { ...e, currentlyPursuing: false }
                  : e
            );
          initialDataRef.current = {
            ...initialDataRef.current,
            higherEducation: updatedRefEducation,
          };
        }

        feedbackMessage = "Updated successfully!";
      }

      setHigherEduFeedback((prev) => ({ ...prev, [edu.id]: feedbackMessage }));
      setHiddenSaveIds((prev) => new Set([...prev, edu.id]));
      setLastModifiedEducationId(null);

      setTimeout(() => {
        setHigherEduFeedback((prev) => {
          const updated = { ...prev };
          delete updated[edu.id];
          return updated;
        });
        setHiddenSaveIds((prev) => {
          const updated = new Set(prev);
          updated.delete(edu.id);
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error("Error saving higher education:", error);
      setHigherEduFeedback((prev) => ({
        ...prev,
        [edu.id]: "Failed to save",
      }));
      setLastModifiedEducationId(null);
      setTimeout(
        () =>
          setHigherEduFeedback((prev) => {
            const updated = { ...prev };
            delete updated[edu.id];
            return updated;
          }),
        3000
      );
    }
  };

  const updateSSLC = (
    field: string,
    value: string
  ) => {
    const updatedSslc = {
      ...data.sslc,
      [field]: value,
      ...(field === "yearOfPassing" ? { endYear: value } : {}),
      ...(field === "resultFormat" ? { result: "" } : {}),
    };
    onChange({
      ...data,
      sslc: updatedSslc,
    });
    setSslcFeedback("");

    const fieldError = validateField(`sslc.${field}`, value, updatedSslc.resultFormat);
    const resultFormatError = validateField(
      `sslc.resultFormat`,
      updatedSslc.resultFormat,
      updatedSslc.resultFormat
    );
    const resultError = validateField(
      `sslc.result`,
      updatedSslc.result,
      updatedSslc.resultFormat
    );

    setErrors((prev) => ({
      ...prev,
      [`sslc.${field}`]: fieldError,
      "sslc.resultFormat": resultFormatError,
      "sslc.result": resultError,
    }));
  };

  const updatePreUniversity = (
    field: string,
    value: string
  ) => {
    const updatedPu = {
      ...data.preUniversity,
      [field]: value,
      ...(field === "yearOfPassing" ? { endYear: value } : {}),
      ...(field === "resultFormat" ? { result: "" } : {}),
    };
    onChange({
      ...data,
      preUniversity: updatedPu,
    });
    setPuFeedback("");

    const fieldError = validateField(
      `preUniversity.${field}`,
      value,
      updatedPu.resultFormat
    );
    const resultFormatError = validateField(
      `preUniversity.resultFormat`,
      updatedPu.resultFormat,
      updatedPu.resultFormat
    );
    const resultError = validateField(
      `preUniversity.result`,
      updatedPu.result,
      updatedPu.resultFormat
    );
    setErrors((prev) => ({
      ...prev,
      [`preUniversity.${field}`]: fieldError,
      "preUniversity.resultFormat": resultFormatError,
      "preUniversity.result": resultError,
    }));
  };

  const updateHigherEducation = (
    id: string,
    field: string,
    value: string | boolean
  ) => {
    const sanitizeYearOrMonthInput = (raw: string): string => {
      const cleaned = raw.replace(/[^\d-]/g, "");
      if (cleaned.includes("-")) {
        // keep at most YYYY-MM (7 chars)
        return cleaned.slice(0, 7);
      }
      // no hyphen -> year typed manually, allow up to 4 digits
      return cleaned.slice(0, 4);
    };

    const normalizedValue =
      field === "startYear" || field === "endYear"
        ? typeof value === "string"
          ? sanitizeYearOrMonthInput(value)
          : value
        : value;

    const updatedEducation = data.higherEducation.map((edu) => {
      if (field === "currentlyPursuing" && normalizedValue === true) {
        return edu.id === id
          ? { ...edu, currentlyPursuing: true, endYear: "" }
          : { ...edu, currentlyPursuing: false };
      }
      return edu.id === id
        ? {
            ...edu,
            [field]: normalizedValue,
            ...(field === "resultFormat" ? { result: "" } : {}),
          }
        : edu;
    });

    onChange({ ...data, higherEducation: updatedEducation });
    setLastModifiedEducationId(id);

    setHigherEduFeedback((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    const edu = updatedEducation.find((e) => e.id === id) as HigherEducation;

    const fieldError = validateField(
      `higherEducation.${id}.${field}`,
      typeof normalizedValue === "string" ? normalizedValue : (value as string),
      edu?.resultFormat
    );
    const resultFormatError = validateField(
      `higherEducation.${id}.resultFormat`,
      edu?.resultFormat,
      edu?.resultFormat
    );
    const resultError = validateField(
      `higherEducation.${id}.result`,
      edu?.result,
      edu?.resultFormat
    );
    setErrors((prev) => ({
      ...prev,
      [`higherEducation.${id}.${field}`]: fieldError,
      [`higherEducation.${id}.resultFormat`]: resultFormatError,
      [`higherEducation.${id}.result`]: resultError,
    }));

    if (
      edu &&
      (field === "startYear" ||
        field === "endYear" ||
        field === "currentlyPursuing")
    ) {
      const currentEndYear =
        field === "currentlyPursuing" && value === true ? "" : edu.endYear;

      const dateError = validateDateRange(
        edu.startYear,
        currentEndYear,
        edu.currentlyPursuing
      );
      setErrors((prev) => ({
        ...prev,
        [`higherEducation.${id}.endYear`]: dateError,
      }));
    }
  };

  const addHigherEducation = () => {
    const newId = Date.now().toString();
    const newEdu: HigherEducation = {
      id: newId,
      degree: "",
      fieldOfStudy: "",
      instituteName: "",
      universityBoard: "",
      startYear: "",
      endYear: "",
      resultFormat: "",
      result: "",
      currentlyPursuing: false,
      education_id: null,
      enabled: true,
    };
    onChange({
      ...data,
      higherEducation: [...data.higherEducation, newEdu],
    });
    setExpandedEducationIds((prev) => new Set([...prev, newId]));
  };

  const removeHigherEducation = async (id: string) => {
    const eduToRemove = data.higherEducation.find((edu) => edu.id === id);

    if (eduToRemove && eduToRemove.education_id) {
      try {
        setHigherEduFeedback((prev) => ({ ...prev, [id]: "Deleting..." }));
        await deleteEducation(userId, token, eduToRemove.education_id);
        setDeleteEducationIds((prev) => [
          ...prev,
          eduToRemove.education_id as number,
        ]);
        setHigherEduFeedback((prev) => ({
          ...prev,
          [id]: "Deleted successfully!",
        }));
        setLastModifiedEducationId(null);
        setTimeout(
          () =>
            setHigherEduFeedback((prev) => {
              const updated = { ...prev };
              delete updated[id];
              return updated;
            }),
          3000
        );
      } catch (error) {
        console.error("Error deleting education:", error);
        setHigherEduFeedback((prev) => ({
          ...prev,
          [id]: "Failed to delete",
        }));
        setTimeout(
          () =>
            setHigherEduFeedback((prev) => {
              const updated = { ...prev };
              delete updated[id];
              return updated;
            }),
          3000
        );
        return;
      }
    }

    onChange({
      ...data,
      higherEducation: data.higherEducation.filter((edu) => edu.id !== id),
    });

    initialDataRef.current = {
      ...initialDataRef.current,
      higherEducation: initialDataRef.current.higherEducation.filter(
        (e) => e.id !== id
      ),
    };
    setLastModifiedEducationId(null);
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.includes(id)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const renderEducationCard = (education: HigherEducation, index: number) => {
    const id = education.id;
    const hasChanged = getHigherEduChangedStatus(education);
    const isDirectlyModified = lastModifiedEducationId === id;
    const feedback = higherEduFeedback[id];
    const isNewCard = !education.education_id;
    const isExpanded = expandedEducationIds.has(id);
    const isEnabled =
      education.enabled !== undefined ? education.enabled : true;

    const title = education.degree
      ? education.degree
      : `Education ${index + 1}`;

    return (
      <FormSection
        key={id}
        title={title}
        required={false}
        showToggle={true}
        enabled={isEnabled}
        onToggle={(enabled) => toggleHigherEducation(id, enabled)}
        onRemove={
          data.higherEducation.length > 1
            ? () => removeHigherEducation(id)
            : undefined
        }
        showActions={true}
        isCollapsed={!isExpanded}
        onCollapseToggle={() => toggleCollapseEducation(id)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Degree"
              placeholder="Select Degree"
              value={education.degree}
              onChange={(v) => updateHigherEducation(id, "degree", v)}
              options={degrees}
            />
            <FormInput
              label="Field of Study"
              placeholder="Enter Field of Study"
              value={education.fieldOfStudy || ""}
              onChange={(v) => updateHigherEducation(id, "fieldOfStudy", v)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Institute Name"
              placeholder="Enter Institute Name"
              required
              value={education.instituteName}
              onChange={(v) => updateHigherEducation(id, "instituteName", v)}
              error={errors[`higherEducation.${id}.instituteName`]}
              maxLength={100}
            />
            <FormInput
              label="University / Board"
              placeholder="Enter University / Board"
              required
              value={education.universityBoard}
              onChange={(v) => updateHigherEducation(id, "universityBoard", v)}
              error={errors[`higherEducation.${id}.universityBoard`]}
              maxLength={50}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Year
              </label>
              <input
                type="month"
                value={education.startYear}
                onChange={(e) =>
                  updateHigherEducation(id, "startYear", e.target.value)
                }
                min="1960-01"
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm ${errors[`higherEducation.${id}.startYear`]
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                  }`}
                onKeyDown={(e) => e.preventDefault()}
              />
              {errors[`higherEducation.${id}.startYear`] && (
                <p className="mt-1 text-xs text-red-500">
                  {errors[`higherEducation.${id}.startYear`]}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                End Year
              </label>
              <input
                type="month"
                value={education.currentlyPursuing ? "" : education.endYear}
                onChange={(e) =>
                  updateHigherEducation(id, "endYear", e.target.value)
                }
                disabled={education.currentlyPursuing}
                min="1960-01"
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm disabled:bg-gray-100 ${errors[`higherEducation.${id}.endYear`]
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                  }`}
                max={getMaxEndDate()}
                onKeyDown={(e) => e.preventDefault()}
              />
              {errors[`higherEducation.${id}.endYear`] && (
                <p className="mt-1 text-xs text-red-500">
                  {errors[`higherEducation.${id}.endYear`]}
                </p>
              )}
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={education.currentlyPursuing}
                  onChange={(e) =>
                    updateHigherEducation(
                      id,
                      "currentlyPursuing",
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 text-orange-400 border-gray-300 rounded focus:ring-orange-400"
                />
                Currently Pursuing
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Result Format"
              placeholder="Format"
              value={education.resultFormat}
              onChange={(v) => updateHigherEducation(id, "resultFormat", v)}
              options={resultFormats}
              required
            />
            <FormInput
              label="Result"
              placeholder="Result"
              value={education.result}
              onChange={(v) => updateHigherEducation(id, "result", v)}
              error={errors[`higherEducation.${id}.result`]}
              required
            />
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
            {hasChanged && !hiddenSaveIds.has(education.id) && isDirectlyModified && (
              <button
                type="button"
                onClick={() => handleSaveHigherEducation(education)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                aria-pressed="false"
                aria-label={isNewCard ? "Save new education" : "Save education changes"}
              >
                <Save className="w-4 h-4" strokeWidth={2} />
                Save
              </button>
            )}
          </div>
        </div>
      </FormSection>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <FormSection
        title={"SSLC (10th Standard)"}
        required={false}
        enabled={data.sslcEnabled}
        onToggle={(enabled) => onChange({ ...data, sslcEnabled: enabled })}
        showActions={true}
        isCollapsed={sslcCollapsed}
        onCollapseToggle={() => setSslcCollapsed(!sslcCollapsed)}
      >
        <FormInput
          label="Institution Name"
          placeholder="Enter Institute Name"
          required
          value={data.sslc.instituteName}
          onChange={(v) => updateSSLC("instituteName", v)}
          error={errors["sslc.instituteName"]}
          maxLength={100}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormSelect
            label="Board Type"
            placeholder="Select Board Type"
            value={data.sslc.boardType}
            onChange={(v) => updateSSLC("boardType", v)}
            options={boardTypes}
          />
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Year of Passing
            </label>
            <input
              type="month"
              value={data.sslc.yearOfPassing}
              onChange={(e) => updateSSLC("yearOfPassing", e.target.value)}
              max={getCurrentMonth()}
              min="1960-01"
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm ${errors["sslc.yearOfPassing"]
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                }`}
              onKeyDown={(e) => e.preventDefault()}
            />
            {errors["sslc.yearOfPassing"] && (
              <p className="mt-1 text-xs text-red-500">
                {errors["sslc.yearOfPassing"]}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormSelect
            label="Result Format"
            placeholder="Select Result Format"
            value={data.sslc.resultFormat}
            onChange={(v) => updateSSLC("resultFormat", v)}
            options={resultFormats}
            required
          />
          <FormInput
            label="Result"
            placeholder="Enter Result"
            value={data.sslc.result}
            onChange={(v) => updateSSLC("result", v)}
            error={errors["sslc.result"]}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
          {sslcFeedback && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${sslcFeedback.includes("successfully")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
                }`}
            >
              {sslcFeedback}
            </span>
          )}
          {hasSslcChanged() && !hiddenSaveIds.has("sslc") && (
            <button
              type="button"
              onClick={handleSaveSslc}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
              aria-pressed="false"
              aria-label={data.sslc.education_id ? "Update SSLC" : "Save SSLC"}
            >
              <Save className="w-4 h-4" strokeWidth={2} />
              Save
            </button>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Pre-university (12th Standard)"
        required={false}
        enabled={data.preUniversityEnabled}
        onToggle={(enabled) =>
          onChange({ ...data, preUniversityEnabled: enabled })
        }
        showActions={true}
        isCollapsed={preUniversityCollapsed}
        onCollapseToggle={() =>
          setPreUniversityCollapsed(!preUniversityCollapsed)
        }
      >
        <FormInput
          label="Institution Name"
          placeholder="Enter Institute Name"
          required
          value={data.preUniversity.instituteName}
          onChange={(v) => updatePreUniversity("instituteName", v)}
          error={errors["preUniversity.instituteName"]}
          maxLength={100}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormSelect
            label="Board Type"
            placeholder="Select Board Type"
            value={data.preUniversity.boardType}
            onChange={(v) => updatePreUniversity("boardType", v)}
            options={boardTypes}
          />
          <FormSelect
            label="Subject Stream"
            placeholder="Select Subject Stream"
            value={data.preUniversity.subjectStream}
            onChange={(v) => updatePreUniversity("subjectStream", v)}
            options={subjectStreams}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Year of Passing
            </label>
            <input
              type="month"
              value={data.preUniversity.yearOfPassing}
              onChange={(e) =>
                updatePreUniversity("yearOfPassing", e.target.value)
              }
              max={getCurrentMonth()}
              min="1960-01"
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm ${errors["preUniversity.yearOfPassing"]
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                }`}
            />
            {errors["preUniversity.yearOfPassing"] && (
              <p className="mt-1 text-xs text-red-500">
                {errors["preUniversity.yearOfPassing"]}
              </p>
            )}
          </div>
          <FormSelect
            label="Result Format"
            placeholder="Result Format"
            value={data.preUniversity.resultFormat}
            onChange={(v) => updatePreUniversity("resultFormat", v)}
            options={resultFormats}
            required
          />
          <FormInput
            label="Result"
            placeholder="Enter Result"
            value={data.preUniversity.result}
            onChange={(v) => updatePreUniversity("result", v)}
            error={errors["preUniversity.result"]}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
          {puFeedback && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${puFeedback.includes("successfully")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
                }`}
            >
              {puFeedback}
            </span>
          )}
          {hasPuChanged() && !hiddenSaveIds.has("preUniversity") && (
            <button
              type="button"
              onClick={handleSavePu}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
              aria-pressed="false"
              aria-label={
                data.preUniversity.education_id
                  ? "Update Pre University"
                  : "Save Pre University"
              }
            >
              <Save className="w-4 h-4" strokeWidth={2} />
              Save
            </button>
          )}
        </div>
      </FormSection>

      {data.higherEducation.map((edu, index) =>
        renderEducationCard(edu as HigherEducation, index)
      )}

      <div className="bg-white border border-gray-200 rounded-xl">
        <AddButton onClick={addHigherEducation} label="Add Education" />
      </div>
    </div>
  );
};

export default EducationDetailsForm;
