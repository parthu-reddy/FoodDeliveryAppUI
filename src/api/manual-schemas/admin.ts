import { z } from 'zod';

export const adminActionSchema = z.object({
  action: z.string(),
  targetId: z.string().optional(),
   
  payload: z.any().optional(),
}).passthrough();

export type AdminAction = z.infer<typeof adminActionSchema>;

export const adminMetricSchema = z.object({
  metricName: z.string(),
  value: z.number(),
  timestamp: z.string().optional(),
}).passthrough();

export type AdminMetric = z.infer<typeof adminMetricSchema>;

import { makeApi } from '@zodios/core';
export const adminApiDef = makeApi([
  {
    method: 'get',
    path: '/api/v1/admin/users',
    alias: 'getUsers',
     
    response: z.any()
  },
  {
    method: 'get',
    path: '/api/v1/admin/dashboard',
    alias: 'getDashboard',
     
    response: z.any()
  },
  {
    method: 'get',
    path: '/api/v1/internal/admin/refunds',
    alias: 'getRefundTickets',
    parameters: [
      {
        name: 'page',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'size',
        type: 'Query',
        schema: z.number().optional()
      },
      {
        name: 'status',
        type: 'Query',
        schema: z.string().optional()
      }
    ],
    response: z.any()
  },
  {
    method: 'post',
    path: '/api/v1/internal/admin/refunds/:ticketId/resolve',
    alias: 'resolveRefundTicket',
    parameters: [
      {
        name: 'ticketId',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'body',
        type: 'Body',
        schema: z.object({
          approved: z.boolean(),
          notes: z.string().optional(),
          faultType: z.string().optional(),
          overrideAmount: z.number().optional()
        })
      }
    ],
    response: z.any()
  }
]);
