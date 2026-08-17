import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { checkCoupon } from "../services/couponService";
import { Eye, EyeOff } from "lucide-react";
import Bowizzy from "../assets/bowizzy.png";

export default function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUsername, setLinkedinUsername] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasCoupon, setHasCoupon] = useState(false); // user opted in to enter a coupon
  const [coupon, setCoupon] = useState("");
  const [couponStatus, setCouponStatus] = useState(""); // "valid" | "invalid" | ""
  const [couponMessage, setCouponMessage] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [agree, setAgree] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Email OTP verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);       // OTP has been sent → show OTP box
  const [emailOtpSending, setEmailOtpSending] = useState(false); // Sending OTP spinner
  const [otp, setOtp] = useState("");                             // OTP value user types
  const [otpVerifying, setOtpVerifying] = useState(false);       // Verifying OTP spinner
  const [emailVerifyMessage, setEmailVerifyMessage] = useState("");
  const [emailVerifyStatus, setEmailVerifyStatus] = useState<"" | "success" | "error">("");
  const verifiedEmailRef = useRef("");

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Whether the user has attempted to submit the form at least once.
  // Used to decide when to show the "fill mandatory fields" banner and
  // to make sure every error (including untouched fields) surfaces together.
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            navigate("/login");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showSuccess, navigate]);

  type RegisterErrors = {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    phone?: string;
    dob?: string;
    email?: string;
    linkedin?: string;
    gender?: string;
    password?: string;
    confirmPassword?: string;
  };
  const [errors, setErrors] = useState<RegisterErrors>({});

  const setFieldError = (field, message) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  // Returns the classNames to apply to an input so it highlights red when
  // that field currently has a validation error.
  const fieldClass = (field: keyof RegisterErrors, base = "") => {
    const hasError = Boolean(errors[field]);
    return `${base} ${
      hasError
        ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-300"
        : "border-gray-300"
    }`;
  };

  const sanitizeName = (value) => value.replace(/[^A-Za-z\s]/g, "").trim();
  const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);
  const isBlank = (value) => !value || value.trim() === "";

  const extractLinkedinUsername = (value) => {
    if (!value) return "";
    const m = value.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
    if (m?.[1]) return m[1];
    return value;
  };

  const formatDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getAge = (dob: string) => {
    if (!dob) return 0;

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    return age;
  };

  const isValidDob = (dob: string) => {
    const age = getAge(dob);
    return age >= 18 && age < 100;
  };

  const today = new Date();
  const minDob = formatDateInputValue(new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()));
  const maxDob = formatDateInputValue(new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()));

  // Password rule
  const validPassword = (pwd) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#])[A-Za-z\d@$!%*?&_#]{8,}$/.test(pwd);
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return;
    try {
      setEmailOtpSending(true);
      setEmailVerifyMessage("");
      setEmailVerifyStatus("");
      setOtp("");

      await api.post("/auth/send-email-otp", { email: normalizedEmail });

      setEmailOtpSent(true);
      setEmailVerifyStatus("success");
      setEmailVerifyMessage("OTP sent to your email. Please check your inbox.");
    } catch (err: any) {
      setEmailOtpSent(false);
      setEmailVerifyStatus("error");
      setEmailVerifyMessage(
        err?.response?.data?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setEmailOtpSending(false);
    }
  };

  // Step 2: Verify the OTP entered by user
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setEmailVerifyStatus("error");
      setEmailVerifyMessage("Please enter the 6-digit OTP.");
      return;
    }
    try {
      setOtpVerifying(true);
      setEmailVerifyMessage("");
      setEmailVerifyStatus("");

      await api.post("/auth/verify-email-otp", { email, otp });

      verifiedEmailRef.current = email;
      setEmailVerified(true);
      setEmailOtpSent(false);
      setOtp("");
      setEmailVerifyStatus("success");
      setEmailVerifyMessage("Email verified successfully!");
    } catch (err: any) {
      setEmailVerifyStatus("error");
      setEmailVerifyMessage(
        err?.response?.data?.message || "Invalid OTP. Please try again."
      );
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleCouponCheck = async () => {
    if (!coupon.trim()) {
      setCouponStatus("invalid");
      setCouponMessage("Please enter coupon code");
      return;
    }

    try {
      setCheckingCoupon(true);
      setCouponStatus("");
      setCouponMessage("");

      const res = await checkCoupon(coupon);

      if (res.exists) {
        setCouponStatus("valid");
        setCouponMessage("Coupon code valid");
      } else {
        setCouponStatus("invalid");
        setCouponMessage("Coupon code not valid");
      }
    } catch (err) {
      setCouponStatus("invalid");
      setCouponMessage(err?.response?.data?.message || "Invalid coupon");
    } finally {
      setCheckingCoupon(false);
    }
  };

  // Runs every field's validation rule at once (used on submit) so that
  // every error - including fields the user never touched - shows together.
  const validateAll = (): RegisterErrors => {
    const newErrors: RegisterErrors = {};

    const normalizedFirstName = firstName.trim();
    const normalizedMiddleName = middleName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedPhoneNumber = phoneNumber.trim();
    const normalizedEmail = email.trim();
    const normalizedLinkedinUsername = linkedinUsername.trim();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (isBlank(normalizedFirstName)) {
      newErrors.firstName = "First name is required";
    } else if (/[^A-Za-z\s]/.test(normalizedFirstName)) {
      newErrors.firstName = "Only letters allowed";
    } else if (normalizedFirstName.length > 32) {
      newErrors.firstName = "Max 32 characters";
    }

    if (normalizedMiddleName && /[^A-Za-z\s]/.test(normalizedMiddleName)) {
      newErrors.middleName = "Only letters allowed";
    } else if (normalizedMiddleName.length > 32) {
      newErrors.middleName = "Max 32 characters";
    }

    if (isBlank(normalizedLastName)) {
      newErrors.lastName = "Last name is required";
    } else if (/[^A-Za-z\s]/.test(normalizedLastName)) {
      newErrors.lastName = "Only letters allowed";
    } else if (normalizedLastName.length > 32) {
      newErrors.lastName = "Max 32 characters";
    }

    if (isBlank(normalizedPhoneNumber)) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(normalizedPhoneNumber)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (isBlank(dateOfBirth)) {
      newErrors.dob = "Date of birth is required";
    } else if (!isValidDob(dateOfBirth)) {
      newErrors.dob = "You must be between 18 and 99 years old";
    }

    if (isBlank(normalizedEmail)) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      newErrors.email = "Enter a valid email address";
    }

    if (isBlank(normalizedLinkedinUsername)) {
      newErrors.linkedin = "LinkedIn username is required";
    }

    if (isBlank(gender)) {
      newErrors.gender = "Gender is required";
    }

    if (isBlank(normalizedPassword)) {
      newErrors.password = "Password is required";
    } else if (!validPassword(normalizedPassword)) {
      newErrors.password = "Min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol";
    }

    if (isBlank(normalizedConfirmPassword)) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (normalizedPassword !== normalizedConfirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitAttempted(true);

    // Validate every field at once so all errors show together, highlighted
    // in place, instead of stopping at the first problem found.
    const newErrors = validateAll();
    const hasFieldErrors = Object.values(newErrors).some((msg) => Boolean(msg));

    if (hasFieldErrors) {
      setFormError("Please fill in all the mandatory fields marked with * correctly before signing up.");
      return;
    }

    if (!emailVerified) {
      setFormError("Please verify your email address before signing up.");
      return;
    }

    if (!agree) {
      setFormError("You must agree to the Terms and Conditions and Privacy Policy.");
      return;
    }

    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();
    const normalizedFirstName = firstName.trim();
    const normalizedMiddleName = middleName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedPhoneNumber = phoneNumber.trim();
    const normalizedLinkedinUsername = linkedinUsername.trim();
    const normalizedCoupon = coupon.trim();

    setLoading(true);

    try {
      // If a coupon was entered but not checked/validated yet, validate it now
      if (normalizedCoupon) {
        if (couponStatus !== "valid") {
          try {
            setCheckingCoupon(true);
            const couponRes = await checkCoupon(normalizedCoupon);

            if (!couponRes.exists) {
              setCouponStatus("invalid");
              setCouponMessage("Coupon code not valid");
              setFormError("Coupon code not valid.");
              setLoading(false);
              return;
            } else {
              setCouponStatus("valid");
              setCouponMessage("Coupon code valid");
            }
          } catch (err) {
            setCouponStatus("invalid");
            setCouponMessage(err?.response?.data?.message || "Invalid coupon");
            setFormError("Coupon code not valid.");
            setLoading(false);
            return;
          } finally {
            setCheckingCoupon(false);
          }
        }
      }

      await api.post("/auth", {
        type: "signup",
        email: normalizedEmail,
        password: normalizedPassword,
        first_name: normalizedFirstName,
        middle_name: normalizedMiddleName,
        last_name: normalizedLastName,
        phone_number: normalizedPhoneNumber,
        date_of_birth: dateOfBirth,
        linkedin_url: `https://www.linkedin.com/in/${normalizedLinkedinUsername}`,
        gender,
        coupon_code: normalizedCoupon,
      });

      setLoading(false);
      setShowSuccess(true);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Signup error");
      setLoading(false);
    }
  };

  return (
    <>
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Account Created Successfully!</h3>
            <p className="text-gray-500">Redirecting to login in</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{countdown}</p>
          </div>
        </div>
      )}

      <div className="min-h-screen grid grid-cols-1 md:grid-cols-[700px_1fr] font-['Baloo_2']">
        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-between bg-[#FFE9D6] p-12 sticky top-0 h-screen">
          <img src={Bowizzy} alt="Logo" className="w-32" />
          <h1 className="text-4xl md:text-5xl font-semibold text-orange-700">
            Prep for interviews. <br /> Grow your career.
          </h1>
          <p className="text-sm text-gray-700">
            Ready to get started? Sign up for free.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="h-screen overflow-y-auto bg-white">
          <div className="max-w-3xl mx-auto px-6 py-10">
            {/* Mobile Logo */}
            <div className="md:hidden flex justify-center mb-8">
              <img src={Bowizzy} alt="Logo" className="w-32" />
            </div>

            <h2 className="text-2xl font-semibold mb-4">Create Account</h2>

            {/* Friendly top-level banner shown after a failed submit attempt */}
            {submitAttempted && formError && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off" noValidate>
              <div className="grid grid-cols-12 gap-4">

                {/* FIRST NAME */}
                <div className="col-span-12 lg:col-span-6">
                  <label>
                    First Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const normalized = raw.trim();
                      if (/[^A-Za-z\s]/.test(normalized)) {
                        setFieldError("firstName", "Only letters allowed");
                      } else if (normalized.length > 32) {
                        setFieldError("firstName", "Max 32 characters");
                      } else if (isBlank(normalized)) {
                        setFieldError("firstName", "First name is required");
                      } else {
                        setFieldError("firstName", "");
                      }
                      const val = sanitizeName(normalized).slice(0, 32);
                      setFirstName(val);
                    }}
                    className={fieldClass("firstName", "mt-2 w-full px-4 py-3 border rounded-lg")}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>

                {/* MIDDLE NAME */}
                <div className="col-span-12 lg:col-span-6">
                  <label>Middle Name</label>
                  <input
                    value={middleName}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const normalized = raw.trim();
                      if (/[^A-Za-z\s]/.test(normalized)) {
                        setFieldError("middleName", "Only letters allowed");
                      } else if (normalized.length > 32) {
                        setFieldError("middleName", "Max 32 characters");
                      } else {
                        setFieldError("middleName", "");
                      }
                      const val = sanitizeName(normalized).slice(0, 32);
                      setMiddleName(val);
                    }}
                    className={fieldClass("middleName", "mt-2 w-full px-4 py-3 border rounded-lg")}
                  />
                  {errors.middleName && (
                    <p className="text-red-500 text-sm mt-1">{errors.middleName}</p>
                  )}
                </div>

                {/* LAST NAME */}
                <div className="col-span-12">
                  <label>
                    Last Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const normalized = raw.trim();
                      if (/[^A-Za-z\s]/.test(normalized)) {
                        setFieldError("lastName", "Only letters allowed");
                      } else if (normalized.length > 32) {
                        setFieldError("lastName", "Max 32 characters");
                      } else if (isBlank(normalized)) {
                        setFieldError("lastName", "Last name is required");
                      } else {
                        setFieldError("lastName", "");
                      }
                      const val = sanitizeName(normalized).slice(0, 32);
                      setLastName(val);
                    }}
                    className={fieldClass("lastName", "mt-2 w-full px-4 py-3 border rounded-lg")}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>

                {/* PHONE */}
                <div className="col-span-12">
                  <label>
                    Phone Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    value={phoneNumber}
                    onChange={(e) => {
                      const v = sanitizePhone(e.target.value.trim());
                      if (isBlank(v)) {
                        setFieldError("phone", "Phone number is required");
                      } else if (!/^[6-9]/.test(v)) {
                        setFieldError("phone", "Must start with 6-9");
                      } else if (v.length < 10) {
                        setFieldError("phone", "Enter a valid 10-digit phone number");
                      } else {
                        setFieldError("phone", "");
                      }
                      setPhoneNumber(v);
                    }}
                    className={fieldClass("phone", "mt-2 w-full px-4 py-3 border rounded-lg")}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* DOB */}
                <div className="col-span-12">
                  <label>
                    Date of Birth<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={minDob}
                    max={maxDob}
                    value={dateOfBirth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDateOfBirth(val);
                      if (isBlank(val)) {
                        setFieldError("dob", "Date of birth is required");
                      } else if (!isValidDob(val)) {
                        setFieldError("dob", "You must be between 18 and 99 years old");
                      } else {
                        setFieldError("dob", "");
                      }
                    }}
                    className={fieldClass("dob", "mt-2 w-full px-4 py-3 border rounded-lg")}
                  />
                  {errors.dob && (
                    <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
                  )}
                </div>

                {/* EMAIL */}
                <div className="col-span-12">
                  <label>
                    Email<span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 flex gap-2 items-center">
                    <input
                      value={email}
                      maxLength={150}
                      disabled={emailVerified}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setEmail(val);

                        // Reset verification if email changes
                        if (emailVerified && val !== verifiedEmailRef.current) {
                          setEmailVerified(false);
                          setEmailOtpSent(false);
                          setOtp("");
                          setEmailVerifyStatus("");
                          setEmailVerifyMessage("");
                        }
                        // Reset OTP box if email changes while OTP was sent
                        if (emailOtpSent) {
                          setEmailOtpSent(false);
                          setOtp("");
                          setEmailVerifyStatus("");
                          setEmailVerifyMessage("");
                        }

                        if (isBlank(val)) {
                          setFieldError("email", "Email is required");
                        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                          setFieldError("email", "Invalid email address");
                        } else {
                          setFieldError("email", "");
                        }
                      }}
                      className={
                        emailVerified
                          ? "flex-1 px-4 py-3 border rounded-lg transition-colors border-green-500 bg-green-50 text-gray-500 cursor-not-allowed"
                          : fieldClass("email", "flex-1 px-4 py-3 border rounded-lg transition-colors")
                      }
                      placeholder="Enter your email"
                    />

                    {/* Send OTP button — shown when valid email entered, OTP not yet sent, not yet verified */}
                    {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emailOtpSent && !emailVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={emailOtpSending}
                        className={`px-4 py-3 rounded-lg text-white font-medium whitespace-nowrap transition-colors ${
                          emailOtpSending
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-orange-500 hover:bg-orange-600"
                        }`}
                      >
                        {emailOtpSending ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                            Sending...
                          </span>
                        ) : (
                          "Verify"
                        )}
                      </button>
                    )}

                    {/* Verified badge */}
                    {emailVerified && (
                      <span className="flex items-center gap-1.5 px-3 py-3 rounded-lg bg-green-100 text-green-700 font-medium text-sm whitespace-nowrap">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>

                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}

                  {/* OTP input box — appears after OTP is sent */}
                  {emailOtpSent && !emailVerified && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Enter OTP
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={otp}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setOtp(val);
                            // Clear error as user types
                            if (emailVerifyStatus === "error") {
                              setEmailVerifyStatus("");
                              setEmailVerifyMessage("");
                            }
                          }}
                          maxLength={6}
                          placeholder="Enter 6-digit OTP"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg tracking-widest text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpVerifying || otp.length !== 6}
                          className={`px-4 py-3 rounded-lg text-white font-medium whitespace-nowrap transition-colors ${
                            otpVerifying || otp.length !== 6
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {otpVerifying ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                              Verifying...
                            </span>
                          ) : (
                            "Submit OTP"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={emailOtpSending}
                          className="text-sm text-orange-500 hover:text-orange-600 font-medium underline whitespace-nowrap transition-colors disabled:opacity-50"
                        >
                          Resend
                        </button>
                      </div>
                    </div>
                  )}

                  {emailVerifyMessage && (
                    <p
                      className={`text-sm mt-1.5 ${
                        emailVerifyStatus === "success" ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {emailVerifyMessage}
                    </p>
                  )}
                </div>

                {/* LINKEDIN */}
                <div className="col-span-12">
                  <label>
                    LinkedIn URL<span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 flex flex-col lg:flex-row">
                    <span className="px-3 py-3 border rounded-t-lg lg:rounded-t-none lg:rounded-l-lg bg-gray-100 flex items-center break-all lg:break-normal">
                      https://www.linkedin.com/in/
                    </span>
                    <input
                      value={linkedinUsername}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        if (val.startsWith("http")) {
                          setFieldError("linkedin", "Do not enter full URL");
                          val = val.replace(
                            /^https?:\/\/(www\.)?linkedin\.com\/in\//,
                            ""
                          );
                        } else if (isBlank(val)) {
                          setFieldError("linkedin", "LinkedIn username is required");
                        } else {
                          setFieldError("linkedin", "");
                        }
                        const extracted = extractLinkedinUsername(val);
                        setLinkedinUsername(extracted);
                      }}
                      className={fieldClass(
                        "linkedin",
                        "w-full px-4 py-3 border border-t-0 lg:border-t lg:border-l-0 rounded-b-lg lg:rounded-b-none lg:rounded-r-lg"
                      )}
                    />
                  </div>
                  {errors.linkedin && (
                    <p className="text-red-500 text-sm mt-1">{errors.linkedin}</p>
                  )}
                </div>

                {/* GENDER */}
                <div className="col-span-12">
                  <label>
                    Gender<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => {
                      const value = e.target.value;
                      setGender(value);
                      if (!value) {
                        setFieldError("gender", "Gender is required");
                      } else {
                        setFieldError("gender", "");
                      }
                    }}
                    className={fieldClass("gender", "mt-2 w-full px-4 py-3 border rounded-lg")}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-Binary</option>
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                  )}
                </div>

                {/* PASSWORD */}
                <div className="col-span-12">
                  <label>
                    Password<span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setPassword(val);
                        if (isBlank(val)) {
                          setFieldError("password", "Password is required");
                        } else if (!validPassword(val)) {
                          setFieldError(
                            "password",
                            "Min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol"
                          );
                        } else {
                          setFieldError("password", "");
                        }
                      }}
                      className={fieldClass("password", "w-full px-4 py-3 border rounded-lg")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="col-span-12">
                  <label>
                    Confirm Password<span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setConfirmPassword(val);
                        if (isBlank(val)) {
                          setFieldError("confirmPassword", "Please confirm your password");
                        } else if (password !== val) {
                          setFieldError("confirmPassword", "Passwords do not match");
                        } else {
                          setFieldError("confirmPassword", "");
                        }
                      }}
                      className={fieldClass("confirmPassword", "w-full px-4 py-3 border rounded-lg")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-3"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* COUPON */}
                <div className="col-span-12">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hasCoupon"
                      checked={hasCoupon}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHasCoupon(checked);
                        if (!checked) {
                          // Clear any entered/validated coupon when the box is hidden
                          setCoupon("");
                          setCouponStatus("");
                          setCouponMessage("");
                        }
                      }}
                    />
                    <label htmlFor="hasCoupon" className="text-sm cursor-pointer">
                      I have a coupon code I wish to apply
                    </label>
                  </div>

                  {hasCoupon && (
                    <>
                      <div className="flex gap-2 mt-3">
                        <input
                          value={coupon}
                          onChange={(e) => {
                            setCoupon(e.target.value.trim());
                            setCouponStatus("");
                            setCouponMessage("");
                          }}
                          className="w-full px-4 py-3 border rounded-lg"
                          placeholder="Enter coupon code"
                        />
                        <button
                          type="button"
                          onClick={handleCouponCheck}
                          disabled={checkingCoupon}
                          className={`px-4 py-3 rounded-lg text-white font-medium ${
                            checkingCoupon ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500"
                          }`}
                        >
                          {checkingCoupon ? "Checking..." : "Check"}
                        </button>
                      </div>
                      {couponMessage && (
                        <p
                          className={`text-sm mt-2 ${
                            couponStatus === "valid" ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {couponMessage}
                        </p>
                      )}
                    </>
                  )}
                </div>

              </div>

              {/* AGREE */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className={submitAttempted && !agree ? "outline outline-2 outline-red-400 rounded" : ""}
                />
                <p className="text-sm">
                  I agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 font-semibold hover:underline"
                  >
                    Terms and Conditions
                  </a>
                  {" "}and{" "}
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 font-semibold hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
              {submitAttempted && !agree && (
                <p className="text-red-500 text-sm -mt-4">
                  You must agree to the Terms and Conditions and Privacy Policy.
                </p>
              )}

              {/* Email not verified warning */}
              {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emailVerified && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                  ⚠️ Please verify your email address before signing up.
                </p>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg text-white font-medium flex items-center justify-center transition-colors ${
                  loading ? "bg-gray-400 opacity-60 cursor-not-allowed" : "bg-gray-700 hover:bg-gray-800"
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Sign Up"
                )}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-orange-600 font-semibold hover:underline cursor-pointer"
                  >
                    Log In
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}