import api from "@/api";

const authHeaders = (token?: string) =>
  token
    ? {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
    : undefined;

export type CreateMockInterviewBookingPayload = {
  start_time_utc: string;
  end_time_utc: string;
  interview_type: "online" | "offline";
  amount: number;
  job_role?: string;
  resume_url?: string;
  skills?: string;
  experience_months?: number;
  meeting_link?: string;
  purchased_credits_used?: number;
};

export type VerifyMockInterviewPaymentPayload = {
  mock_interview_id: string | number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type InterviewerBankDetailsPayload = {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  branch_name: string;
  document_url?: string;
};

export type AcceptMockInterviewBookingPayload = {
  interviewer_id: string | number;
};

export type CandidateReviewPayload = {
  interview_schedule_id: number;
  mock_interview_id?: number;
  candidate_id?: number;
  interviewer_id?: number;
  communication_skills: string;
  technical_knowledge: string;
  problem_solving_analytical_skills: string;
  relevant_experience_skills: string;
  adaptability_learning_ability: string;
  cultural_team_fit: string;
  overall_impression: string;
  final_comments: string;
  final_recommendation: string;
  communication_skills_rating: number;
  technical_knowledge_rating: number;
  problem_solving_analytical_skills_rating: number;
  relevant_experience_skills_rating: number;
  adaptability_learning_ability_rating: number;
  cultural_team_fit_rating: number;
  overall_impression_rating: number;
};

export type InterviewerReviewPayload = {
  interview_schedule_id: number;
  mock_interview_id?: number;
  candidate_id?: number;
  interviewer_id?: number;
  professionalism_conduct: string;
  clarity_of_questions: string;
  knowledge_of_role: string;
  engagement_during_interview: string;
  timeliness_organization: string;
  overall_experience: string;
  final_comments: string;
  professionalism_conduct_rating: number;
  clarity_of_questions_rating: number;
  knowledge_of_role_rating: number;
  engagement_during_interview_rating: number;
  timeliness_organization_rating: number;
  overall_experience_rating: number;
};

export const createMockInterviewBooking = async (
  userId: string | number,
  token: string,
  payload: CreateMockInterviewBookingPayload
) => {
  const response = await api.post(
    `/users/${userId}/mock-interview/bookings`,
    payload,
    authHeaders(token)
  );
  return response.data;
};

export const verifyMockInterviewPayment = async (
  userId: string | number,
  token: string,
  payload: VerifyMockInterviewPaymentPayload
) => {
  const response = await api.post(
    `/users/${userId}/mock-interview/bookings/verify-payment`,
    payload,
    authHeaders(token)
  );
  return response.data;
};

export const getMockInterviewBookings = async (
  userId: string | number,
  token: string
) => {
  const response = await api.get(
    `/users/${userId}/mock-interview/bookings`,
    authHeaders(token)
  );
  return response.data;
};

export const getMockInterviewBookingSlots = async (
  userId: string | number,
  token: string
) => {
  const response = await api.get(
    `/users/${userId}/mock-interview/bookings`,
    authHeaders(token)
  );
  return response.data;
};

export const getMockInterviewBookingById = async (
  userId: string | number,
  token: string,
  id: string | number
) => {
  const response = await api.get(
    `/users/${userId}/mock-interview/bookings/${id}`,
    authHeaders(token)
  );
  return response.data;
};

export const cancelMockInterviewBooking = async (
  userId: string | number,
  token: string,
  id: string | number
) => {
  const response = await api.put(
    `/users/${userId}/mock-interview/bookings/${id}/cancel`,
    {},
    authHeaders(token)
  );
  return response.data;
};

export const acceptMockInterviewBooking = async (
  userId: string | number,
  token: string,
  id: string | number,
  payload: AcceptMockInterviewBookingPayload
) => {
  const response = await api.put(
    `/users/${userId}/mock-interview/bookings/${id}/accept`,
    payload,
    authHeaders(token)
  );
  return response.data;
};

export const getAllMockInterviewBookings = async (token: string) => {
  const response = await api.get("/mock-interview/bookings", authHeaders(token));
  return response.data;
};

export const getAcceptedMockInterviews = async (
  userId: string | number,
  token: string
) => {
  const response = await api.get(
    `/users/${userId}/mock-interview/accepted-interviews`,
    authHeaders(token)
  );
  return response.data;
};

export const submitCandidateReview = async (
  userId: string | number,
  token: string,
  payload: CandidateReviewPayload
) => {
  const response = await api.post(
    `/users/${userId}/mock-interview/candidate-review`,
    payload,
    authHeaders(token)
  );
  return response.data;
};

export const submitInterviewerReview = async (
  userId: string | number,
  token: string,
  payload: InterviewerReviewPayload
) => {
  const response = await api.post(
    `/users/${userId}/mock-interview/interviewer-review`,
    payload,
    authHeaders(token)
  );
  return response.data;
};

export const submitInterviewerBankDetails = async (
  userId: string | number,
  token: string,
  payload: InterviewerBankDetailsPayload
) => {
  const response = await api.post(
    `/users/${userId}/mock-interview/interviewer/bank-details`,
    payload,
    authHeaders(token)
  );
  return response.data;
};

export const getInterviewerBankDetailsStatus = async (
  userId: string | number,
  token: string
) => {
  const response = await api.get(
    `/users/${userId}/mock-interview/interviewer/bank-details/status`,
    authHeaders(token)
  );
  return response.data;
};

export const validateInterviewer = async (
  userId: string | number,
  token: string
) => {
  try {
    const response = await api.get(
      `/users/${userId}/mock-interview/validate-interviewer`,
      authHeaders(token)
    );
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 403 && error?.response?.data) {
      return {
        ...error.response.data,
        http_status: 403,
      };
    }

    throw error;
  }
};

export const isVerifiedInterviewerResponse = (value: any) =>
  value?.is_verified_interviewer === true ||
  value?.is_interviewer_verified === true ||
  String(value?.is_interviewer_verified).toLowerCase() === "true";

export const getMockInterviewUserType = async (
  userId: string | number,
  token: string
) => {
  const response = await api.get(
    `/users/${userId}/mock-interview/is-interviewer`,
    authHeaders(token)
  );
  return response.data;
};

export const isInterviewerUserResponse = (value: any) =>
  value === true ||
  String(value).toLowerCase() === "true" ||
  value?.is_interviewer === true ||
  String(value?.is_interviewer).toLowerCase() === "true" ||
  value?.user_type === "interviewer";

export const fetchAvailableMockInterviews = async (
  userId: string | number,
  token: string,
  params: {
    job_role?: string;
    experience_months?: number;
    skills?: string;
  }
) => {
  const response = await api.get(
    `/users/${userId}/mock-interview/fetch-interviews`,
    {
      ...authHeaders(token),
      params,
    }
  );
  return response.data;
};

export const confirmMockInterviewCreditBooking = async (
  userId: string | number,
  token: string,
  payload: { mock_interview_id: string | number }
) => {
  const response = await api.post(
    "/mock-interview/confirm-credit-booking", // adjust to your actual route
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response?.data ?? response;
};
