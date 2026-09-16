import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_campaign } from './campaign_controller';
import { createApiClient as create_adGroup } from './ad_group_controller';
import { createApiClient as create_adCreative } from './ad_creative_controller';
import { createApiClient as create_internalCampaign } from './internal_campaign_controller';
import { createApiClient as create_advertiser } from './advertiser_controller';
import { createApiClient as create_internalAdvertiser } from './internal_advertiser_controller';

export function createCampaignFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  campaign: create_campaign(baseUrl, options),
  adGroup: create_adGroup(baseUrl, options),
  adCreative: create_adCreative(baseUrl, options),
  internalCampaign: create_internalCampaign(baseUrl, options),
  advertiser: create_advertiser(baseUrl, options),
  internalAdvertiser: create_internalAdvertiser(baseUrl, options),
  };
}
