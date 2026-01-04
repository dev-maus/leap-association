import { describe, it, expect } from 'vitest';
import {
  calculateCategoryScores,
  calculateLeapScores,
  calculateAllScores,
  type Answer,
} from '../assessmentScoring';

describe('calculateCategoryScores', () => {
  it('sums points by category correctly', () => {
    const answers: Answer[] = [
      { questionId: 'q1', category: 'habit', points: 4 },
      { questionId: 'q2', category: 'habit', points: 3 },
      { questionId: 'q3', category: 'ability', points: 2 },
      { questionId: 'q4', category: 'talent', points: 4 },
      { questionId: 'q5', category: 'skill', points: 1 },
    ];

    const scores = calculateCategoryScores(answers);

    expect(scores.habit).toBe(7);
    expect(scores.ability).toBe(2);
    expect(scores.talent).toBe(4);
    expect(scores.skill).toBe(1);
  });

  it('handles empty answers array', () => {
    const scores = calculateCategoryScores([]);

    expect(scores.habit).toBe(0);
    expect(scores.ability).toBe(0);
    expect(scores.talent).toBe(0);
    expect(scores.skill).toBe(0);
  });

  it('handles single answer per category', () => {
    const answers: Answer[] = [
      { questionId: 'q1', category: 'habit', points: 4 },
      { questionId: 'q2', category: 'ability', points: 3 },
      { questionId: 'q3', category: 'talent', points: 2 },
      { questionId: 'q4', category: 'skill', points: 1 },
    ];

    const scores = calculateCategoryScores(answers);

    expect(scores.habit).toBe(4);
    expect(scores.ability).toBe(3);
    expect(scores.talent).toBe(2);
    expect(scores.skill).toBe(1);
  });
});

describe('calculateLeapScores', () => {
  it('calculates Leadership = Habits + Talents', () => {
    const categoryScores = {
      habit: 6,
      ability: 5,
      talent: 7,
      skill: 4,
    };

    const leapScores = calculateLeapScores(categoryScores);

    expect(leapScores.leadership).toBe(13); // 6 + 7
  });

  it('calculates Effectiveness = Habits + Abilities', () => {
    const categoryScores = {
      habit: 6,
      ability: 5,
      talent: 7,
      skill: 4,
    };

    const leapScores = calculateLeapScores(categoryScores);

    expect(leapScores.effectiveness).toBe(11); // 6 + 5
  });

  it('calculates Accountability = Abilities + Skills', () => {
    const categoryScores = {
      habit: 6,
      ability: 5,
      talent: 7,
      skill: 4,
    };

    const leapScores = calculateLeapScores(categoryScores);

    expect(leapScores.accountability).toBe(9); // 5 + 4
  });

  it('calculates Productivity = Habits + Skills', () => {
    const categoryScores = {
      habit: 6,
      ability: 5,
      talent: 7,
      skill: 4,
    };

    const leapScores = calculateLeapScores(categoryScores);

    expect(leapScores.productivity).toBe(10); // 6 + 4
  });

  it('calculates all LEAP dimensions correctly', () => {
    const categoryScores = {
      habit: 8,
      ability: 6,
      talent: 7,
      skill: 5,
    };

    const leapScores = calculateLeapScores(categoryScores);

    expect(leapScores.leadership).toBe(15); // 8 + 7
    expect(leapScores.effectiveness).toBe(14); // 8 + 6
    expect(leapScores.accountability).toBe(11); // 6 + 5
    expect(leapScores.productivity).toBe(13); // 8 + 5
  });
});

describe('calculateAllScores', () => {
  it('calculates both category and LEAP scores', () => {
    const answers: Answer[] = [
      { questionId: 'q1', category: 'habit', points: 4 },
      { questionId: 'q2', category: 'habit', points: 3 },
      { questionId: 'q3', category: 'ability', points: 2 },
      { questionId: 'q4', category: 'talent', points: 4 },
      { questionId: 'q5', category: 'skill', points: 1 },
    ];

    const result = calculateAllScores(answers);

    expect(result.categoryScores.habit).toBe(7);
    expect(result.categoryScores.ability).toBe(2);
    expect(result.leapScores.leadership).toBe(11); // 7 + 4
    expect(result.leapScores.effectiveness).toBe(9); // 7 + 2
    expect(result.leapScores.accountability).toBe(3); // 2 + 1
    expect(result.leapScores.productivity).toBe(8); // 7 + 1
  });
});

describe('Document Example Validation', () => {
  it('matches HATS Score Template example (5,5,5,5)', () => {
    // From LEAP HATS Assessment Score Template:
    // Q1: B = 3 points (habit)
    // Q2: C = 2 points (habit)
    // Q3: B = 3 points (ability)
    // Q4: C = 2 points (ability)
    // Q5: A = 4 points (talent)
    // Q6: D = 1 point (talent)
    // Q7: B = 3 points (skill)
    // Q8: C = 2 points (skill)
    // Expected: habit: 5, ability: 5, talent: 5, skill: 5

    const answers: Answer[] = [
      { questionId: 'q1', category: 'habit', points: 3 }, // B
      { questionId: 'q2', category: 'habit', points: 2 }, // C
      { questionId: 'q3', category: 'ability', points: 3 }, // B
      { questionId: 'q4', category: 'ability', points: 2 }, // C
      { questionId: 'q5', category: 'talent', points: 4 }, // A
      { questionId: 'q6', category: 'talent', points: 1 }, // D
      { questionId: 'q7', category: 'skill', points: 3 }, // B
      { questionId: 'q8', category: 'skill', points: 2 }, // C
    ];

    const result = calculateAllScores(answers);

    expect(result.categoryScores.habit).toBe(5); // 3 + 2
    expect(result.categoryScores.ability).toBe(5); // 3 + 2
    expect(result.categoryScores.talent).toBe(5); // 4 + 1
    expect(result.categoryScores.skill).toBe(5); // 3 + 2

    // LEAP scores
    expect(result.leapScores.leadership).toBe(10); // 5 + 5
    expect(result.leapScores.effectiveness).toBe(10); // 5 + 5
    expect(result.leapScores.accountability).toBe(10); // 5 + 5
    expect(result.leapScores.productivity).toBe(10); // 5 + 5
  });

  it('validates individual assessment max scores (8 per category, 16 per LEAP)', () => {
    // Individual: 2 questions per category, max 4 points each = 8 max per category
    const maxAnswers: Answer[] = [
      { questionId: 'h1', category: 'habit', points: 4 },
      { questionId: 'h2', category: 'habit', points: 4 },
      { questionId: 'a1', category: 'ability', points: 4 },
      { questionId: 'a2', category: 'ability', points: 4 },
      { questionId: 't1', category: 'talent', points: 4 },
      { questionId: 't2', category: 'talent', points: 4 },
      { questionId: 's1', category: 'skill', points: 4 },
      { questionId: 's2', category: 'skill', points: 4 },
    ];

    const result = calculateAllScores(maxAnswers);

    expect(result.categoryScores.habit).toBe(8);
    expect(result.categoryScores.ability).toBe(8);
    expect(result.categoryScores.talent).toBe(8);
    expect(result.categoryScores.skill).toBe(8);

    // LEAP max: 8 + 8 = 16 per dimension
    expect(result.leapScores.leadership).toBe(16); // 8 + 8
    expect(result.leapScores.effectiveness).toBe(16); // 8 + 8
    expect(result.leapScores.accountability).toBe(16); // 8 + 8
    expect(result.leapScores.productivity).toBe(16); // 8 + 8
  });

  it('validates team assessment max scores (12 per category, 24 per LEAP)', () => {
    // Team: 3 questions per category, max 4 points each = 12 max per category
    const maxAnswers: Answer[] = [
      { questionId: 'h1', category: 'habit', points: 4 },
      { questionId: 'h2', category: 'habit', points: 4 },
      { questionId: 'h3', category: 'habit', points: 4 },
      { questionId: 'a1', category: 'ability', points: 4 },
      { questionId: 'a2', category: 'ability', points: 4 },
      { questionId: 'a3', category: 'ability', points: 4 },
      { questionId: 't1', category: 'talent', points: 4 },
      { questionId: 't2', category: 'talent', points: 4 },
      { questionId: 't3', category: 'talent', points: 4 },
      { questionId: 's1', category: 'skill', points: 4 },
      { questionId: 's2', category: 'skill', points: 4 },
      { questionId: 's3', category: 'skill', points: 4 },
    ];

    const result = calculateAllScores(maxAnswers);

    expect(result.categoryScores.habit).toBe(12);
    expect(result.categoryScores.ability).toBe(12);
    expect(result.categoryScores.talent).toBe(12);
    expect(result.categoryScores.skill).toBe(12);

    // LEAP max: 12 + 12 = 24 per dimension
    expect(result.leapScores.leadership).toBe(24); // 12 + 12
    expect(result.leapScores.effectiveness).toBe(24); // 12 + 12
    expect(result.leapScores.accountability).toBe(24); // 12 + 12
    expect(result.leapScores.productivity).toBe(24); // 12 + 12
  });
});

