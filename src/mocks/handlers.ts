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
  
  // `success` is REQUIRED, not decoration. `apiGet` in menuStore unwraps with
  //   json?.success !== undefined ? json.data : json
  // so a mock without it returns the whole body as `data`, making `brands` an object and
  // throwing `brands.some is not a function` on the restaurant dashboard. This mock lacked it,
  // so the restaurant role was unusable in local dev; the deployed API sends the envelope.
  http.get('*/api/v1/brands', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', name: 'Spicy Kitchen', kycStatus: 'APPROVED', pennyDropStatus: 'APPROVED' },
        { id: '2', name: 'Burger Joint', kycStatus: 'APPROVED', pennyDropStatus: 'APPROVED' },
      ],
    });
  }),
];
