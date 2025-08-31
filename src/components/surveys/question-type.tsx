// components/surveys/question-scale.ts

export type QuestionType =
  | "multiple-choice"
  | "dropdown"
  | "checkbox"
  | "rating"
  | "scale"
  | "nps"
  | "number"
  | "text"
  | "textarea";

/**
 * Convert a standardized question type into a numeric scale.
 * - rating/scale -> 5 (1..5)
 * - nps          -> 11 (0..10)
 * - number/other -> null (no fixed scale)
 */
export function convertQuestionTypeToScale(type: QuestionType): number | null {
  switch (type) {
    case "rating":
    case "scale":
      return 5;
    case "nps":
      return 11; // 0..10
    case "number":
    default:
      return null;
  }
}

/** Optional: default labels for common types (useful for legends). */
export function defaultLabelsForType(
  type: QuestionType,
  scale: number | null
): string[] | null {
  if (type === "nps") {
    return Array.from({ length: 11 }, (_, i) => String(i)); // "0".."10"
  }
  if ((type === "rating" || type === "scale") && scale && scale > 0) {
    return Array.from({ length: scale }, (_, i) => String(i + 1)); // "1".."scale"
  }
  return null;
}
