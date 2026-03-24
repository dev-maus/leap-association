/**
 * Assessment storage utility — per assessment type (individual / team / leadership)
 */

export type AssessmentStorageType = 'individual' | 'team' | 'leadership';

export interface AssessmentData {
  submittedEmail?: string;
  responseId?: string;
  submittedAt?: string;
}

const LEGACY_STORAGE_KEY = 'leap_assessment_data';
const CALL_SCHEDULED_KEY = 'leap_call_scheduled';
const isClient = typeof window !== 'undefined';

function storageKeyForType(type: AssessmentStorageType): string {
  return `leap_assessment_${type}`;
}

/**
 * One-time migration: copy legacy single-key data into the type that matches current URL or default to individual.
 */
function migrateLegacyIfNeeded(): void {
  if (!isClient) return;
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return;
    const parsed = JSON.parse(legacy) as AssessmentData & { callScheduled?: boolean };
    if (parsed.callScheduled) {
      localStorage.setItem(CALL_SCHEDULED_KEY, '1');
    }
    const { callScheduled: _c, ...rest } = parsed;
    if (!rest.submittedEmail && !rest.responseId) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }
    // If any per-type key already exists, drop legacy only
    const types: AssessmentStorageType[] = ['individual', 'team', 'leadership'];
    const hasPerType = types.some((t) => localStorage.getItem(storageKeyForType(t)));
    if (hasPerType) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }
    // Heuristic: cannot know type from legacy — default to individual (most common)
    localStorage.setItem(storageKeyForType('individual'), JSON.stringify(rest));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Get assessment data for one type from localStorage
 */
export function getAssessmentData(type: AssessmentStorageType): AssessmentData {
  if (!isClient) return {};
  migrateLegacyIfNeeded();
  try {
    const stored = localStorage.getItem(storageKeyForType(type));
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to read assessment data from localStorage:', error);
    return {};
  }
}

/**
 * Save assessment data for one type
 */
export function saveAssessmentData(
  type: AssessmentStorageType,
  data: Partial<AssessmentData>,
  replace: boolean = false,
): void {
  if (!isClient) return;
  migrateLegacyIfNeeded();
  try {
    const updated: AssessmentData = replace
      ? (data as AssessmentData)
      : {
          ...getAssessmentData(type),
          ...data,
        };
    localStorage.setItem(storageKeyForType(type), JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save assessment data to localStorage:', error);
  }
}

/**
 * Whether this assessment type has a recorded submission (email captured)
 */
export function hasSubmittedAssessment(type: AssessmentStorageType): boolean {
  const data = getAssessmentData(type);
  return !!data.submittedEmail;
}

/**
 * Global flag: user scheduled a strategy call (any path)
 */
export function hasScheduledCall(): boolean {
  if (!isClient) return false;
  migrateLegacyIfNeeded();
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as AssessmentData & { callScheduled?: boolean };
      if (parsed.callScheduled) return true;
    }
  } catch {
    // ignore
  }
  return localStorage.getItem(CALL_SCHEDULED_KEY) === '1';
}

export function setCallScheduled(scheduled: boolean): void {
  if (!isClient) return;
  if (scheduled) {
    localStorage.setItem(CALL_SCHEDULED_KEY, '1');
  } else {
    localStorage.removeItem(CALL_SCHEDULED_KEY);
  }
}

/**
 * Clear one assessment type, or all types + legacy + call flag
 */
export function clearAssessmentData(type?: AssessmentStorageType): void {
  if (!isClient) return;
  try {
    if (type) {
      localStorage.removeItem(storageKeyForType(type));
      return;
    }
    (['individual', 'team', 'leadership'] as const).forEach((t) => {
      localStorage.removeItem(storageKeyForType(t));
    });
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(CALL_SCHEDULED_KEY);
  } catch (error) {
    console.error('Failed to clear assessment data from localStorage:', error);
  }
}
