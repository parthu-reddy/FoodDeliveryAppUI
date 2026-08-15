import { env } from './env';
import { commonZodiosConfig, authPlugin } from './zodiosConfig';

// Import the generated client creators
import { createApiClient as createCampaignApi } from '../api/generated/schemas/campaign';
import { createApiClient as createChatApi } from '../api/generated/schemas/chat';
import { createApiClient as createCustomerApi } from '../api/generated/schemas/customer';
import { createApiClient as createDeliveryApi } from '../api/generated/schemas/delivery';
import { createApiClient as createGovernmentIdApi } from '../api/generated/schemas/governmentId';
import { createApiClient as createIdentityApi } from '../api/generated/schemas/identity';
import { createApiClient as createLedgerApi } from '../api/generated/schemas/ledger';
import { createApiClient as createMapsApi } from '../api/generated/schemas/maps';
import { createApiClient as createPaymentApi } from '../api/generated/schemas/payment';
import { createApiClient as createRestaurantApi } from '../api/generated/schemas/restaurant';
import { createApiClient as createTrackingApi } from '../api/generated/schemas/tracking';
import { createApiClient as createWalletApi } from '../api/generated/schemas/wallet';
import { adminApiDef } from '../api/manual-schemas/admin';
import { Zodios } from '@zodios/core';

const BASE_URL = env.VITE_API_BASE_URL || '';

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
const clients = [
  campaignApi, chatApi, customerApi, deliveryApi, governmentIdApi, identityApi,
  ledgerApi, mapsApi, paymentApi, restaurantApi, trackingApi, walletApi, adminApi
];

clients.forEach(client => {
  client.use(authPlugin);
});
