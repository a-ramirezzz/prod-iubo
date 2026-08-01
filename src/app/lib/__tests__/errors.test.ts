import { describe, it, expect } from 'vitest';
import { translateSupabaseError } from '../errors';

// Mock t function that returns the key itself (so we can assert the key was correct)
const mockT = (key: string) => key;

describe('translateSupabaseError', () => {
  // Login errors
  it('translates invalid login credentials', () => {
    expect(translateSupabaseError('Invalid login credentials', mockT))
      .toBe('auth.errors.invalidCredentials');
  });

  it('translates invalid email or password', () => {
    expect(translateSupabaseError('Invalid email or password', mockT))
      .toBe('auth.errors.invalidCredentials');
  });

  it('translates user not found', () => {
    expect(translateSupabaseError('User not found', mockT))
      .toBe('auth.errors.userNotFound');
  });

  // Email confirmation
  it('translates email not confirmed', () => {
    expect(translateSupabaseError('Email not confirmed', mockT))
      .toBe('auth.errors.emailNotConfirmed');
  });

  it('translates confirm your email', () => {
    expect(translateSupabaseError('Please confirm your email', mockT))
      .toBe('auth.errors.emailNotConfirmed');
  });

  // Duplicate user
  it('translates user already registered', () => {
    expect(translateSupabaseError('User already registered', mockT))
      .toBe('auth.errors.emailAlreadyRegistered');
  });

  it('translates duplicate key value for username', () => {
    expect(translateSupabaseError('duplicate key value violates unique constraint on username', mockT))
      .toBe('auth.errors.usernameAlreadyTaken');
  });

  it('translates duplicate key value without username', () => {
    expect(translateSupabaseError('duplicate key value violates unique constraint', mockT))
      .toBe('auth.errors.emailAlreadyRegistered');
  });

  // Network
  it('translates network error', () => {
    expect(translateSupabaseError('Network error', mockT))
      .toBe('auth.errors.networkError');
  });

  // Password
  it('translates password errors', () => {
    expect(translateSupabaseError('Password is too weak', mockT))
      .toBe('auth.errors.passwordError');
  });

  // Unknown errors pass through
  it('returns original message for unknown errors', () => {
    expect(translateSupabaseError('Something completely unknown happened', mockT))
      .toBe('Something completely unknown happened');
  });

  // Case insensitivity
  it('handles uppercase error messages', () => {
    expect(translateSupabaseError('INVALID LOGIN CREDENTIALS', mockT))
      .toBe('auth.errors.invalidCredentials');
  });
});
