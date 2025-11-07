import { describe, it, expect } from 'vitest';
import { generateGameId } from './game-id.js';

describe('generateGameId', () => {
  it('should generate a 32-character hex string', () => {
    const gameId = generateGameId('https://example.com/game');
    
    expect(gameId).toBeDefined();
    expect(typeof gameId).toBe('string');
    expect(gameId.length).toBe(32); // MD5 hash is 32 hex characters
    expect(gameId).toMatch(/^[a-f0-9]{32}$/); // Only hex characters
  });

  it('should generate the same ID for the same URL', () => {
    const url = 'https://example.com/game';
    const id1 = generateGameId(url);
    const id2 = generateGameId(url);
    
    expect(id1).toBe(id2);
  });

  it('should generate different IDs for different URLs', () => {
    const id1 = generateGameId('https://example.com/game1');
    const id2 = generateGameId('https://example.com/game2');
    
    expect(id1).not.toBe(id2);
  });

  it('should handle URLs with query parameters consistently', () => {
    const id1 = generateGameId('https://example.com/game?param=value');
    const id2 = generateGameId('https://example.com/game?param=value');
    
    expect(id1).toBe(id2);
  });

  it('should treat URLs with different query parameters as different', () => {
    const id1 = generateGameId('https://example.com/game?param=value1');
    const id2 = generateGameId('https://example.com/game?param=value2');
    
    expect(id1).not.toBe(id2);
  });

  it('should handle URLs with fragments', () => {
    const id1 = generateGameId('https://example.com/game#section');
    const id2 = generateGameId('https://example.com/game#section');
    
    expect(id1).toBe(id2);
  });

  it('should be case-sensitive for URLs', () => {
    const id1 = generateGameId('https://Example.com/Game');
    const id2 = generateGameId('https://example.com/game');
    
    expect(id1).not.toBe(id2);
  });
});

