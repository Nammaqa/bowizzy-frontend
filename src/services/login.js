import api from "../api";

export const loginUser = async (email, password) => {
  try {
    const response = await api.post("/auth", {
      type: "login",
      email,
      password,
    });

    return response.data; 
  } catch (error) {
    throw error;
  }
};

export const sendForgotPasswordOtp = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password/send-otp", {
      email,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyForgotPasswordOtp = async (email, otp) => {
  try {
    const response = await api.post("/auth/forgot-password/verify-otp", {
      email,
      otp,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const changeForgotPassword = async (email, otp, newPassword) => {
  try {
    const response = await api.post("/auth/forgot-password/change-password", {
      email,
      otp,
      new_password: newPassword,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};
