// enhanceCareerObjective.js
// Calls the backend enhancement API. All prompt/AI logic lives server-side
// (src/controllers/aiEnhanceController.js) so the OpenAI key never ships to the browser.

import api from "@/api";

/**
 * Requests two enhanced versions of the career objective from the backend.
 *
 * @param {string} userInput - The raw career objective text (can include HTML).
 * @param {string[]} skills - Array of skill names.
 * @param {Array} experiences - Array of work experience objects.
 * @param {Array} projects - Array of project objects.
 * @param {string} token - Auth token.
 * @returns {Promise<{ professional: string, elaborate: string }>}
 */
export async function enhanceCareerObjective(
  userInput,
  skills,
  experiences,
  projects,
  token
) {
  const res = await api.post(
    "/enhance/career-objective",
    {
      userInput,
      skills: skills || [],
      experiences: experiences || [],
      projects: projects || [],
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = res.data?.data;

  if (!data?.professional || !data?.elaborate) {
    throw new Error("Incomplete AI response. Please try again.");
  }

  return {
    professional: data.professional,
    elaborate: data.elaborate,
  };
}