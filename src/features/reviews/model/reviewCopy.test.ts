import { describe, expect, it } from 'vitest';
import { authorLabel, isAlreadyReviewed, reviewRejectionCopy } from './reviewCopy';

describe('reviewRejectionCopy', () => {
  it('translates every reason the service can send', () => {
    // Mirrors ReviewRejectionReason. If the service gains a value and this list is not updated,
    // the last assertion here is what catches it -- an unmapped reason falls through to the generic
    // sentence, which is a silent downgrade rather than a crash.
    const reasons = [
      'ORDER_NOT_FOUND',
      'NOT_YOUR_ORDER',
      'ORDER_NOT_DELIVERED',
      'REVIEW_WINDOW_CLOSED',
      'TARGET_NOT_ON_ORDER',
      'ALREADY_REVIEWED',
      'DUPLICATE_ENTRY',
    ];

    const generic = reviewRejectionCopy('SOMETHING_NEW');
    for (const reason of reasons) {
      expect(reviewRejectionCopy(reason)).not.toBe(generic);
      expect(reviewRejectionCopy(reason).length).toBeGreaterThan(0);
    }
  });

  it('falls back rather than showing an enum name', () => {
    expect(reviewRejectionCopy(undefined)).not.toContain('_');
    expect(reviewRejectionCopy('WHAT_IS_THIS')).not.toContain('WHAT_IS_THIS');
  });

  it('says plainly that a review cannot be changed', () => {
    expect(reviewRejectionCopy('ALREADY_REVIEWED')).toMatch(/can't be changed|cannot be changed/i);
  });
});

describe('isAlreadyReviewed', () => {
  it('is true only for the already-reviewed code', () => {
    expect(isAlreadyReviewed('ALREADY_REVIEWED')).toBe(true);
    expect(isAlreadyReviewed('REVIEW_WINDOW_CLOSED')).toBe(false);
    expect(isAlreadyReviewed(undefined)).toBe(false);
  });
});

describe('authorLabel', () => {
  it('uses the name the server chose to send', () => {
    expect(authorLabel('Priya R.')).toBe('Priya R.');
  });

  it('stands in neutrally when the author is withheld', () => {
    // Driver reviews arrive with authorDisplayName null by design -- a driver must not be able to
    // attach a rating to the customer whose address they know.
    expect(authorLabel(null)).toBe('A customer');
    expect(authorLabel('   ')).toBe('A customer');
    expect(authorLabel(undefined)).toBe('A customer');
  });
});
