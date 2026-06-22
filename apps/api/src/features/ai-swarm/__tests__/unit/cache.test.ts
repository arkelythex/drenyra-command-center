/**
 * Cache Tests
 *
 * @module ai-swarm/__tests__/unit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentCache } from '../../tools/cache';

describe('AgentCache', () => {
  let cache: AgentCache;

  beforeEach(() => {
    cache = new AgentCache({ maxSize: 10, defaultTtl: 1000 });
  });

  describe('get/set', () => {
    it('should cache and retrieve data', () => {
      const input = { ruc: '20100070970', total: 100 };
      const output = { isValid: true };

      cache.set('sunat', input, output, 0.001);

      const cached = cache.get('sunat', input);

      expect(cached).toEqual(output);
    });

    it('should return null for cache miss', () => {
      const input = { ruc: '20100070970', total: 100 };

      const cached = cache.get('sunat', input);

      expect(cached).toBeNull();
    });

    it('should generate different keys for different inputs', () => {
      const input1 = { ruc: '20100070970', total: 100 };
      const input2 = { ruc: '20100070970', total: 200 };

      cache.set('sunat', input1, { result: 1 }, 0.001);
      cache.set('sunat', input2, { result: 2 }, 0.001);

      const cached1 = cache.get('sunat', input1);
      const cached2 = cache.get('sunat', input2);

      expect(cached1).toEqual({ result: 1 });
      expect(cached2).toEqual({ result: 2 });
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      const input = { ruc: '20100070970' };
      const output = { isValid: true };

      cache.set('sunat', input, output, 0.001, 100); // 100ms TTL

      // Should be cached immediately
      expect(cache.get('sunat', input)).toEqual(output);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      expect(cache.get('sunat', input)).toBeNull();
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      const cache = new AgentCache({ maxSize: 3 });

      cache.set('agent', { id: 1 }, 'data1', 0.001);
      cache.set('agent', { id: 2 }, 'data2', 0.001);
      cache.set('agent', { id: 3 }, 'data3', 0.001);

      // Cache is now full (3/3)
      expect(cache.getStats().size).toBe(3);

      // Add 4th entry, should evict oldest
      cache.set('agent', { id: 4 }, 'data4', 0.001);

      expect(cache.getStats().size).toBe(3);
      expect(cache.get('agent', { id: 1 })).toBeNull(); // Evicted
      expect(cache.get('agent', { id: 4 })).toBe('data4'); // New entry
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', () => {
      const input = { ruc: '20100070970' };

      cache.set('sunat', input, { isValid: true }, 0.001);

      cache.get('sunat', input); // Hit
      cache.get('sunat', input); // Hit
      cache.get('sunat', { ruc: 'other' }); // Miss

      const stats = cache.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.666, 2);
    });

    it('should track cost savings', () => {
      cache.set('ocr', { id: 1 }, 'data', 0.01);
      cache.set('pcge', { id: 2 }, 'data', 0.001);

      const stats = cache.getStats();

      expect(stats.totalSavingsUsd).toBeCloseTo(0.011, 3);
    });
  });

  describe('clear', () => {
    it('should clear all entries and stats', () => {
      cache.set('agent', { id: 1 }, 'data', 0.001);
      cache.get('agent', { id: 1 });

      cache.clear();

      const stats = cache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });
});
