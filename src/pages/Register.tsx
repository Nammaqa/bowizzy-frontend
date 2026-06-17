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
    password?: string;
    confirmPassword?: string;
  };
  const [errors, setErrors] = useState<RegisterErrors>({});

  const setFieldError = (field, message) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const sanitizeName = (value) => value.replace(/[^A-Za-z\s]/g, "");
  const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);

  const extractLinkedinUsername = (value) => {
    if (!value) return "";
    const m = value.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
    if (m?.[1]) return m[1];
    return value.replace(/[^A-Za-z0-9-]/g, "");
  };

  // Check if DOB is 18+
  const isAdult = (dob) => {
    const birth = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();

    return age > 18 || (age === 18 && month >= 0);
  };

  // Password rule
  const validPassword = (pwd) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#])[A-Za-z\d@$!%*?&_#]{8,}$/.test(
      pwd
    );
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

      // if success
      if (res.exists) {
        setCouponStatus("valid");
        setCouponMessage("Coupon code valid");
      } else {
        setCouponStatus("invalid");
        setCouponMessage("Coupon code not valid");
      }
    } catch (err) {
      setCouponStatus("invalid");
      setCouponMessage(
        err?.response?.data?.message || "Invalid coupon"
      );
    } finally {
      setCheckingCoupon(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    

    if (!agree) return setFormError("You must agree to the terms.");

    if (password !== confirmPassword)
      return setFormError("Passwords do not match.");

    if (!validPassword(password))
      return setFormError(
        "Password must be 8+ chars, include upper, lower, number, symbol."
      );

    if (!/^[6-9]\d{9}$/.test(phoneNumber))
      return setFormError("Phone number must be valid.");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setFormError("Enter a valid email address.");

    if (!isAdult(dateOfBirth))
      return setFormError("You must be 18 years or older.");

    if (!linkedinUsername || !/^[A-Za-z0-9-]+$/.test(linkedinUsername))
      return setFormError("Invalid LinkedIn identifier.");
      setLoading(true);

    try {
      // If a coupon was entered but not checked/validated yet, validate it now
      if (coupon && coupon.trim()) {
        if (couponStatus !== "valid") {
          try {
            setCheckingCoupon(true);
            const couponRes = await checkCoupon(coupon);

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
        email,
        password,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        phone_number: phoneNumber,
        date_of_birth: dateOfBirth,
        linkedin_url: `https://www.linkedin.com/in/${linkedinUsername}`,
        gender,
        coupon_code: coupon,
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

                    if (/[^A-Za-z\s]/.test(raw)) {
                      setFieldError("firstName", "Only letters allowed");
                    } else if (raw.length > 32) {
                      setFieldError("firstName", "Max 32 characters");
                    } else {
                      setFieldError("firstName", "");
                    }

                    const val = sanitizeName(raw);
                    setFirstName(val.slice(0, 32));
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

                    if (/[^A-Za-z\s]/.test(raw)) {
                      setFieldError("middleName", "Only letters allowed");
                    } else if (raw.length > 32) {
                      setFieldError("middleName", "Max 32 characters");
                    } else {
                      setFieldError("middleName", "");
                    }

                    const val = sanitizeName(raw);
                    setMiddleName(val.slice(0, 32));
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

                    if (/[^A-Za-z\s]/.test(raw)) {
                      setFieldError("lastName", "Only letters allowed");
                    } else if (raw.length > 32) {
                      setFieldError("lastName", "Max 32 characters");
                    } else {
                      setFieldError("lastName", "");
                    }

                    const val = sanitizeName(raw);
                    setLastName(val.slice(0, 32));
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
                    const v = sanitizePhone(e.target.value);
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
                  max={new Date().toISOString().split("T")[0]}
                  value={dateOfBirth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDateOfBirth(val);

                    if (!isAdult(val)) {
                      setFieldError("dob", "You must above 18 years");
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
                <input
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);

                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                      setFieldError("email", "Invalid email address");
                    } else {
                      setFieldError("email", "");
                    }
                  }}
                  className="mt-2 w-full px-4 py-3 border rounded-lg"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
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
                      let val = e.target.value;

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
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-2 w-full px-4 py-3 border rounded-lg"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-Binary</option>
                </select>
              </div>

              {/* PASSWORD */}
              <div className="col-span-12">
                <label>Password*</label>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      const val = e.target.value;
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
                      const val = e.target.value;
                      setConfirmPassword(val);

                      if (password !== val) {
                        setFieldError(
                          "confirmPassword",
                          "Passwords do not match"
                        );
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
                  <p className="text-red-500 text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              {/* COUPON */}
              <div className="col-span-12">
                <label>Coupon Code</label>

                <div className="flex gap-2 mt-2">
                  <input
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value);
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
                    className={`px-4 py-3 rounded-lg text-white font-medium ${checkingCoupon ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500"
                      }`}
                  >
                    {checkingCoupon ? "Checking..." : "Check"}
                  </button>
                </div>

                {couponMessage && (
                  <p
                    className={`text-sm mt-2 ${couponStatus === "valid" ? "text-green-600" : "text-red-500"
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

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={!agree || loading}
              className={`w-full py-3 rounded-lg text-white font-medium flex items-center justify-center ${
                agree ? "bg-gray-700" : "bg-gray-300 cursor-not-allowed"
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
