/**
 * BCell Tests - Authorization System
 */

import { BCell } from '../authorization/BCell';

describe('BCell - Authorization System', () => {
  describe('Permission Management', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should create a permission', () => {
      const permission = bcell.createPermission('posts', 'read');

      expect(permission).toBeDefined();
      expect(permission.id).toBeDefined();
      expect(permission.resource).toBe('posts');
      expect(permission.action).toBe('read');
    });

    it('should create permission with description', () => {
      const permission = bcell.createPermission('posts', 'write', undefined, 'Write posts');

      expect(permission.description).toBe('Write posts');
    });

    it('should create permission with conditions', () => {
      const conditions = [{ field: 'status', operator: 'equals' as const, value: 'published' }];
      const permission = bcell.createPermission('posts', 'delete', conditions);

      expect(permission.conditions).toEqual(conditions);
    });

    it('should get permission by ID', () => {
      const created = bcell.createPermission('posts', 'read');
      const retrieved = bcell.getPermission(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent permission', () => {
      const permission = bcell.getPermission('invalid-id');

      expect(permission).toBeUndefined();
    });

    it('should delete permission', () => {
      const permission = bcell.createPermission('posts', 'read');
      const deleted = bcell.deletePermission(permission.id);

      expect(deleted).toBe(true);
      expect(bcell.getPermission(permission.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent permission', () => {
      const deleted = bcell.deletePermission('invalid-id');

      expect(deleted).toBe(false);
    });

    it('should emit permission:created event', () => {
      return new Promise<void>((resolve) => {
        bcell.on('permission:created', (permission) => {
          expect(permission.resource).toBe('posts');
          expect(permission.action).toBe('read');
          resolve();
        });

        bcell.createPermission('posts', 'read');
      });
    });
  });

  describe('Role Management', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should create a role', () => {
      const role = bcell.createRole('editor');

      expect(role).toBeDefined();
      expect(role.id).toBeDefined();
      expect(role.name).toBe('editor');
    });

    it('should create role with description', () => {
      const role = bcell.createRole('editor', 'Can edit content');

      expect(role.description).toBe('Can edit content');
    });

    it('should create role with inheritance', () => {
      const parentRole = bcell.createRole('viewer');
      const childRole = bcell.createRole('editor', undefined, [parentRole.id]);

      expect(childRole.inheritsFrom).toEqual([parentRole.id]);
    });

    it('should get role by ID', () => {
      const created = bcell.createRole('editor');
      const retrieved = bcell.getRole(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should get role by name', () => {
      const created = bcell.createRole('editor');
      const retrieved = bcell.getRoleByName('editor');

      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent role', () => {
      const role = bcell.getRole('invalid-id');

      expect(role).toBeUndefined();
    });

    it('should delete role', () => {
      const role = bcell.createRole('editor');
      const deleted = bcell.deleteRole(role.id);

      expect(deleted).toBe(true);
      expect(bcell.getRole(role.id)).toBeUndefined();
    });

    it('should emit role:created event', () => {
      return new Promise<void>((resolve) => {
        bcell.on('role:created', (role) => {
          expect(role.name).toBe('editor');
          resolve();
        });

        bcell.createRole('editor');
      });
    });
  });

  describe('Role-Permission Assignment', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should add permission to role', () => {
      const role = bcell.createRole('editor');
      const permission = bcell.createPermission('posts', 'write');

      const added = bcell.addPermissionToRole(role.id, permission.id);

      expect(added).toBe(true);

      const retrievedRole = bcell.getRole(role.id);
      expect(retrievedRole?.permissions).toContain(permission.id);
    });

    it('should not add duplicate permission to role', () => {
      const role = bcell.createRole('editor');
      const permission = bcell.createPermission('posts', 'write');

      bcell.addPermissionToRole(role.id, permission.id);
      const added = bcell.addPermissionToRole(role.id, permission.id);

      expect(added).toBe(false);
    });

    it('should return false when adding permission to non-existent role', () => {
      const permission = bcell.createPermission('posts', 'write');
      const added = bcell.addPermissionToRole('invalid-id', permission.id);

      expect(added).toBe(false);
    });

    it('should return false when adding non-existent permission to role', () => {
      const role = bcell.createRole('editor');
      const added = bcell.addPermissionToRole(role.id, 'invalid-id');

      expect(added).toBe(false);
    });

    it('should remove permission from role', () => {
      const role = bcell.createRole('editor');
      const permission = bcell.createPermission('posts', 'write');

      bcell.addPermissionToRole(role.id, permission.id);
      const removed = bcell.removePermissionFromRole(role.id, permission.id);

      expect(removed).toBe(true);

      const retrievedRole = bcell.getRole(role.id);
      expect(retrievedRole?.permissions).not.toContain(permission.id);
    });

    it('should emit role:permission:added event', () => {
      return new Promise<void>((resolve) => {
        const role = bcell.createRole('editor');
        const permission = bcell.createPermission('posts', 'write');

        bcell.on('role:permission:added', (data) => {
          expect(data.roleId).toBe(role.id);
          expect(data.permissionId).toBe(permission.id);
          resolve();
        });

        bcell.addPermissionToRole(role.id, permission.id);
      });
    });
  });

  describe('Subject Management', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should register a subject', () => {
      const subject = bcell.registerSubject('user-1');

      expect(subject).toBeDefined();
      expect(subject.id).toBe('user-1');
      expect(subject.roles).toEqual([]);
    });

    it('should not create duplicate subjects', () => {
      bcell.registerSubject('user-1');
      const subject = bcell.registerSubject('user-1');

      expect(subject.id).toBe('user-1');
    });

    it('should get subject by ID', () => {
      bcell.registerSubject('user-1');
      const subject = bcell.getSubject('user-1');

      expect(subject?.id).toBe('user-1');
    });

    it('should return undefined for non-existent subject', () => {
      const subject = bcell.getSubject('invalid-id');

      expect(subject).toBeUndefined();
    });

    it('should emit subject:registered event', () => {
      return new Promise<void>((resolve) => {
        bcell.on('subject:registered', (data) => {
          expect(data.subjectId).toBe('user-1');
          resolve();
        });

        bcell.registerSubject('user-1');
      });
    });
  });

  describe('Role Assignment', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should assign role to subject', () => {
      bcell.registerSubject('user-1');
      const role = bcell.createRole('editor');

      const assigned = bcell.assignRole('user-1', role.id);

      expect(assigned).toBe(true);

      const subject = bcell.getSubject('user-1');
      expect(subject?.roles).toContain(role.id);
    });

    it('should auto-register subject when assigning role', () => {
      const role = bcell.createRole('editor');

      const assigned = bcell.assignRole('user-1', role.id);

      expect(assigned).toBe(true);
      expect(bcell.getSubject('user-1')).toBeDefined();
    });

    it('should not assign duplicate role to subject', () => {
      const role = bcell.createRole('editor');

      bcell.assignRole('user-1', role.id);
      const assigned = bcell.assignRole('user-1', role.id);

      expect(assigned).toBe(false);
    });

    it('should return false when assigning non-existent role', () => {
      bcell.registerSubject('user-1');
      const assigned = bcell.assignRole('user-1', 'invalid-id');

      expect(assigned).toBe(false);
    });

    it('should revoke role from subject', () => {
      const role = bcell.createRole('editor');
      bcell.assignRole('user-1', role.id);

      const revoked = bcell.revokeRole('user-1', role.id);

      expect(revoked).toBe(true);

      const subject = bcell.getSubject('user-1');
      expect(subject?.roles).not.toContain(role.id);
    });

    it('should return false when revoking from non-existent subject', () => {
      const role = bcell.createRole('editor');
      const revoked = bcell.revokeRole('invalid-id', role.id);

      expect(revoked).toBe(false);
    });

    it('should emit subject:role:assigned event', () => {
      return new Promise<void>((resolve) => {
        const role = bcell.createRole('editor');

        bcell.on('subject:role:assigned', (data) => {
          expect(data.subjectId).toBe('user-1');
          expect(data.roleId).toBe(role.id);
          resolve();
        });

        bcell.assignRole('user-1', role.id);
      });
    });
  });

  describe('Direct Permissions', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should grant direct permission to subject', () => {
      bcell.registerSubject('user-1');
      const permission = bcell.createPermission('posts', 'delete');

      const granted = bcell.grantDirectPermission('user-1', permission.id);

      expect(granted).toBe(true);

      const subject = bcell.getSubject('user-1');
      expect(subject?.directPermissions).toContain(permission.id);
    });

    it('should auto-register subject when granting permission', () => {
      const permission = bcell.createPermission('posts', 'delete');

      const granted = bcell.grantDirectPermission('user-1', permission.id);

      expect(granted).toBe(true);
      expect(bcell.getSubject('user-1')).toBeDefined();
    });

    it('should not grant duplicate permission', () => {
      const permission = bcell.createPermission('posts', 'delete');

      bcell.grantDirectPermission('user-1', permission.id);
      const granted = bcell.grantDirectPermission('user-1', permission.id);

      expect(granted).toBe(false);
    });

    it('should revoke direct permission', () => {
      const permission = bcell.createPermission('posts', 'delete');
      bcell.grantDirectPermission('user-1', permission.id);

      const revoked = bcell.revokeDirectPermission('user-1', permission.id);

      expect(revoked).toBe(true);

      const subject = bcell.getSubject('user-1');
      expect(subject?.directPermissions).not.toContain(permission.id);
    });

    it('should emit subject:permission:granted event', () => {
      return new Promise<void>((resolve) => {
        const permission = bcell.createPermission('posts', 'delete');

        bcell.on('subject:permission:granted', (data) => {
          expect(data.subjectId).toBe('user-1');
          expect(data.permissionId).toBe(permission.id);
          resolve();
        });

        bcell.grantDirectPermission('user-1', permission.id);
      });
    });
  });

  describe('Basic Authorization', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should grant authorization with matching role permission', () => {
      const role = bcell.createRole('editor');
      const permission = bcell.createPermission('posts', 'write');
      bcell.addPermissionToRole(role.id, permission.id);
      bcell.assignRole('user-1', role.id);

      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'write',
      });

      expect(result.granted).toBe(true);
      expect(result.matchedPermissions).toContain(permission.id);
      expect(result.matchedRoles).toContain(role.id);
    });

    it('should grant authorization with direct permission', () => {
      const permission = bcell.createPermission('posts', 'delete');
      bcell.grantDirectPermission('user-1', permission.id);

      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'delete',
      });

      expect(result.granted).toBe(true);
      expect(result.matchedPermissions).toContain(permission.id);
    });

    it('should deny authorization with no permissions', () => {
      bcell.registerSubject('user-1');

      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'write',
      });

      expect(result.granted).toBe(false);
      expect(result.reason).toBe('No matching permissions');
    });

    it('should deny authorization for non-existent subject', () => {
      const result = bcell.authorize({
        subjectId: 'invalid-user',
        resource: 'posts',
        action: 'write',
      });

      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Subject not found');
    });

    it('should deny authorization with wrong action', () => {
      const role = bcell.createRole('viewer');
      const permission = bcell.createPermission('posts', 'read');
      bcell.addPermissionToRole(role.id, permission.id);
      bcell.assignRole('user-1', role.id);

      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'write',
      });

      expect(result.granted).toBe(false);
    });

    it('should deny authorization with wrong resource', () => {
      const role = bcell.createRole('editor');
      const permission = bcell.createPermission('posts', 'write');
      bcell.addPermissionToRole(role.id, permission.id);
      bcell.assignRole('user-1', role.id);

      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'comments',
        action: 'write',
      });

      expect(result.granted).toBe(false);
    });

    it('should emit authorization:granted event', () => {
      return new Promise<void>((resolve) => {
        const permission = bcell.createPermission('posts', 'read');
        bcell.grantDirectPermission('user-1', permission.id);

        bcell.on('authorization:granted', (request) => {
          expect(request.subjectId).toBe('user-1');
          expect(request.resource).toBe('posts');
          expect(request.action).toBe('read');
          resolve();
        });

        bcell.authorize({
          subjectId: 'user-1',
          resource: 'posts',
          action: 'read',
        });
      });
    });

    it('should emit authorization:denied event', () => {
      return new Promise<void>((resolve) => {
        bcell.registerSubject('user-1');

        bcell.on('authorization:denied', (data) => {
          expect(data.subjectId).toBe('user-1');
          expect(data.reason).toBe('No matching permissions');
          resolve();
        });

        bcell.authorize({
          subjectId: 'user-1',
          resource: 'posts',
          action: 'write',
        });
      });
    });
  });

  describe('Conditional Authorization', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should grant with matching equals condition', () => {
      const conditions = [{ field: 'ownerId', operator: 'equals' as const, value: 'user-1' }];
      const permission = bcell.createPermission('posts', 'delete', conditions);
      bcell.grantDirectPermission('user-1', permission.id);

      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'delete',
        context: { ownerId: 'user-1' },
      });

      expect(result.granted).toBe(true);
    });

    it('should deny with non-matching equals condition', () => {
      const conditions = [{ field: 'ownerId', operator: 'equals' as const, value: 'user-1' }];
      const permission = bcell.createPermission('posts', 'delete', conditions);
      bcell.grantDirectPermission('user-1', permission.id);

      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'delete',
        context: { ownerId: 'user-2' },
      });

      expect(result.granted).toBe(false);
    });

    it('should grant with matching contains condition', () => {
      const conditions = [{ field: 'tags', operator: 'contains' as const, value: 'admin' }];
      const permission = bcell.createPermission('settings', 'read', conditions);
      bcell.grantDirectPermission('user-1', permission.id);

      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'settings',
        action: 'read',
        context: { tags: 'admin,moderator' },
      });

      expect(result.granted).toBe(true);
    });

    it('should grant with matching greaterThan condition', () => {
      const conditions = [{ field: 'level', operator: 'greaterThan' as const, value: 5 }];
      const permission = bcell.createPermission('admin', 'execute', conditions);
      bcell.grantDirectPermission('user-1', permission.id);

      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'admin',
        action: 'execute',
        context: { level: 10 },
      });

      expect(result.granted).toBe(true);
    });

    it('should deny when context not provided for conditional permission', () => {
      const conditions = [{ field: 'ownerId', operator: 'equals' as const, value: 'user-1' }];
      const permission = bcell.createPermission('posts', 'delete', conditions);
      bcell.grantDirectPermission('user-1', permission.id);

      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'delete',
      });

      expect(result.granted).toBe(false);
    });
  });

  describe('Role Inheritance', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should inherit permissions from parent role', () => {
      const viewerRole = bcell.createRole('viewer');
      const editorRole = bcell.createRole('editor', undefined, [viewerRole.id]);

      const viewPermission = bcell.createPermission('posts', 'read');
      const editPermission = bcell.createPermission('posts', 'write');

      bcell.addPermissionToRole(viewerRole.id, viewPermission.id);
      bcell.addPermissionToRole(editorRole.id, editPermission.id);

      bcell.assignRole('user-1', editorRole.id);

      // Should have editor permission
      const writeResult = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'write',
      });

      expect(writeResult.granted).toBe(true);

      // Should also have inherited viewer permission
      const readResult = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'read',
      });

      expect(readResult.granted).toBe(true);
    });

    it('should handle multiple inheritance levels', () => {
      const viewerRole = bcell.createRole('viewer');
      const editorRole = bcell.createRole('editor', undefined, [viewerRole.id]);
      const adminRole = bcell.createRole('admin', undefined, [editorRole.id]);

      const viewPermission = bcell.createPermission('posts', 'read');
      const editPermission = bcell.createPermission('posts', 'write');
      const deletePermission = bcell.createPermission('posts', 'delete');

      bcell.addPermissionToRole(viewerRole.id, viewPermission.id);
      bcell.addPermissionToRole(editorRole.id, editPermission.id);
      bcell.addPermissionToRole(adminRole.id, deletePermission.id);

      bcell.assignRole('user-1', adminRole.id);

      // Should have all permissions
      const readResult = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'read',
      });

      expect(readResult.granted).toBe(true);

      const writeResult = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'write',
      });

      expect(writeResult.granted).toBe(true);

      const deleteResult = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'delete',
      });

      expect(deleteResult.granted).toBe(true);
    });
  });

  describe('Subject Permissions and Roles', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should get all permissions for subject', () => {
      const role = bcell.createRole('editor');
      const perm1 = bcell.createPermission('posts', 'read');
      const perm2 = bcell.createPermission('posts', 'write');
      const perm3 = bcell.createPermission('posts', 'delete');

      bcell.addPermissionToRole(role.id, perm1.id);
      bcell.addPermissionToRole(role.id, perm2.id);
      bcell.assignRole('user-1', role.id);
      bcell.grantDirectPermission('user-1', perm3.id);

      const permissions = bcell.getSubjectPermissions('user-1');

      expect(permissions).toHaveLength(3);
      expect(permissions.map((p) => p.id)).toContain(perm1.id);
      expect(permissions.map((p) => p.id)).toContain(perm2.id);
      expect(permissions.map((p) => p.id)).toContain(perm3.id);
    });

    it('should get all roles for subject (including inherited)', () => {
      const viewerRole = bcell.createRole('viewer');
      const editorRole = bcell.createRole('editor', undefined, [viewerRole.id]);

      bcell.assignRole('user-1', editorRole.id);

      const roles = bcell.getSubjectRoles('user-1');

      expect(roles).toHaveLength(2);
      expect(roles.map((r) => r.id)).toContain(viewerRole.id);
      expect(roles.map((r) => r.id)).toContain(editorRole.id);
    });
  });

  describe('Caching', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false, enableCache: true });
    });

    it('should cache authorization results', () => {
      const permission = bcell.createPermission('posts', 'read');
      bcell.grantDirectPermission('user-1', permission.id);

      // First request
      bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'read',
      });

      // Second request should hit cache
      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'read',
      });

      expect(result.granted).toBe(true);

      const stats = bcell.getStatistics();
      expect(stats.cacheHitRate).toBeGreaterThan(0);
    });

    it('should invalidate cache when role assigned', () => {
      bcell.registerSubject('user-1');

      // Initial authorization (denied)
      bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'read',
      });

      // Assign role
      const role = bcell.createRole('viewer');
      const permission = bcell.createPermission('posts', 'read');
      bcell.addPermissionToRole(role.id, permission.id);
      bcell.assignRole('user-1', role.id);

      // Should get fresh result (granted)
      const result = bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'read',
      });

      expect(result.granted).toBe(true);
    });

    it('should clear cache manually', () => {
      const permission = bcell.createPermission('posts', 'read');
      bcell.grantDirectPermission('user-1', permission.id);

      bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'read',
      });

      bcell.clearCache();

      // Next request should be cache miss
      bcell.authorize({
        subjectId: 'user-1',
        resource: 'posts',
        action: 'read',
      });

      const stats = bcell.getStatistics();
      expect(stats.totalRequests).toBe(2);
    });

    it('should emit cache:cleared event', () => {
      return new Promise<void>((resolve) => {
        bcell.on('cache:cleared', () => {
          resolve();
        });

        bcell.clearCache();
      });
    });
  });

  describe('Statistics', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should track authorization statistics', () => {
      const permission = bcell.createPermission('posts', 'read');
      bcell.grantDirectPermission('user-1', permission.id);

      bcell.authorize({ subjectId: 'user-1', resource: 'posts', action: 'read' });
      bcell.authorize({ subjectId: 'user-1', resource: 'posts', action: 'write' });

      const stats = bcell.getStatistics();

      expect(stats.totalRequests).toBe(2);
      expect(stats.granted).toBe(1);
      expect(stats.denied).toBe(1);
      expect(stats.grantRate).toBe(50);
    });

    it('should track resource counts', () => {
      bcell.createPermission('posts', 'read');
      bcell.createPermission('posts', 'write');
      bcell.createRole('editor');
      bcell.createRole('viewer');
      bcell.registerSubject('user-1');
      bcell.registerSubject('user-2');

      const stats = bcell.getStatistics();

      expect(stats.totalPermissions).toBe(2);
      expect(stats.totalRoles).toBe(2);
      expect(stats.totalSubjects).toBe(2);
    });

    it('should reset statistics', () => {
      const permission = bcell.createPermission('posts', 'read');
      bcell.grantDirectPermission('user-1', permission.id);

      bcell.authorize({ subjectId: 'user-1', resource: 'posts', action: 'read' });

      bcell.resetStatistics();

      const stats = bcell.getStatistics();

      expect(stats.totalRequests).toBe(0);
      expect(stats.granted).toBe(0);
      expect(stats.denied).toBe(0);
    });

    it('should emit stats:reset event', () => {
      return new Promise<void>((resolve) => {
        bcell.on('stats:reset', () => {
          resolve();
        });

        bcell.resetStatistics();
      });
    });
  });

  describe('Cleanup on Deletion', () => {
    let bcell: BCell;

    beforeEach(() => {
      bcell = new BCell({ verbose: false });
    });

    it('should remove permission from roles when deleted', () => {
      const role = bcell.createRole('editor');
      const permission = bcell.createPermission('posts', 'write');

      bcell.addPermissionToRole(role.id, permission.id);
      bcell.deletePermission(permission.id);

      const retrievedRole = bcell.getRole(role.id);
      expect(retrievedRole?.permissions).not.toContain(permission.id);
    });

    it('should remove role from subjects when deleted', () => {
      const role = bcell.createRole('editor');
      bcell.assignRole('user-1', role.id);

      bcell.deleteRole(role.id);

      const subject = bcell.getSubject('user-1');
      expect(subject?.roles).not.toContain(role.id);
    });
  });
});
