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
