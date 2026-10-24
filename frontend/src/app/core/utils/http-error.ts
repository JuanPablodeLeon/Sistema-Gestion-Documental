import { HttpErrorResponse } from '@angular/common/http';

export function extractHttpError(
  error: unknown,
  fallback = 'Ocurrió un error inesperado',
): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;

  const message = error.error?.message;

  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;
  if (error.status === 0) return 'No se pudo conectar con el servidor';

  return fallback;
}
