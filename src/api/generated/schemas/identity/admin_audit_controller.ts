import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { SortObject } from "./common";
import { PageableObject } from "./common";

export const AuditEvent = z
  .object({
    id: z.string().uuid(),
    occurredAt: z.string().datetime({ offset: true }),
    actorUserId: z.string().uuid(),
    actorKind: z.string(),
    action: z.enum([
      "ORGANISATION_CREATED",
      "ORGANISATION_RENAMED",
      "ORGANISATION_SUSPENDED",
      "ORGANISATION_REINSTATED",
      "ORGANISATION_CLOSED",
      "MEMBER_INVITED",
      "INVITATION_ACCEPTED",
      "INVITATION_DECLINED",
      "INVITATION_REVOKED",
      "INVITATION_EXPIRED",
      "MEMBER_ROLE_CHANGED",
      "MEMBER_REMOVED",
      "OWNERSHIP_TRANSFERRED",
      "APPLICATION_SUBMITTED",
      "APPLICATION_APPROVED",
      "APPLICATION_REJECTED",
      "APPLICATION_SUSPENDED",
      "APPLICATION_REINSTATED",
      "KYC_DOCUMENT_VIEWED",
      "ADMIN_STEP_UP",
      "TOPUP_REQUESTED",
      "TOPUP_SETTLED",
      "TOPUP_FAILED",
      "CREATIVE_APPROVED",
      "CREATIVE_REJECTED",
      "CAMPAIGN_ACTIVATED",
      "CAMPAIGN_PAUSED",
    ]),
    subjectType: z.string(),
    subjectId: z.string().uuid(),
    organisationId: z.string().uuid(),
    reason: z.string(),
    traceId: z.string(),
    details: z.record(z.object({}).partial().passthrough()),
  })
  .partial()
  .passthrough();
export const SliceAuditEvent = z
  .object({
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(AuditEvent),
    sort: SortObject,
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();

export const schemas = {
  AuditEvent,
  SliceAuditEvent,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/admin/audit-events",
    alias: "history",
    requestFormat: "json",
    parameters: [
      {
        name: "subjectType",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "subjectId",
        type: "Query",
        schema: z.string().uuid(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
    ],
    response: SliceAuditEvent,
  },
]);

export const Admin_audit_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
