import { describe, it, expect } from 'vitest';
import { translateSupabaseError } from '../errors';

describe('translateSupabaseError', () => {
  // Login errors
  it('translates invalid login credentials', () => {
    expect(translateSupabaseError('Invalid login credentials'))
      .toBe('Correo electrónico o contraseña incorrectos.');
  });

  it('translates invalid email or password', () => {
    expect(translateSupabaseError('Invalid email or password'))
      .toBe('Correo electrónico o contraseña incorrectos.');
  });

  it('translates user not found', () => {
    expect(translateSupabaseError('User not found'))
      .toBe('Usuario no encontrado.');
  });

  // Email confirmation
  it('translates email not confirmed', () => {
    expect(translateSupabaseError('Email not confirmed'))
      .toBe('Por favor confirma tu correo electrónico.');
  });

  it('translates confirm your email', () => {
    expect(translateSupabaseError('Please confirm your email'))
      .toBe('Por favor confirma tu correo electrónico.');
  });

  // Duplicate user
  it('translates user already registered', () => {
    expect(translateSupabaseError('User already registered'))
      .toBe('El correo electrónico ya está registrado.');
  });

  it('translates duplicate key value for username', () => {
    expect(translateSupabaseError('duplicate key value violates unique constraint on username'))
      .toBe('El nombre de usuario ya está en uso. Por favor, elige otro.');
  });

  it('translates duplicate key value without username', () => {
    expect(translateSupabaseError('duplicate key value violates unique constraint'))
      .toBe('El correo electrónico ya está registrado.');
  });

  // Network
  it('translates network error', () => {
    expect(translateSupabaseError('Network error'))
      .toBe('Error de red. Intenta de nuevo más tarde.');
  });

  // Password
  it('translates password errors', () => {
    expect(translateSupabaseError('Password is too weak'))
      .toBe('La contraseña es incorrecta o no cumple los requisitos.');
  });

  // Unknown errors pass through
  it('returns original message for unknown errors', () => {
    expect(translateSupabaseError('Something completely unknown happened'))
      .toBe('Something completely unknown happened');
  });

  // Case insensitivity
  it('handles uppercase error messages', () => {
    expect(translateSupabaseError('INVALID LOGIN CREDENTIALS'))
      .toBe('Correo electrónico o contraseña incorrectos.');
  });
});
