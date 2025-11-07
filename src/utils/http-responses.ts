// HTTP response utilities for Lambda handler
// Provides consistent response formatting

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Get standard CORS headers
 */
export function getCorsHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

/**
 * Create a success response
 */
export function createSuccessResponse(data: unknown, headers?: Record<string, string>): HttpResponse {
  return {
    statusCode: 200,
    headers: headers || getCorsHeaders(),
    body: JSON.stringify(data),
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  statusCode: number,
  error: string,
  details?: string,
  headers?: Record<string, string>
): HttpResponse {
  const body: Record<string, string> = { error };
  if (details) {
    body.details = details;
  }

  return {
    statusCode,
    headers: headers || getCorsHeaders(),
    body: JSON.stringify(body),
  };
}

/**
 * Create a CORS preflight response
 */
export function createCorsPreflightResponse(): HttpResponse {
  return {
    statusCode: 200,
    headers: getCorsHeaders(),
    body: '',
  };
}

