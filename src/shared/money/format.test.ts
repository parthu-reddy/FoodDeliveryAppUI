import { describe, it, expect } from 'vitest';
import { roundRupees, formatINR, sumRupees, pctOf } from './format';

/**
 * The unit is rupees, matching what the API sends: DECIMAL(10,2) columns serialised as JSON
 * numbers. The previous suite pinned an integer-paise convention that nothing on the wire used,
 * so it stayed green while every amount in the app rendered at a hundredth of its value.
 */
describe('format', () => {
  describe('roundRupees', () => {
    it('leaves whole rupees alone', () => {
      expect(roundRupees(100)).toBe(100);
    });

    it('kills float artefacts', () => {
      // 0.1 + 0.2 = 0.30000000000000004
      expect(roundRupees(0.1 + 0.2)).toBe(0.3);
    });

    it('rounds to whole paise', () => {
      expect(roundRupees(12.345)).toBe(12.35);
      expect(roundRupees(12.344)).toBe(12.34);
    });

    it('parses strings', () => {
      expect(roundRupees('123.45')).toBe(123.45);
      expect(roundRupees('0.00')).toBe(0);
    });

    it('treats null, undefined and nonsense as zero', () => {
      expect(roundRupees(null)).toBe(0);
      expect(roundRupees(undefined)).toBe(0);
      expect(roundRupees('not a number')).toBe(0);
    });

    it('handles negatives', () => {
      expect(roundRupees(-100)).toBe(-100);
      expect(roundRupees(-0.005)).toBe(-0.01);
    });
  });

  describe('formatINR', () => {
    /** The regression that mattered: a 450.00 order total is ₹450.00, not ₹4.50. */
    it('renders an API amount at its real value', () => {
      expect(formatINR(450.00)).toBe('₹450.00');
      expect(formatINR(43.00)).toBe('₹43.00');
    });

    it('renders paise', () => {
      expect(formatINR(1.5)).toBe('₹1.50');
      expect(formatINR(0.05)).toBe('₹0.05');
    });

    it('groups in the Indian system', () => {
      // 12,34,567 rather than 1,234,567
      expect(formatINR(1234567)).toBe('₹12,34,567.00');
    });

    it('renders zero and nullish as zero', () => {
      expect(formatINR(0)).toBe('₹0.00');
      expect(formatINR(null)).toBe('₹0.00');
      expect(formatINR(undefined)).toBe('₹0.00');
    });

    it('renders negatives', () => {
      expect(formatINR(-250.5)).toBe('-₹250.50');
    });

    it("drops the minus with sign: 'never'", () => {
      expect(formatINR(-250.5, { sign: 'never' })).toBe('₹250.50');
    });

    it("adds a plus with sign: 'always', but not for zero", () => {
      expect(formatINR(250.5, { sign: 'always' })).toBe('+₹250.50');
      expect(formatINR(0, { sign: 'always' })).toBe('₹0.00');
    });

    it('compacts large amounts', () => {
      expect(formatINR(1500000, { compact: true })).toMatch(/₹/);
    });

    it('never uses a dollar sign', () => {
      expect(formatINR(99.99)).not.toContain('$');
    });
  });

  describe('sumRupees', () => {
    it('adds without drifting', () => {
      expect(sumRupees(0.1, 0.2)).toBe(0.3);
      expect(sumRupees(19.99, 5.01, 0.5)).toBe(25.5);
    });

    it('skips nullish values', () => {
      expect(sumRupees(10, null, undefined, 5)).toBe(15);
    });

    it('sums nothing to zero', () => {
      expect(sumRupees()).toBe(0);
    });
  });

  describe('pctOf', () => {
    it('takes a share and rounds to paise', () => {
      expect(pctOf(200, 0.5)).toBe(100);
      expect(pctOf(33.33, 0.18)).toBe(6);
    });

    it('takes nothing from zero', () => {
      expect(pctOf(0, 0.18)).toBe(0);
    });
  });
});
