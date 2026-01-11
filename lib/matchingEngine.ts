import { OnboardingAnswers, Agency } from "../types";

/**
 * Matching Engine
 * Generates agency recommendations based on new onboarding answers
 * 
 * Note: Scores are calibrated to ensure all matches display 90%+
 * to maintain user confidence in match quality.
 */
export class MatchingEngine {
  /**
   * Calculate raw match score between user answers and agency profile
   */
  static calculateMatchScore(
    answers: OnboardingAnswers,
    agency: Agency
  ): number {
    let score = 0;
    let maxScore = 0;

    // Platform expertise alignment (40% weight - increased for better scores)
    maxScore += 40;
    if (agency.platforms && answers.adPlatforms && answers.adPlatforms.length > 0) {
      const matchingPlatforms = answers.adPlatforms.filter((p) =>
        agency.platforms?.includes(p)
      ).length;
      // Give partial credit more generously
      const platformScore = (matchingPlatforms / answers.adPlatforms.length) * 40;
      score += Math.max(platformScore, 20); // Minimum 20 points for any platform presence
    } else {
      score += 20; // Base score even without platforms
    }

    // Ad spend / Budget compatibility (30% weight - increased and more forgiving)
    maxScore += 30;
    if (agency.spendBrackets && answers.adSpend) {
      // Map new ad spend values to agency spend brackets
      const spendMapping: Record<string, string[]> = {
        "$0": ["$0", "$1k–$5k", "$5k–$20k"],
        "$1k–$5k": ["$0", "$1k–$5k", "$5k–$20k"],
        "$5k–$20k": ["$1k–$5k", "$5k–$20k", "$20k+"],
        "$20k+": ["$5k–$20k", "$20k+", "$50k+", "$100k+"],
      };
      const matchingBrackets = spendMapping[answers.adSpend] || [];
      if (matchingBrackets.some(bracket => agency.spendBrackets?.includes(bracket))) {
        score += 30;
      } else {
        score += 20; // Partial credit for budget flexibility
      }
    } else {
      score += 25; // Default high score
    }

    // Revenue consistency affects readiness (15% weight)
    maxScore += 15;
    if (answers.revenueConsistency) {
      const consistencyScores: Record<string, number> = {
        "Very stable": 15,
        "Mostly stable": 14,
        "Somewhat inconsistent": 12,
        "Very inconsistent": 10,
      };
      score += consistencyScores[answers.revenueConsistency] || 12;
    } else {
      score += 12;
    }

    // Ads experience affects agency fit (10% weight - reduced)
    maxScore += 10;
    if (answers.adsExperience) {
      // All experience levels are valuable
      const experienceScores: Record<string, number> = {
        "< 3 months": 9,
        "3–12 months": 10,
        "12+ months": 10,
      };
      score += experienceScores[answers.adsExperience] || 9;
    } else {
      score += 9;
    }

    // Monthly revenue affects tier matching (5% weight - reduced)
    maxScore += 5;
    if (answers.monthlyRevenue) {
      // All revenue levels are workable
      const revenueScores: Record<string, number> = {
        "$10k–$50k": 4,
        "$50k–$100k": 5,
        "$100k–$500k": 5,
        "Over $500k": 5,
      };
      score += revenueScores[answers.monthlyRevenue] || 4;
    } else {
      score += 4;
    }

    // Normalize to percentage
    const rawPercentage = Math.round((score / maxScore) * 100);
    
    // Return raw score (normalization happens in generateMatches)
    return rawPercentage;
  }

  /**
   * Normalize scores to ensure all matches are 90%+
   * Maps the top 3 scores to 90-100% range
   */
  static normalizeScores(
    matches: Array<{ agency: Agency; matchScore: number }>
  ): Array<{ agency: Agency; matchScore: number }> {
    if (matches.length === 0) return matches;

    // Find the score range
    const scores = matches.map(m => m.matchScore);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // If all scores are already 90+, return as-is
    if (minScore >= 90) {
      return matches;
    }

    // Map scores to 90-100 range
    // Best match gets 98%, worst match gets 90%
    return matches.map((match, index) => {
      let normalizedScore: number;
      
      if (matches.length === 1) {
        // Single match gets 95%
        normalizedScore = 95;
      } else if (maxScore === minScore) {
        // All scores are the same - distribute evenly
        normalizedScore = 98 - (index * 2);
      } else {
        // Linear interpolation: map [minScore, maxScore] to [90, 98]
        const ratio = (match.matchScore - minScore) / (maxScore - minScore);
        normalizedScore = 90 + (ratio * 8); // 90-98 range
      }

      return {
        agency: match.agency,
        matchScore: Math.round(normalizedScore),
      };
    });
  }

  /**
   * Generate top 3 agency matches with normalized scores (90%+)
   */
  static generateMatches(
    answers: OnboardingAnswers,
    agencies: Agency[]
  ): Array<{ agency: Agency; matchScore: number }> {
    // Calculate raw scores for all agencies
    const scoredAgencies = agencies.map((agency) => ({
      agency,
      matchScore: this.calculateMatchScore(answers, agency),
    }));

    // Sort by match score (descending)
    scoredAgencies.sort((a, b) => b.matchScore - a.matchScore);

    // Get top 3 matches (or fewer if not enough agencies)
    const topMatches = scoredAgencies.slice(0, 3);

    // Normalize scores to 90-100% range
    return this.normalizeScores(topMatches);
  }
}
