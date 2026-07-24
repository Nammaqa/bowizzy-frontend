// enhanceRolesResponsibilities.js
// Utility to enhance Roles & Responsibilities using Groq API (llama-3.1-8b-instant)

const GROQ_API_KEY =import.meta.env.VITE_GROK_API_KEY;  // 🔑 Paste your Groq key here (console.groq.com)

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
 * Fixes unescaped newlines/tabs inside JSON string values so JSON.parse doesn't choke.
 * Llama models sometimes return literal newlines inside string values instead of \n.
 * @param {string} raw
 * @returns {string}
 */
function fixJsonStringNewlines(raw) {
  return raw.replace(/"((?:[^"\\]|\\.)*)"/gs, (match, inner) => {
    const fixed = inner
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return `"${fixed}"`;
  });
}

/**
 * Calls Groq API to generate two enhanced versions of roles & responsibilities.
 *
 * @param {string} rolesInput - The raw roles & responsibilities text (can include HTML).
 * @param {string} projectTitle - The project title for context.
 * @param {string} projectType - The project type for context.
 * @param {string} description - The project description for context.
 * @returns {Promise<{ precise: string, technical: string }>}
 */
export async function enhanceRolesResponsibilities(
  rolesInput,
  projectTitle,
  projectType,
  description
) {
  const plainRoles = stripHtml(rolesInput);
  const plainDescription = stripHtml(description);

  const contextLines = [];
  if (projectTitle) contextLines.push(`Project Title: ${projectTitle}`);
  if (projectType) contextLines.push(`Project Type: ${projectType}`);
  if (plainDescription) contextLines.push(`Project Description: ${plainDescription}`);
  const context =
    contextLines.length > 0
      ? contextLines.join("\n")
      : "No additional context provided.";

  const systemPrompt = `You are a professional resume writer specializing in technical roles.
Your task is to enhance a candidate's roles & responsibilities for a project section of their resume.
You will be given the current roles & responsibilities along with project context.
Generate exactly TWO enhanced versions:
1. "precise" - Bullet-point style, concise action verbs, each point under 15 words. Max 4 bullets. No fluff. Focuses on what was done.
2. "technical" - Detailed technical breakdown highlighting tools, technologies, methodologies, and impact. Max 5 bullets, each 15-25 words.

STRICT LENGTH LIMIT: Each version MUST NOT exceed 500 characters in total, counting all of its bullets together including the bullet characters, spaces, punctuation and line breaks. Count the characters of every version before responding, and if a version is longer than 500 characters, shorten or drop bullets until it fits. A version longer than 500 characters is invalid.

IMPORTANT: Format both as plain text using "• " as the bullet character separated by \\n (escaped newline, NOT a real line break).
Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation, no code fences):
{"precise":"• point one\\n• point two\\n• point three","technical":"• point one\\n• point two\\n• point three"}`;

  const userPrompt = `Current Roles & Responsibilities:
"${plainRoles}"

Project Context:
${context}

Generate two enhanced versions as specified. Remember: each version must total 500 characters or fewer across all of its bullets.`;

  const fetchWithRetry = async (retries = 3, delayMs = 1000) => {
    for (let i = 0; i < retries; i++) {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
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
        }
      );

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const waitMs = retryAfter
          ? parseInt(retryAfter) * 1000
          : delayMs * Math.pow(2, i);
        console.warn(
          `Rate limited. Retrying in ${waitMs}ms... (attempt ${i + 1}/${retries})`
        );
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

      // Step 1: strip markdown code fences
      const stripped = raw.replace(/```json|```/g, "").trim();

      // Step 2: fix literal newlines inside JSON string values
      const fixedJson = fixJsonStringNewlines(stripped);

      let parsed;

      // Step 3: try direct parse first
      try {
        parsed = JSON.parse(fixedJson);
      } catch {
        // Step 4: fallback — extract the {...} block and try again
        const jsonMatch = fixedJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error("Parse error after fallback:", e, "\nCleaned string:", fixedJson);
            throw new Error("Failed to parse AI response. Please try again.");
          }
        } else {
          console.error("No JSON object found in response:", fixedJson);
          throw new Error("Failed to parse AI response. Please try again.");
        }
      }

      if (!parsed.precise || !parsed.technical) {
        throw new Error("Incomplete AI response. Please try again.");
      }

      return {
        precise: parsed.precise.trim(),
        technical: parsed.technical.trim(),
      };
    }

    throw new Error("Too many requests. Please wait a moment and try again.");
  };

  return await fetchWithRetry();
}