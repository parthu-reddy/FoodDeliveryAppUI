import { describe, expect, it } from 'vitest';
import { restaurantApi } from '../lib/zodiosClients';

describe('MSW API Interception', () => {
  it('intercepts Zodios requests with mocked responses', async () => {
    // This should hit our MSW handler defined in src/mocks/handlers.ts
    const response = await restaurantApi.restaurantOnboarding.getBrands();
    
    // We mocked it to return 2 fake brands
    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBe(2);
    expect(response[0].name).toBe('Spicy Kitchen');
  });
});
