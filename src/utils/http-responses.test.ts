import { describe, it, expect } from 'vitest';
import {
  getCorsHeaders,
  createSuccessResponse,
  createErrorResponse,
  createCorsPreflightResponse,
} from './http-responses.js';

describe('getCorsHeaders', () => {
  it('should return standard CORS headers', () => {
    const headers = getCorsHeaders();
    
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    });
  });

  it('should return a new object each time (not shared reference)', () => {
    const headers1 = getCorsHeaders();
    const headers2 = getCorsHeaders();
    
    expect(headers1).toEqual(headers2);
    expect(headers1).not.toBe(headers2); // Different objects
  });
});

describe('createSuccessResponse', () => {
  it('should create a 200 response with JSON body', () => {
    const data = { status: 'pass', gameUrl: 'https://example.com' };
    const response = createSuccessResponse(data);
    
    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual(getCorsHeaders());
    expect(JSON.parse(response.body)).toEqual(data);
  });

  it('should stringify complex objects', () => {
    const data = {
      status: 'pass',
      screenshots: [{ url: 'https://example.com/img.png' }],
      duration: 1234,
    };
    const response = createSuccessResponse(data);
    
    expect(JSON.parse(response.body)).toEqual(data);
  });

  it('should use custom headers if provided', () => {
    const customHeaders = { 'X-Custom-Header': 'value' };
    const response = createSuccessResponse({}, customHeaders);
    
    expect(response.headers).toEqual(customHeaders);
    expect(response.headers).not.toEqual(getCorsHeaders());
  });

  it('should handle null and undefined data', () => {
    expect(() => createSuccessResponse(null)).not.toThrow();
    expect(() => createSuccessResponse(undefined)).not.toThrow();
  });
});

describe('createErrorResponse', () => {
  it('should create an error response with status code and error message', () => {
    const response = createErrorResponse(400, 'Bad request');
    
    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual(getCorsHeaders());
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Bad request');
    expect(body.details).toBeUndefined();
  });

  it('should include details if provided', () => {
    const response = createErrorResponse(400, 'Bad request', 'Invalid JSON');
    
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Bad request');
    expect(body.details).toBe('Invalid JSON');
  });

  it('should work with different status codes', () => {
    const codes = [400, 401, 403, 404, 500, 502, 503];
    
    for (const code of codes) {
      const response = createErrorResponse(code, 'Error message');
      expect(response.statusCode).toBe(code);
    }
  });

  it('should use custom headers if provided', () => {
    const customHeaders = { 'X-Custom-Header': 'value' };
    const response = createErrorResponse(400, 'Error', undefined, customHeaders);
    
    expect(response.headers).toEqual(customHeaders);
  });

  it('should handle empty error message', () => {
    const response = createErrorResponse(500, '');
    const body = JSON.parse(response.body);
    expect(body.error).toBe('');
  });
});

describe('createCorsPreflightResponse', () => {
  it('should create a 200 response with empty body', () => {
    const response = createCorsPreflightResponse();
    
    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual(getCorsHeaders());
    expect(response.body).toBe('');
  });

  it('should include all CORS headers', () => {
    const response = createCorsPreflightResponse();
    
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
    expect(response.headers['Access-Control-Allow-Headers']).toBe('Content-Type');
  });
});

