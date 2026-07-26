/**
 * Structured error logger.
 *
 * Wraps console.error / console.warn with a consistent, grep-friendly shape so
 * logs are easy to filter in Vercel. No external dependencies.
 *
 * Do NOT log PII (email, names, etc.) — use userId (auth.uid) only.
 */

export interface LogContext {
  /** e.g. 'loadSettings', 'saveSession', 'fetchTasks' */
  operation: string;
  /** auth.uid if available — do NOT log email or other PII */
  userId?: string;
  /** any extra context (table name, retry count, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * Log an error with structured context.
 * Handles both Error instances and unknown thrown values.
 */
export function logError(error: unknown, context: LogContext): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(`[${context.operation}]`, {
    message,
    stack,
    userId: context.userId,
    ...context.metadata,
  });
}

/**
 * Log a non-fatal warning (e.g. a retry attempt).
 */
export function logWarn(
  message: string,
  context: Omit<LogContext, 'operation'> & { operation: string },
): void {
  console.warn(`[${context.operation}]`, message, context.metadata);
}
