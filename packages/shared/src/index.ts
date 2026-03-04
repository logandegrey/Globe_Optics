import { z } from 'zod';

export const ServiceSchema = z.enum(['web', 'api', 'ingest']);

export const HealthSchema = z.object({
  service: ServiceSchema,
  status: z.literal('ok'),
});

export type ServiceName = z.infer<typeof ServiceSchema>;
export type HealthPayload = z.infer<typeof HealthSchema>;
