/**
 * Utility functions for SMS service
 */

/**
 * Get mobile carrier based on phone number prefix for Bhutan
 * @param phoneNumber - The phone number (with or without country code)
 * @returns carrier code
 */
export function getCarrier(phoneNumber: number): string {
  // Get first 2 digits to determine carrier
  const prefix = String(phoneNumber).substring(0, 1);

  switch (prefix) {
    case '1':
      return 'BMOB'; // B-Mobile (Bhutan Telecom)
    case '7':
      return 'TCELL'; // TashiCell
    default:
      // Default to bt-mobile for unknown prefixes
      return 'TCELL';
  }
}

/**
 * Validate Bhutanese phone number
 * @param phoneNumber - Phone number to validate
 * @returns boolean indicating if valid
 */
export function isValidBhutanPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Check for 8-digit local number
  if (cleaned.length === 8) {
    const prefix = cleaned.substring(0, 2);
    return ['17', '77'].includes(prefix);
  }

  // Check for 11-digit number with country code
  if (cleaned.length === 11 && cleaned.startsWith('975')) {
    const localPart = cleaned.substring(3);
    const prefix = localPart.substring(0, 2);
    return ['17', '77'].includes(prefix);
  }

  return false;
}
