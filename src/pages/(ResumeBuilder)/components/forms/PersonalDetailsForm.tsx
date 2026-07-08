import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import type { PersonalDetails } from "src/types/resume";
import {
  FormInput,
  FormSelect,
  FormTextarea,
  TagInput,
  FormSection,
  RichTextEditor,
} from "@/pages/(ResumeBuilder)/components/ui";
import { Lock, X, Save, ChevronDown, ChevronUp, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { deleteFromCloudinary } from "@/utils/deleteFromCloudinary";
import { updatePersonalDetails } from "@/services/personalService";
import { filterResumeData, getEnabledSkills, getEnabledWorkExperiences, getEnabledProjects } from "@/utils/filterResumeData";
import { enhanceCareerObjective } from "@/utils/enhancecareerobjective";
import { fetchCountries, fetchStates, fetchCities } from "@/services/locationService";
import api from "@/api";
interface PersonalDetailsFormProps {
  data: PersonalDetails;
  fullResumeData: any;
  onChange: (data: PersonalDetails) => void;
  userId: string;
  token: string;
  personalDetailsId: string | null;
  supportsPhoto?: boolean;
  disableAiEnhance?: boolean;
  enhanceStatus?: { isBonus_enhance_used: boolean; enhance_usage_left: number } | null;
  onRedeemEnhance?: () => void;
  redeemingEnhance?: boolean;
}

const genders = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const ALL_LANGUAGES = [
  // Indian Official Scheduled Languages
  "Assamese",
  "Bengali",
  "Bodo",
  "Dogri",
  "Gujarati",
  "Hindi",
  "Kannada",
  "Kashmiri",
  "Konkani",
  "Maithili",
  "Malayalam",
  "Manipuri",
  "Marathi",
  "Nepali",
  "Odia",
  "Punjabi",
  "Sanskrit",
  "Santali",
  "Sindhi",
  "Tamil",
  "Telugu",
  "Urdu",
  // Foreign Languages Commonly Used in India
  "English",
  "French",
  "German",
  "Spanish",
  "Portuguese",
  "Russian",
  "Chinese (Mandarin)",
  "Japanese",
  "Korean",
  "Arabic",
  "Persian",
  "Italian",
  "Dutch",
  "Thai",
  "Hebrew",
];

export const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({
  data,
  fullResumeData,
  onChange,
  userId,
  token,
  personalDetailsId,
  supportsPhoto = true,
  disableAiEnhance = false,
  enhanceStatus,
  onRedeemEnhance,
  redeemingEnhance = false,
}) => {
  const [personalInfoCollapsed, setPersonalInfoCollapsed] = useState(false);
  const [languagesCollapsed, setLanguagesCollapsed] = useState(false);
  const [locationDetailsCollapsed, setLocationDetailsCollapsed] =
    useState(false);
  const [careerObjectiveCollapsed, setCareerObjectiveCollapsed] =
    useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [languagesEnabled, setLanguagesEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const [languagesChanged, setLanguagesChanged] = useState(false);
  const [locationChanged, setLocationChanged] = useState(false);
  const [careerObjectiveChanged, setCareerObjectiveChanged] = useState(false);

  const [languagesFeedback, setLanguagesFeedback] = useState("");
  const [locationFeedback, setLocationFeedback] = useState("");
  const [careerObjectiveFeedback, setCareerObjectiveFeedback] = useState("");
  const [hiddenSaveIds, setHiddenSaveIds] = useState<Set<string>>(new Set());

  // Dynamic location options
  const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const cannotEnhance = enhanceStatus ? enhanceStatus.enhance_usage_left <= 0 : false;
  const [enhanceError, setEnhanceError] = useState("");
  const [enhancedVersions, setEnhancedVersions] = useState<{ professional: string; elaborate: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialLanguages = useRef<string[]>(data.languagesKnown || []);
  const [newLanguage, setNewLanguage] = useState("");
  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);
  const languageInputRef = useRef<HTMLInputElement>(null);
  const languageContainerRef = useRef<HTMLDivElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const initialLocation = useRef({
    address: data.address || "",
    country: data.country || "",
    state: data.state || "",
    city: data.city || "",
    pincode: data.pincode || "",
    nationality: data.nationality || "",
  });
  const initialCareerObjective = useRef<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [changedLocationFields, setChangedLocationFields] = useState<string[]>(
    []
  );

  useEffect(() => {
    const hasChanged =
      JSON.stringify(data.languagesKnown) !==
      JSON.stringify(initialLanguages.current);
    setLanguagesChanged(hasChanged);
  }, [data.languagesKnown]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        languageContainerRef.current &&
        !languageContainerRef.current.contains(event.target as Node) &&
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target as Node)
      ) {
        const trimmedLang = newLanguage.trim();
        const isValidLanguage = ALL_LANGUAGES.some(
          (lang) => lang.toLowerCase() === trimmedLang.toLowerCase()
        );

        if (trimmedLang && !isValidLanguage) {
          setNewLanguage("");
        }

        setShowLanguageSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [newLanguage]);

  // update dropdown rect when suggestions open or window scroll/resize
  useEffect(() => {
    if (!showLanguageSuggestions) return;

    const updateRect = () => {
      const el = languageInputRef.current || languageContainerRef.current;
      if (el) setDropdownRect(el.getBoundingClientRect());
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [showLanguageSuggestions, newLanguage]);

  // Fetch countries on mount
  useEffect(() => {
    setLoadingCountries(true);
    fetchCountries()
      .then((data: any[]) => {
        setCountryOptions((data || []).map((c) => ({ value: c.name, label: c.name, isoCode: c.isoCode })));
      })
      .catch(() => setCountryOptions([]))
      .finally(() => setLoadingCountries(false));
  }, []);

  // Load initial states when countries are ready and a country is already selected
  useEffect(() => {
    if (!data.country || countryOptions.length === 0 || stateOptions.length > 0) return;
    const selected = (countryOptions as any[]).find((c) => c.value === data.country || c.isoCode === data.country);
    if (!selected) return;
    setLoadingStates(true);
    fetchStates(selected.isoCode)
      .then((res: any[]) => setStateOptions((res || []).map((s) => ({ value: s.name, label: s.name, isoCode: s.isoCode }))))
      .catch(() => setStateOptions([]))
      .finally(() => setLoadingStates(false));
  }, [countryOptions]);

  // Load initial cities when states are ready and a state is already selected
  useEffect(() => {
    if (!data.state || stateOptions.length === 0 || cityOptions.length > 0) return;
    const selectedCountry = (countryOptions as any[]).find((c) => c.value === data.country || c.isoCode === data.country);
    const selectedState = (stateOptions as any[]).find((s) => s.value === data.state || s.isoCode === data.state);
    if (!selectedCountry || !selectedState) return;
    setLoadingCities(true);
    fetchCities(selectedCountry.isoCode, selectedState.isoCode)
      .then((res: any[]) => setCityOptions((res || []).map((c) => ({ value: c.name, label: c.name }))))
      .catch(() => setCityOptions([]))
      .finally(() => setLoadingCities(false));
  }, [stateOptions]);

  // Fetch states when country changes
  useEffect(() => {
    if (!data.country || countryOptions.length === 0) {
      setStateOptions([]);
      setCityOptions([]);
      return;
    }
    const selected = (countryOptions as any[]).find((c) => c.value === data.country || c.isoCode === data.country);
    if (!selected) return;
    setLoadingStates(true);
    fetchStates(selected.isoCode)
      .then((res: any[]) => setStateOptions((res || []).map((s) => ({ value: s.name, label: s.name, isoCode: s.isoCode }))))
      .catch(() => setStateOptions([]))
      .finally(() => setLoadingStates(false));
    setCityOptions([]);
  }, [data.country, countryOptions]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!data.country || !data.state || countryOptions.length === 0 || stateOptions.length === 0) {
      setCityOptions([]);
      return;
    }
    const selectedCountry = (countryOptions as any[]).find((c) => c.value === data.country || c.isoCode === data.country);
    const selectedState = (stateOptions as any[]).find((s) => s.value === data.state || s.isoCode === data.state);
    if (!selectedCountry || !selectedState) return;
    setLoadingCities(true);
    fetchCities(selectedCountry.isoCode, selectedState.isoCode)
      .then((res: any[]) => setCityOptions((res || []).map((c) => ({ value: c.name, label: c.name }))))
      .catch(() => setCityOptions([]))
      .finally(() => setLoadingCities(false));
  }, [data.state, data.country, countryOptions, stateOptions]);




  // useEffect(() => {
  //   // In your component:
  //   // const filteredData = filterResumeData(fullResumeData);


  //   console.log(skillNames, experiences);
  // }, [])

  const getPlainText = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  };

  const careerObjectiveLength = getPlainText(data.aboutCareerObjective ?? "").length;
  const hasCareerObjectiveInput = careerObjectiveLength > 0;
  const isCareerObjectiveTooLong = careerObjectiveLength > 500;

  const handleEnhanceCareerObjective = async () => {
    if (disableAiEnhance || !hasCareerObjectiveInput) return;
    setIsEnhancing(true);
    setEnhanceError("");
    setEnhancedVersions(null);
    try {
      // 1. Check if user can use enhance feature
      const checkRes = await api.get(`/users/${userId}/check-enhance-used`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.data && checkRes.data.canUse === false) {
        throw new Error(checkRes.data.message || "You have reached your limit for AI enhancement.");
      }

      // 2. Call the AI service
      const result = await enhanceCareerObjective(
        data.aboutCareerObjective,
        skillNames,
        experiences,
        projects
      );

      // 3. Mark as used
      await api.post(`/users/${userId}/mark-enhance-used`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Optionally notify parent to refresh status
      if (onRedeemEnhance && !enhanceStatus?.isBonus_enhance_used) {
         // This is handled via redeem actually, but just let ResumeEditor refresh it.
      }

      setEnhancedVersions(result);
    } catch (err: any) {
      setEnhanceError(err.response?.data?.message || err.message || "Failed to enhance. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleApplyVersion = (type: "professional" | "elaborate") => {
    if (!enhancedVersions) return;
    const html = `<p>${enhancedVersions[type]}</p>`;
    onChange({ ...data, aboutCareerObjective: html });
    setCareerObjectiveChanged(true);
    setEnhancedVersions(null);
    setEnhanceError("");
  };

  const handleDismissEnhanced = () => {
    setEnhancedVersions(null);
    setEnhanceError("");
  };

  const skillNames = getEnabledSkills(fullResumeData);
  const experiences = getEnabledWorkExperiences(fullResumeData);
  const projects = getEnabledProjects(fullResumeData);
  console.log("Enabled skills:", skillNames);
  console.log("Enabled experiences:", experiences);
  console.log("Enabled projects:", projects);

  const handleLanguageInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewLanguage(e.target.value);
    setShowLanguageSuggestions(true);
  };

  const handleSelectLanguage = (language: string) => {
    if (!data.languagesKnown.includes(language.trim())) {
      onChange({ ...data, languagesKnown: [...data.languagesKnown, language.trim()] });
    }
    setNewLanguage("");
    setShowLanguageSuggestions(false);
  };

  const handleAddLanguage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "Tab") && newLanguage.trim()) {
      if (filteredSuggestions.length > 0) {
        e.preventDefault();
        const match = filteredSuggestions[0];
        if (!data.languagesKnown.includes(match)) {
          onChange({ ...data, languagesKnown: [...data.languagesKnown, match] });
        }
        setNewLanguage("");
        setShowLanguageSuggestions(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        setNewLanguage("");
        setShowLanguageSuggestions(false);
      }
    }
  };

  const handleRemoveLanguage = (languageToRemove: string) => {
    onChange({
      ...data,
      languagesKnown: data.languagesKnown.filter((lang) => lang !== languageToRemove),
    });
  };

  const filteredSuggestions = useMemo(() => {
    if (!newLanguage.trim()) return [];
    const normalizedInput = newLanguage.trim().toLowerCase();

    return ALL_LANGUAGES.filter(
      (lang) =>
        lang.toLowerCase().startsWith(normalizedInput) &&
        !data.languagesKnown.some((addedLang: string) => addedLang.toLowerCase() === lang.toLowerCase())
    ).slice(0, 5);
  }, [newLanguage, data.languagesKnown]);

  useEffect(() => {
    const changedFields: string[] = [];

    if (data.address !== initialLocation.current.address)
      changedFields.push("address");
    if (data.country !== initialLocation.current.country)
      changedFields.push("country");
    if (data.state !== initialLocation.current.state)
      changedFields.push("state");
    if (data.city !== initialLocation.current.city) changedFields.push("city");
    if (data.pincode !== initialLocation.current.pincode)
      changedFields.push("pincode");
    if (data.nationality !== initialLocation.current.nationality)
      changedFields.push("nationality");

    setChangedLocationFields(changedFields);
    setLocationChanged(changedFields.length > 0);
  }, [
    data.address,
    data.country,
    data.state,
    data.city,
    data.pincode,
    data.nationality,
    data.passportNumber,
  ]);

  // Initialize the ref only once when component mounts or data first loads
  useEffect(() => {
    if (!isInitialized) {
      initialCareerObjective.current = data.aboutCareerObjective || "";
      setIsInitialized(true);
    }
  }, [isInitialized, data.aboutCareerObjective]);

  useEffect(() => {
    if (!isInitialized) return;

    const currentValue = data.aboutCareerObjective || "";
    const initialValue = initialCareerObjective.current || "";
    const hasChanged = currentValue !== initialValue;

    setCareerObjectiveChanged(hasChanged);
  }, [data.aboutCareerObjective, isInitialized]);

  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "firstName":
      case "lastName":
        if (value && !/^[a-zA-Z\s]+$/.test(value)) {
          error = "Only letters allowed";
        }
        break;

      case "middleName":
        if (value && !/^[a-zA-Z\s]+$/.test(value)) {
          error = "Only letters allowed";
        }
        break;

      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Invalid email format";
        }
        break;

      case "mobileNumber":
        if (value && !/^\d{0,10}$/.test(value)) {
          error = "Only 10 digits allowed";
        } else if (value && value.length > 0 && value.length < 10) {
          error = "Must be 10 digits";
        }
        break;

      case "pincode":
        if (value && !/^\d{0,6}$/.test(value)) {
          error = "Only 6 digits allowed";
        } else if (value && value.length > 0 && value.length < 6) {
          error = "Must be 6 digits";
        }
        break;

      case "address":
        if (value) {
          if (value.trim().length > 250) {
            error = "Address cannot exceed 250 characters";
          } else if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
            error = "Address must include at least one letter and one number";
          }
        }
        break;

      case "aboutCareerObjective":
        if (value) {
          const plainText = getPlainText(value);
          if (plainText.length > 500) {
            error = "Career objective cannot exceed 500 characters";
          }
        }
        break;

      case "passportNumber":
        if (value && !/^[A-Z0-9]*$/.test(value)) {
          error = "Only uppercase letters and numbers allowed";
        } else if (value && !/(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = "Must contain at least one letter and one number";
        }
        break;
    }

    return error;
  };

  const updateField = <K extends keyof PersonalDetails>(
    field: K,
    value: PersonalDetails[K]
  ) => {
    let newValue: any = value;

    if (
      field === "mobileNumber" &&
      typeof newValue === "string" &&
      newValue.length > 10
    ) {
      return;
    }

    if (field === "pincode" && typeof newValue === "string") {
      if (!/^\d*$/.test(newValue)) return;
      if (newValue.length > 6) return;
      // Reset address when pincode changes so the location hierarchy remains consistent
      onChange({ ...data, pincode: newValue, address: "" });
      const error = validateField(field, newValue);
      setErrors((prev) => ({ ...prev, [field]: error, address: "" }));
      return;
    }

    if (field === "nationality" && typeof newValue === "string") {
      if (!/^[a-zA-Z\s]*$/.test(newValue)) return;
      if (newValue.length > 50) return;
    }

    console.log("Updating field:", field, "with value:", newValue);
    onChange({ ...data, [field]: newValue });

    if (typeof newValue === "string") {
      const error = validateField(field, newValue);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleLocationSelectionChange = (
    field: "country" | "state" | "city",
    value: string
  ) => {
    const nextData: PersonalDetails = {
      ...data,
      [field]: value,
      address: "",
      pincode: data.pincode,
    };

    if (field === "country") {
      nextData.state = "";
      nextData.city = "";
      nextData.pincode = "";
    }

    if (field === "state") {
      nextData.city = "";
      nextData.pincode = "";
    }

    if (field === "city") {
      nextData.pincode = "";
    }

    onChange(nextData);
    setErrors((prev) => ({
      ...prev,
      address: "",
      pincode: "",
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    const isTypeAllowed = allowedTypes.includes(file.type);
    const fileName = file.name.toLowerCase();
    const isExtensionAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isTypeAllowed && !isExtensionAllowed) {
      alert("Only JPG, JPEG, PNG, and WEBP images are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > maxSizeBytes) {
      alert("Image size must be 5 MB or less.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const cloudinaryRes = await uploadToCloudinary(file);

      onChange({
        ...data,
        profilePhotoUrl: cloudinaryRes.url,
      });

      if (personalDetailsId) {
        const payload = {
          profile_photo_url: cloudinaryRes.url,
        };
        await updatePersonalDetails(userId, token, personalDetailsId, payload);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
  };

  const handlePhotoDelete = async () => {
    try {
      if (personalDetailsId) {
        const payload = {
          profile_photo_url: "",
        };
        await updatePersonalDetails(userId, token, personalDetailsId, payload);
      }

      onChange({
        ...data,
        profilePhotoUrl: "",
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  const handleUpdateLanguages = async () => {
    if (!personalDetailsId) {
      setLanguagesFeedback("Unable to save: Missing personal details ID");
      setTimeout(() => setLanguagesFeedback(""), 3000);
      return;
    }

    try {
      const payload = {
        languages_known: data.languagesKnown,
      };

      await updatePersonalDetails(userId, token, personalDetailsId, payload);
      initialLanguages.current = [...data.languagesKnown];
      setLanguagesChanged(false);
      setLanguagesFeedback("Languages updated successfully!");
      setHiddenSaveIds(prev => new Set([...prev, "languages"]));
      setTimeout(() => {
        setLanguagesFeedback("");
        setHiddenSaveIds(prev => {
          const updated = new Set(prev);
          updated.delete("languages");
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error("Error updating languages:", error);
      setLanguagesFeedback("Failed to update languages");
      setTimeout(() => setLanguagesFeedback(""), 3000);
    }
  };

  const handleResetLanguages = () => {
    onChange({
      ...data,
      languagesKnown: [...initialLanguages.current],
    });
    setLanguagesChanged(false);
    setLanguagesFeedback("");
  };

  const handleUpdateLocation = async () => {
    // Prevent saving when there are no changes or when validation errors exist
    if (!personalDetailsId || changedLocationFields.length === 0) {
      if (!personalDetailsId) {
        setLocationFeedback("Unable to save: Missing personal details ID");
        setTimeout(() => setLocationFeedback(""), 3000);
      }
      return;
    }

    // Block save if address validation fails
    if (errors.address) {
      setLocationFeedback("Fix Address errors before saving");
      setTimeout(() => setLocationFeedback(""), 3000);
      return;
    }

    try {
      const payload: any = {};

      changedLocationFields.forEach((field) => {
        switch (field) {
          case "address":
            payload.address = data.address;
            break;
          case "country":
            payload.country = data.country;
            break;
          case "state":
            payload.state = data.state;
            break;
          case "city":
            payload.city = data.city;
            break;
          case "pincode":
            payload.pincode = data.pincode;
            break;
          case "nationality":
            payload.nationality = data.nationality;
            break;
          case "passportNumber":
            payload.passport_number = data.passportNumber;
            break;
        }
      });

      await updatePersonalDetails(userId, token, personalDetailsId, payload);

      initialLocation.current = {
        address: data.address,
        country: data.country,
        state: data.state,
        city: data.city,
        pincode: data.pincode,
        nationality: data.nationality
      };

      setLocationChanged(false);
      setChangedLocationFields([]);
      setLocationFeedback("Location updated successfully!");
      setHiddenSaveIds(prev => new Set([...prev, "location"]));
      setTimeout(() => {
        setLocationFeedback("");
        setHiddenSaveIds(prev => {
          const updated = new Set(prev);
          updated.delete("location");
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error("Error updating location:", error);
      setLocationFeedback("Failed to update location");
      setTimeout(() => setLocationFeedback(""), 3000);
    }
  };

  const handleResetLocation = () => {
    onChange({
      ...data,
      address: initialLocation.current.address,
      country: initialLocation.current.country,
      state: initialLocation.current.state,
      city: initialLocation.current.city,
      pincode: initialLocation.current.pincode,
      nationality: initialLocation.current.nationality,
    });
    setLocationChanged(false);
    setChangedLocationFields([]);
    setLocationFeedback("");
  };

  const handleUpdateCareerObjective = async () => {
    if (!personalDetailsId) {
      setCareerObjectiveFeedback("Unable to save: Missing personal details ID");
      setTimeout(() => setCareerObjectiveFeedback(""), 3000);
      return;
    }

    if (errors.aboutCareerObjective) {
      setCareerObjectiveFeedback("Fix career objective errors before saving");
      setTimeout(() => setCareerObjectiveFeedback(""), 3000);
      return;
    }

    if (isCareerObjectiveTooLong) {
      setCareerObjectiveFeedback("Career objective cannot exceed 500 characters");
      setTimeout(() => setCareerObjectiveFeedback(""), 3000);
      return;
    }

    try {
      const payload = {
        about: data.aboutCareerObjective,
      };

      await updatePersonalDetails(userId, token, personalDetailsId, payload);

      initialCareerObjective.current = data.aboutCareerObjective ?? "";
      setCareerObjectiveChanged(false);
      setCareerObjectiveFeedback("Career Objective updated successfully!");
      setHiddenSaveIds(prev => new Set([...prev, "careerObjective"]));
      setTimeout(() => {
        setCareerObjectiveFeedback("");
        setHiddenSaveIds(prev => {
          const updated = new Set(prev);
          updated.delete("careerObjective");
          return updated;
        });
      }, 3000);
    } catch (error) {
      console.error("Error updating career objective:", error);
      setCareerObjectiveFeedback("Failed to update Career Objective");
      setTimeout(() => setCareerObjectiveFeedback(""), 3000);
    }
  };

  const handleResetCareerObjective = () => {
    onChange({
      ...data,
      aboutCareerObjective: initialCareerObjective.current ?? "",
    });
    setCareerObjectiveChanged(false);
    setCareerObjectiveFeedback("");
    setEnhancedVersions(null);
    setEnhanceError("");
  };

  const CollapseButton = ({
    isCollapsed,
    onClick,
  }: {
    isCollapsed: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-gray-600 hover:text-gray-800 hover:border-gray-600 transition-colors"
      aria-expanded={!isCollapsed}
      aria-controls="section-content"
    >
      {isCollapsed ? (
        <ChevronDown size={14} strokeWidth={2.2} />
      ) : (
        <ChevronUp size={14} strokeWidth={2.2} />
      )}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* If the selected template does not support photos, show a notice in the form */}
      {supportsPhoto === false && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 1a4 4 0 0 0-4 4v3H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V5a4 4 0 0 0-4-4z" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">This Template does not support photo upload</div>
            {/* <div className="text-xs text-gray-500">Select a template that supports photos to show your image</div> */}
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl overflow-visible">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">
            Profile Photo
          </span>
        </div>
        <div className="p-4">
          <div className="flex flex-col items-center">
            <div
              onClick={() =>
                !data.profilePhotoUrl && fileInputRef.current?.click()
              }
              className={`relative w-32 h-32 bg-gray-100 rounded-lg border-2 ${data.profilePhotoUrl
                ? "border-gray-300"
                : "border-dashed border-gray-300"
                } flex items-center justify-center overflow-hidden ${!data.profilePhotoUrl
                  ? "cursor-pointer hover:border-orange-400 transition-colors group"
                  : ""
                }`}
            >
              {data.profilePhotoUrl ? (
                <>
                  <img
                    src={data.profilePhotoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhotoDelete();
                    }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-100 z-10 transition-colors"
                    title="Delete photo"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <svg
                  className="w-12 h-12 text-gray-400 group-hover:text-orange-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-sm text-gray-700 hover:text-orange-400 font-medium transition-colors"
            >
              {data.profilePhotoUrl ? "Change Photo" : "Upload Profile Photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">
            Personal Info
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-orange-500" />
              <span className="text-xs text-orange-600 font-medium">
                Read-only
              </span>
            </div>
            <CollapseButton
              isCollapsed={personalInfoCollapsed}
              onClick={() => setPersonalInfoCollapsed(!personalInfoCollapsed)}
            />
          </div>
        </div>
        {!personalInfoCollapsed && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                label="First Name"
                placeholder="Aarav"
                value={data.firstName}
                onChange={(v) => updateField("firstName", v)}
                error={errors.firstName}
                disabled={true}
              />
              <FormInput
                label="Middle Name"
                placeholder="Enter Middle Name"
                value={data.middleName}
                onChange={(v) => updateField("middleName", v)}
                error={errors.middleName}
                disabled={true}
              />
              <FormInput
                label="Last Name"
                placeholder="Mehta"
                value={data.lastName}
                onChange={(v) => updateField("lastName", v)}
                error={errors.lastName}
                disabled={true}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormInput
                label="Email"
                placeholder="aarav.m@gmail.com"
                value={data.email}
                onChange={(v) => updateField("email", v)}
                type="email"
                error={errors.email}
                disabled={true}
              />
              <div>
                <label className="block text-xs text-gray-600 font-medium mb-1">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <FormSelect
                    label=""
                    value="+91"
                    onChange={() => { }}
                    options={[{ value: "+91", label: "+91" }]}
                    className="w-20"
                    disabled={true}
                  />
                  <FormInput
                    label=""
                    placeholder="88888 88888"
                    value={data.mobileNumber}
                    onChange={(v) => updateField("mobileNumber", v)}
                    className="flex-1"
                    error={errors.mobileNumber}
                    disabled={true}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormInput
                label="Date of Birth"
                value={data.dateOfBirth}
                onChange={(v) => updateField("dateOfBirth", v)}
                type="date"
                disabled={true}
              />
              <FormSelect
                label="Gender"
                value={data.gender}
                onChange={(v) => updateField("gender", v)}
                options={genders}
                disabled={true}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">
            Language(s) Known
          </span>
          <CollapseButton
            isCollapsed={languagesCollapsed}
            onClick={() => setLanguagesCollapsed(!languagesCollapsed)}
          />
        </div>

        {languagesEnabled && !languagesCollapsed && (
          <div className="p-4">
            <div
              ref={languageContainerRef}
              className="relative w-full overflow-visible"
            >
              <div className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent min-h-[38px] sm:min-h-[42px] flex flex-wrap gap-2 items-center">
                {data.languagesKnown.map((lang: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gray-100 text-gray-700 rounded-md text-xs sm:text-sm"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 cursor-pointer" />
                    </button>
                  </span>
                ))}
                <input
                  ref={languageInputRef}
                  type="text"
                  value={newLanguage}
                  onChange={handleLanguageInputChange}
                  onKeyDown={handleAddLanguage}
                  onFocus={() => setShowLanguageSuggestions(true)}
                  placeholder="Add Languages known to you..."
                  className="flex-1 min-w-[150px] sm:min-w-[200px] outline-none text-xs sm:text-sm"
                />
              </div>

              {showLanguageSuggestions && filteredSuggestions.length > 0 && dropdownRect && ReactDOM.createPortal(
                <div
                  ref={suggestionBoxRef}
                  style={{
                    position: "absolute",
                    top: dropdownRect.bottom + window.scrollY + 6,
                    left: dropdownRect.left + window.scrollX,
                    width: dropdownRect.width,
                    zIndex: 9999,
                  }}
                >
                  <div className="bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto w-full">
                    {filteredSuggestions.map((lang, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectLanguage(lang)}
                        className="px-4 py-2 cursor-pointer hover:bg-orange-50 text-gray-700 text-sm whitespace-nowrap"
                      >
                        {lang}
                      </div>
                    ))}
                  </div>
                </div>,
                document.body
              )}
            </div>

            {/* Save/Reset section moved to bottom */}
            <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
              {languagesFeedback && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${languagesFeedback.includes("success")
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                    }`}
                >
                  {languagesFeedback}
                </span>
              )}
              {languagesChanged && !hiddenSaveIds.has("languages") && (
                <button
                  type="button"
                  onClick={handleUpdateLanguages}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                  aria-pressed="false"
                  aria-label="Save language changes"
                >
                  <Save className="w-4 h-4" strokeWidth={2} />
                  Save
                </button>
              )}
            </div>
          </div>

        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">
            Location Details
          </span>
          <CollapseButton
            isCollapsed={locationDetailsCollapsed}
            onClick={() =>
              setLocationDetailsCollapsed(!locationDetailsCollapsed)
            }
          />
        </div>

        {locationEnabled && !locationDetailsCollapsed && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Country"
                placeholder={loadingCountries ? "Loading..." : "Select Country"}
                value={data.country}
                onChange={(v) => handleLocationSelectionChange("country", v)}
                options={countryOptions}
              />
              <FormSelect
                label="State"
                placeholder={loadingStates ? "Loading..." : "Select State"}
                value={data.state}
                onChange={(v) => handleLocationSelectionChange("state", v)}
                options={stateOptions}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormSelect
                label="City"
                placeholder={loadingCities ? "Loading..." : "Select City"}
                value={data.city}
                onChange={(v) => handleLocationSelectionChange("city", v)}
                options={cityOptions}
              />
              <FormInput
                label="Pincode"
                placeholder="Enter Pincode"
                value={data.pincode}
                onChange={(v) => updateField("pincode", v)}
                error={errors.pincode}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormInput
                label="Address"
                placeholder="Enter Address (must include letters & numbers)"
                value={data.address}
                onChange={(v) => updateField("address", v)}
                error={errors.address}
              />
              <FormInput
                label="Nationality"
                placeholder="Enter Nationality"
                value={data.nationality}
                onChange={(v) => updateField("nationality", v)}
              />
            </div>

            <div className="mt-4">
              <FormInput
                label="Passport Number"
                placeholder="Enter Passport Number (must include letters & numbers)"
                value={data.passportNumber}
                onChange={(v) => updateField("passportNumber", v)}
                error={errors.passportNumber}
              />
            </div>

            {/* Save/Reset section moved to bottom */}
            <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
              {locationFeedback && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${locationFeedback.includes("success")
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                    }`}
                >
                  {locationFeedback}
                </span>
              )}
              {locationChanged && !hiddenSaveIds.has("location") && (
                <button
                  type="button"
                  onClick={handleUpdateLocation}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                  aria-pressed="false"
                  aria-label="Save location changes"
                >
                  <Save className="w-4 h-4" strokeWidth={2} />
                  Save
                </button>
              )}
            </div>
          </div>

        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">
            About / Career Objective
          </span>
          <CollapseButton
            isCollapsed={careerObjectiveCollapsed}
            onClick={() => setCareerObjectiveCollapsed(!careerObjectiveCollapsed)}
          />
        </div>

        {!careerObjectiveCollapsed && (
          <div className="p-4">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleEnhanceCareerObjective}
                  disabled={disableAiEnhance || !hasCareerObjectiveInput || isEnhancing || isCareerObjectiveTooLong || cannotEnhance}
                  title={
                    disableAiEnhance
                      ? "AI enhancement is disabled for this template"
                      : cannotEnhance
                      ? "You have already used the AI enhancement feature"
                      : !hasCareerObjectiveInput
                      ? "Add some text to enable AI enhancement"
                      : isCareerObjectiveTooLong
                      ? "Reduce career objective to 500 characters or less"
                      : "Enhance with AI"
                  }
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${!disableAiEnhance && hasCareerObjectiveInput && !isEnhancing && !isCareerObjectiveTooLong && !cannotEnhance
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm hover:from-violet-600 hover:to-purple-700 cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  {isEnhancing
                    ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    : <Sparkles className="w-4 h-4" strokeWidth={2} />
                  }
                  {isEnhancing ? "Enhancing..." : "Enhance with AI"}
                </button>
                {enhanceStatus && !disableAiEnhance && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 font-medium">
                      <span className="text-orange-600 font-bold">{enhanceStatus.enhance_usage_left}</span> left
                    </span>
                    {enhanceStatus.enhance_usage_left === 0 && !enhanceStatus.isBonus_enhance_used && (
                      <button
                        onClick={onRedeemEnhance}
                        disabled={redeemingEnhance}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition disabled:opacity-50"
                      >
                        {redeemingEnhance ? 'Redeeming...' : 'Redeem with Bonus'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {disableAiEnhance && (
                <span className="text-xs font-medium text-gray-500">
                 Enhance with AI not supported in this template
                </span>
              )}
            </div>

            <RichTextEditor
              value={data.aboutCareerObjective}
              onChange={(v) => {
                updateField("aboutCareerObjective", v);
                setCareerObjectiveChanged(true);
                if (enhancedVersions) setEnhancedVersions(null);
                if (enhanceError) setEnhanceError("");
              }}
              placeholder="Provide Career Objective"
              rows={6}
            />
            <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-gray-500">
                {careerObjectiveLength}/500 characters
              </p>
              {errors.aboutCareerObjective && (
                <p className="text-xs text-red-600">{errors.aboutCareerObjective}</p>
              )}
            </div>

            {/* Error */}
            {enhanceError && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-red-500 text-xs mt-0.5">⚠</span>
                <p className="text-xs text-red-600 flex-1">{enhanceError}</p>
                <button type="button" onClick={() => setEnhanceError("")} className="text-red-400 hover:text-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* AI Results Panel */}
            {enhancedVersions && (
              <div className="mt-4 border border-purple-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-purple-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" strokeWidth={2} />
                    <span className="text-sm font-semibold text-purple-800">AI Enhanced Versions</span>
                  </div>
                  <button type="button" onClick={handleDismissEnhanced} className="text-purple-400 hover:text-purple-700 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-4 bg-white">
                  {/* Professional */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Professional</span>
                        <span className="text-xs text-gray-400">— Concise & ATS-friendly</span>
                      </div>
                      <button type="button" onClick={() => handleApplyVersion("professional")} className="text-xs px-3 py-1 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition-colors cursor-pointer">
                        Use This
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{enhancedVersions.professional}</p>
                    </div>
                  </div>

                  {/* Elaborate */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Elaborate</span>
                        <span className="text-xs text-gray-400">— Rich narrative with full context</span>
                      </div>
                      <button type="button" onClick={() => handleApplyVersion("elaborate")} className="text-xs px-3 py-1 bg-emerald-500 text-white rounded-md font-medium hover:bg-emerald-600 transition-colors cursor-pointer">
                        Use This
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{enhancedVersions.elaborate}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 text-center">Click "Use This" to apply a version, or dismiss to keep your current text.</p>
                </div>
              </div>
            )}

            {/* Save/Reset section moved to bottom */}
            <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
              {careerObjectiveFeedback && (
                <span className={`text-xs px-2 py-1 rounded-full ${careerObjectiveFeedback.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {careerObjectiveFeedback}
                </span>
              )}
              {careerObjectiveChanged && !hiddenSaveIds.has("careerObjective") && (
                <button
                  type="button"
                  onClick={handleUpdateCareerObjective}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                  aria-pressed="false"
                  aria-label="Save career objective changes"
                >
                  <Save className="w-4 h-4" strokeWidth={2} /> Save
                </button>
              )}
            </div>
          </div>

        )}
      </div>
    </div>
  );
};

export default PersonalDetailsForm;
