import { describe, it, expect, jest } from '@jest/globals';
import {
  isExpectedPhoneLengthReached,
  isExpectedAgeLengthReached,
  isFieldEligibleForNavigation,
  findNextNavigableField,
  focusNextField,
  handleReferralInputEdit,
  handleReferralDoctorSelect,
  handleReferralBlur,
  buildReferralSubmissionPayload,
  splitTextForHighlight,
  type DoctorSuggestion,
  type ReferralState,
} from '../../../web/src/pages/Billing/outsideFormHelpers';

describe('Outside Patient Form Auto-Navigation & Referred By Autocomplete Logic', () => {
  const createMockField = (overrides: Record<string, any> = {}) => ({
    tagName: 'INPUT',
    type: 'text',
    disabled: false,
    readOnly: false,
    hidden: false,
    tabIndex: 0,
    style: { display: 'block', visibility: 'visible' },
    parentElement: null,
    getAttribute: (attr: string) => overrides.attributes?.[attr] ?? null,
    focus: jest.fn(),
    ...overrides,
  });

  describe('1. Auto-Navigation & Skipping Disabled/Hidden/ReadOnly Fields', () => {
    it('moves focus sequentially across active form fields', () => {
      const nameInput = createMockField({ name: 'name' });
      const phoneInput = createMockField({ name: 'phone' });
      const ageInput = createMockField({ name: 'age', type: 'number' });
      const genderSelect = createMockField({ name: 'gender', tagName: 'SELECT' });
      const referredByInput = createMockField({ name: 'referredBy' });
      const fields = [nameInput, phoneInput, ageInput, genderSelect, referredByInput];

      expect(focusNextField(nameInput, fields)).toBe(phoneInput);
      expect(phoneInput.focus).toHaveBeenCalledTimes(1);

      expect(focusNextField(phoneInput, fields)).toBe(ageInput);
      expect(ageInput.focus).toHaveBeenCalledTimes(1);

      expect(focusNextField(ageInput, fields)).toBe(genderSelect);
      expect(genderSelect.focus).toHaveBeenCalledTimes(1);

      expect(focusNextField(genderSelect, fields)).toBe(referredByInput);
      expect(referredByInput.focus).toHaveBeenCalledTimes(1);
    });

    it('skips disabled, hidden, read-only, and conditionally hidden ancestor fields', () => {
      const nameInput = createMockField({ name: 'name' });
      const disabledField = createMockField({ name: 'disabledField', disabled: true });
      const hiddenField = createMockField({ name: 'hiddenField', hidden: true });
      const displayNoneField = createMockField({
        name: 'displayNoneField',
        style: { display: 'none', visibility: 'visible' },
      });
      const readOnlyField = createMockField({ name: 'readOnlyField', readOnly: true });
      const ancestorHiddenField = createMockField({
        name: 'ancestorHiddenField',
        parentElement: {
          hidden: false,
          style: { display: 'none', visibility: 'visible' },
          classList: { contains: () => false },
        },
      });
      const referredByInput = createMockField({ name: 'referredBy' });

      const fields = [
        nameInput,
        disabledField,
        hiddenField,
        displayNoneField,
        readOnlyField,
        ancestorHiddenField,
        referredByInput,
      ];

      expect(isFieldEligibleForNavigation(disabledField)).toBe(false);
      expect(isFieldEligibleForNavigation(hiddenField)).toBe(false);
      expect(isFieldEligibleForNavigation(displayNoneField)).toBe(false);
      expect(isFieldEligibleForNavigation(readOnlyField)).toBe(false);
      expect(isFieldEligibleForNavigation(ancestorHiddenField)).toBe(false);
      expect(isFieldEligibleForNavigation(referredByInput)).toBe(true);

      const next = findNextNavigableField(nameInput, fields);
      expect(next).toBe(referredByInput);
    });

    it('auto-advances when Bangladeshi phone number reaches expected valid length', () => {
      // Incomplete 10-digit number -> false
      expect(isExpectedPhoneLengthReached('0171234567', '017123456')).toBe(false);
      // Complete valid 11-digit BD number -> true
      expect(isExpectedPhoneLengthReached('01712345678', '0171234567')).toBe(true);
      // Complete valid 14-char +8801... number -> true
      expect(isExpectedPhoneLengthReached('+8801812345678', '+880181234567')).toBe(true);
      // Invalid prefix (011...) at 11 digits -> false (validation error prevents focus jump)
      expect(isExpectedPhoneLengthReached('01112345678', '0111234567')).toBe(false);
      // Deleting characters (backspace) -> false
      expect(isExpectedPhoneLengthReached('01712345678', '017123456789')).toBe(false);
    });

    it('auto-advances age only when valid 3-digit age (100-150) is reached and blocks invalid >150', () => {
      expect(isExpectedAgeLengthReached('25', '2')).toBe(false);
      expect(isExpectedAgeLengthReached('105', '10')).toBe(true);
      // Invalid age > 150 must not auto-advance
      expect(isExpectedAgeLengthReached('200', '20')).toBe(false);
    });

    it('prevents accidental form submission on Enter and skips submit/button inputs', () => {
      const submitBtn = createMockField({ type: 'submit', name: 'submitBtn' });
      const buttonInput = createMockField({ type: 'button', name: 'btn' });
      expect(isFieldEligibleForNavigation(submitBtn)).toBe(false);
      expect(isFieldEligibleForNavigation(buttonInput)).toBe(false);
    });
  });

  describe('2. Referred By – Doctor Autocomplete & Manual Entry State Machine', () => {
    const sampleDoctor: DoctorSuggestion = {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      firstName: 'Abdur',
      lastName: 'Rahman',
      specialization: 'Cardiology',
      degree: 'MBBS, FCPS',
    };

    it('populates doctor name and stores doctor ID when an existing doctor is selected', () => {
      const selected = handleReferralDoctorSelect(sampleDoctor);
      expect(selected.referredBy).toBe('Dr. Abdur Rahman');
      expect(selected.referredByDoctorId).toBe(sampleDoctor.id);
      expect(selected.selectedDoctor?.id).toBe(sampleDoctor.id);

      const payload = buildReferralSubmissionPayload(selected);
      expect(payload).toEqual({
        referredBy: 'Dr. Abdur Rahman',
        referredByDoctorId: sampleDoctor.id,
      });
    });

    it('accepts manual doctor name entry with null doctor ID and preserves it on blur/tab', () => {
      const initial: ReferralState = {
        referredBy: '',
        referredByDoctorId: null,
        selectedDoctor: null,
      };

      const afterTyping = handleReferralInputEdit(initial, 'Dr. Manual Karim');
      expect(afterTyping.referredBy).toBe('Dr. Manual Karim');
      expect(afterTyping.referredByDoctorId).toBeNull();

      // Moving to another field (blur) retains the manual value
      const afterBlur = handleReferralBlur(afterTyping);
      expect(afterBlur.referredBy).toBe('Dr. Manual Karim');
      expect(afterBlur.referredByDoctorId).toBeNull();

      const payload = buildReferralSubmissionPayload(afterBlur);
      expect(payload).toEqual({
        referredBy: 'Dr. Manual Karim',
        referredByDoctorId: null,
      });
    });

    it('clears outdated doctor ID immediately when user edits a previously selected doctor name', () => {
      const selected = handleReferralDoctorSelect(sampleDoctor);
      expect(selected.referredByDoctorId).toBe(sampleDoctor.id);

      // User edits "Dr. Abdur Rahman" -> "Dr. Abdur Rahman Jr"
      const edited = handleReferralInputEdit(selected, 'Dr. Abdur Rahman Jr');
      expect(edited.referredBy).toBe('Dr. Abdur Rahman Jr');
      expect(edited.referredByDoctorId).toBeNull();
      expect(edited.selectedDoctor).toBeNull();

      const payload = buildReferralSubmissionPayload(edited);
      expect(payload).toEqual({
        referredBy: 'Dr. Abdur Rahman Jr',
        referredByDoctorId: null,
      });
    });

    it('retains manual doctor entry when API returns no matches or encounters an API error', () => {
      const stateAfterManualEntry = handleReferralInputEdit(
        { referredBy: '', referredByDoctorId: null, selectedDoctor: null },
        'Dr. Unlisted Specialist'
      );
      // Even when suggestions = [] (no-match or API error), blurring or pressing Enter preserves manual referral
      const stateAfterLeavingField = handleReferralBlur(stateAfterManualEntry);
      expect(stateAfterLeavingField.referredBy).toBe('Dr. Unlisted Specialist');
      expect(stateAfterLeavingField.referredByDoctorId).toBeNull();
    });

    it('highlights matching query segments case-insensitively in doctor suggestions', () => {
      const segments = splitTextForHighlight('Dr. Abdur Rahman', 'rahman');
      const highlighted = segments
        .filter((s: { text: string; highlight: boolean }) => s.highlight)
        .map((s: { text: string; highlight: boolean }) => s.text);
      expect(highlighted).toEqual(['Rahman']);
    });

    it('preserves selected doctor name and ID when blur fires immediately after selection', () => {
      const selected = handleReferralDoctorSelect({
        id: sampleDoctor.id,
        firstName: 'Abdur',
        lastName: 'Rahman',
        name: '',
      });
      const afterImmediateBlur = handleReferralBlur(selected);
      expect(afterImmediateBlur.referredBy).toBe('Dr. Abdur Rahman');
      expect(afterImmediateBlur.referredByDoctorId).toBe(sampleDoctor.id);
    });
  });
});
