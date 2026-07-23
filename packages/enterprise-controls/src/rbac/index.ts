/**
 * Role-Based Access Control (RBAC)
 * 
 * Manages roles, permissions, and access control for the enterprise platform.
 * Supports hierarchical roles and fine-grained permissions.
 */

/**
 * Represents a permission in the system
 */
export interface Permission {
  /** Unique permission identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Detailed description */
  description: string;
  /** Resource being protected (e.g., 'design-system', 'approval', 'export') */
  resource: string;
  /** Action being controlled (e.g., 'create', 'read', 'update', 'delete', 'approve') */
  action: string;
}

/**
 * Represents a role with associated permissions
 */
export interface Role {
  /** Unique role identifier */
  id: string;
  /** Role name */
  name: string;
  /** Role description */
  description: string;
  /** Parent role (for inheritance) */
  parentRoleId?: string;
  /** Permissions granted to this role */
  permissions: Permission[];
  /** Is this a system role? */
  isSystemRole: boolean;
}

/**
 * User with role assignments and tenant context
 */
export interface UserWithRoles {
  /** User identifier */
  userId: string;
  /** Tenant identifier */
  tenantId: string;
  /** Assigned roles */
  roles: Role[];
  /** Additional direct permissions (beyond roles) */
  additionalPermissions?: Permission[];
}

/**
 * Authorization context for access control decisions
 */
export interface AuthorizationContext {
  /** Requesting user */
  user: UserWithRoles;
  /** Resource being accessed */
  resource: string;
  /** Action being performed */
  action: string;
  /** Additional context data */
  context?: Record<string, unknown>;
}

/**
 * Authorization decision result
 */
export interface AuthorizationDecision {
  /** Is the action authorized? */
  allowed: boolean;
  /** Reason for decision */
  reason: string;
  /** Which role/permission granted access (if allowed) */
  grantedBy?: string;
}

/**
 * RBAC manager interface
 */
export interface RBACManager {
  /** Check if a user can perform an action on a resource */
  authorize(context: AuthorizationContext): Promise<AuthorizationDecision>;

  /** Get all permissions for a user (including inherited from roles) */
  getUserPermissions(user: UserWithRoles): Promise<Permission[]>;

  /** Grant a permission to a role */
  addPermissionToRole(roleId: string, permission: Permission): Promise<void>;

  /** Revoke a permission from a role */
  removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;

  /** Assign a role to a user */
  assignRoleToUser(userId: string, tenantId: string, roleId: string): Promise<void>;

  /** Revoke a role from a user */
  revokeRoleFromUser(userId: string, tenantId: string, roleId: string): Promise<void>;

  /** Create a custom role */
  createRole(role: Omit<Role, 'id' | 'isSystemRole'>): Promise<Role>;

  /** Delete a custom role */
  deleteRole(roleId: string): Promise<void>;
}

/**
 * Default system roles
 */
export const SYSTEM_ROLES: Record<string, Role> = {
  ADMIN: {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all features and settings',
    permissions: [],
    isSystemRole: true,
  },
  DESIGNER_LEAD: {
    id: 'designer_lead',
    name: 'Design Lead',
    description: 'Can create, edit, and approve design systems',
    permissions: [],
    isSystemRole: true,
  },
  DESIGNER: {
    id: 'designer',
    name: 'Designer',
    description: 'Can create and edit design systems',
    permissions: [],
    isSystemRole: true,
  },
  APPROVER: {
    id: 'approver',
    name: 'Approver',
    description: 'Can review and approve design system changes',
    permissions: [],
    isSystemRole: true,
  },
  VIEWER: {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to design systems',
    permissions: [],
    isSystemRole: true,
  },
};

/**
 * Default permissions
 */
export const SYSTEM_PERMISSIONS = {
  // Prompt permissions
  PROMPT_CREATE: {
    id: 'prompt_create',
    name: 'Create Prompt',
    description: 'Can submit new design prompts',
    resource: 'prompt',
    action: 'create',
  },
  PROMPT_READ: {
    id: 'prompt_read',
    name: 'Read Prompt',
    description: 'Can view prompts',
    resource: 'prompt',
    action: 'read',
  },
  PROMPT_DELETE: {
    id: 'prompt_delete',
    name: 'Delete Prompt',
    description: 'Can delete prompts',
    resource: 'prompt',
    action: 'delete',
  },

  // Design System permissions
  DESIGN_SYSTEM_CREATE: {
    id: 'design_system_create',
    name: 'Create Design System',
    description: 'Can create new design systems',
    resource: 'design_system',
    action: 'create',
  },
  DESIGN_SYSTEM_READ: {
    id: 'design_system_read',
    name: 'Read Design System',
    description: 'Can view design systems',
    resource: 'design_system',
    action: 'read',
  },
  DESIGN_SYSTEM_UPDATE: {
    id: 'design_system_update',
    name: 'Update Design System',
    description: 'Can modify design systems',
    resource: 'design_system',
    action: 'update',
  },
  DESIGN_SYSTEM_DELETE: {
    id: 'design_system_delete',
    name: 'Delete Design System',
    description: 'Can delete design systems',
    resource: 'design_system',
    action: 'delete',
  },
  DESIGN_SYSTEM_PUBLISH: {
    id: 'design_system_publish',
    name: 'Publish Design System',
    description: 'Can publish design systems',
    resource: 'design_system',
    action: 'publish',
  },

  // Approval permissions
  APPROVAL_REQUEST_CREATE: {
    id: 'approval_request_create',
    name: 'Request Approval',
    description: 'Can request approval for design systems',
    resource: 'approval_request',
    action: 'create',
  },
  APPROVAL_REQUEST_APPROVE: {
    id: 'approval_request_approve',
    name: 'Approve Request',
    description: 'Can approve design system changes',
    resource: 'approval_request',
    action: 'approve',
  },
  APPROVAL_REQUEST_REJECT: {
    id: 'approval_request_reject',
    name: 'Reject Request',
    description: 'Can reject design system changes',
    resource: 'approval_request',
    action: 'reject',
  },

  // Export permissions
  EXPORT_DESIGN_SYSTEM: {
    id: 'export_design_system',
    name: 'Export Design System',
    description: 'Can export design systems',
    resource: 'design_system',
    action: 'export',
  },

  // Admin permissions
  MANAGE_ROLES: {
    id: 'manage_roles',
    name: 'Manage Roles',
    description: 'Can create and manage roles',
    resource: 'role',
    action: 'manage',
  },
  MANAGE_USERS: {
    id: 'manage_users',
    name: 'Manage Users',
    description: 'Can manage user access',
    resource: 'user',
    action: 'manage',
  },
  VIEW_AUDIT_LOG: {
    id: 'view_audit_log',
    name: 'View Audit Log',
    description: 'Can view audit logs',
    resource: 'audit_log',
    action: 'read',
  },
} as const;

/**
 * Default role-to-permission mappings
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  admin: Object.keys(SYSTEM_PERMISSIONS),
  designer_lead: [
    'prompt_create',
    'design_system_create',
    'design_system_read',
    'design_system_update',
    'design_system_publish',
    'approval_request_create',
    'approval_request_approve',
    'export_design_system',
    'view_audit_log',
  ],
  designer: [
    'prompt_create',
    'design_system_create',
    'design_system_read',
    'design_system_update',
    'approval_request_create',
    'export_design_system',
  ],
  approver: [
    'design_system_read',
    'approval_request_approve',
    'approval_request_reject',
    'view_audit_log',
  ],
  viewer: ['prompt_read', 'design_system_read'],
};

/**
 * Default in-memory RBAC manager implementation
 */
export class DefaultRBACManager implements RBACManager {
  private rolePermissions: Map<string, Permission[]> = new Map();
  private userRoles: Map<string, Role[]> = new Map();
  private customRoles: Map<string, Role> = new Map();

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Initialize system permissions to system roles
    for (const [roleId, permissionIds] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const permissions = permissionIds.map(
        (id) => SYSTEM_PERMISSIONS[id as keyof typeof SYSTEM_PERMISSIONS]
      );
      this.rolePermissions.set(roleId, permissions);
    }
  }

  async authorize(context: AuthorizationContext): Promise<AuthorizationDecision> {
    try {
      const userPermissions = await this.getUserPermissions(context.user);

      // Check if user has a permission matching resource + action
      const hasPermission = userPermissions.some(
        (p) => p.resource === context.resource && p.action === context.action
      );

      if (hasPermission) {
        const grantedBy = context.user.roles
          .map((r) => r.name)
          .join(', ');

        return {
          allowed: true,
          reason: `User authorized via roles: ${grantedBy}`,
          grantedBy,
        };
      }

      return {
        allowed: false,
        reason: `User does not have permission to ${context.action} on ${context.resource}`,
      };
    } catch (error) {
      return {
        allowed: false,
        reason: `Authorization check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async getUserPermissions(user: UserWithRoles): Promise<Permission[]> {
    const permissions = new Set<Permission>();

    // Collect permissions from all assigned roles
    for (const role of user.roles) {
      const rolePerms = this.rolePermissions.get(role.id) || [];
      rolePerms.forEach((p) => permissions.add(p));
    }

    // Add any direct permissions
    if (user.additionalPermissions) {
      user.additionalPermissions.forEach((p) => permissions.add(p));
    }

    return Array.from(permissions);
  }

  async addPermissionToRole(roleId: string, permission: Permission): Promise<void> {
    const permissions = this.rolePermissions.get(roleId) || [];
    // Avoid duplicates
    if (!permissions.some((p) => p.id === permission.id)) {
      permissions.push(permission);
      this.rolePermissions.set(roleId, permissions);
    }
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const permissions = this.rolePermissions.get(roleId) || [];
    this.rolePermissions.set(
      roleId,
      permissions.filter((p) => p.id !== permissionId)
    );
  }

  async assignRoleToUser(userId: string, tenantId: string, roleId: string): Promise<void> {
    const key = `${tenantId}:${userId}`;
    const roles = this.userRoles.get(key) || [];
    
    // Get the role (system or custom)
    const systemRole = Object.values(SYSTEM_ROLES).find((r) => r.id === roleId);
    const customRole = this.customRoles.get(roleId);
    const role = systemRole || customRole;

    if (role && !roles.some((r) => r.id === roleId)) {
      roles.push(role);
      this.userRoles.set(key, roles);
    }
  }

  async revokeRoleFromUser(userId: string, tenantId: string, roleId: string): Promise<void> {
    const key = `${tenantId}:${userId}`;
    const roles = this.userRoles.get(key) || [];
    this.userRoles.set(key, roles.filter((r) => r.id !== roleId));
  }

  async createRole(role: Omit<Role, 'id' | 'isSystemRole'>): Promise<Role> {
    const id = `custom_${Date.now()}`;
    const newRole: Role = {
      ...role,
      id,
      isSystemRole: false,
    };
    this.customRoles.set(id, newRole);
    this.rolePermissions.set(id, []);
    return newRole;
  }

  async deleteRole(roleId: string): Promise<void> {
    this.customRoles.delete(roleId);
    this.rolePermissions.delete(roleId);
  }
}
