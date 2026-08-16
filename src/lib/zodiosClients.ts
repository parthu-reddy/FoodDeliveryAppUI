import { env } from './env';
import { commonZodiosConfig, authPlugin } from './zodiosConfig';

// Import the generated client creators
import { createCampaignFacade as createCampaignApi } from '../api/generated/schemas/campaign/facade';
import { createChatFacade as createChatApi } from '../api/generated/schemas/chat/facade';
import { createCustomerFacade as createCustomerApi } from '../api/generated/schemas/customer/facade';
import { createDeliveryFacade as createDeliveryApi } from '../api/generated/schemas/delivery/facade';
import { createGovernmentIdFacade as createGovernmentIdApi } from '../api/generated/schemas/governmentId/facade';
import { createIdentityFacade as createIdentityApi } from '../api/generated/schemas/identity/facade';
import { createLedgerFacade as createLedgerApi } from '../api/generated/schemas/ledger/facade';
import { createMapsFacade as createMapsApi } from '../api/generated/schemas/maps/facade';
import { createPaymentFacade as createPaymentApi } from '../api/generated/schemas/payment/facade';
import { createRestaurantFacade as createRestaurantApi } from '../api/generated/schemas/restaurant/facade';
import { createTrackingFacade as createTrackingApi } from '../api/generated/schemas/tracking/facade';
import { createWalletFacade as createWalletApi } from '../api/generated/schemas/wallet/facade';
import { adminApiDef } from '../api/manual-schemas/admin';
import { Zodios } from '@zodios/core';

const BASE_URL = env.VITE_API_BASE_URL || window.location.origin;

// Create all 12 API clients
export const campaignApi = createCampaignApi(BASE_URL, commonZodiosConfig);
export const chatApi = createChatApi(BASE_URL, commonZodiosConfig);
export const customerApi = createCustomerApi(BASE_URL, commonZodiosConfig);
export const deliveryApi = createDeliveryApi(BASE_URL, commonZodiosConfig);
export const governmentIdApi = createGovernmentIdApi(BASE_URL, commonZodiosConfig);
export const identityApi = createIdentityApi(BASE_URL, commonZodiosConfig);
export const ledgerApi = createLedgerApi(BASE_URL, commonZodiosConfig);
export const mapsApi = createMapsApi(BASE_URL, commonZodiosConfig);
export const paymentApi = createPaymentApi(BASE_URL, commonZodiosConfig);
export const restaurantApi = createRestaurantApi(BASE_URL, commonZodiosConfig);
export const trackingApi = createTrackingApi(BASE_URL, commonZodiosConfig);
export const walletApi = createWalletApi(BASE_URL, commonZodiosConfig);
export const adminApi = new Zodios(BASE_URL, adminApiDef, commonZodiosConfig);

// Register the authentication and device headers plugin for all clients
const facades = [
  campaignApi, chatApi, customerApi, deliveryApi, governmentIdApi, identityApi,
  ledgerApi, mapsApi, paymentApi, restaurantApi, trackingApi, walletApi
];

facades.forEach(facade => {
  Object.values(facade).forEach((client: any) => {
    if (client && typeof client.use === 'function') {
      client.use(authPlugin);
    }
  });
});

if (adminApi && typeof adminApi.use === 'function') {
  adminApi.use(authPlugin);
}
