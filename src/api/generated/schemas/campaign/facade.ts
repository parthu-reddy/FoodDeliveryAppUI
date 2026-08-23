import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_advertiserPortal } from './advertiser_portal_controller';
import { createApiClient as create_campaign } from './campaign_controller';
import { createApiClient as create_internalCampaign } from './internal_campaign_controller';

export function createCampaignFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  campaign: create_campaign(baseUrl, options),
  internalCampaign: create_internalCampaign(baseUrl, options),
  advertiserPortal: create_advertiserPortal(baseUrl, options),
  };
}
