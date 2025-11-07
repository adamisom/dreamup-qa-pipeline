// AWS Lambda handler for API Gateway
// Handles HTTP requests and executes QA tests

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { runQATest } from './src/qa-agent.js';
import { getErrorMessage } from './src/utils/errors.js';

/**
 * Lambda handler for API Gateway
 * Expects POST request with JSON body: { "gameUrl": "https://example.com" }
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed. Use POST.',
      }),
    };
  }

  try {
    // Parse request body
    let gameUrl: string;
    
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      gameUrl = body.gameUrl;
      
      if (!gameUrl || typeof gameUrl !== 'string') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Missing or invalid gameUrl in request body',
            example: { gameUrl: 'https://example.com' },
          }),
        };
      }
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON in request body',
          details: getErrorMessage(parseError),
        }),
      };
    }

    // Run QA test
    const result = await runQATest(gameUrl);

    // Return result
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    // Handle unexpected errors
    console.error('Lambda handler error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: getErrorMessage(error),
      }),
    };
  }
};

