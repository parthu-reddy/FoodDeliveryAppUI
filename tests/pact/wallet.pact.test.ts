import { MatchersV3, PactV3 } from '@pact-foundation/pact';
import axios from 'axios';
import { describe, expect, it } from 'vitest';

const { string, decimal, uuid } = MatchersV3;

const provider = new PactV3({
  consumer: 'FoodDeliveryAppUI',
  provider: 'WalletService',
});

/**
 * Mirrors WalletController.getWallet: GET /api/v1/wallets/{entityType}/{entityId}, returning a
 * bare WalletDto.
 *
 * The previous version of this file asserted `GET /api/v1/wallets/balance` wrapped in a
 * {success, message, data} envelope. WalletService has never exposed that route and does not use
 * that envelope here, and no UI code called it -- every real caller
 * (RiderSettingsView, SharedSettingsView, CampaignManagement) uses
 * `/api/v1/wallets/:entityType/:entityId`. It was a fabricated contract that read as coverage,
 * which is exactly the risk gap G-5 describes: consumer pacts generated and never verified
 * against a provider.
 */
describe('WalletService API Contract', () => {
  describe('GET /api/v1/wallets/{entityType}/{entityId}', () => {
    it('returns the wallet for an entity', async () => {
      const entityId = '123e4567-e89b-12d3-a456-426614174000';

      provider
        .uponReceiving('a request to get a wallet by entity')
        .withRequest({
          method: 'GET',
          path: `/api/v1/wallets/CUSTOMER/${entityId}`,
          headers: {
            // the controller 403s when X-User-Id disagrees with the path entityId
            'X-User-Id': string(entityId),
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: uuid('7a1d5e90-3c22-4b6f-8a11-9d4c2e77b501'),
            entityId: uuid(entityId),
            entityType: string('CUSTOMER'),
            balance: decimal(1000.5),
            currency: string('INR'),
            status: string('ACTIVE'),
          },
        });

      await provider.executeTest(async (mockserver) => {
        const api = axios.create({ baseURL: mockserver.url });
        const response = await api.get(`/api/v1/wallets/CUSTOMER/${entityId}`, {
          headers: { 'X-User-Id': entityId },
        });

        expect(response.status).toBe(200);
        expect(response.data.entityId).toBe(entityId);
        expect(response.data.currency).toBe('INR');
        expect(typeof response.data.balance).toBe('number');
      });
    });
  });
});
