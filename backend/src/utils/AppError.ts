/**
 * Domain error with an HTTP status and a stable, client-safe `code`.
 * Anything thrown that is not an AppError is treated as a 500 and its
 * message is hidden from the client by the error middleware.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(msg = 'Bad request', details?: unknown) {
    return new AppError(400, 'BAD_REQUEST', msg, details);
  }
  static unauthorized(msg = 'Not authenticated') {
    return new AppError(401, 'UNAUTHORIZED', msg);
  }
  static forbidden(msg = 'Not allowed') {
    return new AppError(403, 'FORBIDDEN', msg);
  }
  static notFound(msg = 'Not found') {
    return new AppError(404, 'NOT_FOUND', msg);
  }
  static conflict(msg = 'Conflict') {
    return new AppError(409, 'CONFLICT', msg);
  }
  static upstream(msg = 'Upstream service error', details?: unknown) {
    return new AppError(502, 'UPSTREAM_ERROR', msg, details);
  }
}
