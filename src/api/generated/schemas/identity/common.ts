import { z } from "zod";

// Schemas shared across tag files. openapi-zod-client's tag-file grouping emits a shared
// schema into neither file; this restores them. Generated -- do not edit by hand.

export const ProfileResponseDto = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
  })
  .partial()
  .passthrough();
export const ApiResponseProfileResponseDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: ProfileResponseDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const UpdateProfileRequest = z
  .object({
    name: z.string().min(0).max(100),
    email: z.string().min(0).max(255).optional(),
    phone: z
      .string()
      .min(0)
      .max(20)
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional(),
  })
  .passthrough();
export const StatusUpdateDTO = z.object({ isActive: z.boolean() }).passthrough();
export const ApiResponseString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const OrganisationView = z
  .object({
    id: z.string().uuid(),
    displayName: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
    myRole: z.enum(["OWNER", "ADMIN", "MANAGER", "STAFF"]),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
export const PageableObject = z
  .object({
    offset: z.number().int(),
    sort: SortObject.optional(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
  })
  .passthrough();
export const SliceOrganisationView = z
  .object({
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(OrganisationView),
    sort: SortObject,
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
export const Name = z
  .object({ displayName: z.string().min(0).max(120) })
  .passthrough();
export const Transfer = z.object({ userId: z.string().uuid() }).passthrough();
export const InvitationView = z
  .object({
    id: z.string().uuid(),
    organisationId: z.string().uuid(),
    phoneNumber: z.string(),
    role: z.enum(["OWNER", "ADMIN", "MANAGER", "STAFF"]),
    status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "REVOKED", "EXPIRED"]),
    expiresAt: z.string().datetime({ offset: true }),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const SliceInvitationView = z
  .object({
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(InvitationView),
    sort: SortObject,
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
export const Invite = z
  .object({
    phoneNumber: z.string().regex(/[0-9]{10}/),
    role: z.enum(["OWNER", "ADMIN", "MANAGER", "STAFF"]),
  })
  .passthrough();
export const ApiResponseVoid = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.object({}).partial().passthrough().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const RoleRequestDTO = z
  .object({
    serviceName: z
      .string()
      .min(0)
      .max(50)
      .regex(/^[A-Za-z0-9_\-]+$/),
    roleName: z
      .string()
      .min(0)
      .max(50)
      .regex(/^[A-Za-z0-9_]+$/),
  })
  .passthrough();
export const Reason = z.object({ reason: z.string().min(10).max(500) }).passthrough();
export const ChangeRole = z
  .object({ role: z.enum(["OWNER", "ADMIN", "MANAGER", "STAFF"]) })
  .passthrough();
export const MemberView = z
  .object({
    userId: z.string().uuid(),
    name: z.string(),
    phoneNumber: z.string(),
    role: z.enum(["OWNER", "ADMIN", "MANAGER", "STAFF"]),
    status: z.enum(["ACTIVE", "REMOVED"]),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const SliceMemberView = z
  .object({
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(MemberView),
    sort: SortObject,
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
export const MembershipDto = z
  .object({
    organisationId: z.string().uuid(),
    organisationStatus: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
    userId: z.string().uuid(),
    role: z.enum(["OWNER", "ADMIN", "MANAGER", "STAFF"]),
    status: z.enum(["ACTIVE", "REMOVED"]),
  })
  .passthrough();
export const SessionInfo = z
  .object({
    sessionId: z.string(),
    deviceInfo: z.string(),
    os: z.string(),
    browser: z.string(),
    lastActive: z.number().int(),
    serviceName: z.string(),
  })
  .passthrough();
export const ApiResponseListSessionInfo = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(SessionInfo).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const UserDTO = z
  .object({
    id: z.string().uuid(),
    phoneNumber: z.string(),
    roles: z.array(z.enum(["CUSTOMER", "DELIVERY", "RESTAURANT", "ADMIN"])),
    active: z.boolean().optional(),
  })
  .passthrough();
export const ApiResponseUserDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: UserDTO.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PageResponseDtoUserDTO = z
  .object({
    content: z.array(UserDTO),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    last: z.boolean(),
    size: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const ApiResponsePageResponseDtoUserDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoUserDTO.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const AdminOrganisationView = z
  .object({ organisation: OrganisationView, members: SliceMemberView })
  .partial()
  .passthrough();
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
