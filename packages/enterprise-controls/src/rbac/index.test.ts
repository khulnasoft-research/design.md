import { describe, it, expect } from 'vitest'
import {
  DefaultRBACManager,
  SYSTEM_ROLES,
  SYSTEM_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from './index.js'
import type { UserWithRoles } from './index.js'

function testUser(overrides?: Partial<UserWithRoles>): UserWithRoles {
  return {
    userId: 'user-1',
    tenantId: 'acme-corp',
    roles: [SYSTEM_ROLES.DESIGNER],
    additionalPermissions: [],
    ...overrides,
  }
}

describe('DefaultRBACManager', () => {
  it('initializes system roles with default permissions', async () => {
    const rbac = new DefaultRBACManager()
    const user = testUser({ roles: [SYSTEM_ROLES.ADMIN] })
    const perms = await rbac.getUserPermissions(user)
    expect(perms.length).toBeGreaterThan(0)
  })

  it('authorizes admin for any action', async () => {
    const rbac = new DefaultRBACManager()
    const user = testUser({ roles: [SYSTEM_ROLES.ADMIN] })
    const decision = await rbac.authorize({
      user,
      resource: 'design_system',
      action: 'delete',
    })
    expect(decision.allowed).toBe(true)
  })

  it('denies viewer for write actions', async () => {
    const rbac = new DefaultRBACManager()
    const user = testUser({ roles: [SYSTEM_ROLES.VIEWER] })
    const decision = await rbac.authorize({
      user,
      resource: 'design_system',
      action: 'create',
    })
    expect(decision.allowed).toBe(false)
  })

  it('allows viewer to read', async () => {
    const rbac = new DefaultRBACManager()
    const user = testUser({ roles: [SYSTEM_ROLES.VIEWER] })
    const decision = await rbac.authorize({
      user,
      resource: 'design_system',
      action: 'read',
    })
    expect(decision.allowed).toBe(true)
  })

  it('allows designer_lead to approve', async () => {
    const rbac = new DefaultRBACManager()
    const user = testUser({ roles: [SYSTEM_ROLES.DESIGNER_LEAD] })
    const decision = await rbac.authorize({
      user,
      resource: 'approval_request',
      action: 'approve',
    })
    expect(decision.allowed).toBe(true)
  })

  it('allows approver to reject', async () => {
    const rbac = new DefaultRBACManager()
    const user = testUser({ roles: [SYSTEM_ROLES.APPROVER] })
    const decision = await rbac.authorize({
      user,
      resource: 'approval_request',
      action: 'reject',
    })
    expect(decision.allowed).toBe(true)
  })

  it('denies designer to approve', async () => {
    const rbac = new DefaultRBACManager()
    const user = testUser({ roles: [SYSTEM_ROLES.DESIGNER] })
    const decision = await rbac.authorize({
      user,
      resource: 'approval_request',
      action: 'approve',
    })
    expect(decision.allowed).toBe(false)
  })

  it('gets user permissions from roles', async () => {
    const rbac = new DefaultRBACManager()
    const user = testUser({ roles: [SYSTEM_ROLES.DESIGNER] })
    const perms = await rbac.getUserPermissions(user)
    expect(perms.length).toBeGreaterThan(0)
    expect(perms.some(p => p.id === 'design_system_create')).toBe(true)
  })

  it('includes additional direct permissions', async () => {
    const rbac = new DefaultRBACManager()
    const user = testUser({
      roles: [SYSTEM_ROLES.VIEWER],
      additionalPermissions: [SYSTEM_PERMISSIONS.DESIGN_SYSTEM_CREATE],
    })
    const perms = await rbac.getUserPermissions(user)
    expect(perms.some(p => p.id === 'design_system_create')).toBe(true)
  })

  it('adds permission to role', async () => {
    const rbac = new DefaultRBACManager()
    await rbac.addPermissionToRole('viewer', SYSTEM_PERMISSIONS.MANAGE_ROLES)
    const user = testUser({ roles: [SYSTEM_ROLES.VIEWER] })
    const perms = await rbac.getUserPermissions(user)
    expect(perms.some(p => p.id === 'manage_roles')).toBe(true)
  })

  it('removes permission from role', async () => {
    const rbac = new DefaultRBACManager()
    await rbac.removePermissionFromRole('viewer', 'prompt_read')
    const user = testUser({ roles: [SYSTEM_ROLES.VIEWER] })
    const perms = await rbac.getUserPermissions(user)
    expect(perms.some(p => p.id === 'prompt_read')).toBe(false)
  })

  it('assigns role to user', async () => {
    const rbac = new DefaultRBACManager()
    await rbac.assignRoleToUser('user-2', 'acme-corp', 'admin')
    const user = testUser({ userId: 'user-2', roles: [SYSTEM_ROLES.ADMIN] })
    const perms = await rbac.getUserPermissions(user)
    expect(perms.length).toBeGreaterThan(0)
  })

  it('revokes role from user store', async () => {
    const rbac = new DefaultRBACManager()
    await rbac.assignRoleToUser('user-3', 'acme-corp', 'approver')
    // Should not throw
    await rbac.revokeRoleFromUser('user-3', 'acme-corp', 'approver')
    // Verify revoke is idempotent
    await expect(
      rbac.revokeRoleFromUser('user-3', 'acme-corp', 'approver')
    ).resolves.toBeUndefined()
  })

  it('creates custom role', async () => {
    const rbac = new DefaultRBACManager()
    const role = await rbac.createRole({
      name: 'Custom Editor',
      description: 'Custom role with limited edit',
      parentRoleId: 'designer',
      permissions: [SYSTEM_PERMISSIONS.DESIGN_SYSTEM_CREATE],
    })
    expect(role.id).toMatch(/^custom_/)
    expect(role.isSystemRole).toBe(false)
    expect(role.name).toBe('Custom Editor')
  })

  it('deletes custom role', async () => {
    const rbac = new DefaultRBACManager()
    const role = await rbac.createRole({
      name: 'Temp Role',
      description: 'Will be deleted',
      permissions: [],
    })
    await rbac.deleteRole(role.id)
    // Should not throw - role just won't grant permissions
    const user = testUser({ roles: [role] })
    const perms = await rbac.getUserPermissions(user)
    expect(perms.length).toBe(0)
  })

  it('returns denied decision on error gracefully', async () => {
    const rbac = new DefaultRBACManager()
    const decision = await rbac.authorize({
      user: undefined as unknown as UserWithRoles,
      resource: 'test',
      action: 'test',
    })
    expect(decision.allowed).toBe(false)
  })

  it('does not duplicate permissions on reassignment', async () => {
    const rbac = new DefaultRBACManager()
    await rbac.addPermissionToRole('viewer', SYSTEM_PERMISSIONS.DESIGN_SYSTEM_CREATE)
    await rbac.addPermissionToRole('viewer', SYSTEM_PERMISSIONS.DESIGN_SYSTEM_CREATE)
    const user = testUser({ roles: [SYSTEM_ROLES.VIEWER] })
    const perms = await rbac.getUserPermissions(user)
    const matches = perms.filter(p => p.id === 'design_system_create')
    expect(matches.length).toBe(1)
  })
})
