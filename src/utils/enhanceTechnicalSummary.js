// enhanceTechnicalSummary.js
// Utility to enhance Technical Summary using OpenAI API (gpt-4o-mini)

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; // 🔑 Paste your OpenAI key here (platform.openai.com)

/**
 * Strips HTML tags from a string and returns plain text.
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calls OpenAI API to generate two enhanced versions of the technical summary.
 *
 * @param {string} userInput - The raw technical summary text (can include HTML).
 * @param {string[]} skills - Array of skill names from the skills section.
 * @returns {Promise<{ atsFriendly: string, informative: string }>}
 */
export default async function enhanceTechnicalSummary(userInput, skills) {
  const plainInput = stripHtml(userInput);

  const skillsContext =
    skills && skills.length > 0
      ? `Skills: ${skills.join(", ")}`
      : "No skills provided.";

  const systemPrompt = `You are a professional resume writer and technical career coach.
Your task is to enhance a user's technical summary section for their resume.
You will be given their current technical summary along with their skills as context.
Generate exactly TWO enhanced versions:
1. "atsFriendly" - Optimized for Applicant Tracking Systems. Must be written as exactly 6 bullet points (each starting with "• "). Each bullet is one concise, keyword-rich sentence using relevant skills. No paragraphs, no prose.
2. "informative" - Must be written as exactly 6 bullet points (each starting with "• "). Each bullet is a detailed sentence highlighting technical depth, breadth, and value. No paragraphs, no prose.

Both versions must naturally incorporate the provided skills.
Each version MUST have exactly 6 bullet points. No more, no less.

STRICT LENGTH LIMIT: Each version MUST NOT exceed 500 characters in total, counting all 6 bullets together including the bullet characters, spaces, punctuation and line breaks. That means roughly 70-78 characters per bullet. Count the characters of every version before responding, and if a version is longer than 500 characters, shorten the bullets until it fits (keep all 6 bullets). A version longer than 500 characters is invalid.
Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation, no code fences):
{
  "atsFriendly": "• point 1\n• point 2\n• point 3\n• point 4\n• point 5\n• point 6",
  "informative": "• point 1\n• point 2\n• point 3\n• point 4\n• point 5\n• point 6"
}`;

  const userPrompt = `Current Technical Summary:
"${plainInput}"

Resume Context:
${skillsContext}

Generate two enhanced versions as specified. Remember: each version must total 500 characters or fewer across its 6 bullets.`;

  const fetchWithRetry = async (retries = 3, delayMs = 1000) => {
    for (let i = 0; i < retries; i++) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 900,
        }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const waitMs = retryAfter
          ? parseInt(retryAfter) * 1000
          : delayMs * Math.pow(2, i);
        console.warn(`Rate limited. Retrying in ${waitMs}ms... (attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message || `OpenAI API error: ${response.status}`
        );
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content || "";

      // Strip any markdown code fences if present
      // Strip any markdown code fences if present
const cleaned = raw.replace(/```json|```/g, "").trim();

let parsed;
try {
  // Fix unescaped newlines inside JSON string values before parsing
  const sanitized = cleaned.replace(
    /"(atsFriendly|informative)":\s*"([\s\S]*?)(?<!\\)"/g,
    (match, key, value) => {
      const escaped = value
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      return `"${key}": "${escaped}"`;
    }
  );
  parsed = JSON.parse(sanitized);
} catch {
  throw new Error("Failed to parse AI response. Please try again.");
}

      if (!parsed.atsFriendly || !parsed.informative) {
        throw new Error("Incomplete AI response. Please try again.");
      }

      return {
        atsFriendly: parsed.atsFriendly.trim(),
        informative: parsed.informative.trim(),
      };
    }

    throw new Error("Too many requests. Please wait a moment and try again.");
  };

  return await fetchWithRetry();
}