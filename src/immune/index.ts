/**
 * Immune System - Security & Authentication
 *
 * The Immune System protects the Synapse framework from security threats,
 * just like the biological immune system protects the body from pathogens.
 *
 * Components implemented:
 * - Antibody: Threat detection system
 * - TCell: Authentication system
 * - BCell: Authorization system
 *
 * Components planned:
 * - Macrophage: Input sanitization
 * - Lymphocyte: Security policy management
 */

// Antibody - Threat Detection
export { Antibody } from './detection/Antibody';
export type {
  ThreatType,
  ThreatSeverity,
  DetectedThreat,
  ThreatPattern,
  AntibodyConfig,
  ThreatStatistics,
} from './detection/Antibody';

// TCell - Authentication
export { TCell } from './authentication/TCell';
export type {
  AuthMethod,
  AuthenticationResult,
  PasswordCredentials,
  StoredUser,
  Session,
  TCellConfig,
  AuthStatistics,
} from './authentication/TCell';

// BCell - Authorization
export { BCell } from './authorization/BCell';
export type {
  Action,
  ResourceType,
  Permission,
  PermissionCondition,
  Role,
  AuthorizationRequest,
  AuthorizationResult,
  Subject,
  BCellConfig,
  AuthorizationStatistics,
} from './authorization/BCell';
