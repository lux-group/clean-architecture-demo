import { AuthenticationError, InvalidOperationError } from '~/domain/errors';

export function getErrorMessage(err: unknown): string {
  if (err instanceof AuthenticationError || err instanceof InvalidOperationError) return err.message;
  return 'An unknown error occurred. Please try again.';
}

export function safeRedirect(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // If URL constructor throws, fall through to default
  }
  return '/'; // fallback to home on invalid or unsafe scheme
}
