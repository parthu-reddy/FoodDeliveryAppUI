/**
 * Narrows a response the OpenAPI contract leaves untyped.
 *
 * A handful of controllers are declared as `ResponseEntity<Object>`, `ResponseEntity<Map<...>>`
 * or `ApiResponse<Object>`, so springdoc emits a bare `object` schema and the generated Zod client
 * types the response as `{}`. The payload has a real shape at runtime; the contract just does not
 * describe it.
 *
 * This exists so those places are explicit and greppable rather than scattered `as any` casts, and
 * so the list shrinks as controllers gain real return types. It is deliberately not a general
 * escape hatch: every call site is a backend contract gap that should eventually disappear.
 *
 * @see RandomDocuments/CoreServicesReview_2026-08-22 — "untyped controller responses"
 */
export function asUntyped<T>(response: unknown): T {
  return response as T;
}

/** Shape of a Spring `Page<T>` as it appears on the wire. */
export interface WirePage<T> {
  content?: T[];
  totalPages?: number;
  totalElements?: number;
  number?: number;
  size?: number;
}

/**
 * Assigns a contract-derived payload to the app's own mirror interface.
 *
 * openapi-zod-client emits `.passthrough()` schemas, so an inferred response type carries an index
 * signature that TypeScript will not assign to a stricter hand-written interface even when the
 * fields line up. The underlying problem is the duplicate: the app declares its own
 * `WalletTransaction`, `Campaign` and so on alongside the generated ones.
 *
 * Use this at the boundary, and prefer deleting the local interface in favour of the generated
 * type when touching one of these files. Every call site is a type maintained in two places.
 */
export function fromContract<T>(payload: unknown): T {
  return payload as T;
}
