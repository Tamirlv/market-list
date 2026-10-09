// Must match the list in firestore.rules exactly (verified by tests/config/allowlist.test.ts).
export const ALLOWED_EMAILS: readonly string[] = ['tamirlevi22@gmail.com', 'edenvilf@gmail.com'];

export function isAllowed(email: string | null | undefined): boolean {
  return !!email && ALLOWED_EMAILS.includes(email.toLowerCase());
}
