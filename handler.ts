// AWS Lambda handler for API Gateway
// Handles HTTP requests and executes QA tests

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { runQATest } from './src/qa-agent.js';
import { getErrorMessage } from './src/utils/errors.js';
import {
  getCorsHeaders,
  createSuccessResponse,
  createErrorResponse,
  createCorsPreflightResponse,
} from './src/utils/http-responses.js';

/**
 * Lambda handler for API Gateway
 * Expects POST request with JSON body: { "gameUrl": "https://example.com" }
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createCorsPreflightResponse();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method not allowed. Use POST.');
  }

  try {
    // Parse request body
    let gameUrl: string;
    
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      gameUrl = body.gameUrl;
      
      if (!gameUrl || typeof gameUrl !== 'string') {
        return createErrorResponse(
          400,
          'Missing or invalid gameUrl in request body',
          JSON.stringify({ example: { gameUrl: 'https://example.com' } })
        );
      }
    } catch (parseError) {
      return createErrorResponse(
        400,
        'Invalid JSON in request body',
        getErrorMessage(parseError)
      );
    }

    // Run QA test
    const result = await runQATest(gameUrl);

    // Return result
    return createSuccessResponse(result);
  } catch (error) {
    // Handle unexpected errors
    console.error('Lambda handler error:', error);
    
    return createErrorResponse(
      500,
      'Internal server error',
      getErrorMessage(error)
    );
  }
};

