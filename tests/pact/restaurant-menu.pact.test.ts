import { MatchersV3, PactV3 } from '@pact-foundation/pact';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

const { string, boolean, eachLike, number, uuid } = MatchersV3;

const provider = new PactV3({
  consumer: 'FoodDeliveryAppUI',
  provider: 'RestaurantApplication',
});

describe('RestaurantApplication API Contract', () => {
  describe('GET /api/v1/brands/{id}/master-menu', () => {
    it('returns a successful response with the master menu', async () => {
      provider
        .uponReceiving('a request to get the master menu')
        .withRequest({
          method: 'GET',
          path: '/api/v1/brands/123e4567-e89b-12d3-a456-426614174000/master-menu',
          headers: {
            'Authorization': string('Bearer VALID_TOKEN'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: boolean(true),
            message: string('Master menu retrieved successfully'),
            data: eachLike({
              id: uuid('123e4567-e89b-12d3-a456-426614174001'),
              name: string('Margherita Pizza'),
              description: string('Classic cheese and tomato pizza'),
              price: number(250.0),
              isAvailable: boolean(true),
              categoryId: uuid('123e4567-e89b-12d3-a456-426614174002')
            }),
          },
        });

      await provider.executeTest(async (mockserver) => {
        const api = axios.create({ baseURL: mockserver.url });
        const response = await api.get('/api/v1/brands/123e4567-e89b-12d3-a456-426614174000/master-menu', {
          headers: { Authorization: 'Bearer VALID_TOKEN' }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });
  });
});
