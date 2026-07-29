// enhanceCareerObjective.js
// Utility to enhance Career Objective using Groq API (llama-3.1-8b-instant)

const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY; // 🔑 Paste your NEW Groq key here (console.groq.com)

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
 * Builds a structured context string from skills, experiences, and projects.
 * @param {string[]} skills
 * @param {Array} experiences
 * @param {Array} projects
 * @returns {string}
 */
function buildContext(skills, experiences, projects) {
  const lines = [];

  if (skills && skills.length > 0) {
    lines.push(`Skills: ${skills.join(", ")}`);
  }

  if (experiences && experiences.length > 0) {
    const expLines = experiences
      .filter((e) => e.jobTitle || e.companyName)
      .map((e) => {
        const parts = [];
        if (e.jobTitle) parts.push(`Role: ${e.jobTitle}`);
        if (e.companyName) parts.push(`Company: ${e.companyName}`);
        if (e.employmentType) parts.push(`Type: ${e.employmentType}`);
        if (e.startDate || e.endDate) {
          parts.push(
            `Duration: ${e.startDate || "N/A"} - ${
              e.currentlyWorking ? "Present" : e.endDate || "N/A"
            }`
          );
        }
        if (e.description) parts.push(`Details: ${stripHtml(e.description)}`);
        return parts.join(" | ");
      });

    if (expLines.length > 0) {
      lines.push(`Work Experience:\n${expLines.map((l) => `  - ${l}`).join("\n")}`);
    }
  }

  if (projects && projects.length > 0) {
    const projLines = projects
      .filter((p) => p.projectTitle)
      .map((p) => {
        const parts = [];
        if (p.projectTitle) parts.push(`Project: ${p.projectTitle}`);
        if (p.projectType) parts.push(`Type: ${p.projectType}`);
        if (p.description) parts.push(`Description: ${stripHtml(p.description)}`);
        if (p.rolesResponsibilities)
          parts.push(`Roles: ${stripHtml(p.rolesResponsibilities)}`);
        return parts.join(" | ");
      });

    if (projLines.length > 0) {
      lines.push(`Projects:\n${projLines.map((l) => `  - ${l}`).join("\n")}`);
    }
  }

  return lines.join("\n\n");
}

/**
 * Calls Groq API to generate two enhanced versions of the career objective.
 *
 * @param {string} userInput - The raw career objective text (can include HTML).
 * @param {string[]} skills - Array of skill names.
 * @param {Array} experiences - Array of work experience objects.
 * @param {Array} projects - Array of project objects.
 * @returns {Promise<{ professional: string, elaborate: string }>}
 */
export async function enhanceCareerObjective(
  userInput,
  skills,
  experiences,
  projects
) {
  const plainInput = stripHtml(userInput);
  const context = buildContext(skills, experiences, projects);

  const systemPrompt = `You are a professional resume writer and career coach. 
Your task is to enhance a user's career objective/about section for their resume.
You will be given their current career objective along with their skills, experience, and projects as context.
Generate exactly TWO enhanced versions:
1. "professional" - Concise, impactful, formal tone. 2-3 sentences max. ATS-friendly.
2. "elaborate" - Detailed, rich narrative that showcases depth. 4-6 sentences. Highlights specific skills and achievements.

Both versions should naturally incorporate relevant details from the provided context.

STRICT LENGTH LIMIT: Each version MUST NOT exceed 500 characters (including spaces and punctuation). Count the characters of every version before responding, and if a version is longer than 500 characters, rewrite it shorter until it fits. Aim for 450-490 characters for "elaborate" so it stays safely under the limit. A version longer than 500 characters is invalid.
Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation, no code fences):
{
  "professional": "...",
  "elaborate": "..."
}`;

  const userPrompt = `Current Career Objective:
"${plainInput}"

Resume Context:
${context || "No additional context provided."}

Generate two enhanced versions as specified. Remember: each version must be 500 characters or fewer.`;

  const fetchWithRetry = async (retries = 3, delayMs = 1000) => {
    for (let i = 0; i < retries; i++) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 600,
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
          errorData?.error?.message || `Groq API error: ${response.status}`
        );
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content || "";

      // Strip any markdown code fences if present
      const cleaned = raw.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error("Failed to parse AI response. Please try again.");
      }

      if (!parsed.professional || !parsed.elaborate) {
        throw new Error("Incomplete AI response. Please try again.");
      }

      return {
        professional: parsed.professional.trim(),
        elaborate: parsed.elaborate.trim(),
      };
    }

    throw new Error("Too many requests. Please wait a moment and try again.");
  };

  return await fetchWithRetry();
}