import { OnboardingAnswers, Agency, Deal } from "../types";

/**
 * Matching Engine
 * Generates agency recommendations based on onboarding answers
 */
export class MatchingEngine {
  /**
   * Calculate match score between user answers and agency profile
   */
  static calculateMatchScore(
    answers: OnboardingAnswers,
    agency: Agency
  ): number {
    let score = 0;
    let maxScore = 0;

    // Platform expertise alignment (30% weight)
    maxScore += 30;
    if (agency.platforms && answers.platforms.length > 0) {
      const matchingPlatforms = answers.platforms.filter((p) =>
        agency.platforms?.includes(p)
      ).length;
      const platformScore = (matchingPlatforms / answers.platforms.length) * 30;
      score += platformScore;
    }

    // Budget compatibility (25% weight)
    maxScore += 25;
    if (
      agency.spendBrackets &&
      agency.spendBrackets.includes(answers.spendBracket)
    ) {
      score += 25;
    }

    // Industry specialization (20% weight)
    maxScore += 20;
    if (agency.industries && agency.industries.includes(answers.industry)) {
      score += 20;
    }

    // Objective alignment (15% weight)
    maxScore += 15;
    if (agency.objectives && answers.objectives.length > 0) {
      const matchingObjectives = answers.objectives.filter((o) =>
        agency.objectives?.includes(o)
      ).length;
      const objectiveScore =
        (matchingObjectives / answers.objectives.length) * 15;
      score += objectiveScore;
    }

    // Current ops compatibility (10% weight)
    maxScore += 10;
    // If user has agency and agency specializes in agency-to-agency transitions
    if (
      answers.currentManagement === "Agency" &&
      agency.capabilities?.some((c) => c.toLowerCase().includes("transition"))
    ) {
      score += 10;
    } else if (answers.currentManagement !== "Agency") {
      // General compatibility
      score += 5;
    }

    // Normalize to percentage
    return Math.round((score / maxScore) * 100);
  }

  /**
   * Generate top 3 agency matches
   */
  static generateMatches(
    answers: OnboardingAnswers,
    agencies: Agency[]
  ): Array<{ agency: Agency; matchScore: number }> {
    // Calculate scores for all agencies
    const scoredAgencies = agencies.map((agency) => ({
      agency,
      matchScore: this.calculateMatchScore(answers, agency),
    }));

    // Sort by match score (descending)
    scoredAgencies.sort((a, b) => b.matchScore - a.matchScore);

    // Return top 3
    return scoredAgencies.slice(0, 3);
  }
}
