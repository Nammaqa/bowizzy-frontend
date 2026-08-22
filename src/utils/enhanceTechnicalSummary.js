// enhanceTechnicalSummary.js
// Calls the backend enhancement API. All prompt/AI logic lives server-side
// (src/controllers/aiEnhanceController.js) so the OpenAI key never ships to the browser.
// The backend already normalises each version to one bullet per newline.

import api from "@/api";

/**
 * Requests two enhanced versions of the technical summary from the backend.
 *
 * @param {string} userInput - The raw technical summary text (can include HTML).
 * @param {string[]} skills - Array of skill names from the skills section.
 * @param {string} token - Auth token.
 * @returns {Promise<{ atsFriendly: string, informative: string }>}
 */
export default async function enhanceTechnicalSummary(userInput, skills, token) {
  const res = await api.post(
    "/enhance/technical-summary",
    { userInput, skills: skills || [] },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = res.data?.data;

  if (!data?.atsFriendly || !data?.informative) {
    throw new Error("Incomplete AI response. Please try again.");
  }

  return {
    atsFriendly: data.atsFriendly,
    informative: data.informative,
  };
}