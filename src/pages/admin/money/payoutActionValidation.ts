export const MIN_BANK_REFERENCE_LENGTH = 3;
export const MIN_FAILURE_REASON_LENGTH = 5;

export function hasMeaningfulBankReference(value: string) {
  return value.trim().length >= MIN_BANK_REFERENCE_LENGTH;
}

export function hasMeaningfulFailureReason(value: string) {
  return value.trim().length >= MIN_FAILURE_REASON_LENGTH;
}
