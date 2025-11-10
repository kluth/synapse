/**
 * BCell - Authorization System
 *
 * Inspired by B cells in the immune system, which produce antibodies
 * and handle adaptive immunity. In our framework, BCell manages:
 * - Role-based access control (RBAC)
 * - Permission management
 * - Resource-based authorization
 * - Policy evaluation
 *
 * @module BCell
 */

import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';

/**
 * Permission action types
 */
export type Action = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'admin' | string;

/**
 * Resource types
 */
export type ResourceType = string;

/**
 * Permission definition
 */
export interface Permission {
  /**
   * Permission ID
   */
  id: string;

  /**
   * Resource type this permission applies to
   */
  resource: ResourceType;

  /**
   * Action allowed by this permission
   */
  action: Action;

  /**
   * Optional conditions for this permission
   */
  conditions?: PermissionCondition[];

  /**
   * Permission description
   */
  description?: string;

  /**
   * Creation timestamp
   */
  createdAt: number;
}

/**
 * Permission condition
 */
export interface PermissionCondition {
  /**
   * Field to check
   */
  field: string;

  /**
   * Operator to use
   */
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan';

  /**
   * Value to compare against
   */
  value: unknown;
}

/**
 * Role definition
 */
export interface Role {
  /**
   * Role ID
   */
  id: string;

  /**
   * Role name
   */
  name: string;

  /**
   * Role description
   */
  description?: string;

  /**
   * Permissions granted by this role
   */
  permissions: string[]; // Permission IDs

  /**
   * Parent roles (for role hierarchy)
   */
  inheritsFrom?: string[]; // Role IDs

  /**
   * Creation timestamp
   */
  createdAt: number;
}

/**
 * Authorization request
 */
export interface AuthorizationRequest {
  /**
   * User/subject ID requesting authorization
   */
  subjectId: string;

  /**
   * Resource being accessed
   */
  resource: ResourceType;

  /**
   * Action being performed
   */
  action: Action;

  /**
   * Optional resource context for condition evaluation
   */
  context?: Record<string, unknown>;
}

/**
 * Authorization result
 */
export interface AuthorizationResult {
  /**
   * Whether authorization is granted
   */
  granted: boolean;

  /**
   * Reason for denial (if not granted)
   */
  reason?: string;

  /**
   * Matched permissions (if granted)
   */
  matchedPermissions?: string[];

  /**
   * Matched roles
   */
  matchedRoles?: string[];

  /**
   * Request timestamp
   */
  timestamp: number;
}

/**
 * Subject (user) with assigned roles
 */
export interface Subject {
  /**
   * Subject ID
   */
  id: string;

  /**
   * Assigned role IDs
   */
  roles: string[];

  /**
   * Direct permissions (not from roles)
   */
  directPermissions?: string[];

  /**
   * Creation timestamp
   */
  createdAt: number;
}

/**
 * BCell configuration
 */
export interface BCellConfig {
  /**
   * Enable verbose logging
   */
  verbose?: boolean;

  /**
   * Cache authorization results
   */
  enableCache?: boolean;

  /**
   * Cache TTL in milliseconds
   */
  cacheTTL?: number;

  /**
   * Default deny if no permission matches
   */
  defaultDeny?: boolean;
}

/**
 * Authorization statistics
 */
export interface AuthorizationStatistics {
  /**
   * Total authorization requests
   */
  totalRequests: number;

  /**
   * Granted authorizations
   */
  granted: number;

  /**
   * Denied authorizations
   */
  denied: number;

  /**
   * Grant rate (percentage)
   */
  grantRate: number;

  /**
   * Total roles created
   */
  totalRoles: number;

  /**
   * Total permissions created
   */
  totalPermissions: number;

  /**
   * Total subjects
   */
  totalSubjects: number;

  /**
   * Cache hit rate (if caching enabled)
   */
  cacheHitRate?: number;
}

/**
 * BCell - Authorization System
 *
 * Manages authorization, roles, and permissions using RBAC
 */
export class BCell extends EventEmitter {
  private readonly config: Required<BCellConfig>;
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private subjects: Map<string, Subject> = new Map();
  private authCache: Map<string, AuthorizationResult> = new Map();
  private stats = {
    totalRequests: 0,
    granted: 0,
    denied: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  /**
   * Create a new BCell authorization system
   */
  constructor(config: BCellConfig = {}) {
    super();

    this.config = {
      verbose: config.verbose ?? false,
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL ?? 300000, // 5 minutes
      defaultDeny: config.defaultDeny ?? true,
    };

    if (this.config.verbose) {
      this.log('BCell authorization system initialized');
    }
  }

  /**
   * Create a new permission
   */
  public createPermission(
    resource: ResourceType,
    action: Action,
    conditions?: PermissionCondition[],
    description?: string,
  ): Permission {
    const permission: Permission = {
      id: this.generatePermissionId(),
      resource,
      action,
      ...(conditions !== undefined && { conditions }),
      ...(description !== undefined && { description }),
      createdAt: Date.now(),
    };

    this.permissions.set(permission.id, permission);

    if (this.config.verbose) {
      this.log(`Permission created: ${resource}:${action}`);
    }

    this.emit('permission:created', permission);

    return permission;
  }

  /**
   * Get permission by ID
   */
  public getPermission(id: string): Permission | undefined {
    return this.permissions.get(id);
  }

  /**
   * Delete permission
   */
  public deletePermission(id: string): boolean {
    const deleted = this.permissions.delete(id);

    if (deleted) {
      // Remove from all roles
      for (const role of Array.from(this.roles.values())) {
        role.permissions = role.permissions.filter((p) => p !== id);
      }

      // Remove from all subjects
      for (const subject of Array.from(this.subjects.values())) {
        if (subject.directPermissions !== undefined) {
          subject.directPermissions = subject.directPermissions.filter((p) => p !== id);
        }
      }

      this.emit('permission:deleted', { permissionId: id });
    }

    return deleted;
  }

  /**
   * Create a new role
   */
  public createRole(name: string, description?: string, inheritsFrom?: string[]): Role {
    const role: Role = {
      id: this.generateRoleId(),
      name,
      ...(description !== undefined && { description }),
      permissions: [],
      ...(inheritsFrom !== undefined && { inheritsFrom }),
      createdAt: Date.now(),
    };

    this.roles.set(role.id, role);

    if (this.config.verbose) {
      this.log(`Role created: ${name}`);
    }

    this.emit('role:created', role);

    return role;
  }

  /**
   * Get role by ID
   */
  public getRole(id: string): Role | undefined {
    return this.roles.get(id);
  }

  /**
   * Get role by name
   */
  public getRoleByName(name: string): Role | undefined {
    return Array.from(this.roles.values()).find((r) => r.name === name);
  }

  /**
   * Add permission to role
   */
  public addPermissionToRole(roleId: string, permissionId: string): boolean {
    const role = this.roles.get(roleId);
    const permission = this.permissions.get(permissionId);

    if (role === undefined || permission === undefined) {
      return false;
    }

    if (!role.permissions.includes(permissionId)) {
      role.permissions.push(permissionId);

      this.emit('role:permission:added', { roleId, permissionId });

      return true;
    }

    return false;
  }

  /**
   * Remove permission from role
   */
  public removePermissionFromRole(roleId: string, permissionId: string): boolean {
    const role = this.roles.get(roleId);

    if (role === undefined) {
      return false;
    }

    const index = role.permissions.indexOf(permissionId);
    if (index !== -1) {
      role.permissions.splice(index, 1);

      this.emit('role:permission:removed', { roleId, permissionId });

      return true;
    }

    return false;
  }

  /**
   * Delete role
   */
  public deleteRole(id: string): boolean {
    const deleted = this.roles.delete(id);

    if (deleted) {
      // Remove from all subjects
      for (const subject of Array.from(this.subjects.values())) {
        subject.roles = subject.roles.filter((r) => r !== id);
      }

      // Remove from inheritsFrom of other roles
      for (const role of Array.from(this.roles.values())) {
        if (role.inheritsFrom !== undefined) {
          role.inheritsFrom = role.inheritsFrom.filter((r) => r !== id);
        }
      }

      this.emit('role:deleted', { roleId: id });
    }

    return deleted;
  }

  /**
   * Register a subject (user)
   */
  public registerSubject(id: string): Subject {
    let subject = this.subjects.get(id);

    if (subject === undefined) {
      subject = {
        id,
        roles: [],
        createdAt: Date.now(),
      };

      this.subjects.set(id, subject);

      this.emit('subject:registered', { subjectId: id });
    }

    return subject;
  }

  /**
   * Get subject by ID
   */
  public getSubject(id: string): Subject | undefined {
    return this.subjects.get(id);
  }

  /**
   * Assign role to subject
   */
  public assignRole(subjectId: string, roleId: string): boolean {
    let subject = this.subjects.get(subjectId);
    const role = this.roles.get(roleId);

    if (role === undefined) {
      return false;
    }

    if (subject === undefined) {
      subject = this.registerSubject(subjectId);
    }

    if (!subject.roles.includes(roleId)) {
      subject.roles.push(roleId);

      // Invalidate cache for this subject
      this.invalidateSubjectCache(subjectId);

      this.emit('subject:role:assigned', { subjectId, roleId });

      return true;
    }

    return false;
  }

  /**
   * Revoke role from subject
   */
  public revokeRole(subjectId: string, roleId: string): boolean {
    const subject = this.subjects.get(subjectId);

    if (subject === undefined) {
      return false;
    }

    const index = subject.roles.indexOf(roleId);
    if (index !== -1) {
      subject.roles.splice(index, 1);

      // Invalidate cache for this subject
      this.invalidateSubjectCache(subjectId);

      this.emit('subject:role:revoked', { subjectId, roleId });

      return true;
    }

    return false;
  }

  /**
   * Grant direct permission to subject (bypass role)
   */
  public grantDirectPermission(subjectId: string, permissionId: string): boolean {
    let subject = this.subjects.get(subjectId);
    const permission = this.permissions.get(permissionId);

    if (permission === undefined) {
      return false;
    }

    if (subject === undefined) {
      subject = this.registerSubject(subjectId);
    }

    if (subject.directPermissions === undefined) {
      subject.directPermissions = [];
    }

    if (!subject.directPermissions.includes(permissionId)) {
      subject.directPermissions.push(permissionId);

      // Invalidate cache for this subject
      this.invalidateSubjectCache(subjectId);

      this.emit('subject:permission:granted', { subjectId, permissionId });

      return true;
    }

    return false;
  }

  /**
   * Revoke direct permission from subject
   */
  public revokeDirectPermission(subjectId: string, permissionId: string): boolean {
    const subject = this.subjects.get(subjectId);

    if (subject?.directPermissions === undefined) {
      return false;
    }

    const index = subject.directPermissions.indexOf(permissionId);
    if (index !== -1) {
      subject.directPermissions.splice(index, 1);

      // Invalidate cache for this subject
      this.invalidateSubjectCache(subjectId);

      this.emit('subject:permission:revoked', { subjectId, permissionId });

      return true;
    }

    return false;
  }

  /**
   * Authorize a request
   */
  public authorize(request: AuthorizationRequest): AuthorizationResult {
    this.stats.totalRequests++;

    // Check cache
    if (this.config.enableCache) {
      const cacheKey = this.getCacheKey(request);
      const cached = this.authCache.get(cacheKey);

      if (cached !== undefined) {
        this.stats.cacheHits++;
        return cached;
      }

      this.stats.cacheMisses++;
    }

    const result = this.evaluateAuthorization(request);

    // Update stats
    if (result.granted) {
      this.stats.granted++;
    } else {
      this.stats.denied++;
    }

    // Cache result
    if (this.config.enableCache && result.granted) {
      const cacheKey = this.getCacheKey(request);
      this.authCache.set(cacheKey, result);

      // Auto-expire cache
      setTimeout(() => {
        this.authCache.delete(cacheKey);
      }, this.config.cacheTTL);
    }

    // Emit event
    if (result.granted) {
      this.emit('authorization:granted', request);
    } else {
      this.emit('authorization:denied', { ...request, reason: result.reason });
    }

    return result;
  }

  /**
   * Evaluate authorization request
   */
  private evaluateAuthorization(request: AuthorizationRequest): AuthorizationResult {
    const subject = this.subjects.get(request.subjectId);

    if (subject === undefined) {
      return {
        granted: false,
        reason: 'Subject not found',
        timestamp: Date.now(),
      };
    }

    const matchedPermissions: string[] = [];
    const matchedRoles: string[] = [];

    // Check direct permissions
    if (subject.directPermissions !== undefined) {
      for (const permId of subject.directPermissions) {
        const permission = this.permissions.get(permId);

        if (permission !== undefined && this.permissionMatches(permission, request)) {
          matchedPermissions.push(permId);
        }
      }
    }

    // Check role permissions (including inherited roles)
    const allRoles = this.getAllRoles(subject.roles);

    for (const roleId of allRoles) {
      const role = this.roles.get(roleId);

      if (role !== undefined) {
        for (const permId of role.permissions) {
          const permission = this.permissions.get(permId);

          if (permission !== undefined && this.permissionMatches(permission, request)) {
            if (!matchedPermissions.includes(permId)) {
              matchedPermissions.push(permId);
            }

            if (!matchedRoles.includes(roleId)) {
              matchedRoles.push(roleId);
            }
          }
        }
      }
    }

    // Grant if any permissions matched
    if (matchedPermissions.length > 0) {
      return {
        granted: true,
        matchedPermissions,
        matchedRoles,
        timestamp: Date.now(),
      };
    }

    // Default deny
    return {
      granted: false,
      reason: 'No matching permissions',
      timestamp: Date.now(),
    };
  }

  /**
   * Check if permission matches request
   */
  private permissionMatches(permission: Permission, request: AuthorizationRequest): boolean {
    // Check resource and action
    if (permission.resource !== request.resource || permission.action !== request.action) {
      return false;
    }

    // Check conditions
    if (permission.conditions !== undefined && permission.conditions.length > 0) {
      if (request.context === undefined) {
        return false; // Conditions exist but no context provided
      }

      for (const condition of permission.conditions) {
        if (!this.evaluateCondition(condition, request.context)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Evaluate a permission condition
   */
  private evaluateCondition(
    condition: PermissionCondition,
    context: Record<string, unknown>,
  ): boolean {
    const contextValue = context[condition.field];

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'notEquals':
        return contextValue !== condition.value;
      case 'contains':
        return (
          typeof contextValue === 'string' &&
          typeof condition.value === 'string' &&
          contextValue.includes(condition.value)
        );
      case 'notContains':
        return (
          typeof contextValue === 'string' &&
          typeof condition.value === 'string' &&
          !contextValue.includes(condition.value)
        );
      case 'greaterThan':
        return (
          typeof contextValue === 'number' &&
          typeof condition.value === 'number' &&
          contextValue > condition.value
        );
      case 'lessThan':
        return (
          typeof contextValue === 'number' &&
          typeof condition.value === 'number' &&
          contextValue < condition.value
        );
      default:
        return false;
    }
  }

  /**
   * Get all roles including inherited roles (recursive)
   */
  private getAllRoles(roleIds: string[]): string[] {
    const allRoles = new Set<string>();

    const processRole = (roleId: string): void => {
      if (allRoles.has(roleId)) {
        return; // Already processed
      }

      allRoles.add(roleId);

      const role = this.roles.get(roleId);
      if (role?.inheritsFrom !== undefined) {
        for (const parentId of role.inheritsFrom) {
          processRole(parentId);
        }
      }
    };

    for (const roleId of roleIds) {
      processRole(roleId);
    }

    return Array.from(allRoles);
  }

  /**
   * Get cache key for authorization request
   */
  private getCacheKey(request: AuthorizationRequest): string {
    return `${request.subjectId}:${request.resource}:${request.action}`;
  }

  /**
   * Invalidate cache for a subject
   */
  private invalidateSubjectCache(subjectId: string): void {
    for (const key of Array.from(this.authCache.keys())) {
      if (key.startsWith(`${subjectId}:`)) {
        this.authCache.delete(key);
      }
    }
  }

  /**
   * Get all permissions for a subject
   */
  public getSubjectPermissions(subjectId: string): Permission[] {
    const subject = this.subjects.get(subjectId);

    if (subject === undefined) {
      return [];
    }

    const permissionIds = new Set<string>();

    // Add direct permissions
    if (subject.directPermissions !== undefined) {
      for (const permId of subject.directPermissions) {
        permissionIds.add(permId);
      }
    }

    // Add role permissions
    const allRoles = this.getAllRoles(subject.roles);

    for (const roleId of allRoles) {
      const role = this.roles.get(roleId);

      if (role !== undefined) {
        for (const permId of role.permissions) {
          permissionIds.add(permId);
        }
      }
    }

    // Get permission objects
    const permissions: Permission[] = [];
    for (const permId of permissionIds) {
      const permission = this.permissions.get(permId);
      if (permission !== undefined) {
        permissions.push(permission);
      }
    }

    return permissions;
  }

  /**
   * Get all roles for a subject (including inherited)
   */
  public getSubjectRoles(subjectId: string): Role[] {
    const subject = this.subjects.get(subjectId);

    if (subject === undefined) {
      return [];
    }

    const allRoleIds = this.getAllRoles(subject.roles);
    const roles: Role[] = [];

    for (const roleId of allRoleIds) {
      const role = this.roles.get(roleId);
      if (role !== undefined) {
        roles.push(role);
      }
    }

    return roles;
  }

  /**
   * Get authorization statistics
   */
  public getStatistics(): AuthorizationStatistics {
    const grantRate =
      this.stats.totalRequests > 0 ? (this.stats.granted / this.stats.totalRequests) * 100 : 0;

    const cacheTotal = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRate = cacheTotal > 0 ? (this.stats.cacheHits / cacheTotal) * 100 : 0;

    return {
      totalRequests: this.stats.totalRequests,
      granted: this.stats.granted,
      denied: this.stats.denied,
      grantRate,
      totalRoles: this.roles.size,
      totalPermissions: this.permissions.size,
      totalSubjects: this.subjects.size,
      ...(this.config.enableCache && { cacheHitRate }),
    };
  }

  /**
   * Reset statistics
   */
  public resetStatistics(): void {
    this.stats = {
      totalRequests: 0,
      granted: 0,
      denied: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    this.emit('stats:reset');
  }

  /**
   * Clear authorization cache
   */
  public clearCache(): void {
    this.authCache.clear();
    this.emit('cache:cleared');
  }

  /**
   * Generate permission ID
   */
  private generatePermissionId(): string {
    return `perm_${Date.now()}_${randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate role ID
   */
  private generateRoleId(): string {
    return `role_${Date.now()}_${randomBytes(16).toString('hex')}`;
  }

  /**
   * Log message
   */
  private log(message: string): void {
    if (this.config.verbose) {
      // Using warn for verbose logging as it's allowed by linter
      console.warn(`[BCell] ${message}`);
    }
  }
}
