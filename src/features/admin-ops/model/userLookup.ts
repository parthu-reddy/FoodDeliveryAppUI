/**
 * What the admin's "User ID / Phone" search should ask IdentityService for.
 *
 * A user id is a UUID. A phone number is looked up as the 10 digits the sign-in form sends --
 * AuthForm strips everything else and shows +91 as a prefix -- so spaces, dashes and a leading
 * +91 or 91 are dropped here. Anything else is neither, and nothing is fetched.
 */
export type UserLookup = { kind: 'id'; id: string } | { kind: 'phone'; phone: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function userLookup(query: string): UserLookup | null {
  const trimmed = query.trim();
  if (UUID.test(trimmed)) return { kind: 'id', id: trimmed.toLowerCase() };
  if (!/^[+\d\s-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return { kind: 'phone', phone: digits };
  if (digits.length === 12 && digits.startsWith('91')) return { kind: 'phone', phone: digits.slice(2) };
  return null;
}
