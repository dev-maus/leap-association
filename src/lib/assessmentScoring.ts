export interface Answer {
  questionId: string;
  category: 'habit' | 'ability' | 'talent' | 'skill';
  points: number;
}

export interface CategoryScores {
  habit: number;
  ability: number;
  talent: number;
  skill: number;
}

export interface LeapScores {
  leadership: number;
  effectiveness: number;
  accountability: number;
  productivity: number;
}

/**
 * Calculates category scores by summing points for each category
 */
export function calculateCategoryScores(answers: Answer[]): CategoryScores {
  const scores: CategoryScores = {
    habit: 0,
    ability: 0,
    talent: 0,
    skill: 0,
  };

  answers.forEach((answer) => {
    const category = answer.category;
    if (category in scores) {
      scores[category] += answer.points;
    }
  });

  return scores;
}

/**
 * Calculates LEAP dimension scores from category scores
 * Leadership = Habits + Talents
 * Effectiveness = Habits + Abilities
 * Accountability = Abilities + Skills
 * Productivity = Habits + Skills
 */
export function calculateLeapScores(categoryScores: CategoryScores): LeapScores {
  const { habit, ability, talent, skill } = categoryScores;

  return {
    leadership: habit + talent,
    effectiveness: habit + ability,
    accountability: ability + skill,
    productivity: habit + skill,
  };
}

/**
 * Calculates all scores from answers array
 */
export function calculateAllScores(answers: Answer[]) {
  const categoryScores = calculateCategoryScores(answers);
  const leapScores = calculateLeapScores(categoryScores);

  return {
    categoryScores,
    leapScores,
  };
}

