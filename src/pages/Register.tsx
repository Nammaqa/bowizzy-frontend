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

  const sanitizeName = (value) => value.replace(/[^A-Za-z\s]/g, "").trim();
  const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);
  const isBlank = (value) => !value || value.trim() === "";

  const extractLinkedinUsername = (value) => {
    if (!value) return "";
    const m = value.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
    if (m?.[1]) return m[1];
    return value.replace(/[^A-Za-z0-9-]/g, "");
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
    return age > 18 && age < 100;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const normalizedFirstName = firstName.trim();
    const normalizedMiddleName = middleName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedPhoneNumber = phoneNumber.trim();
    const normalizedEmail = email.trim();
    const normalizedLinkedinUsername = linkedinUsername.trim();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();
    const normalizedCoupon = coupon.trim();

    if (isBlank(normalizedFirstName)) return setFormError("Please enter your first name.");
    if (isBlank(normalizedLastName)) return setFormError("Please enter your last name.");
    if (isBlank(normalizedPhoneNumber)) return setFormError("Please enter your phone number.");
    if (isBlank(normalizedEmail)) return setFormError("Please enter your email address.");
    if (isBlank(normalizedLinkedinUsername)) return setFormError("Please enter your LinkedIn username.");
    if (!emailVerified) return setFormError("Please verify your email address before signing up.");

    if (isBlank(gender)) return setFormError("Please select your gender.");
    if (!agree) return setFormError("You must agree to the terms.");

    if (normalizedPassword !== normalizedConfirmPassword)
      return setFormError("Passwords do not match.");

    if (!validPassword(normalizedPassword))
      return setFormError("Password must be 8+ chars, include upper, lower, number, symbol.");

    if (!/^[6-9]\d{9}$/.test(normalizedPhoneNumber))
      return setFormError("Phone number must be valid.");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
      return setFormError("Enter a valid email address.");

    if (!isValidDob(dateOfBirth))
      return setFormError("You must be between 18 and 99 years old.");

    if (!normalizedLinkedinUsername || !/^[A-Za-z0-9-]+$/.test(normalizedLinkedinUsername))
      return setFormError("Invalid LinkedIn identifier.");

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

            <h2 className="text-2xl font-semibold mb-10">Create Account</h2>

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <div className="grid grid-cols-12 gap-4">

                {/* FIRST NAME */}
                <div className="col-span-12 lg:col-span-6">
                  <label>First Name*</label>
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
                    className="mt-2 w-full px-4 py-3 border rounded-lg"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm">{errors.firstName}</p>
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
                    className="mt-2 w-full px-4 py-3 border rounded-lg"
                  />
                  {errors.middleName && (
                    <p className="text-red-500 text-sm">{errors.middleName}</p>
                  )}
                </div>

                {/* LAST NAME */}
                <div className="col-span-12">
                  <label>Last Name*</label>
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
                    className="mt-2 w-full px-4 py-3 border rounded-lg"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm">{errors.lastName}</p>
                  )}
                </div>

                {/* PHONE */}
                <div className="col-span-12">
                  <label>Phone Number*</label>
                  <input
                    value={phoneNumber}
                    onChange={(e) => {
                      const v = sanitizePhone(e.target.value.trim());
                      if (v.length > 0 && !/^[6-9]/.test(v)) {
                        setFieldError("phone", "Must start with 6-9");
                        return;
                      } else {
                        setFieldError("phone", "");
                      }
                      setPhoneNumber(v);
                    }}
                    className="mt-2 w-full px-4 py-3 border rounded-lg"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm">{errors.phone}</p>
                  )}
                </div>

                {/* DOB */}
                <div className="col-span-12">
                  <label>Date of Birth*</label>
                  <input
                    type="date"
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split("T")[0]}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                    value={dateOfBirth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDateOfBirth(val);
                      if (!isValidDob(val)) {
                        setFieldError("dob", "You must be between 18 and 99 years old");
                      } else {
                        setFieldError("dob", "");
                      }
                    }}
                    className="mt-2 w-full px-4 py-3 border rounded-lg"
                  />
                  {errors.dob && (
                    <p className="text-red-500 text-sm">{errors.dob}</p>
                  )}
                </div>

                {/* EMAIL */}
                <div className="col-span-12">
                  <label>Email*</label>
                  <div className="mt-2 flex gap-2 items-center">
                    <input
                      value={email}
                      maxLength={150}
                      disabled={emailVerified}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setEmail(val);
                        if (errors.email) setFieldError("email", "");

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

                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                          setFieldError("email", "Invalid email address");
                        } else {
                          setFieldError("email", "");
                        }
                      }}
                      className={`flex-1 px-4 py-3 border rounded-lg transition-colors ${
                        emailVerified
                          ? "border-green-500 bg-green-50 text-gray-500 cursor-not-allowed"
                          : "border-gray-300"
                      }`}
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
                      {/* <p className="text-xs text-gray-500 mt-1">OTP sent to {email}. Check your inbox.</p> */}
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
                  <label>LinkedIn URL*</label>
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
                        } else {
                          setFieldError("linkedin", "");
                        }
                        const extracted = extractLinkedinUsername(val);
                        setLinkedinUsername(extracted);
                      }}
                      className="w-full px-4 py-3 border border-t-0 lg:border-t lg:border-l-0 rounded-b-lg lg:rounded-b-none lg:rounded-r-lg"
                    />
                  </div>
                  {errors.linkedin && (
                    <p className="text-red-500 text-sm">{errors.linkedin}</p>
                  )}
                </div>

                {/* GENDER */}
                <div className="col-span-12">
                  <label>Gender*</label>
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
                    className="mt-2 w-full px-4 py-3 border rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-Binary</option>
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-sm">{errors.gender}</p>
                  )}
                </div>

                {/* PASSWORD */}
                <div className="col-span-12">
                  <label>Password*</label>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setPassword(val);
                        if (!validPassword(val)) {
                          setFieldError(
                            "password",
                            "Min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol"
                          );
                        } else {
                          setFieldError("password", "");
                        }
                      }}
                      className="w-full px-4 py-3 border rounded-lg"
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
                    <p className="text-red-500 text-sm">{errors.password}</p>
                  )}
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="col-span-12">
                  <label>Confirm Password*</label>
                  <div className="relative mt-2">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setConfirmPassword(val);
                        if (password !== val) {
                          setFieldError("confirmPassword", "Passwords do not match");
                        } else {
                          setFieldError("confirmPassword", "");
                        }
                      }}
                      className="w-full px-4 py-3 border rounded-lg"
                      required
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
                    <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* COUPON */}
                <div className="col-span-12">
                  <label>Coupon Code</label>
                  <div className="flex gap-2 mt-2">
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
                </div>

              </div>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              {/* AGREE */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
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

              {/* Email not verified warning */}
              {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emailVerified && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                  ⚠️ Please verify your email address before signing up.
                </p>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={!agree || loading || !emailVerified}
                className={`w-full py-3 rounded-lg text-white font-medium flex items-center justify-center transition-colors ${
                  agree && emailVerified
                    ? "bg-gray-700 hover:bg-gray-800"
                    : "bg-gray-300 cursor-not-allowed"
                } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
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
