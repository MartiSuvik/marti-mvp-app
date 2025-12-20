import { OnboardingAnswers, Agency } from "../types";

/**
 * Matching Engine
 * Generates agency recommendations based on new onboarding answers
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

    // Platform expertise alignment (35% weight)
    maxScore += 35;
    if (agency.platforms && answers.adPlatforms && answers.adPlatforms.length > 0) {
      const matchingPlatforms = answers.adPlatforms.filter((p) =>
        agency.platforms?.includes(p)
      ).length;
      const platformScore = (matchingPlatforms / answers.adPlatforms.length) * 35;
      score += platformScore;
    }

    // Ad spend / Budget compatibility (25% weight)
    maxScore += 25;
    if (agency.spendBrackets && answers.adSpend) {
      // Map new ad spend values to agency spend brackets
      const spendMapping: Record<string, string[]> = {
        "$0": ["$0", "$1k–$5k"],
        "$1k–$5k": ["$1k–$5k", "$5k–$20k"],
        "$5k–$20k": ["$5k–$20k", "$20k+"],
        "$20k+": ["$20k+", "$50k+", "$100k+"],
      };
      const matchingBrackets = spendMapping[answers.adSpend] || [];
      if (matchingBrackets.some(bracket => agency.spendBrackets?.includes(bracket))) {
        score += 25;
      }
    }

    // Revenue consistency affects readiness (15% weight)
    maxScore += 15;
    if (answers.revenueConsistency) {
      const consistencyScores: Record<string, number> = {
        "Very stable": 15,
        "Mostly stable": 12,
        "Somewhat inconsistent": 8,
        "Very inconsistent": 4,
      };
      score += consistencyScores[answers.revenueConsistency] || 0;
    }

    // Ads experience affects agency fit (15% weight)
    maxScore += 15;
    if (answers.adsExperience) {
      // Agencies prefer some experience but can work with beginners
      const experienceScores: Record<string, number> = {
        "< 3 months": 10,
        "3–12 months": 15,
        "12+ months": 15,
      };
      score += experienceScores[answers.adsExperience] || 0;
    }

    // Monthly revenue affects tier matching (10% weight)
    maxScore += 10;
    if (answers.monthlyRevenue) {
      // Higher revenue = better fit for most agencies
      const revenueScores: Record<string, number> = {
        "$10k–$50k": 6,
        "$50k–$100k": 8,
        "$100k–$500k": 10,
        "Over $500k": 10,
      };
      score += revenueScores[answers.monthlyRevenue] || 0;
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
