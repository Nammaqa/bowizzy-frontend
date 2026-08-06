/**
 * Shared rules for deciding whether a school-level education record (SSLC/PUC)
 * is real enough to put on a resume.
 *
 * The JD analyzer always returns an entry for both, filling the fields it can't
 * infer with placeholder text like "NA" rather than leaving them blank. Those
 * placeholders are truthy, so the `instituteName &&` guards in the templates
 * let them through and the resume ends up showing "Pre University (12th) / NA".
 */

// School-level records have no degree, field of study or university, and only
// their completion year is meaningful — all of that only applies to higher
// education.
export const SCHOOL_EDUCATION_TYPES = ["sslc", "puc"];

export const isSchoolEducation = (educationType?: string) =>
  SCHOOL_EDUCATION_TYPES.includes((educationType || "").toLowerCase());

const PLACEHOLDER_VALUES = new Set([
  "na",
  "n/a",
  "n.a.",
  "nil",
  "none",
  "null",
  "undefined",
  "-",
  "--",
  "not available",
  "not applicable",
  "not specified",
  "not mentioned",
  "not provided",
  "unknown",
]);

/**
 * True when a field holds real user data — i.e. it isn't blank and isn't one of
 * the analyzer's stand-ins for "I don't know".
 */
export function hasRealValue(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return !PLACEHOLDER_VALUES.has(normalized);
}

/**
 * Drops SSLC/PUC entries the user never actually supplied. A school record is
 * only identified by its institution, so with no real institution name there is
 * nothing worth rendering — the year alone is a guess by the analyzer.
 * Higher education is left untouched: those entries carry a degree and field of
 * study that stand on their own.
 */
export function dropIncompleteSchoolEducation<
  T extends { education_type?: string; institution_name?: string | null }
>(education: T[]): T[] {
  return education.filter(
    (edu) => !isSchoolEducation(edu.education_type) || hasRealValue(edu.institution_name)
  );
}
