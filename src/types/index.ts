import { z } from 'zod';

/**
 * Neuron types mirroring biological nervous system
 */
export type NeuronType = 'cortical' | 'reflex';

/**
 * Connection types based on synaptic behavior
 */
export type ConnectionType = 'excitatory' | 'inhibitory';

/**
 * Transmission speed categories
 */
export type TransmissionSpeed = 'fast' | 'myelinated' | 'slow';

/**
 * Communication protocols
 */
export type Protocol = 'gRPC' | 'REST' | 'event' | 'queue';

/**
 * Node operational states
 */
export type NodeState = 'inactive' | 'active' | 'firing' | 'refractory' | 'failed';

/**
 * Health status indicators
 */
export interface HealthStatus {
  readonly healthy: boolean;
  readonly lastCheck: Date;
  readonly uptime: number;
  readonly errors: number;
  readonly metrics: Record<string, number>;
}

/**
 * Signal schema with Zod validation
 */
export const SignalSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string(),
  targetId: z.string().optional(),
  type: z.enum(['excitatory', 'inhibitory']),
  strength: z.number().min(0).max(1),
  payload: z.unknown(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export type Signal = z.infer<typeof SignalSchema>;

/**
 * Event schema for pub-sub communication
 */
export const EventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  source: z.string(),
  data: z.unknown(),
  timestamp: z.date(),
  correlationId: z.string().optional(),
});

export type Event = z.infer<typeof EventSchema>;

/**
 * Input/Output types for processing
 */
export interface Input<T = unknown> {
  readonly data: T;
  readonly metadata?: Record<string, unknown>;
}

export interface Output<T = unknown> {
  readonly data: T;
  readonly success: boolean;
  readonly error?: Error | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

/**
 * Decision result from signal integration
 */
export interface Decision {
  readonly shouldFire: boolean;
  readonly threshold: number;
  readonly accumulated: number;
  readonly reason?: string;
}
