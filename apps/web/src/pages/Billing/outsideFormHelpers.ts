export const BD_PHONE_REGEX = /^(?:\+88|88)?01[3-9]\d{8}$/;

export interface DoctorSuggestion {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  specialization?: string;
  degree?: string | null;
  department?: string | null;
}

export interface ReferralState {
  referredBy: string;
  referredByDoctorId: string | null;
  selectedDoctor: DoctorSuggestion | null;
}

/**
 * Formats a doctor record into its standard display name (e.g. "Dr. John Doe").
 */
export function formatDoctorName(doctor: Partial<DoctorSuggestion> | null | undefined): string {
  if (!doctor) return '';
  const anyDoc = doctor as any;
  const rawName =
    (typeof doctor.name === 'string' && doctor.name.trim()) ||
    `${(doctor.firstName || anyDoc.first_name || '').trim()} ${(doctor.lastName || anyDoc.last_name || '').trim()}`.trim() ||
    (typeof anyDoc.fullName === 'string' && anyDoc.fullName.trim()) ||
    (typeof anyDoc.doctorName === 'string' && anyDoc.doctorName.trim()) ||
    (typeof anyDoc.user?.name === 'string' && anyDoc.user.name.trim()) ||
    '';
  if (!rawName) return '';
  return /^dr\.?\s+/i.test(rawName) ? rawName : `Dr. ${rawName}`;
}

/**
 * Checks whether a Bangladeshi phone number has reached its expected input length
 * (11 digits for 01XXXXXXXXX, 13 for 8801XXXXXXXXX, 14 for +8801XXXXXXXXX)
 * and is valid while typing forward.
 */
export function isExpectedPhoneLengthReached(value: string, previousValue: string = ''): boolean {
  const trimmed = (value || '').trim();
  const prevTrimmed = (previousValue || '').trim();
  if (trimmed.length <= prevTrimmed.length) {
    return false;
  }
  if (trimmed.startsWith('+8801')) {
    return trimmed.length === 14 && BD_PHONE_REGEX.test(trimmed);
  }
  if (trimmed.startsWith('8801')) {
    return trimmed.length === 13 && BD_PHONE_REGEX.test(trimmed);
  }
  if (trimmed.startsWith('01')) {
    return trimmed.length === 11 && BD_PHONE_REGEX.test(trimmed);
  }
  return false;
}

/**
 * Checks whether an age input has reached the maximum 3-digit length (100-150)
 * and is a valid whole number age while typing forward.
 */
export function isExpectedAgeLengthReached(value: string, previousValue: string = ''): boolean {
  const trimmed = String(value ?? '').trim();
  const prevTrimmed = String(previousValue ?? '').trim();
  if (trimmed.length <= prevTrimmed.length) {
    return false;
  }
  if (!/^\d{3}$/.test(trimmed)) {
    return false;
  }
  const num = Number(trimmed);
  return Number.isInteger(num) && num >= 100 && num <= 150;
}

/**
 * Determines whether a form field element is eligible to receive automatic focus navigation.
 * Skips disabled, hidden, read-only, negative tabIndex, and conditionally unavailable elements.
 */
export function isFieldEligibleForNavigation(element: any): boolean {
  if (!element) return false;

  if (element.disabled === true) return false;
  if (typeof element.getAttribute === 'function') {
    const disabledAttr = element.getAttribute('disabled');
    if (disabledAttr !== null && disabledAttr !== undefined && disabledAttr !== 'false') {
      return false;
    }
    if (element.getAttribute('aria-disabled') === 'true') return false;
    const readonlyAttr = element.getAttribute('readonly');
    if (readonlyAttr !== null && readonlyAttr !== undefined && readonlyAttr !== 'false') {
      return false;
    }
    const hiddenAttr = element.getAttribute('hidden');
    if (hiddenAttr !== null && hiddenAttr !== undefined && hiddenAttr !== 'false') {
      return false;
    }
    if (element.getAttribute('aria-hidden') === 'true') return false;
  }

  if (element.readOnly === true) return false;
  if (element.hidden === true) return false;

  const type = (element.type || '').toLowerCase();
  if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset') {
    return false;
  }

  if (typeof element.tabIndex === 'number' && element.tabIndex < 0) {
    return false;
  }

  if (element.style) {
    if (element.style.display === 'none' || element.style.visibility === 'hidden') {
      return false;
    }
  }

  // Check ancestor visibility / disabled state
  let parent = element.parentElement;
  while (parent) {
    if (parent.hidden === true) return false;
    if (parent.disabled === true) return false;
    if (typeof parent.getAttribute === 'function') {
      const pHidden = parent.getAttribute('hidden');
      if (pHidden !== null && pHidden !== undefined && pHidden !== 'false') return false;
      if (parent.getAttribute('aria-hidden') === 'true') return false;
    }
    if (parent.style) {
      if (parent.style.display === 'none' || parent.style.visibility === 'hidden') {
        return false;
      }
    }
    if (parent.classList && typeof parent.classList.contains === 'function') {
      if (parent.classList.contains('hidden')) return false;
    }
    parent = parent.parentElement;
  }

  return true;
}

const DEFAULT_FIELD_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]), select, textarea';

/**
 * Returns all candidate fields in DOM order from a container or explicit field array.
 */
export function getCandidateFields(containerOrFields: any): any[] {
  if (!containerOrFields) return [];
  if (Array.isArray(containerOrFields)) {
    return containerOrFields.filter(Boolean);
  }
  if (typeof containerOrFields.querySelectorAll === 'function') {
    return Array.from(containerOrFields.querySelectorAll(DEFAULT_FIELD_SELECTOR));
  }
  return [];
}

/**
 * Returns only the eligible navigable fields in sequence.
 */
export function getNavigableFields(containerOrFields: any): any[] {
  return getCandidateFields(containerOrFields).filter(isFieldEligibleForNavigation);
}

/**
 * Finds the next eligible field after `currentField` in the form sequence,
 * skipping any disabled, hidden, read-only, or unavailable fields.
 */
export function findNextNavigableField(currentField: any, containerOrFields: any): any | null {
  if (!currentField || !containerOrFields) return null;
  const allCandidates = getCandidateFields(containerOrFields);
  const currentIndex = allCandidates.indexOf(currentField);
  if (currentIndex === -1) return null;

  for (let i = currentIndex + 1; i < allCandidates.length; i++) {
    const candidate = allCandidates[i];
    if (isFieldEligibleForNavigation(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Moves focus to the next eligible field in sequence.
 * Returns the focused element or null if none is available.
 */
export function focusNextField(currentField: any, containerOrFields: any): any | null {
  const next = findNextNavigableField(currentField, containerOrFields);
  if (next && typeof next.focus === 'function') {
    next.focus();
    return next;
  }
  return null;
}

/**
 * Updates referral state when the user types or edits the Referred By text input.
 * Invalidates any previously selected doctor ID if the text is modified.
 */
export function handleReferralInputEdit(
  currentState: ReferralState,
  newInputValue: string
): ReferralState {
  const selectedName = currentState.selectedDoctor
    ? formatDoctorName(currentState.selectedDoctor)
    : null;

  if (
    currentState.referredByDoctorId &&
    selectedName &&
    newInputValue === selectedName
  ) {
    return {
      ...currentState,
      referredBy: newInputValue,
    };
  }

  return {
    referredBy: newInputValue,
    referredByDoctorId: null,
    selectedDoctor: null,
  };
}

/**
 * Updates referral state when the user selects an existing doctor from autocomplete suggestions.
 */
export function handleReferralDoctorSelect(doctor: DoctorSuggestion): ReferralState {
  const displayName = formatDoctorName(doctor);
  return {
    referredBy: displayName,
    referredByDoctorId: doctor.id,
    selectedDoctor: {
      ...doctor,
      name: displayName,
    },
  };
}

/**
 * Updates referral state when the user leaves (blurs) the Referred By input.
 * Retains manual text entry while clearing doctor ID if the input was cleared.
 */
export function handleReferralBlur(currentState: ReferralState): ReferralState {
  if (!currentState.referredBy || !currentState.referredBy.trim()) {
    return {
      referredBy: '',
      referredByDoctorId: null,
      selectedDoctor: null,
    };
  }

  return currentState;
}

/**
 * Builds the normalized referral payload for backend submission, preserving the distinction
 * between an existing doctor referral (`referredByDoctorId` + `referredBy`) and a manual
 * referral (`referredByDoctorId: null` + `referredBy`).
 */
export function buildReferralSubmissionPayload(state: {
  referredBy?: string | null;
  referredByDoctorId?: string | null;
}): {
  referredBy: string | undefined;
  referredByDoctorId: string | null;
} {
  const trimmedName = (state.referredBy || '').trim();
  const docId = state.referredByDoctorId ? String(state.referredByDoctorId).trim() : '';

  if (!trimmedName && !docId) {
    return {
      referredBy: undefined,
      referredByDoctorId: null,
    };
  }

  if (docId) {
    return {
      referredBy: trimmedName || undefined,
      referredByDoctorId: docId,
    };
  }

  return {
    referredBy: trimmedName || undefined,
    referredByDoctorId: null,
  };
}

/**
 * Splits text into segments for case-insensitive search match highlighting.
 */
export function splitTextForHighlight(
  text: string,
  query: string
): Array<{ text: string; highlight: boolean }> {
  if (!text) return [];
  const rawQuery = (query || '').trim();
  const cleanedQuery = rawQuery.replace(/^dr\.?\s*/i, '').trim() || rawQuery;
  if (!cleanedQuery) {
    return [{ text, highlight: false }];
  }

  const tokens = cleanedQuery
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (tokens.length === 0) {
    return [{ text, highlight: false }];
  }

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(regex).filter((p) => p.length > 0);

  return parts.map((part) => ({
    text: part,
    highlight: regex.test(part) || tokens.some((t) => new RegExp(`^${t}$`, 'i').test(part)),
  }));
}

