import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Trash2, Plus, Save } from "lucide-react";
import {
  updateEducationDetails,
  saveEducationDetails,
  deleteEducation,
} from "@/services/educationService";

const CURRENT_YEAR = new Date().getFullYear();
const LETTERS_ONLY_REGEX = /^[A-Za-z\s]+$/;

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

  "B.Com": [
    "General",
    "Accounting",
    "Finance",
    "Banking",
    "Taxation",
  ],

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

  "MBA": [
    "Finance",
    "Marketing",
    "HR",
    "Operations",
    "Business Analytics",
    "International Business",
  ],

  "PhD": [
    "Computer Science",
    "Engineering",
    "Management",
    "Science",
    "Arts",
    "Commerce",
  ],
};

interface EducationDetailsFormProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
  userId: string;
  token: string;
  hideIntro?: boolean;
  hideHeader?: boolean;
}

interface HigherEducation {
  id: string; // Client-side unique ID (timestamp or generated)
  degree: string;
  fieldOfStudy?: string;
  institutionName: string;
  universityBoard: string;
  startYear: string;
  endYear: string;
  resultFormat: string;
  result: string;
  currentlyPursuing: boolean;
  education_id?: number; // Database ID
}

export default function EducationDetailsForm({
  onNext,
  onBack,
  initialData = {},
  userId,
  token,
  hideIntro = false,
  hideHeader = false,
}: EducationDetailsFormProps) {
  const [sslcExpanded, setSslcExpanded] = useState(true);

  // Scroll to top on mount so SSLC is always visible
  useEffect(() => {
    // Try to scroll the nearest scrollable parent, fallback to window
    setTimeout(() => {
      let scrolled = false;
      // Find the nearest scrollable parent
      let el = document.getElementById("education-details-form-root");
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
  const [puExpanded, setPuExpanded] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState("");

  // SSLC Data
  const [sslcData, setSslcData] = useState({
    institutionName: initialData.sslc?.institutionName || "",
    boardType: initialData.sslc?.boardType || "",
    resultFormat: initialData.sslc?.resultFormat || "",
    yearOfPassing: initialData.sslc?.yearOfPassing || "",
    result: initialData.sslc?.result || "",
    education_id: initialData.sslc?.education_id || null,
  });

  // PU Data
  const [puData, setPuData] = useState({
    institutionName: initialData.pu?.institutionName || "",
    boardType: initialData.pu?.boardType || "",
    yearOfPassing: initialData.pu?.yearOfPassing || "",
    resultFormat: initialData.pu?.resultFormat || "",
    subjectStream: initialData.pu?.subjectStream || "",
    result: initialData.pu?.result || "",
    education_id: initialData.pu?.education_id || null,
  });

  // Helper to initialize lists, ensuring at least one Higher Education card exists
  const getInitialHigherEducations = (data: any) => {
    const higherEdus = data.higherEducations || [];
    const extraEdus = data.extraEducations || [];

    // Combine into a single array for state management
    let combined = [...higherEdus, ...extraEdus];

    // Ensure at least one element for the mandatory higher education
    if (combined.length === 0) {
      combined.push({
        id: Date.now().toString(),
        degree: "",
        fieldOfStudy: "",
        institutionName: "",
        universityBoard: "",
        startYear: "",
        endYear: "",
        resultFormat: "",
        result: "",
        currentlyPursuing: false,
      });
    }

    return combined;
  };

  const initialEducations = getInitialHigherEducations(initialData);

  // Split into mandatory (first item) and extra (rest)
  const initialHigherEdu = initialEducations.slice(0, 1);
  const initialExtraEdu = initialEducations.slice(1);

  const getInitialExpanded = (array: HigherEducation[]) =>
    array.reduce((acc, edu) => ({ ...acc, [edu.id]: true }), {});

  const [higherEducations, setHigherEducations] =
    useState<HigherEducation[]>(initialHigherEdu);
  const [extraEducations, setExtraEducations] =
    useState<HigherEducation[]>(initialExtraEdu);
  const [higherExpanded, setHigherExpanded] = useState<Record<string, boolean>>(
    getInitialExpanded(initialHigherEdu)
  );
  const [extraExpanded, setExtraExpanded] = useState<Record<string, boolean>>(
    getInitialExpanded(initialExtraEdu)
  );

  // Track changes for each education section/card
  const [sslcChanged, setSslcChanged] = useState(false);
  const [puChanged, setPuChanged] = useState(false);
  const [higherChanges, setHigherChanges] = useState<Record<string, string[]>>(
    {}
  );
  const [extraChanges, setExtraChanges] = useState<Record<string, string[]>>(
    {}
  );

  // Feedback messages
  const [sslcFeedback, setSslcFeedback] = useState("");
  const [puFeedback, setPuFeedback] = useState("");
  const [higherFeedback, setHigherFeedback] = useState<Record<string, string>>(
    {}
  );
  const [extraFeedback, setExtraFeedback] = useState<Record<string, string>>(
    {}
  );

  // Track IDs of education records marked for deletion (only relevant for existing extra education cards)
  const deletedEducationIds = useRef<number[]>([]);

  // Store initial values for comparison
  const initialSslc = useRef(sslcData);
  const initialPu = useRef(puData);
  const initialHigher = useRef<Record<string, HigherEducation>>({});
  const initialExtra = useRef<Record<string, HigherEducation>>({});

  // Initialize refs for higher and extra educations on mount
  useEffect(() => {
    [...initialHigherEdu, ...initialExtraEdu].forEach((edu) => {
      if (edu.id) {
        if (initialHigherEdu.some((e) => e.id === edu.id)) {
          initialHigher.current[edu.id] = { ...edu };
        } else {
          initialExtra.current[edu.id] = { ...edu };
        }
      }
    });
  }, []);

  // Check SSLC changes
  useEffect(() => {
    const hasChanged =
      sslcData.institutionName !==
      (initialSslc.current.institutionName || "") ||
      sslcData.boardType !== (initialSslc.current.boardType || "") ||
      sslcData.resultFormat !== (initialSslc.current.resultFormat || "") ||
      sslcData.yearOfPassing !== (initialSslc.current.yearOfPassing || "") ||
      sslcData.result !== (initialSslc.current.result || "");
    setSslcChanged(hasChanged);
  }, [sslcData]);

  // Check PU changes
  useEffect(() => {
    const hasChanged =
      puData.institutionName !== (initialPu.current.institutionName || "") ||
      puData.boardType !== (initialPu.current.boardType || "") ||
      puData.yearOfPassing !== (initialPu.current.yearOfPassing || "") ||
      puData.resultFormat !== (initialPu.current.resultFormat || "") ||
      puData.subjectStream !== (initialPu.current.subjectStream || "") ||
      puData.result !== (initialPu.current.result || "");
    setPuChanged(hasChanged);
  }, [puData]);

  // Check Higher Education changes
  useEffect(() => {
    const changes: Record<string, string[]> = {};
    higherEducations.forEach((edu) => {
      const initial = initialHigher.current[edu.id];
      if (initial) {
        const changedFields = getEducationChangedFields(edu, initial);
        if (changedFields.length > 0) {
          changes[edu.id] = changedFields;
        }
      } else if (edu.degree || edu.institutionName) {
        // Treat new/unsaved education card as 'changed' if any field is filled
        changes[edu.id] = ["new"];
      }
    });
    setHigherChanges(changes);
  }, [higherEducations]);

  // Check Extra Education changes
  useEffect(() => {
    const changes: Record<string, string[]> = {};
    extraEducations.forEach((edu) => {
      const initial = initialExtra.current[edu.id];
      if (initial) {
        const changedFields = getEducationChangedFields(edu, initial);
        if (changedFields.length > 0) {
          changes[edu.id] = changedFields;
        }
      } else if (edu.degree || edu.institutionName) {
        // Treat new/unsaved education card as 'changed' if any field is filled
        changes[edu.id] = ["new"];
      }
    });
    setExtraChanges(changes);
  }, [extraEducations]);

  // Helper to extract changed fields between current and initial education objects
  const getEducationChangedFields = (
    current: HigherEducation,
    initial: HigherEducation
  ): string[] => {
    const changedFields = [];
    if (current.degree !== (initial.degree || "")) changedFields.push("degree");
    if ((current.fieldOfStudy || "") !== (initial.fieldOfStudy || ""))
      changedFields.push("fieldOfStudy");
    if (current.institutionName !== (initial.institutionName || ""))
      changedFields.push("institutionName");
    if (current.universityBoard !== (initial.universityBoard || ""))
      changedFields.push("universityBoard");
    if (current.startYear !== (initial.startYear || ""))
      changedFields.push("startYear");
    if (current.endYear !== (initial.endYear || ""))
      changedFields.push("endYear");
    if (current.resultFormat !== (initial.resultFormat || ""))
      changedFields.push("resultFormat");
    if (current.result !== (initial.result || "")) changedFields.push("result");
    if (current.currentlyPursuing !== (initial.currentlyPursuing || false))
      changedFields.push("currentlyPursuing");
    return changedFields;
  };

  // Helper function to validate result format
  const validateResult = (value: string, format: string) => {
    if (!format) return "";
    if (!value || !value.trim()) {
      return "Result is required when result format is selected";
    }

    // Ensure no negative sign is allowed if format is numeric
    if (format === "Percentage" || format === "CGPA") {
      if (value.startsWith("-")) return "Must be a positive number";
    }

    switch (format) {
      case "Percentage":
        if (!/^\d+(\.\d{1,2})?$/.test(value)) return "Enter valid percentage (e.g., 85 or 85.5)";
        const percentage = parseFloat(value);
        if (isNaN(percentage)) return "Must be a number";
        if (percentage < 0 || percentage > 100) return "Must be between 0-100";
        break;
      case "CGPA":
        if (!/^\d+(\.\d{1,2})?$/.test(value)) return "Enter valid CGPA (e.g., 8.5)";
        const cgpa = parseFloat(value);
        if (isNaN(cgpa)) return "Must be a number";
        if (cgpa < 0 || cgpa > 10) return "Must be between 0-10";
        break;
      case "Grade":
        if (!/^(?:A1|A2|B1|B2|C1|C2|D|E)$/i.test(value.trim()))
          return "Enter valid grade (A1, A2, B1, B2, C1, C2, D, E)";
        break;
    }
    return "";
  };

  // Helper function to validate institution/board names
  const validateInstitutionName = (value: string) => {
    if (!value || !value.trim()) return "Institution name is required";
    if (value.length > 100) {
      return "Max 100 characters allowed";
    }
    if (!LETTERS_ONLY_REGEX.test(value)) {
      return "Only letters allowed";
    }
    if (value.split(/\s+/).some((word) => word.length > 15)) {
      return "Each word must be 15 characters or less";
    }

    return "";
  };

  const validateAlphabetField = (value: string, label: string) => {
    if (!value || !value.trim()) return `${label} is required`;
    if (value.length > 50) return "Max 50 characters allowed";
    if (!LETTERS_ONLY_REGEX.test(value)) return "Only letters allowed";
    return "";
  };

  const sanitizeAlphabetInput = (value: string) =>
    value.replace(/[^A-Za-z\s]/g, "").slice(0, 50);

  const sanitizeInstitutionNameInput = (value: string) =>
    value.replace(/[^A-Za-z\s]/g, "").slice(0, 100);

  const validateYearOfPassing = (value: string, label = "Year of Passing") => {
    if (!value) return "";
    const error = validateMonthFormat(value);
    if (error) return error;
    const year = Number(value.slice(0, 4));
    if (year > CURRENT_YEAR) return `${label} cannot be after ${CURRENT_YEAR}`;
    return "";
  };

  const validateBoardType = (value: string) => {
    if (!value || !value.trim()) return "Board Type is required";
    return "";
  };

  // Helper function to validate date range
  const validateDateRange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      if (endDate <= startDate) {
        return "End date must be after start date";
      }
    }
    return "";
  };

  // Helper to format year for API payload
  const buildYear = (
    val: string | null | undefined
  ): string | number | null => {
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

    const n = parseInt(val as string, 10);
    return isNaN(n) ? val : n;
  };

  // Helper to get current month in YYYY-MM format (for blocking future dates)
  const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const validateMonthFormat = (value: string) => {
    if (!value || value === "") return "";
    if (!/^\d{4}-\d{2}$/.test(value)) {
      return "Please select a valid month (YYYY-MM)";
    }
    const [y, m] = value.split("-");
    if (y.length !== 4) return "Year must be 4 digits";
    const yearNum = parseInt(y, 10);
    if (yearNum <= 1960) return "Year must be after 1960";
    if (yearNum > CURRENT_YEAR) return `Year cannot be after ${CURRENT_YEAR}`;
    const monthNum = parseInt(m, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12)
      return "Invalid month";
    return "";
  };

  // Helper function to check if education card has any data filled
  const isEducationCardFilled = (edu: HigherEducation): boolean => {
    return !!(
      edu.degree ||
      edu.fieldOfStudy ||
      edu.institutionName ||
      edu.universityBoard ||
      edu.startYear ||
      edu.endYear ||
      edu.resultFormat ||
      edu.result
    );
  };

  // Helper function to validate mandatory fields if degree is selected
  const validateMandatoryFields = (
    edu: HigherEducation,
    prefix: string
  ): void => {
    if (edu.degree) {
      const requiredFields = [
        { key: "fieldOfStudy", message: "Field of Study is required", validator: () => validateAlphabetField(edu.fieldOfStudy || "", "Field of Study") },
        { key: "institutionName", message: "Institution Name is required", validator: () => validateInstitutionName(edu.institutionName) },
        { key: "universityBoard", message: "University/Board is required", validator: () => validateAlphabetField(edu.universityBoard, "University/Board") },
        { key: "startYear", message: "Start Year is required", validator: () => validateMonthFormat(edu.startYear) },
        { key: "resultFormat", message: "Result Format is required", validator: () => "" },
        { key: "result", message: "Result is required", validator: () => validateResult(edu.result, edu.resultFormat) },
      ];

      requiredFields.forEach(({ key, message, validator }) => {
        if (!edu[key as keyof HigherEducation]) {
          setErrors((prev) => ({ ...prev, [`${prefix}-${key}`]: message }));
        } else {
          const error = validator();
          setErrors((prev) => {
            const updated = { ...prev };
            if (error) {
              updated[`${prefix}-${key}`] = error;
            } else {
              delete updated[`${prefix}-${key}`];
            }
            return updated;
          });
        }
      });

      if (!edu.currentlyPursuing && !edu.endYear) {
        setErrors((prev) => ({ ...prev, [`${prefix}-endYear`]: "End Year is required" }));
      } else {
        const endYearError =
          !edu.currentlyPursuing && edu.endYear
            ? validateMonthFormat(edu.endYear) || validateDateRange(edu.startYear, edu.endYear)
            : "";
        setErrors((prev) => {
          const updated = { ...prev };
          if (endYearError) {
            updated[`${prefix}-endYear`] = endYearError;
          } else if (updated[`${prefix}-endYear`] === "End Year is required" || !endYearError) {
            delete updated[`${prefix}-endYear`];
          }
          return updated;
        });
      }

    } else if (isEducationCardFilled(edu)) {
      if (!edu.resultFormat) {
        setErrors((prev) => ({
          ...prev,
          [`${prefix}-resultFormat`]: "Result Format is required if data is entered",
        }));
      } else {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[`${prefix}-resultFormat`];
          return updated;
        });
      }

      if (!edu.result) {
        setErrors((prev) => ({
          ...prev,
          [`${prefix}-result`]: "Result is required if data is entered",
        }));
      } else {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[`${prefix}-result`];
          return updated;
        });
      }
    } else {
      // If card is empty, clear the mandatory errors
      const keysToClear = ["fieldOfStudy", "institutionName", "universityBoard", "startYear", "endYear", "resultFormat", "result"];
      setErrors((prev) => {
        const updated = { ...prev };
        keysToClear.forEach(key => delete updated[`${prefix}-${key}`]);
        return updated;
      });
    }
  };

  // Handler for SSLC data changes
  const handleSslcChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "institutionName") {
      finalValue = sanitizeInstitutionNameInput(value);
    }
    if (name === "result" && sslcData.resultFormat === "Grade") {
      finalValue = value.toUpperCase();
    }
    setSslcData((prev) => {
      const nextData = { ...prev, [name]: finalValue };
      if (name === "resultFormat") {
        nextData.result = "";
      }
      return nextData;
    });

    if (name === "result") {
      const error = validateResult(finalValue, sslcData.resultFormat);
      setErrors((prev) => ({ ...prev, [`sslc-result`]: error }));
    } else if (name === "resultFormat") {
      const error = validateResult("", value);
      setErrors((prev) => ({ ...prev, [`sslc-result`]: error, [`sslc-resultFormat`]: value ? "" : "Result Format is required" }));
    } else if (name === "institutionName") {
      const error = validateInstitutionName(finalValue);
      setErrors((prev) => ({ ...prev, [`sslc-institutionName`]: error }));
    } else if (name === "boardType") {
      const error = validateBoardType(finalValue);
      setErrors((prev) => ({ ...prev, [`sslc-boardType`]: error }));
    } else if (name === "yearOfPassing") {
      const error = validateYearOfPassing(finalValue);
      setErrors((prev) => ({ ...prev, [`sslc-yearOfPassing`]: error }));
    }
  };

  // Handler for PU data changes
  const handlePuChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "institutionName") {
        finalValue = sanitizeInstitutionNameInput(value);   // ✅ caps at 100

    }
    if (name === "result" && puData.resultFormat === "Grade") {
      finalValue = value.toUpperCase();
    }
    setPuData((prev) => {
      const nextData = { ...prev, [name]: finalValue };
      if (name === "resultFormat") {
        nextData.result = "";
      }
      return nextData;
    });

    if (name === "result") {
      const error = validateResult(finalValue, puData.resultFormat);
      setErrors((prev) => ({ ...prev, [`pu-result`]: error }));
    } else if (name === "resultFormat") {
      const error = validateResult("", value);
      setErrors((prev) => ({ ...prev, [`pu-result`]: error, [`pu-resultFormat`]: value ? "" : "Result Format is required" }));
    } else if (name === "institutionName") {
      const error = validateInstitutionName(finalValue);
      setErrors((prev) => ({ ...prev, [`pu-institutionName`]: error }));
    } else if (name === "boardType") {
      const error = validateBoardType(finalValue);
      setErrors((prev) => ({ ...prev, [`pu-boardType`]: error }));
    } else if (name === "yearOfPassing") {
      const error = validateYearOfPassing(finalValue);
      setErrors((prev) => ({ ...prev, [`pu-yearOfPassing`]: error }));
    }
  };

  // Handler for Higher/Extra Education card data changes
  const handleEducationChange = (
    id: string,
    field: string,
    value: string | boolean,
    isExtra: boolean
  ) => {
    const setter = isExtra ? setExtraEducations : setHigherEducations;
    const currentList = isExtra ? extraEducations : higherEducations;
    const index = currentList.findIndex((e) => e.id === id);
    const prefix = isExtra ? `extra-${index}` : `higher-${index}`;

    let finalValue = value;
    if (
      typeof value === "string" &&
      (field === "fieldOfStudy" ||
        field === "universityBoard")
    ) {
      finalValue = sanitizeAlphabetInput(value);
    } else if (typeof value === "string" && field === "institutionName") {
      finalValue = sanitizeInstitutionNameInput(value);
    }
    if (field === "result" && typeof value === "string" && currentList[index]?.resultFormat === "Grade") {
      finalValue = value.toUpperCase();
    }

    setter((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: finalValue };

      if (field === "resultFormat") {
        updated[index].result = "";
      }

      if (field === "currentlyPursuing" && finalValue === true) {
        updated[index].endYear = "";
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[`${prefix}-endYear`];
          return newErrors;
        });
      } else if (field === "currentlyPursuing" && finalValue === false) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[`${prefix}-endYear`];
          return newErrors;
        });
      }

      return updated;
    });

    // Validation logic
    const updatedEdu = { ...currentList[index], [field]: finalValue };
    if (field === "resultFormat") {
      updatedEdu.result = "";
    }

    if (field === "result" && typeof finalValue === "string") {
      const error = validateResult(finalValue, updatedEdu.resultFormat);
      setErrors((prev) => ({ ...prev, [`${prefix}-result`]: error }));
    } else if (field === "resultFormat" && typeof finalValue === "string") {
      const error = validateResult(updatedEdu.result, finalValue);
      setErrors((prev) => ({
        ...prev,
        [`${prefix}-result`]: error,
        [`${prefix}-resultFormat`]: finalValue ? "" : "Result Format is required",
      }));
    } else if (field === "fieldOfStudy" && typeof finalValue === "string") {
      const error = validateAlphabetField(finalValue, "Field of Study");
      setErrors((prev) => ({ ...prev, [`${prefix}-fieldOfStudy`]: error }));
    } else if (field === "institutionName" && typeof finalValue === "string") {
      const error = validateInstitutionName(finalValue);
      setErrors((prev) => ({ ...prev, [`${prefix}-institutionName`]: error }));
    } else if (field === "universityBoard" && typeof finalValue === "string") {
      const error = validateAlphabetField(finalValue, "University/Board");
      setErrors((prev) => ({ ...prev, [`${prefix}-universityBoard`]: error }));
    } else if (field === "startYear" && typeof finalValue === "string") {
      const fmtError = validateMonthFormat(finalValue);
      if (fmtError) {
        setErrors((prev) => ({ ...prev, [`${prefix}-startYear`]: fmtError }));
      } else {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[`${prefix}-startYear`];
          return updated;
        });
      }

      const rangeError = validateDateRange(finalValue, updatedEdu.endYear);
      setErrors((prev) => ({ ...prev, [`${prefix}-endYear`]: rangeError }));
    } else if (field === "endYear" && typeof finalValue === "string") {
      const fmtError = validateMonthFormat(finalValue);
      if (fmtError) {
        setErrors((prev) => ({ ...prev, [`${prefix}-endYear`]: fmtError }));
      } else {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[`${prefix}-endYear`];
          return updated;
        });
        const rangeError = validateDateRange(updatedEdu.startYear, finalValue);
        setErrors((prev) => ({ ...prev, [`${prefix}-endYear`]: rangeError }));
      }
    }

    // After all validations, check if result format and result are mandatory
    validateMandatoryFields(updatedEdu, prefix);
  };

  // Handler for saving SSLC details (PUT/POST call)
  const handleSaveSslc = async () => {
    const currentData = sslcData;
    const initial = initialSslc.current;

    let hasError = false;

    const instError = validateInstitutionName(currentData.institutionName);
    if (instError) {
      setErrors((prev) => ({ ...prev, "sslc-institutionName": instError }));
      hasError = true;
    }

    const boardTypeError = validateBoardType(currentData.boardType);
    if (boardTypeError) {
      setErrors((prev) => ({ ...prev, "sslc-boardType": boardTypeError }));
      hasError = true;
    }

    const yearError = validateYearOfPassing(currentData.yearOfPassing);
    if (yearError) {
      setErrors((prev) => ({ ...prev, "sslc-yearOfPassing": yearError }));
      hasError = true;
    }

    if (!currentData.resultFormat) {
      setErrors((prev) => ({ ...prev, "sslc-resultFormat": "Result Format is required" }));
      hasError = true;
    }

    if (!currentData.result) {
      setErrors((prev) => ({ ...prev, "sslc-result": "Result is required" }));
      hasError = true;
    } else if (currentData.resultFormat) {
      const resultError = validateResult(currentData.result, currentData.resultFormat);
      if (resultError) {
        setErrors((prev) => ({ ...prev, "sslc-result": resultError }));
        hasError = true;
      }
    }

    if (hasError) return;

    // Check for any remaining validation errors
    if (errors["sslc-institutionName"] || errors["sslc-boardType"] || errors["sslc-yearOfPassing"] || errors["sslc-resultFormat"] || errors["sslc-result"]) return;

    try {
      let payload: Record<string, any> = {};
      let isChanged = false;

      // Build payload with only changed fields for PUT
      if (currentData.institutionName !== (initial.institutionName || "")) {
        payload.institution_name = currentData.institutionName;
        isChanged = true;
      }
      if (currentData.boardType !== (initial.boardType || "")) {
        payload.board_type = currentData.boardType;
        isChanged = true;
      }
      if (currentData.resultFormat !== (initial.resultFormat || "")) {
        payload.result_format = currentData.resultFormat?.toLowerCase();
        isChanged = true;
      }
      if (currentData.yearOfPassing !== (initial.yearOfPassing || "")) {
        payload.end_year = buildYear(currentData.yearOfPassing);
        isChanged = true;
      }
      if (currentData.result !== (initial.result || "")) {
        payload.result = currentData.result;
        isChanged = true;
      }

      if (!isChanged) {
        setSslcFeedback("No changes to save.");
        setTimeout(() => setSslcFeedback(""), 3000);
        return;
      }

      if (currentData.education_id) {
        // Update existing record (PUT)
        await updateEducationDetails(
          userId,
          token,
          currentData.education_id,
          payload
        );
        initialSslc.current = { ...currentData };
        setSslcChanged(false);
        setSslcFeedback("SSLC details updated successfully!");
      } else {
        // Create new record (POST) - need full payload
        const fullPayload = {
          education_type: "sslc",
          institution_name: currentData.institutionName || "",
          board_type: currentData.boardType || "",
          end_year: buildYear(currentData.yearOfPassing),
          result_format: (currentData.resultFormat || "").toLowerCase(),
          result: currentData.result || "",
        };
        const response = await saveEducationDetails(userId, token, [
          fullPayload,
        ]);
        if (response && response[0]) {
          setSslcData((prev) => ({
            ...prev,
            education_id: response[0].education_id,
          }));
          initialSslc.current = {
            ...currentData,
            education_id: response[0].education_id,
          };
        }
        setSslcChanged(false);
        setSslcFeedback("SSLC details saved successfully! ");
      }

      setTimeout(() => setSslcFeedback(""), 3000);
    } catch (error) {
      console.error("Error saving SSLC:", error);
      setSslcFeedback("Failed to save SSLC details ");
      setTimeout(() => setSslcFeedback(""), 3000);
    }
  };

  // Handler for saving PU details (PUT/POST call)
  const handleSavePu = async () => {
    const currentData = puData;
    const initial = initialPu.current;

    let hasError = false;

    const instError = validateInstitutionName(currentData.institutionName);
    if (instError) {
      setErrors((prev) => ({ ...prev, "pu-institutionName": instError }));
      hasError = true;
    }

    const boardTypeError = validateBoardType(currentData.boardType);
    if (boardTypeError) {
      setErrors((prev) => ({ ...prev, "pu-boardType": boardTypeError }));
      hasError = true;
    }

    const yearError = validateYearOfPassing(currentData.yearOfPassing);
    if (yearError) {
      setErrors((prev) => ({ ...prev, "pu-yearOfPassing": yearError }));
      hasError = true;
    }

    if (!currentData.resultFormat) {
      setErrors((prev) => ({ ...prev, "pu-resultFormat": "Result Format is required" }));
      hasError = true;
    }

    if (!currentData.result) {
      setErrors((prev) => ({ ...prev, "pu-result": "Result is required" }));
      hasError = true;
    } else if (currentData.resultFormat) {
      const resultError = validateResult(currentData.result, currentData.resultFormat);
      if (resultError) {
        setErrors((prev) => ({ ...prev, "pu-result": resultError }));
        hasError = true;
      }
    }

    if (hasError) return;

    // Check for any remaining validation errors
    if (errors["pu-institutionName"] || errors["pu-boardType"] || errors["pu-yearOfPassing"] || errors["pu-resultFormat"] || errors["pu-result"]) return;

    try {
      let payload: Record<string, any> = {};
      let isChanged = false;

      // Build payload with only changed fields for PUT
      if (currentData.institutionName !== (initial.institutionName || "")) {
        payload.institution_name = currentData.institutionName;
        isChanged = true;
      }
      if (currentData.boardType !== (initial.boardType || "")) {
        payload.board_type = currentData.boardType;
        isChanged = true;
      }
      if (currentData.subjectStream !== (initial.subjectStream || "")) {
        payload.subject_stream = currentData.subjectStream;
        isChanged = true;
      }
      if (currentData.resultFormat !== (initial.resultFormat || "")) {
        payload.result_format = currentData.resultFormat?.toLowerCase();
        isChanged = true;
      }
      if (currentData.yearOfPassing !== (initial.yearOfPassing || "")) {
        payload.end_year = buildYear(currentData.yearOfPassing);
        isChanged = true;
      }
      if (currentData.result !== (initial.result || "")) {
        payload.result = currentData.result;
        isChanged = true;
      }

      if (!isChanged) {
        setPuFeedback("No changes to save.");
        setTimeout(() => setPuFeedback(""), 3000);
        return;
      }

      if (currentData.education_id) {
        // Update existing record (PUT)
        await updateEducationDetails(
          userId,
          token,
          currentData.education_id,
          payload
        );
        initialPu.current = { ...currentData };
        setPuChanged(false);
        setPuFeedback("PU details updated successfully! ");
      } else {
        // Create new record (POST) - need full payload
        const fullPayload = {
          education_type: "puc",
          institution_name: currentData.institutionName || "",
          board_type: currentData.boardType || "",
          subject_stream: currentData.subjectStream || "",
          end_year: buildYear(currentData.yearOfPassing),
          result_format: (currentData.resultFormat || "").toLowerCase(),
          result: currentData.result || "",
        };
        const response = await saveEducationDetails(userId, token, [
          fullPayload,
        ]);
        if (response && response[0]) {
          setPuData((prev) => ({
            ...prev,
            education_id: response[0].education_id,
          }));
          initialPu.current = {
            ...currentData,
            education_id: response[0].education_id,
          };
        }
        setPuChanged(false);
        setPuFeedback("PU details saved successfully! ");
      }

      setTimeout(() => setPuFeedback(""), 3000);
    } catch (error) {
      console.error("Error saving PU:", error);
      setPuFeedback("Failed to save PU details ");
      setTimeout(() => setPuFeedback(""), 3000);
    }
  };

  // Handler for saving Higher/Extra Education card details (PUT/POST call)
  const handleSaveHigherEducation = async (
    edu: HigherEducation,
    isExtra: boolean
  ) => {
    const eduChanges = isExtra ? extraChanges[edu.id] : higherChanges[edu.id];
    const prefix = isExtra
      ? `extra-${extraEducations.findIndex((e) => e.id === edu.id)}`
      : `higher-${higherEducations.findIndex((e) => e.id === edu.id)}`;
    const resultError = validateResult(edu.result, edu.resultFormat);
    const fieldOfStudyError = validateAlphabetField(edu.fieldOfStudy || "", "Field of Study");
    const institutionError = validateInstitutionName(edu.institutionName);
    const universityBoardError = validateAlphabetField(edu.universityBoard, "University/Board");
    const startYearError = edu.startYear ? validateMonthFormat(edu.startYear) : "";
    const endYearFormatError = edu.endYear ? validateMonthFormat(edu.endYear) : "";
    const dateRangeError = validateDateRange(edu.startYear, edu.endYear);

    let hasError = false;
    const newErrors: Record<string, string> = {};

    if (edu.degree || isEducationCardFilled(edu)) {
      if (!edu.fieldOfStudy) { newErrors[`${prefix}-fieldOfStudy`] = "Field of Study is required"; hasError = true; }
      else if (fieldOfStudyError) { newErrors[`${prefix}-fieldOfStudy`] = fieldOfStudyError; hasError = true; }
      if (!edu.institutionName) { newErrors[`${prefix}-institutionName`] = "Institution Name is required"; hasError = true; }
      else if (institutionError) { newErrors[`${prefix}-institutionName`] = institutionError; hasError = true; }
      if (!edu.universityBoard) { newErrors[`${prefix}-universityBoard`] = "University/Board is required"; hasError = true; }
      else if (universityBoardError) { newErrors[`${prefix}-universityBoard`] = universityBoardError; hasError = true; }
      if (!edu.startYear) { newErrors[`${prefix}-startYear`] = "Start Year is required"; hasError = true; }
      else if (startYearError) { newErrors[`${prefix}-startYear`] = startYearError; hasError = true; }
      if (!edu.currentlyPursuing && !edu.endYear) { newErrors[`${prefix}-endYear`] = "End Year is required"; hasError = true; }
      else if (!edu.currentlyPursuing && (endYearFormatError || dateRangeError)) {
        newErrors[`${prefix}-endYear`] = endYearFormatError || dateRangeError;
        hasError = true;
      }
      if (!edu.resultFormat) { newErrors[`${prefix}-resultFormat`] = "Result Format is required"; hasError = true; }
      if (!edu.result) { newErrors[`${prefix}-result`] = "Result is required"; hasError = true; }
      if (resultError) { newErrors[`${prefix}-result`] = resultError; hasError = true; }
    }

    if (hasError) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    // Check for any other pre-existing validation errors
    if (
      errors[`${prefix}-fieldOfStudy`] ||
      errors[`${prefix}-result`] ||
      errors[`${prefix}-resultFormat`] ||
      errors[`${prefix}-institutionName`] ||
      errors[`${prefix}-universityBoard`] ||
      errors[`${prefix}-startYear`] ||
      errors[`${prefix}-endYear`]
    )
      return;

    const isNew = !edu.education_id;
    // Handle initial save or update
    try {
      let payload: Record<string, any> = {};

      if (isNew) {
        // New record, construct full payload
        payload = {
          education_type: "higher",
          degree: edu.degree || "",
          field_of_study: edu.fieldOfStudy || "",
          institution_name: edu.institutionName || "",
          university_name: edu.universityBoard || "",
          start_year: buildYear(edu.startYear),
          end_year: buildYear(edu.endYear),
          result_format: (edu.resultFormat || "").toLowerCase(),
          result: edu.result || "",
          currently_pursuing: edu.currentlyPursuing || false,
        };

        // Skip saving empty new cards
        if (!edu.degree && !edu.institutionName) {
          const feedbackSetter = isExtra ? setExtraFeedback : setHigherFeedback;
          feedbackSetter((prev) => ({
            ...prev,
            [edu.id]: "Cannot save empty card.",
          }));
          setTimeout(
            () =>
              feedbackSetter((prev) => {
                const updated = { ...prev };
                delete updated[edu.id];
                return updated;
              }),
            3000
          );
          return;
        }

        const response = await saveEducationDetails(userId, token, [payload]);
        const updatedEdu = { ...edu, education_id: response[0].education_id };

        // Update local state and refs
        const setter = isExtra ? setExtraEducations : setHigherEducations;
        setter((prev) => prev.map((e) => (e.id === edu.id ? updatedEdu : e)));
        const initialRef = isExtra ? initialExtra : initialHigher;
        initialRef.current[edu.id] = updatedEdu;

        const feedbackSetter = isExtra ? setExtraFeedback : setHigherFeedback;
        feedbackSetter((prev) => ({
          ...prev,
          [edu.id]: "Saved successfully! ",
        }));
      } else {
        // Existing record, check for changes and build minimal payload (PUT)
        if (!eduChanges || eduChanges.length === 0) {
          const feedbackSetter = isExtra ? setExtraFeedback : setHigherFeedback;
          feedbackSetter((prev) => ({
            ...prev,
            [edu.id]: "No changes to save.",
          }));
          setTimeout(
            () =>
              feedbackSetter((prev) => {
                const updated = { ...prev };
                delete updated[edu.id];
                return updated;
              }),
            3000
          );
          return;
        }

        eduChanges.forEach((field) => {
          switch (field) {
            case "degree":
              payload.degree = edu.degree;
              break;
            case "fieldOfStudy":
              payload.field_of_study = edu.fieldOfStudy || "";
              break;
            case "institutionName":
              payload.institution_name = edu.institutionName;
              break;
            case "universityBoard":
              payload.university_name = edu.universityBoard;
              break;
            case "startYear":
              payload.start_year = buildYear(edu.startYear);
              break;
            case "endYear":
              payload.end_year = buildYear(edu.endYear);
              break;
            case "resultFormat":
              payload.result_format = edu.resultFormat?.toLowerCase();
              break;
            case "result":
              payload.result = edu.result;
              break;
            case "currentlyPursuing":
              payload.currently_pursuing = edu.currentlyPursuing;
              break;
          }
        });

        await updateEducationDetails(userId, token, edu.education_id, payload);

        // Update local state and refs
        const initialRef = isExtra ? initialExtra : initialHigher;
        initialRef.current[edu.id] = { ...edu };

        const changesSetter = isExtra ? setExtraChanges : setHigherChanges;
        changesSetter((prev) => {
          const updated = { ...prev };
          delete updated[edu.id];
          return updated;
        });

        const feedbackSetter = isExtra ? setExtraFeedback : setHigherFeedback;
        feedbackSetter((prev) => ({
          ...prev,
          [edu.id]: "Updated successfully! ",
        }));
      }

      // Clear feedback after 3 seconds
      setTimeout(() => {
        const feedbackSetter = isExtra ? setExtraFeedback : setHigherFeedback;
        feedbackSetter((prev) => {
          const updated = { ...prev };
          delete updated[edu.id];
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error("Error saving education:", error);
      const feedback = isNew ? "Failed to save " : "Failed to update ";
      const feedbackSetter = isExtra ? setExtraFeedback : setHigherFeedback;
      feedbackSetter((prev) => ({ ...prev, [edu.id]: feedback }));
      setTimeout(
        () =>
          feedbackSetter((prev) => {
            const updated = { ...prev };
            delete updated[edu.id];
            return updated;
          }),
        3000
      );
    }
  };

  // Handler to add an extra education card
  const addEducation = () => {
    const newEdu: HigherEducation = {
      id: Date.now().toString(),
      degree: "",
      fieldOfStudy: "",
      institutionName: "",
      universityBoard: "",
      startYear: "",
      endYear: "",
      resultFormat: "",
      result: "",
      currentlyPursuing: false,
    };
    setExtraEducations([...extraEducations, newEdu]);
    setExtraExpanded((prev) => ({ ...prev, [newEdu.id]: true }));
    // A new card is considered 'changed' until saved
    setExtraChanges((prev) => ({ ...prev, [newEdu.id]: ["new"] }));
  };

  // Handler to remove an extra education card and perform DELETE API call if necessary
  const removeEducation = async (index: number) => {
    const edu = extraEducations[index];

    if (edu.education_id) {
      try {
        await deleteEducation(userId, token, edu.education_id);
        deletedEducationIds.current.push(edu.education_id);
        const feedbackSetter = setExtraFeedback;
        feedbackSetter((prev) => ({
          ...prev,
          [edu.id]: "Deleted successfully! ",
        }));
        setTimeout(
          () =>
            feedbackSetter((prev) => {
              const updated = { ...prev };
              delete updated[edu.id];
              return updated;
            }),
          3000
        );
      } catch (error) {
        console.error("Error deleting education:", error);
        setExtraFeedback((prev) => ({
          ...prev,
          [edu.id]: "Failed to delete ",
        }));
        setTimeout(
          () =>
            setExtraFeedback((prev) => {
              const updated = { ...prev };
              delete updated[edu.id];
              return updated;
            }),
          3000
        );
        return;
      }
    }

    // Remove from state and clear associated data/errors
    const id = edu.id;
    setExtraEducations(extraEducations.filter((_, i) => i !== index));
    setExtraExpanded((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setExtraChanges((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setErrors((prev) => {
      const updated = { ...prev };
      // Clear errors by matching the prefix pattern for the removed index
      Object.keys(updated).forEach((key) => {
        if (key.startsWith(`extra-${index}-`)) {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  // Handler for clearing SSLC form data (RESET/UNDO)
  const handleClearEducationSSLC = () => {
    const initial = initialSslc.current;
    setSslcData((prev) => ({
      ...prev,
      institutionName: initial.institutionName || "",
      boardType: initial.boardType || "",
      resultFormat: initial.resultFormat || "",
      yearOfPassing: initial.yearOfPassing || "",
      result: initial.result || "",
    }));
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated["sslc-result"];
      delete updated["sslc-institutionName"];
      return updated;
    });
    // Since state is reset to initial, useEffect will set sslcChanged to false
    setSslcFeedback("");
  };

  // Handler for clearing PU form data (RESET/UNDO)
  const handleClearEducationPreUniversity = () => {
    const initial = initialPu.current;
    setPuData((prev) => ({
      ...prev,
      institutionName: initial.institutionName || "",
      boardType: initial.boardType || "",
      yearOfPassing: initial.yearOfPassing || "",
      resultFormat: initial.resultFormat || "",
      subjectStream: initial.subjectStream || "",
      result: initial.result || "",
    }));
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated["pu-result"];
      delete updated["pu-institutionName"];
      return updated;
    });
    // Since state is reset to initial, useEffect will set puChanged to false
    setPuFeedback("");
  };

  // Handler for clearing Higher/Extra Education card data (RESET/UNDO)
  const handleClearHigherEducation = (id: string, isExtra: boolean) => {
    const setter = isExtra ? setExtraEducations : setHigherEducations;
    const initialRef = isExtra ? initialExtra : initialHigher;
    const initial = initialRef.current[id];

    if (!initial) {
      // If no initial data (new unsaved card), clear all fields
      const currentList = isExtra ? extraEducations : higherEducations;
      const index = currentList.findIndex((e) => e.id === id);
      const prefix = isExtra ? `extra-${index}` : `higher-${index}`;

      setter((prev) =>
        prev.map((edu, i) =>
          i === index
            ? {
              ...edu,
              degree: "",
              fieldOfStudy: "",
              institutionName: "",
              universityBoard: "",
              startYear: "",
              endYear: "",
              resultFormat: "",
              result: "",
              currentlyPursuing: false,
            }
            : edu
        )
      );
      const changesSetter = isExtra ? setExtraChanges : setHigherChanges;
      changesSetter((prev) => ({ ...prev, [id]: ["cleared"] }));
    } else {
      // If initial data exists, reset to initial data
      const currentList = isExtra ? extraEducations : higherEducations;
      const index = currentList.findIndex((e) => e.id === id);
      const prefix = isExtra ? `extra-${index}` : `higher-${index}`;

      setter((prev) =>
        prev.map((edu) => (edu.id === id ? { ...initial } : edu))
      );

      // Clear changes object for this card (useEffect will re-evaluate and typically remove the entry)
      const changesSetter = isExtra ? setExtraChanges : setHigherChanges;
      changesSetter((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }

    // Clear errors for this card
    const currentList = isExtra ? extraEducations : higherEducations;
    const index = currentList.findIndex((e) => e.id === id);
    const prefix = isExtra ? `extra-${index}` : `higher-${index}`;

    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[`${prefix}-result`];
      delete updated[`${prefix}-institutionName`];
      delete updated[`${prefix}-universityBoard`];
      delete updated[`${prefix}-endYear`];
      return updated;
    });
  };

  // Check if there are any unsaved changes in any section
  const hasUnsavedChanges =
    sslcChanged ||
    puChanged ||
    Object.keys(higherChanges).length > 0 ||
    Object.keys(extraChanges).length > 0;

  // Final submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const resultErrors: { [key: string]: string } = {};
    const sslcBoardTypeError =
      sslcData.boardType ||
        !(sslcData.institutionName || sslcData.resultFormat || sslcData.yearOfPassing || sslcData.result)
        ? ""
        : "Board Type is required";
    const puBoardTypeError =
      puData.boardType ||
        !(puData.institutionName || puData.subjectStream || puData.resultFormat || puData.yearOfPassing || puData.result)
        ? ""
        : "Board Type is required";
    const sslcResultError = validateResult(sslcData.result, sslcData.resultFormat);
    const puResultError = validateResult(puData.result, puData.resultFormat);

    const sslcResultFormatError =
      sslcData.resultFormat ||
        !(sslcData.institutionName || sslcData.boardType || sslcData.yearOfPassing || sslcData.result)
        ? ""
        : "Result Format is required";
    const puResultFormatError =
      puData.resultFormat ||
        !(puData.institutionName || puData.boardType || puData.subjectStream || puData.yearOfPassing || puData.result)
        ? ""
        : "Result Format is required";

    if (sslcBoardTypeError) resultErrors["sslc-boardType"] = sslcBoardTypeError;
    if (puBoardTypeError) resultErrors["pu-boardType"] = puBoardTypeError;
    if (sslcResultError) resultErrors["sslc-result"] = sslcResultError;
    if (puResultError) resultErrors["pu-result"] = puResultError;
    if (sslcResultFormatError) resultErrors["sslc-resultFormat"] = sslcResultFormatError;
    if (puResultFormatError) resultErrors["pu-resultFormat"] = puResultFormatError;

    higherEducations.forEach((edu, index) => {
      const resultError = validateResult(edu.result, edu.resultFormat);
      if (resultError) resultErrors[`higher-${index}-result`] = resultError;
      if (!edu.resultFormat && (edu.degree || isEducationCardFilled(edu))) {
        resultErrors[`higher-${index}-resultFormat`] = "Result Format is required";
      }
    });

    extraEducations.forEach((edu, index) => {
      const resultError = validateResult(edu.result, edu.resultFormat);
      if (resultError) resultErrors[`extra-${index}-result`] = resultError;
      if (!edu.resultFormat && (edu.degree || isEducationCardFilled(edu))) {
        resultErrors[`extra-${index}-resultFormat`] = "Result Format is required";
      }
    });

    if (Object.keys(resultErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...resultErrors }));
      setSubmitError("Please enter the result for each selected result format.");
      return;
    }

    // 1️⃣ Validation errors
    if (Object.values(errors).some((err) => err.length > 0)) {
      setSubmitError("Please fix validation errors before proceeding.");
      return;
    }

    // 2️⃣ Unsaved changes
    if (hasUnsavedChanges) {
      let message = "Please save your changes before proceeding:\n\n";

      if (sslcChanged) {
        message += "• SSLC (10th Standard) (unsaved changes)\n";
      }

      if (puChanged) {
        message += "• Pre-University (12th Standard) (unsaved changes)\n";
      }

      // Mandatory Higher Education cards
      higherEducations.forEach((edu, index) => {
        if (higherChanges[edu.id]) {
          message += `• Education ${index + 1} (unsaved changes)\n`;
        }
      });

      // Additional Education cards
      extraEducations.forEach((edu, index) => {
        if (extraChanges[edu.id]) {
          message += `• Additional Education ${index + 1} (unsaved changes)\n`;
        }
      });

      setSubmitError(message);
      return;
    }

    // 3️⃣ Mandatory degree check
    if (
      higherEducations &&
      higherEducations.length > 0 &&
      !higherEducations[0]?.degree
    ) {
      setSubmitError(
        "First Education Entry (degree) is required before proceeding."
      );
      return;
    }

    setSubmitError("");

    onNext({
      sslc: sslcData,
      pu: puData,
      higherEducations: higherEducations.filter(
        (e) => e.degree || e.fieldOfStudy || e.institutionName || e.education_id
      ),
      extraEducations: extraEducations.filter(
        (e) => e.degree || e.fieldOfStudy || e.institutionName || e.education_id
      ),
      deletedEducationIds: deletedEducationIds.current,
    });
  };

  // Render function for all education cards
  const renderEducationCard = (
    education: HigherEducation,
    index: number,
    isExtra: boolean = false,
    isMandatory: boolean = false
  ) => {
    const id = education.id;
    const expanded = isExtra ? extraExpanded[id] : higherExpanded[id];
    const prefix = isExtra ? `extra-${index}` : `higher-${index}`;
    const changed = isExtra
      ? extraChanges[id]?.length > 0
      : higherChanges[id]?.length > 0;
    const feedback = isExtra ? extraFeedback[id] : higherFeedback[id];
    const handleSave = () => handleSaveHigherEducation(education, isExtra);
    const handleClear = () => handleClearHigherEducation(id, isExtra);
    const handleChange = (field: string, value: string | boolean) =>
      handleEducationChange(id, field, value, isExtra);

    return (
      <div
        key={id}
        className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
            {isExtra ? `Degree ${index + 1}` : "Degree"}
          </h3>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => handleEducationExpandToggle(id, isExtra)}
              className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronDown
                className={`w-3 h-3 text-gray-600 transition-transform cursor-pointer ${expanded ? "" : "rotate-180"
                  }`}
                strokeWidth={2.5}
              />
            </button>
            {isExtra && (
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="w-5 h-5 flex items-center justify-center rounded border-2 border-red-500 hover:bg-red-50 transition-colors"
                title="Delete this education record"
              >
                <Trash2
                  className="w-3 h-3 text-red-500 cursor-pointer"
                  strokeWidth={2.5}
                />
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Degree */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Degree
                </label>
                <div className="relative">
                  <select
                    value={education.degree}
                    onChange={(e) => handleChange("degree", e.target.value)}
                    className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-xs sm:text-sm appearance-none bg-white pr-8"
                  >
                    <option value="">Select Degree</option>
                    <option value="B.A">B.A</option>
                    <option value="B.Arch">B.Arch</option>
                    <option value="BBA">BBA</option>
                    <option value="BCA">BCA</option>
                    <option value="B.Com">B.Com</option>
                    <option value="B.E">B.E</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="M.Sc">M.Sc</option>
                    <option value="MBA">MBA</option>
                    <option value="MCA">MCA</option>
                    <option value="Diploma">Diploma</option>
                    <option value="PhD">PhD</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Field of Study */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Field of Study
                </label>
                <input
                  type="text"
                  value={education.fieldOfStudy || ""}
                  onChange={(e) =>
                    handleChange("fieldOfStudy", e.target.value)
                  }
                  maxLength={50}
                  placeholder="Enter Field of Study"
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors[`${prefix}-fieldOfStudy`]
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                    }`}
                />
                {errors[`${prefix}-fieldOfStudy`] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[`${prefix}-fieldOfStudy`]}
                  </p>
                )}
              </div>

              {/* Institution Name */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={education.institutionName}
                  onChange={(e) =>
                    handleChange("institutionName", e.target.value)
                  }
                  maxLength={100}
                  placeholder="Enter Institution Name"
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors[`${prefix}-institutionName`]
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                    }`}
                />
                {errors[`${prefix}-institutionName`] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[`${prefix}-institutionName`]}
                  </p>
                )}
              </div>

              {/* University Board */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  University/ Board
                </label>
                <input
                  type="text"
                  value={education.universityBoard}
                  onChange={(e) =>
                    handleChange("universityBoard", e.target.value)
                  }
                  maxLength={50}
                  placeholder="Enter University/ Board Name"
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors[`${prefix}-universityBoard`]
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                    }`}
                />
                {errors[`${prefix}-universityBoard`] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[`${prefix}-universityBoard`]}
                  </p>
                )}
              </div>

              {/* Start Year */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Start Year
                </label>
                <div className="relative">
                  <input
                    type="month"
                    value={education.startYear}
                    onChange={(e) => handleChange("startYear", e.target.value)}
                    max={getCurrentMonth()}
                    min="1961-01"
                    onKeyDown={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors[`${prefix}-startYear`]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                      }`}
                  />
                </div>
                {errors[`${prefix}-startYear`] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[`${prefix}-startYear`]}
                  </p>
                )}
              </div>

              {/* End Year */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  End Year
                </label>
                <div className="relative">
                  <input
                    type="month"
                    value={education.endYear}
                    onChange={(e) => handleChange("endYear", e.target.value)}
                    max={getCurrentMonth()}
                    min="1961-01"
                    onKeyDown={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    disabled={education.currentlyPursuing}
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm disabled:bg-gray-100 ${errors[`${prefix}-endYear`]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                      }`}
                  />
                </div>
                {errors[`${prefix}-endYear`] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[`${prefix}-endYear`]}
                  </p>
                )}
              </div>

              {/* Currently Pursuing Checkbox */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                  <input
                    type="checkbox"
                    checked={education.currentlyPursuing}
                    onChange={(e) =>
                      handleChange("currentlyPursuing", e.target.checked)
                    }
                    className="w-4 h-4 text-orange-400 border-gray-300 rounded focus:ring-orange-400"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    Currently Pursuing
                  </span>
                </label>
              </div>

              {/* Result Format */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Result Format
                </label>
                <div className="relative">
                  <select
                    value={education.resultFormat}
                    onChange={(e) =>
                      handleChange("resultFormat", e.target.value)
                    }
                    required
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm appearance-none bg-white pr-8 ${errors[`${prefix}-resultFormat`]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                      }`}
                  >
                    <option value="">Select Result Format</option>
                    <option value="Percentage">Percentage</option>
                    <option value="CGPA">CGPA</option>
                    <option value="Grade">Grade</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors[`${prefix}-resultFormat`] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[`${prefix}-resultFormat`]}
                  </p>
                )}
              </div>

              {/* Result */}
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Result
                </label>
                <input
                  type="text"
                  value={education.result}
                  onChange={(e) => handleChange("result", e.target.value)}
                  placeholder="Enter Result"
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors[`${prefix}-result`]
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                    }`}
                />
                {errors[`${prefix}-result`] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[`${prefix}-result`]}
                  </p>
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
              {changed && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                  aria-label="Save education changes"
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

  // Helper for toggling education card expansion
  const handleEducationExpandToggle = (id: string, isExtra: boolean) => {
    if (isExtra) {
      setExtraExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    } else {
      setHigherExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  return (
    <form
      id="education-details-form-root"
      onSubmit={handleSubmit}
      className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6"
    >{submitError && (
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
        {!hideHeader && (
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1">
              Step 2: Education Details
            </h2>
            {!hideIntro && (
              <p className="text-xs sm:text-sm text-gray-600">
                Add your educational background (SSLC and PUC details are not
                mandatory but included)
              </p>
            )}
          </div>
        )}

        {/* SSLC (10th Standard) */}
        <div className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
              SSLC (10th Standard)
            </h3>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setSslcExpanded(!sslcExpanded)}
                className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ChevronDown
                  className={`w-3 h-3 text-gray-600 transition-transform cursor-pointer ${sslcExpanded ? "" : "rotate-180"
                    }`}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </div>

          {sslcExpanded && (
            <div className="p-4 sm:p-5 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    name="institutionName"
                    value={sslcData.institutionName}
                    onChange={handleSslcChange}
                    maxLength={100}
                    placeholder="Enter Institute Name"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors["sslc-institutionName"]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                      }`}
                  />
                  {errors["sslc-institutionName"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors["sslc-institutionName"]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Board Type
                  </label>
                  <div className="relative">
                    <select
                      name="boardType"
                      value={sslcData.boardType}
                      onChange={handleSslcChange}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm appearance-none bg-white pr-8 ${errors["sslc-boardType"]
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                        }`}
                    >
                      <option value="">Select Board Type</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors["sslc-boardType"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors["sslc-boardType"]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Year Of Passing
                  </label>
                  <input
                    type="month"
                    name="yearOfPassing"
                    value={sslcData.yearOfPassing}
                    onChange={handleSslcChange}
                    max={getCurrentMonth()}
                    min="1961-01"
                    onKeyDown={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors["sslc-yearOfPassing"]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                      }`}
                  />
                  {errors["sslc-yearOfPassing"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors["sslc-yearOfPassing"]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Result Format
                  </label>
                  <div className="relative">
                    <select
                      name="resultFormat"
                      value={sslcData.resultFormat}
                      onChange={handleSslcChange}
                      required
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm appearance-none bg-white pr-8 ${errors["sslc-resultFormat"]
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                        }`}
                    >
                      <option value="">Select Result Format</option>
                      <option value="Percentage">Percentage</option>
                      <option value="CGPA">CGPA</option>
                      <option value="Grade">Grade</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors["sslc-resultFormat"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors["sslc-resultFormat"]}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Result
                  </label>
                  <input
                    type="text"
                    name="result"
                    value={sslcData.result}
                    onChange={handleSslcChange}
                    placeholder="Enter Result"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors["sslc-result"]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                      }`}
                  />
                  {errors["sslc-result"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors["sslc-result"]}
                    </p>
                  )}
                </div>
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
                {sslcChanged && (
                  <button
                    type="button"
                    onClick={handleSaveSslc}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                    aria-label="Save SSLC changes"
                  >
                    <Save className="w-4 h-4" strokeWidth={2} />
                    Save
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pre-University (12th Standard) */}
        <div className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
              Pre-university (12th Standard)
            </h3>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setPuExpanded(!puExpanded)}
                className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ChevronDown
                  className={`w-3 h-3 text-gray-600 transition-transform cursor-pointer ${puExpanded ? "" : "rotate-180"
                    }`}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </div>

          {puExpanded && (
            <div className="p-4 sm:p-5 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    name="institutionName"
                    value={puData.institutionName}
                    onChange={handlePuChange}
                    maxLength={100}
                    placeholder="Enter Institute Name"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors["pu-institutionName"]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                      }`}
                  />
                  {errors["pu-institutionName"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors["pu-institutionName"]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Board Type
                  </label>
                  <div className="relative">
                    <select
                      name="boardType"
                      value={puData.boardType}
                      onChange={handlePuChange}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm appearance-none bg-white pr-8 ${errors["pu-boardType"]
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                        }`}
                    >
                      <option value="">Select Board Type</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors["pu-boardType"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors["pu-boardType"]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Subject Stream
                  </label>
                  <div className="relative">
                    <select
                      name="subjectStream"
                      value={puData.subjectStream}
                      onChange={handlePuChange}
                      className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-xs sm:text-sm appearance-none bg-white pr-8"
                    >
                      <option value="">Select Subject Stream</option>
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Year Of Passing
                  </label>
                  <input
                    type="month"
                    name="yearOfPassing"
                    value={puData.yearOfPassing}
                    onChange={handlePuChange}
                    max={getCurrentMonth()}
                    min="1961-01"
                    onKeyDown={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors["pu-yearOfPassing"]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                      }`}
                  />
                  {errors["pu-yearOfPassing"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors["pu-yearOfPassing"]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Result Format
                  </label>
                  <div className="relative">
                    <select
                      name="resultFormat"
                      value={puData.resultFormat}
                      onChange={handlePuChange}
                      required
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm appearance-none bg-white pr-8 ${errors["pu-resultFormat"]
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                        }`}
                    >
                      <option value="">Select Result Format</option>
                      <option value="Percentage">Percentage</option>
                      <option value="CGPA">CGPA</option>
                      <option value="Grade">Grade</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors["pu-resultFormat"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors["pu-resultFormat"]}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Result
                  </label>
                  <input
                    type="text"
                    name="result"
                    value={puData.result}
                    onChange={handlePuChange}
                    placeholder="Enter Result"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors["pu-result"]
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                      }`}
                  />
                  {errors["pu-result"] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors["pu-result"]}
                    </p>
                  )}
                </div>
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
                {puChanged && (
                  <button
                    type="button"
                    onClick={handleSavePu}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                    aria-label="Save pre-university changes"
                  >
                    <Save className="w-4 h-4" strokeWidth={2} />
                    Save
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Higher Education (Mandatory - First Card) */}
        {higherEducations.map((edu, index) =>
          renderEducationCard(edu, index, false, true)
        )}

        {/* Extra Education Cards (Additional Higher Education) */}
        {extraEducations.map((edu, index) =>
          renderEducationCard(edu, index, true, false)
        )}

        {/* Add Education Button */}
        <button
          type="button"
          onClick={addEducation}
          className="flex items-center gap-2 px-4 py-2.5 text-orange-400 hover:text-orange-500 font-medium text-sm transition-colors mb-4 md:mb-5 cursor-pointer"
        >
          <Plus className="w-4 h-4 cursor-pointer" />
          Add Education
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
