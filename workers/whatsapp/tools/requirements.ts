// ============================================================================
// Tool: Update Customer Requirement Profile
// ============================================================================
import type { ConversationContext, RequirementProfile } from "../types";

export async function updateRequirements(
  updates: {
    productType?: string;
    specs?: Record<string, string>;
    openQuestions?: string[];
    answeredQuestion?: { question: string; answer: string };
  },
  context: ConversationContext,
): Promise<string> {
  // Init profile if missing
  if (!context.requirementProfile) {
    context.requirementProfile = {};
  }
  const profile = context.requirementProfile;

  // Merge product type
  if (updates.productType) {
    profile.productType = updates.productType;
  }

  // Merge specs
  if (updates.specs) {
    profile.specs = { ...profile.specs, ...updates.specs };
  }

  // Replace open questions
  if (updates.openQuestions) {
    profile.openQuestions = updates.openQuestions;
  }

  // Append answered question
  if (updates.answeredQuestion) {
    if (!profile.answeredQuestions) profile.answeredQuestions = [];
    profile.answeredQuestions.push(updates.answeredQuestion);
  }

  // Build confirmation
  const parts: string[] = [];
  if (profile.productType) parts.push(`Urun tipi: ${profile.productType}`);
  if (profile.specs && Object.keys(profile.specs).length > 0) {
    parts.push(
      "Specs: " + Object.entries(profile.specs).map(([k, v]) => `${k}=${v}`).join(", "),
    );
  }
  if (profile.openQuestions && profile.openQuestions.length > 0) {
    parts.push(`Bekleyen sorular: [${profile.openQuestions.join("; ")}]`);
  }

  return `Gereksinim profili guncellendi. ${parts.join(" | ")}`;
}
