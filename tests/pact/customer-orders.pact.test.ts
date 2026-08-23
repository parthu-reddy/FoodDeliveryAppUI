import { MatchersV3, PactV3 } from '@pact-foundation/pact';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

const { string, boolean, eachLike, number, uuid } = MatchersV3;

const provider = new PactV3({
  consumer: 'FoodDeliveryAppUI',
  provider: 'CustomerApplication',
});

describe('CustomerApplication API Contract', () => {
  describe('GET /api/v1/orders/active', () => {
    it('returns a successful response with active orders', async () => {
      provider
        .uponReceiving('a request to get active orders')
        .withRequest({
          method: 'GET',
          path: '/api/v1/orders/active',
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
            message: string('Active orders retrieved successfully'),
            data: eachLike({
              id: uuid('123e4567-e89b-12d3-a456-426614174000'),
              status: string('PREPARING'),
              totalAmount: number(500.0),
              restaurantId: uuid('123e4567-e89b-12d3-a456-426614174001')
            }),
          },
        });

      await provider.executeTest(async (mockserver) => {
        const api = axios.create({ baseURL: mockserver.url });
        const response = await api.get('/api/v1/orders/active', {
          headers: { Authorization: 'Bearer VALID_TOKEN' }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });
  });

  describe('POST /api/v1/orders', () => {
    it('returns a successful response when placing an order', async () => {
      provider
        .uponReceiving('a request to place an order')
        .withRequest({
          method: 'POST',
          path: '/api/v1/orders',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': string('Bearer VALID_TOKEN'),
          },
          body: {
            restaurantId: '123e4567-e89b-12d3-a456-426614174001',
            items: [
              {
                menuItemId: '123e4567-e89b-12d3-a456-426614174002',
                quantity: 2
              }
            ],
            deliveryAddress: '123 Main St',
            deliveryLat: 12.9716,
            deliveryLng: 77.5946
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: boolean(true),
            message: string('Order placed successfully'),
            data: {
              id: uuid('123e4567-e89b-12d3-a456-426614174000'),
              status: string('CREATED')
            }
          },
        });

      await provider.executeTest(async (mockserver) => {
        const api = axios.create({ baseURL: mockserver.url });
        const response = await api.post('/api/v1/orders', {
          restaurantId: '123e4567-e89b-12d3-a456-426614174001',
          items: [
            {
              menuItemId: '123e4567-e89b-12d3-a456-426614174002',
              quantity: 2
            }
          ],
          deliveryAddress: '123 Main St',
          deliveryLat: 12.9716,
          deliveryLng: 77.5946
        }, {
          headers: { Authorization: 'Bearer VALID_TOKEN' }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });
  });
});
