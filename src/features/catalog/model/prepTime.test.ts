import { describe, it, expect } from 'vitest';
import { outletPrepMinutes, stepPrepMinutes } from './prepTime';

describe('outletPrepMinutes', () => {
  it('turns seconds into whole minutes, rounding up', () => {
    expect(outletPrepMinutes(1500)).toBe(25);
    expect(outletPrepMinutes(1230)).toBe(21);
  });
  it('never shows less than the 15-minute floor orders are promised', () => {
    expect(outletPrepMinutes(300)).toBe(15);
  });
  it('is null when there is no usable value', () => {
    expect(outletPrepMinutes(undefined)).toBeNull();
    expect(outletPrepMinutes(0)).toBeNull();
    expect(outletPrepMinutes(Number.NaN)).toBeNull();
  });
});

describe('stepPrepMinutes', () => {
  it('moves in fives and stays within 15..90', () => {
    expect(stepPrepMinutes(25, 1)).toBe(30);
    expect(stepPrepMinutes(15, -1)).toBe(15);
    expect(stepPrepMinutes(90, 1)).toBe(90);
  });
});
