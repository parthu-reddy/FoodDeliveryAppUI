import { http, HttpResponse } from 'msw';
import { env } from '../lib/env';

// This is where you mock your API responses using the actual schemas.
// Example: if the frontend asks for the dashboard profile, we can intercept and return a 200 OK.

export const handlers = [
  http.get(`${env.VITE_API_GATEWAY_URL}/api/v1/identity/users/me/profile`, ({ request }) => {
    // Assert headers if you want (e.g. MSW can verify X-Calling-Service is present!)
    const callingService = request.headers.get('X-Calling-Service');
    if (!callingService) {
      return new HttpResponse(null, { status: 403, statusText: 'Forbidden: Missing Calling Service' });
    }

    return HttpResponse.json({
      success: true,
      data: {
        id: 'mock-user-123',
        phone: '+1234567890',
        name: 'Mock User',
        email: 'mock@example.com',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        isProfileComplete: true,
        createdAt: new Date().toISOString()
      }
    });
  }),
  
  http.get('*/api/v1/brands', () => {
    return HttpResponse.json([
      { id: '1', name: 'Spicy Kitchen' },
      { id: '2', name: 'Burger Joint' }
    ]);
  }),
];
