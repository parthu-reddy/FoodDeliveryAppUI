import { MatchersV3, PactV3 } from '@pact-foundation/pact';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

const { string, boolean } = MatchersV3;

const provider = new PactV3({
  consumer: 'FoodDeliveryAppUI',
  provider: 'IdentityService',
});

describe('IdentityService API API Contract', () => {
  describe('POST /api/v1/internal/auth/initiate', () => {
    it('returns a successful response for valid phone number', async () => {
      provider
        .uponReceiving('a request to initiate login')
        .withRequest({
          method: 'POST',
          path: '/api/v1/internal/auth/initiate',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            phoneNumber: '1234567890',
            serviceName: 'CUSTOMER',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: boolean(true),
            message: string('OTP sent successfully'),
          },
        });

      await provider.executeTest(async (mockserver) => {
        const api = axios.create({ baseURL: mockserver.url });
        const response = await api.post('/api/v1/internal/auth/initiate', {
          phoneNumber: '1234567890',
          serviceName: 'CUSTOMER',
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.message).toBe('OTP sent successfully');
      });
    });
  });
});
