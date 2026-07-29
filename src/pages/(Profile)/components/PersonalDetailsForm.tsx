import React, { useState, useRef, useEffect, useMemo } from "react";
import { fetchCountries, fetchStates, fetchCities } from "@/services/locationService";
import { ChevronDown, X, Save } from "lucide-react";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { deleteFromCloudinary } from "@/utils/deleteFromCloudinary";
import { updatePersonalDetails, sendOtpPersonalChange, updatePersonalDetailsWithOTP } from "@/services/personalService";

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

const PERSONAL_DETAIL_FIELDS = [
  "firstName",
  "middleName",
  "lastName",
  "email",
  "mobileNumber",
  "dateOfBirth",
];

const CURRENT_LOCATION_FIELDS = ["address", "country", "state", "city", "pincode", "nationality"];

const MAX_ADDRESS_LENGTH = 250;
const MAX_CITY_LENGTH = 60;

// Sentinel for the "Other" city choice — never stored as an actual city name.
const OTHER_CITY = "__other__";

interface PersonalDetailsFormProps {
  onNext: (data: any) => void;
  onBack?: () => void;
  onUpdate?: (data: any) => void;
  initialData?: any;
  userId: string;
  token: string;
  personalDetailsId: string | null;
}

export default function PersonalDetailsForm({
  onNext,
  onBack,
  onUpdate,
  initialData = {},
  userId,
  token,
  personalDetailsId,
}: PersonalDetailsFormProps) {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || "",
    middleName: initialData.middleName || "",
    lastName: initialData.lastName || "",
    email: initialData.email || "",
    mobileNumber: initialData.mobileNumber || "",
    dateOfBirth: initialData.dateOfBirth || "",
    gender: initialData.gender || "Male",
    languages: initialData.languages || [],
    address: initialData.address || "",
    country: initialData.country || "",
    state: initialData.state || "",
    city: initialData.city || "",
    pincode: initialData.pincode || "",
    nationality: initialData.nationality || "",
    uploadedPhotoURL: initialData.uploadedPhotoURL || "",
    uploadedPublicId: initialData.uploadedPublicId || "",
    profilePhoto: initialData.profilePhoto || null,
    profilePhotoPreview: initialData.profilePhotoPreview || "",
    uploadedDeleteToken: initialData.uploadedDeleteToken || "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // Location dropdown state
  const [countryOptions, setCountryOptions] = useState<any[]>([]);
  const [stateOptions, setStateOptions] = useState<any[]>([]);
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [showOtpPopup, setShowOtpPopup] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpResent, setOtpResent] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [hasAttemptedProceed, setHasAttemptedProceed] = useState(false);

  // Fetch countries on mount
  useEffect(() => {
    setLoadingCountries(true);
    fetchCountries()
      .then((data) => {
        setCountryOptions(data || []);
      })
      .catch(() => setCountryOptions([]))
      .finally(() => setLoadingCountries(false));
  }, []);

  // Fetch states and cities when initial data has values
  useEffect(() => {
    if (initialLocation.current.country && countryOptions.length > 0 && stateOptions.length === 0) {
      const selectedCountry = countryOptions.find(
        (c) => c.name === initialLocation.current.country || c.isoCode === initialLocation.current.country
      );
      if (!selectedCountry) return;

      setLoadingStates(true);
      fetchStates(selectedCountry.isoCode)
        .then((data) => {
          setStateOptions(data || []);
        })
        .catch(() => setStateOptions([]))
        .finally(() => setLoadingStates(false));
    }
  }, [countryOptions]);

  // Fetch cities when states are loaded and initial city data exists
  useEffect(() => {
    if (initialLocation.current.state && stateOptions.length > 0 && cityOptions.length === 0) {
      const selectedCountry = countryOptions.find(
        (c) => c.name === initialLocation.current.country || c.isoCode === initialLocation.current.country
      );
      const selectedState = stateOptions.find(
        (s) => s.name === initialLocation.current.state || s.isoCode === initialLocation.current.state
      );
      if (!selectedCountry || !selectedState) return;

      setLoadingCities(true);
      fetchCities(selectedCountry.isoCode, selectedState.isoCode)
        .then((data) => {
          setCityOptions(data || []);
        })
        .catch(() => setCityOptions([]))
        .finally(() => setLoadingCities(false));
    }
  }, [stateOptions, countryOptions]);

  // Fetch states when country changes
  useEffect(() => {
    if (!formData.country) {
      setStateOptions([]);
      setCityOptions([]);
      return;
    }
    const selectedCountry = countryOptions.find(
      (c) => c.name === formData.country || c.isoCode === formData.country
    );
    if (!selectedCountry) return;
    setLoadingStates(true);
    fetchStates(selectedCountry.isoCode)
      .then((data) => {
        setStateOptions(data || []);
      })
      .catch(() => setStateOptions([]))
      .finally(() => setLoadingStates(false));
    setCityOptions([]);
    // Don't reset state and city if they already have values from initialData
    if (!formData.state && !initialLocation.current.state) {
      setFormData((prev) => ({ ...prev, state: "", city: "" }));
    }
  }, [formData.country, countryOptions]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!formData.country || !formData.state) {
      setCityOptions([]);
      return;
    }
    const selectedCountry = countryOptions.find(
      (c) => c.name === formData.country || c.isoCode === formData.country
    );
    const selectedState = stateOptions.find(
      (s) => s.name === formData.state || s.isoCode === formData.state
    );
    if (!selectedCountry || !selectedState) return;
    setLoadingCities(true);
    fetchCities(selectedCountry.isoCode, selectedState.isoCode)
      .then((data) => {
        setCityOptions(data || []);
      })
      .catch(() => setCityOptions([]))
      .finally(() => setLoadingCities(false));
    // Don't reset city if it already has a value from initialData
    if (!formData.city && !initialLocation.current.city) {
      setFormData((prev) => ({ ...prev, city: "" }));
    }
  }, [formData.state, formData.country, countryOptions, stateOptions]);

  // A saved city that isn't in the fetched list was typed via "Other" — show it in the free-text field.
  useEffect(() => {
    if (isCustomCity || loadingCities) return;
    if (!formData.city || cityOptions.length === 0) return;
    if (!cityOptions.some((city) => city.name === formData.city)) {
      setIsCustomCity(true);
    }
  }, [cityOptions, loadingCities, formData.city, isCustomCity]);
  const [newLanguage, setNewLanguage] = useState("");
  const [personalDetailsExpanded, setPersonalDetailsExpanded] = useState(true);
  const initialPersonalDetails = useRef({
    firstName: initialData.firstName || "",
    middleName: initialData.middleName || "",
    lastName: initialData.lastName || "",
    email: initialData.email || "",
    mobileNumber: initialData.mobileNumber || "",
    dateOfBirth: initialData.dateOfBirth || "",
    gender: initialData.gender || "Male",
  });
  const [personalDetailsChanged, setPersonalDetailsChanged] = useState(false);

  useEffect(() => {
    const changed =
      formData.firstName !== initialPersonalDetails.current.firstName ||
      formData.middleName !== initialPersonalDetails.current.middleName ||
      formData.lastName !== initialPersonalDetails.current.lastName ||
      formData.email !== initialPersonalDetails.current.email ||
      formData.mobileNumber !== initialPersonalDetails.current.mobileNumber ||
      formData.dateOfBirth !== initialPersonalDetails.current.dateOfBirth ||
      formData.gender !== initialPersonalDetails.current.gender;
    setPersonalDetailsChanged(changed);
  }, [formData.firstName, formData.middleName, formData.lastName, formData.email, formData.mobileNumber, formData.dateOfBirth, formData.gender]);
  const [languagesExpanded, setLanguagesExpanded] = useState(true);
  const [currentLocationExpanded, setCurrentLocationExpanded] = useState(true);

  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);

  const [languagesChanged, setLanguagesChanged] = useState(false);
  const [locationChanged, setLocationChanged] = useState(false);

  const [languagesFeedback, setLanguagesFeedback] = useState("");
  const [locationFeedback, setLocationFeedback] = useState("");
  const [personalDetailsFeedback, setPersonalDetailsFeedback] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const languageInputRef = useRef<HTMLInputElement>(null);
  const languageContainerRef = useRef<HTMLDivElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  const initialLanguages = useRef(initialData.languages || []);
  const initialLocation = useRef({
    address: initialData.address || "",
    country: initialData.country || "",
    state: initialData.state || "",
    city: initialData.city || "",
    pincode: initialData.pincode || "",
    nationality: initialData.nationality || "",
  });

  const [changedLanguages, setChangedLanguages] = useState(false);
  const [changedLocationFields, setChangedLocationFields] = useState<string[]>(
    []
  );

  useEffect(() => {
    const hasChanged =
      JSON.stringify(formData.languages) !==
      JSON.stringify(initialLanguages.current);
    setLanguagesChanged(hasChanged);
    setChangedLanguages(hasChanged);
  }, [formData.languages]);

  useEffect(() => {
    const changedFields: string[] = [];

    if (formData.address !== initialLocation.current.address)
      changedFields.push("address");
    if (formData.country !== initialLocation.current.country)
      changedFields.push("country");
    if (formData.state !== initialLocation.current.state)
      changedFields.push("state");
    if (formData.city !== initialLocation.current.city)
      changedFields.push("city");
    if (formData.pincode !== initialLocation.current.pincode)
      changedFields.push("pincode");
    if (formData.nationality !== initialLocation.current.nationality)
      changedFields.push("nationality");

    setChangedLocationFields(changedFields);
    setLocationChanged(changedFields.length > 0);
  }, [
    formData.address,
    formData.country,
    formData.state,
    formData.city,
    formData.pincode,
    formData.nationality,
  ]);

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

  const validateField = (name: string, value: string) => {
    let error = "";
    const trimmedValue = value.trim();
    const currentYear = new Date().getFullYear();

    switch (name) {
      case "firstName":
      case "middleName":
      case "lastName":
        if (value.length > 50) {
          error = "Maximum 50 characters allowed";
        } else if (value && !/^[A-Za-z]+$/.test(value)) {
          error = "Only letters allowed";
        }
        break;

      case "dateOfBirth":
        if (value) {
          const dob = new Date(value);
          const year = dob.getFullYear();

          if (Number.isNaN(dob.getTime())) {
            error = "Enter a valid date of birth";
          } else if (year <= 1930 || year >= currentYear) {
            error = `Date of birth year must be after 1930 and before ${currentYear}`;
          }
        }
        break;

      case "email":
        if (value.length > 150) {
          error = "Maximum 150 characters allowed";
        } else if (
          value &&
          !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
        ) {
          error = "Enter a valid email address";
        }
        break;

      case "mobileNumber":
        if (value && !/^[6-9]\d{9}$/.test(value)) {
          error = "Mobile number must be 10 digits and start with 6, 7, 8, or 9";
        }
        break;

      case "pincode":
        if (value && !/^\d{6}$/.test(value)) {
          error = "Pincode must be exactly 6 digits";
        }
        break;

      case "address":
        if (!trimmedValue) {
          error = "Address is required";
        } else if (value.length > MAX_ADDRESS_LENGTH) {
          error = "Maximum 250 characters allowed";
        }
        break;

      case "country":
        if (!trimmedValue) {
          error = "Country is required";
        }
        break;

      case "state":
        if (!trimmedValue) {
          error = "State is required";
        }
        break;

      case "city":
        if (!trimmedValue) {
          error = "City is required";
        }
        break;

      case "nationality":
        if (value.length > 50) {
          error = "Maximum 50 characters allowed";
        } else if (value && !/^[A-Za-z]+$/.test(value)) {
          error = "Only letters allowed";
        }
        break;
      default:
        break;
    }

    return error;
  };

  const validateFields = (fieldNames: string[]) => {
    const nextErrors = fieldNames.reduce((acc, fieldName) => {
      acc[fieldName] = validateField(fieldName, String((formData as Record<string, any>)[fieldName] || ""));
      return acc;
    }, {} as { [key: string]: string });

    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return nextErrors;
  };

  const hasErrors = (fieldErrors: { [key: string]: string }) =>
    Object.values(fieldErrors).some(Boolean);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    let newValue = value;
    let error = "";

    if (name === "firstName" || name === "middleName" || name === "lastName") {
      newValue = value.replace(/[^A-Za-z]/g, "");
      if (newValue.length > 50) return;
      if (newValue !== value) {
        error = "Only letters allowed";
      }
    }
    else if (name === "pincode") {
      if (!/^\d*$/.test(value)) {
        error = "Only digits allowed";
        setErrors((prev) => ({ ...prev, [name]: error }));
        return;
      }
      if (value.length > 6) return;
    } 
    else if (name === "mobileNumber") {
      if (!/^\d*$/.test(value)) {
        setErrors((prev) => ({ ...prev, [name]: "Only digits allowed" }));
        return;
      }
      if (value.length > 10) return;
    } 
    else if (name === "nationality") {
      if (!/^[A-Za-z]*$/.test(value)) {
        setErrors((prev) => ({ ...prev, [name]: "Only letters allowed" }));
        return;
      }
      if (value.length > 50) return;
    }
    else if (name === "email") {
      if (value.length > 250) return;
    }
    else if (name === "address") {
      if (value.length > MAX_ADDRESS_LENGTH) return;
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (!error) {
      error = validateField(name, newValue);
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    // "Other" swaps the dropdown for a free-text field the user fills in themselves.
    if (value === OTHER_CITY) {
      setIsCustomCity(true);
      setFormData((prev) => ({ ...prev, city: "" }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.city;
        return next;
      });
      return;
    }

    setIsCustomCity(false);
    setFormData((prev) => ({ ...prev, city: value }));
    setErrors((prev) => ({ ...prev, city: validateField("city", value) }));
  };

  const handleCustomCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, MAX_CITY_LENGTH);
    setFormData((prev) => ({ ...prev, city: value }));
    setErrors((prev) => ({ ...prev, city: validateField("city", value) }));
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

    const prev = formData.profilePhotoPreview;
    if (prev && typeof prev === "string" && prev.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(prev);
      } catch { }
    }

    try {
      const cloudinaryRes = await uploadToCloudinary(file);

      const nextData = {
        ...formData,
        profilePhoto: file,
        profilePhotoPreview: cloudinaryRes.url,
        uploadedPhotoURL: cloudinaryRes.url,
        uploadedPublicId: cloudinaryRes.publicId,
        uploadedDeleteToken: cloudinaryRes.deleteToken || "",
      };

      setFormData(nextData);

      if (onUpdate) {
        onUpdate(nextData);
      }

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

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLanguageInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewLanguage(e.target.value);
    setShowLanguageSuggestions(true);
  };

  const handleSelectLanguage = (language: string) => {
    if (!formData.languages.includes(language.trim())) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, language.trim()],
      }));
    }
    setNewLanguage("");
    setShowLanguageSuggestions(false);
  };

  const handleAddLanguage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newLanguage.trim()) {
      e.preventDefault();

      const exactMatch = filteredSuggestions.find(
        (lang) => lang.toLowerCase() === newLanguage.trim().toLowerCase()
      );

      if (exactMatch && !formData.languages.includes(exactMatch)) {
        setFormData((prev) => ({
          ...prev,
          languages: [...prev.languages, exactMatch],
        }));
        setNewLanguage("");
      } else if (newLanguage.trim() && filteredSuggestions.length === 0) {
        setNewLanguage("");
      }

      setShowLanguageSuggestions(false);
    }
  };

  const handleRemoveLanguage = (languageToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter(
        (lang: string) => lang !== languageToRemove
      ),
    }));
  };

  const handleClearLanguages = () => {
    setFormData((prev) => ({
      ...prev,
      languages: [...initialLanguages.current],
    }));
  };

  const handleClearCurrentLocation = () => {
    setFormData((prev) => ({
      ...prev,
      address: initialLocation.current.address,
      country: initialLocation.current.country,
      state: initialLocation.current.state,
      city: initialLocation.current.city,
      pincode: initialLocation.current.pincode,
      nationality: initialLocation.current.nationality,
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.pincode;
      delete newErrors.address;
      delete newErrors.nationality;
      return newErrors;
    });
  };

  const handleUpdateLanguages = async () => {
    if (!personalDetailsId) {
      console.error("No personalDetailsId available");
      setLanguagesFeedback("Unable to save: Missing personal details ID");
      setTimeout(() => setLanguagesFeedback(""), 3000);
      return;
    }

    try {
      const payload = {
        languages_known: formData.languages,
      };

      console.log("Updating languages with payload:", payload);

      await updatePersonalDetails(userId, token, personalDetailsId, payload);
      initialLanguages.current = [...formData.languages];
      setLanguagesChanged(false);
      setChangedLanguages(false);
      if (onUpdate) {
        onUpdate({
          ...formData,
        });
      }
      setLanguagesFeedback("Languages updated successfully!");
      setTimeout(() => setLanguagesFeedback(""), 3000);
    } catch (error) {
      console.error("Error updating languages:", error);
      setLanguagesFeedback("Failed to update languages");
      setTimeout(() => setLanguagesFeedback(""), 3000);
    }
  };

  const handleUpdateLocation = async () => {
    if (!personalDetailsId || changedLocationFields.length === 0) {
      console.error("No personalDetailsId available or no fields changed");
      if (!personalDetailsId) {
        setLocationFeedback("Unable to save: Missing personal details ID");
        setTimeout(() => setLocationFeedback(""), 3000);
      }
      return;
    }

    const locationErrors = validateFields(CURRENT_LOCATION_FIELDS);
    if (hasErrors(locationErrors)) {
      setSubmitError("Please fix validation errors in Current Location before saving.");
      return;
    }

    try {
      const payload: any = {};

      changedLocationFields.forEach((field) => {
        switch (field) {
          case "address":
            payload.address = formData.address;
            break;
          case "country":
            payload.country = formData.country;
            break;
          case "state":
            payload.state = formData.state;
            break;
          case "city":
            payload.city = formData.city;
            break;
          case "pincode":
            payload.pincode = formData.pincode;
            break;
          case "nationality":
            payload.nationality = formData.nationality;
            break;
        }
      });

      await updatePersonalDetails(userId, token, personalDetailsId, payload);

      initialLocation.current = {
        address: formData.address,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
        nationality: formData.nationality,
      };

      setLocationChanged(false);
      setChangedLocationFields([]);
      if (onUpdate) {
        onUpdate({
          ...formData,
        });
      }
      setLocationFeedback("Location updated successfully!");
      setTimeout(() => setLocationFeedback(""), 3000);
    } catch (error) {
      console.error("Error updating location:", error);
      setLocationFeedback("Failed to update location");
      setTimeout(() => setLocationFeedback(""), 3000);
    }
  };

  const canProceed = !Object.keys(errors).some((key) => errors[key]);
  const handlePersonalDetailsOtpSent = async () => {
    try {
      if (!formData.email && !formData.mobileNumber) {
        setSubmitError("Please provide an email or mobile number to receive OTP");
        return;
      }

      // Reset OTP state
      setOtpValue("");
      setOtpError("");
      setResendTimer(30);

      await sendOtpPersonalChange(userId, token);
    } catch (error) {
      console.error("Error sending OTP:", error);
      setOtpError("Failed to send OTP. Please try again.");
      setResendTimer(0);
    }
  };

  const handleSubmitOtp = async () => {
    try {
      const personalErrors = validateFields(PERSONAL_DETAIL_FIELDS);
      if (hasErrors(personalErrors)) {
        setOtpError("Please fix validation errors in Personal Details.");
        return;
      }

      // Validate OTP input
      if (!otpValue || otpValue.length < 4) {
        setOtpError("Please enter a valid OTP.");
        return;
      }

      if (!personalDetailsId) {
        setOtpError("Unable to save: Missing personal details ID");
        return;
      }

      // Prepare personal details payload
      const personalDetailsPayload = {
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        email: formData.email,
        mobile_number: formData.mobileNumber,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender?.toLowerCase(),
      };

      // Call the combined OTP verification and update API
      await updatePersonalDetailsWithOTP(otpValue, personalDetailsPayload, token);

      // Update the initial values to reflect saved changes
      initialPersonalDetails.current = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      };

      // If email has changed, update local storage "user" object's email
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          if (parsedUser) {
            parsedUser.email = formData.email;
            localStorage.setItem("user", JSON.stringify(parsedUser));
          }
        } catch (e) {
          console.error("Failed to update user in localStorage:", e);
        }
      }

      if (onUpdate) {
        onUpdate({
          ...formData,
        });
      }

      setPersonalDetailsChanged(false);
      setOtpValue("");
      setOtpError("");
      setShowOtpPopup(false);
      setPersonalDetailsFeedback("Personal details updated successfully!");
      setTimeout(() => setPersonalDetailsFeedback(""), 3000);
    } catch (error) {
      console.error("Error updating personal details with OTP:", error);
      setOtpError(error.response?.data?.message || "Failed to update personal details. Please try again.");
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedProceed(true);

    const formErrors = validateFields([
      ...PERSONAL_DETAIL_FIELDS,
      ...CURRENT_LOCATION_FIELDS,
    ]);

    if (hasErrors(formErrors)) {
      if (PERSONAL_DETAIL_FIELDS.some((fieldName) => formErrors[fieldName])) {
        setPersonalDetailsExpanded(true);
      }
      if (CURRENT_LOCATION_FIELDS.some((fieldName) => formErrors[fieldName])) {
        setCurrentLocationExpanded(true);
      }
      setSubmitError("Please fix validation errors before proceeding.");
      return;
    }

    // 🔹 Unsaved changes check with section names
    if (languagesChanged || locationChanged) {
      let message = "Please save your changes before proceeding:\n\n";

      if (languagesChanged) {
        message += "• Languages Known (unsaved changes)\n";
      }

      if (locationChanged) {
        message += "• Current Location (unsaved changes)\n";
      }

      setSubmitError(message);
      return;
    }

    // 🔹 Validation errors check
    if (Object.keys(errors).some((key) => errors[key])) {
      setSubmitError("Please fix validation errors before proceeding.");
      return;
    }

    if (!formData.languages || formData.languages.length === 0) {
      setLanguagesExpanded(true);
      languageInputRef.current?.focus();
      return;
    }

    const missingLocationFields: string[] = [];

    if (!formData.address?.trim()) missingLocationFields.push("Address");
    if (!formData.country?.trim()) missingLocationFields.push("Country");
    if (!formData.state?.trim()) missingLocationFields.push("State");
    if (!formData.city?.trim()) missingLocationFields.push("City");
    if (!formData.pincode?.trim()) missingLocationFields.push("Pincode");
    if (!formData.nationality?.trim()) missingLocationFields.push("Nationality");

    if (missingLocationFields.length > 0) {
      setCurrentLocationExpanded(true);
      setSubmitError(
        `Please fill in all required Current Location fields before proceeding:\n\n• ${missingLocationFields.join("\n• ")}`
      );
      return;
    }

    setSubmitError("");
    onNext(formData);
  };
  // Scroll to top of the next step (Education) after proceeding


  const filteredSuggestions = useMemo(() => {
    if (!newLanguage.trim()) return [];
    const normalizedInput = newLanguage.trim().toLowerCase();

    return ALL_LANGUAGES.filter(
      (lang) =>
        lang.toLowerCase().startsWith(normalizedInput) &&
        !formData.languages.some(
          (addedLang: string) => addedLang.toLowerCase() === lang.toLowerCase()
        )
    ).slice(0, 5);
  }, [newLanguage, formData.languages]);


  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6"
    >
      {submitError && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-white/20"
            onClick={() => setSubmitError("")}
          ></div>

          <div className="relative bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md z-50 animate-fadeIn">
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

      {personalDetailsFeedback && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-white/20"
            onClick={() => setPersonalDetailsFeedback("")}
          ></div>

          <div className="relative bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md z-50 animate-fadeIn">
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Success
            </h3>
            <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">
              {personalDetailsFeedback}
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPersonalDetailsFeedback("")}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 md:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1">
            Step 1: Personal Details
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Add your personal information and contact details
          </p>
          <p className="text-xs text-gray-500 mb-2">
            <span className="text-red-500">*</span> Required fields
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
              Personal Details
            </h3>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() =>
                  setPersonalDetailsExpanded(!personalDetailsExpanded)
                }
                className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ChevronDown
                  className={`w-3 h-3 text-gray-600 cursor-pointer transition-transform ${!personalDetailsExpanded ? "rotate-180" : ""
                    }`}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </div>

          {personalDetailsExpanded && (
            <div className="p-4 sm:p-5 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
                <div className="md:col-span-3 flex justify-center md:justify-start">
                  <div className="flex flex-col items-center">
                    <div
                      onClick={handlePhotoClick}
                      className={`relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 bg-gray-100 rounded-lg border-2 ${formData.profilePhotoPreview ||
                        formData.uploadedPhotoURL
                        ? "border-gray-300"
                        : "border-dashed border-gray-300"
                        } flex items-center justify-center overflow-hidden ${!formData.profilePhotoPreview &&
                          !formData.uploadedPhotoURL
                          ? "cursor-pointer hover:border-orange-400 transition-colors group"
                          : ""
                        }`}
                    >
                      {formData.profilePhotoPreview ||
                        formData.uploadedPhotoURL ? (
                        <>
                          <img
                            src={
                              formData.profilePhotoPreview ||
                              formData.uploadedPhotoURL
                            }
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();

                              try {
                                if (formData.uploadedDeleteToken) {
                                  const deleteSuccess =
                                    await deleteFromCloudinary(
                                      formData.uploadedDeleteToken
                                    );
                                  console.log(
                                    "Cloudinary delete result:",
                                    deleteSuccess
                                  );
                                }

                                if (personalDetailsId) {
                                  const payload = {
                                    profile_photo_url: "",
                                  };
                                  console.log(
                                    "Updating profile photo to empty:",
                                    payload
                                  );
                                  await updatePersonalDetails(
                                    userId,
                                    token,
                                    personalDetailsId,
                                    payload
                                  );
                                }
                              } catch (error) {
                                console.error("Error deleting photo:", error);
                              }

                              setFormData((prev) => {
                                const nextData = {
                                  ...prev,
                                  profilePhoto: null,
                                  profilePhotoPreview: "",
                                  uploadedPhotoURL: "",
                                  uploadedPublicId: "",
                                  uploadedDeleteToken: "",
                                };
                                if (onUpdate) {
                                  onUpdate(nextData);
                                }
                                return nextData;
                              });

                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            }}
                            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-100 z-10 transition-colors"
                            title="Delete photo"
                          >
                            <X className="w-4 h-4 text-red-500 cursor-pointer" />
                          </button>
                        </>
                      ) : (
                        <svg
                          className="w-12 h-12 sm:w-14 sm:h-14 text-gray-400 group-hover:text-orange-400 transition-colors"
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
                      onClick={handlePhotoClick}
                      className="mt-2 text-xs sm:text-sm text-gray-700 hover:text-orange-400 font-medium transition-colors"
                    >
                      Upload Profile Photo
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

                <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      maxLength={50}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm ${errors.firstName ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      maxLength={50}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm ${errors.middleName ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.middleName && (
                      <p className="mt-1 text-xs text-red-500">{errors.middleName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      maxLength={50}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm ${errors.lastName ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      maxLength={250}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm ${errors.email ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value="+91"
                        disabled
                        className="w-12 sm:w-14 px-2 py-2 sm:py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-xs sm:text-sm text-center cursor-not-allowed"
                      />
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        inputMode="numeric"
                        maxLength={10}
                        className={`flex-1 px-3 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm tracking-wider ${errors.mobileNumber ? "border-red-500" : "border-gray-300"}`}
                      />
                    </div>
                    {errors.mobileNumber && (
                      <p className="mt-1 text-xs text-red-500">{errors.mobileNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      min="1931-01-01"
                      max={`${new Date().getFullYear() - 1}-12-31`}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm ${errors.dateOfBirth ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm appearance-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-gray-200">
                {personalDetailsChanged && (
                  <button
                    type="button"
                    onClick={async () => {
                      const personalErrors = validateFields(PERSONAL_DETAIL_FIELDS);
                      if (hasErrors(personalErrors)) {
                        setPersonalDetailsExpanded(true);
                        setSubmitError("Please fix validation errors in Personal Details before saving.");
                        return;
                      }
                      handlePersonalDetailsOtpSent();
                      setShowOtpPopup(true);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md text-sm font-medium shadow-sm hover:from-orange-500 hover:to-orange-600 transition cursor-pointer"
                    aria-label="Save personal details"
                  >
                    <Save className="w-4 h-4" strokeWidth={2} />
                    Save
                  </button>
                )}
              </div>
            </div>
          )}

          {showOtpPopup && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="absolute inset-0 backdrop-blur-md bg-white/10" onClick={() => setShowOtpPopup(false)}></div>
              <div className="relative bg-white rounded-xl shadow-2xl p-6 w-[90%] max-w-md z-50">
                <h3 className="text-lg font-semibold text-orange-600 mb-2">OTP Sent</h3>
                <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">We have sent you otp in your mail. please enter to confirm your changes</p>
                <input
                  type="text"
                  value={otpValue}
                  onChange={e => setOtpValue(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  maxLength={6}
                />
                {otpError && <p className="text-xs text-red-500 mb-2">{otpError}</p>}
                <div className="flex justify-between gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleSubmitOtp}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handlePersonalDetailsOtpSent();
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Resend
                  </button>
                </div>
                {otpResent && <p className="text-xs text-green-600 mt-2">OTP resent to your mail.</p>}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-visible">
          <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
              Communication Language <span className="text-red-500">*</span>
            </h3>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setLanguagesExpanded(!languagesExpanded)}
                className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ChevronDown
                  className={`w-3 h-3 text-gray-600 cursor-pointer transition-transform ${!languagesExpanded ? "rotate-180" : ""
                    }`}
                  strokeWidth={2.5}
                />
              </button>

            </div>
          </div>

          {languagesExpanded && (
            <div className="p-4 sm:p-5 md:p-6">
              <div
                ref={languageContainerRef}
                className="relative w-full overflow-visible"
              >
                <div className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent min-h-[38px] sm:min-h-[42px] flex flex-wrap gap-2 items-center">
                  {formData.languages.map((lang: string, index: number) => (
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
                    placeholder="Add Language known to you..."
                    className="flex-1 min-w-[150px] sm:min-w-[200px] outline-none text-xs sm:text-sm"
                  />
                </div>

                {showLanguageSuggestions && filteredSuggestions.length > 0 && (
                  <div
                    ref={suggestionBoxRef}
                    className="absolute z-20 w-full mt-0.5 left-0 top-full"
                  >
                    <div className="absolute z-20 mt-0.5 left-0 top-full">
                      <div className="bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto w-fit">
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
                    </div>
                  </div>
                )}
              </div>

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
                {languagesChanged && (
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

        <div className="bg-white border border-gray-200 rounded-xl mb-4 md:mb-5 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
              Current Location
            </h3>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() =>
                  setCurrentLocationExpanded(!currentLocationExpanded)
                }
                className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ChevronDown
                  className={`w-3 h-3 text-gray-600 cursor-pointer transition-transform ${!currentLocationExpanded ? "rotate-180" : ""
                    }`}
                  strokeWidth={2.5}
                />
              </button>

            </div>
          </div>

          {currentLocationExpanded && (
            <div className="p-4 sm:p-5 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    rows={3}
                    maxLength={MAX_ADDRESS_LENGTH}
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-xs sm:text-sm resize-none ${errors.address
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400"
                      }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      aria-invalid={!!errors.country}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-xs sm:text-sm appearance-none bg-white pr-8 ${errors.country
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400"
                        }`}
                      disabled={loadingCountries}
                    >
                      <option value="">{loadingCountries ? "Loading..." : "Select Country"}</option>
                      {countryOptions.map((country) => (
                        <option key={country.isoCode} value={country.name}>{country.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.country && (
                    <p className="mt-1 text-xs text-red-500">{errors.country}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    State <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      aria-invalid={!!errors.state}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-xs sm:text-sm appearance-none bg-white pr-8 ${errors.state
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400"
                        }`}
                      disabled={loadingStates || !formData.country}
                    >
                      <option value="">{loadingStates ? "Loading..." : "Select State"}</option>
                      {stateOptions.map((state) => (
                        <option key={state.isoCode} value={state.name}>{state.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.state && (
                    <p className="mt-1 text-xs text-red-500">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="city"
                      value={isCustomCity ? OTHER_CITY : formData.city}
                      onChange={handleCityChange}
                      aria-required="true"
                      aria-invalid={!!errors.city}
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-xs sm:text-sm appearance-none bg-white pr-8 ${errors.city
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400"
                        }`}
                      disabled={loadingCities || !formData.state}
                    >
                      <option value="">{loadingCities ? "Loading..." : "Select City"}</option>
                      {cityOptions.map((city) => (
                        <option key={city.name} value={city.name}>{city.name}</option>
                      ))}
                      <option value={OTHER_CITY}>Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {isCustomCity && (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={handleCustomCityChange}
                      maxLength={MAX_CITY_LENGTH}
                      placeholder="Enter your city"
                      autoFocus
                      aria-required="true"
                      aria-invalid={!!errors.city}
                      className={`mt-2 w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-xs sm:text-sm ${errors.city
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-orange-400"
                        }`}
                    />
                  )}

                  {errors.city && (
                    <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter Pin code"
                    inputMode="numeric"
                    maxLength={6}
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm ${errors.pincode
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                      }`}
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.pincode}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Nationality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    placeholder="Enter Nationality"
                    maxLength={50}
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-xs sm:text-sm bg-white ${errors.nationality
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-orange-400"
                      }`}
                  />
                  {errors.nationality && (
                    <p className="mt-1 text-xs text-red-500">{errors.nationality}</p>
                  )}
                </div>
              </div>

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
                {locationChanged && (
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

        <div className="flex flex-col gap-4">
          {hasAttemptedProceed &&
          (!formData.languages || formData.languages.length === 0) ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">Missing mandatory field:</p>
              <ul className="text-xs text-red-700 space-y-1 ml-4 mt-1">
                <li>• Languages Known (required)</li>
              </ul>
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={false}
              style={{
                background: canProceed
                  ? "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)"
                  : "#BDBDBD",
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
