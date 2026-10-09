import api from "@/api";

export const deleteAccount = async (userId, token) => {
  try {
    const response = await api.delete(`/api/account-delete/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updateAccountReviewStatus = async (userId, token, reviewStatus) => {
  const normalizedStatus =
    reviewStatus === "active" || reviewStatus === "under_review"
      ? reviewStatus
      : "active";

  try {
    const response = await api.patch(
      `/account/${userId}/review-status`,
      { review_status: normalizedStatus },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateAccountTemporarily = async (userId, token) =>
  updateAccountReviewStatus(userId, token, "under_review");

export const activateAccount = async (userId, token) =>
  updateAccountReviewStatus(userId, token, "active");
