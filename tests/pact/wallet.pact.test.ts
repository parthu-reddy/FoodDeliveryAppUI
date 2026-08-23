import { MatchersV3, PactV3 } from '@pact-foundation/pact';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

const { string, boolean, number, uuid } = MatchersV3;

const provider = new PactV3({
  consumer: 'FoodDeliveryAppUI',
  provider: 'WalletService',
});

describe('WalletService API Contract', () => {
  describe('GET /api/v1/wallets/balance', () => {
    it('returns a successful response with wallet balance', async () => {
      provider
        .uponReceiving('a request to get wallet balance')
        .withRequest({
          method: 'GET',
          path: '/api/v1/wallets/balance',
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
            message: string('Balance retrieved successfully'),
            data: {
              walletId: uuid('123e4567-e89b-12d3-a456-426614174000'),
              balance: number(1000.50),
              currency: string('INR')
            },
          },
        });

      await provider.executeTest(async (mockserver) => {
        const api = axios.create({ baseURL: mockserver.url });
        const response = await api.get('/api/v1/wallets/balance', {
          headers: { Authorization: 'Bearer VALID_TOKEN' }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.balance).toBe(1000.50);
      });
    });
  });
});
