import { describe, expect, it } from 'vitest';
import { userLookup } from './userLookup';

// The admin search box says "User ID / Phone". Every query went to GET /users/:id, which takes
// only a UUID, so support could never find a customer by the number they sign in with.
describe('userLookup', () => {
  it('sends a UUID to the id lookup', () => {
    expect(userLookup(' 3f2c1b9a-8d7e-4f6a-9b0c-1d2e3f4a5b6c ')).toEqual({ kind: 'id', id: '3f2c1b9a-8d7e-4f6a-9b0c-1d2e3f4a5b6c' });
  });

  it('sends a phone number as the 10 digits the login stores', () => {
    expect(userLookup('8000000001')).toEqual({ kind: 'phone', phone: '8000000001' });
    expect(userLookup('80000 00001')).toEqual({ kind: 'phone', phone: '8000000001' });
    expect(userLookup('+91 80000-00001')).toEqual({ kind: 'phone', phone: '8000000001' });
    expect(userLookup('918000000001')).toEqual({ kind: 'phone', phone: '8000000001' });
  });

  it('looks nothing up for a query that is neither', () => {
    expect(userLookup('')).toBeNull();
    expect(userLookup('800000')).toBeNull();
    expect(userLookup('priya')).toBeNull();
    expect(userLookup('3f2c1b9a')).toBeNull();
  });
});
