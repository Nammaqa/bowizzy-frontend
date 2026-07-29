import api from "@/api";

export const confirmMockInterviewCreditBooking  = async (
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