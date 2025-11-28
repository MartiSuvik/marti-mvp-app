import { Agency, OnboardingAnswers } from "../types";
import { supabase } from "./supabase";

export interface MatchResult {
  agency: Agency;
  score: number;
  reasons: string[];
}

export async function matchAgencies(
  answers: OnboardingAnswers
): Promise<MatchResult[]> {
  // Fetch all agencies
  const { data: agencies, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("verified", true);

  if (error || !agencies) {
    console.error("Error fetching agencies:", error);
    return [];
  }

  // Score each agency
  const matches: MatchResult[] = agencies.map((agency) => {
    let score = 0;
    const reasons: string[] = [];

    // Platform alignment (30 points)
    const platformMatch = calculatePlatformMatch(
      answers.platforms,
      agency.platforms || []
    );
    score += platformMatch.score;
    if (platformMatch.score > 0) {
      reasons.push(`Expertise in ${platformMatch.matched.join(", ")}`);
    }

    // Industry specialization (25 points)
    if (agency.industries?.includes(answers.industry)) {
      score += 25;
      reasons.push(`Industry specialist in ${answers.industry}`);
    }

    // Spend bracket compatibility (20 points)
    if (agency.spend_brackets?.includes(answers.spendBracket)) {
      score += 20;
      reasons.push(`Experience with ${answers.spendBracket} budgets`);
    }

    // Objective alignment (15 points)
    const objectiveMatch = calculateObjectiveMatch(
      answers.objectives,
      agency.objectives || []
    );
    score += objectiveMatch.score;
    if (objectiveMatch.score > 0) {
      reasons.push(`Strong in ${objectiveMatch.matched.join(", ")}`);
    }

    // Current management compatibility (10 points)
    if (
      answers.currentManagement === "Agency" &&
      agency.capabilities?.includes("Agency Transition")
    ) {
      score += 10;
      reasons.push("Experienced with agency transitions");
    }

    // Growth intent bonus (5 points)
    if (
      answers.growthIntent === "Yes" &&
      agency.capabilities?.includes("Scaling")
    ) {
      score += 5;
      reasons.push("Proven scaling capabilities");
    }

    return {
      agency: agency as Agency,
      score: Math.min(100, score), // Cap at 100
      reasons,
    };
  });

  // Sort by score and return top 3
  return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

function calculatePlatformMatch(
  userPlatforms: string[],
  agencyPlatforms: string[]
): { score: number; matched: string[] } {
  const matched = userPlatforms.filter((p) => agencyPlatforms.includes(p));
  const score = Math.min(30, (matched.length / userPlatforms.length) * 30);
  return { score, matched };
}

function calculateObjectiveMatch(
  userObjectives: string[],
  agencyObjectives: string[]
): { score: number; matched: string[] } {
  const matched = userObjectives.filter((o) => agencyObjectives.includes(o));
  const score = Math.min(15, (matched.length / userObjectives.length) * 15);
  return { score, matched };
}
