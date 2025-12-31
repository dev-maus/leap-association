/**
 * Assessment storage utility for managing assessment data in localStorage
 */

export interface AssessmentData {
  submittedEmail?: string;
  responseId?: string;
  callScheduled?: boolean;
  submittedAt?: string;
}

const STORAGE_KEY = 'leap_assessment_data';
const isClient = typeof window !== 'undefined';

/**
 * Get assessment data from localStorage
 */
export function getAssessmentData(): AssessmentData {
  if (!isClient) return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to read assessment data from localStorage:', error);
    return {};
  }
}

/**
 * Save assessment data to localStorage
 */
export function saveAssessmentData(data: Partial<AssessmentData>): void {
  if (!isClient) return;

  try {
    const existing = getAssessmentData();
    const updated: AssessmentData = {
      ...existing,
      ...data,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save assessment data to localStorage:', error);
  }
}

/**
 * Check if user has submitted an assessment
 */
export function hasSubmittedAssessment(): boolean {
  const data = getAssessmentData();
  return !!data.submittedEmail;
}

/**
 * Check if user has scheduled a call
 */
export function hasScheduledCall(): boolean {
  const data = getAssessmentData();
  return !!data.callScheduled;
}

/**
 * Clear assessment data from localStorage
 */
export function clearAssessmentData(): void {
  if (!isClient) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear assessment data from localStorage:', error);
  }
}

