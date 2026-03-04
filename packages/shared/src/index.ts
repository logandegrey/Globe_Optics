import { z } from 'zod';

export const GlobePointSchema = z.object({
  id: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  label: z.string().min(1)
});

export const IngestMessageSchema = z.object({
  source: z.string().min(1),
  timestamp: z.string().datetime(),
  points: z.array(GlobePointSchema).min(1)
});

export const TrackUpdateSchema = z.object({
  trackId: z.string().min(1),
  source: z.string().min(1),
  timestamp: z.string().datetime(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  label: z.string().min(1)
});

export type GlobePoint = z.infer<typeof GlobePointSchema>;
export type IngestMessage = z.infer<typeof IngestMessageSchema>;
export type TrackUpdate = z.infer<typeof TrackUpdateSchema>;
