// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

/**
 * Canonical shape of a `pomodoro_sessions` row, derived from the generated
 * `database.types.ts`. Other modules that only need a subset of these
 * fields should use `Pick<SessionRow, ...>` rather than redeclaring their
 * own copy.
 */
export type { SessionRow } from './tables';
