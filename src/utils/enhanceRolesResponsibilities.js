// enhanceRolesResponsibilities.js
// Calls the backend enhancement API. All prompt/AI logic lives server-side
// (src/controllers/aiEnhanceController.js) so the OpenAI key never ships to the browser.

import api from "@/api";

/**
 * Requests two enhanced versions of roles & responsibilities from the backend.
 *
 * @param {string} rolesInput - The raw roles & responsibilities text (can include HTML).
 * @param {string} projectTitle - The project title for context.
 * @param {string} projectType - The project type for context.
 * @param {string} description - The project description for context.
 * @param {string} token - Auth token.
 * @returns {Promise<{ precise: string, technical: string }>}
 */
export async function enhanceRolesResponsibilities(
  rolesInput,
  projectTitle,
  projectType,
  description,
  token
) {
  const res = await api.post(
    "/enhance/roles-responsibilities",
    { rolesInput, projectTitle, projectType, description },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = res.data?.data;

  if (!data?.precise || !data?.technical) {
    throw new Error("Incomplete AI response. Please try again.");
  }

  return {
    precise: data.precise,
    technical: data.technical,
  };
}