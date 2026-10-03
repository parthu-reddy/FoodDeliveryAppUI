import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_user } from './user_controller';
import { createApiClient as create_adminUser } from './admin_user_controller';
import { createApiClient as create_organisation } from './organisation_controller';
import { createApiClient as create_organisationInvitation } from './organisation_invitation_controller';
import { createApiClient as create_auth } from './auth_controller';
import { createApiClient as create_adminOrganisation } from './admin_organisation_controller';
import { createApiClient as create_internalUserOrganisations } from './internal_user_organisations_controller';
import { createApiClient as create_internalOrganisation } from './internal_organisation_controller';
import { createApiClient as create_adminAudit } from './admin_audit_controller';

export function createIdentityFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  user: create_user(baseUrl, options),
  adminUser: create_adminUser(baseUrl, options),
  organisation: create_organisation(baseUrl, options),
  organisationInvitation: create_organisationInvitation(baseUrl, options),
  auth: create_auth(baseUrl, options),
  adminOrganisation: create_adminOrganisation(baseUrl, options),
  internalUserOrganisations: create_internalUserOrganisations(baseUrl, options),
  internalOrganisation: create_internalOrganisation(baseUrl, options),
  adminAudit: create_adminAudit(baseUrl, options),
  };
}
