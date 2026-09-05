import { describe, it, expect } from 'vitest';
import { toPaise, formatINR, sumPaise, pctOf } from './format';

describe('format', () => {
  describe('toPaise', () => {
    it('handles integers', () => {
      expect(toPaise(100)).toBe(10000);
    });

    it('handles floats without artefacts', () => {
      // 0.1 + 0.2 = 0.30000000000000004
      expect(toPaise(0.1 + 0.2)).toBe(30);
    });

    it('handles strings (parse round-trip)', () => {
      expect(toPaise('123.45')).toBe(12345);
      expect(toPaise('0.00')).toBe(0);
    });

    it('handles null and undefined', () => {
      expect(toPaise(null)).toBe(0);
      expect(toPaise(undefined)).toBe(0);
    });

    it('handles negative integers', () => {
      expect(toPaise(-100)).toBe(-10000);
    });

    it('handles negative floats', () => {
      expect(toPaise(-0.5)).toBe(-50);
    });

    it('handles NaN', () => {
      expect(toPaise(NaN)).toBe(0);
    });

    it('handles large numbers', () => {
      expect(toPaise(1000000)).toBe(100000000);
    });
  });

  describe('formatINR', () => {
    it('formats positive values', () => {
      expect(formatINR(12345678)).toBe('₹1,23,456.78');
    });

    it('formats negative values', () => {
      // Different node versions might produce slightly different whitespace in Intl output
      // so we normalize spaces before checking, or just use regex.
      const formatted = formatINR(-12345678).replace(/\s/g, '');
      expect(formatted).toBe('-₹1,23,456.78');
    });

    it('applies compact notation', () => {
      expect(formatINR(12000000, { compact: true }).replace(/\s/g, '')).toBe('₹1.2L');
    });

    it('applies sign rules', () => {
      expect(formatINR(1000, { sign: 'always' }).replace(/\s/g, '')).toBe('+₹10.00');
      expect(formatINR(-1000, { sign: 'never' }).replace(/\s/g, '')).toBe('₹10.00');
    });
  });

  describe('sumPaise', () => {
    it('sums correctly', () => {
      expect(sumPaise(100, 200, undefined, 300)).toBe(600);
    });
  });

  describe('pctOf', () => {
    it('calculates percentage correctly', () => {
      expect(pctOf(1000, 0.18)).toBe(180);
    });

    it('calculates 0 percentage', () => {
      expect(pctOf(1000, 0)).toBe(0);
    });

    it('calculates 100 percentage', () => {
      expect(pctOf(1000, 1)).toBe(1000);
    });

    it('calculates small percentage', () => {
      expect(pctOf(1000, 0.01)).toBe(10);
    });

    it('rounds percentage correctly', () => {
      expect(pctOf(1000, 0.185)).toBe(185);
    });
    
    it('handles negative amount', () => {
      expect(pctOf(-1000, 0.18)).toBe(-180);
    });

    it('handles zero amount', () => {
      expect(pctOf(0, 0.18)).toBe(0);
    });
  });
});
