import type { UserRole } from "@/lib/types/models";
import { ServiceError } from "@/lib/services/shared";

// ==============================================================================
// Granular Permission Definitions
// ==============================================================================

export type Permission =
  // Profile
  | "profile:read"
  | "profile:update"
  // Projects
  | "projects:read_own"
  | "projects:read_all"
  | "projects:create_own"
  | "projects:create_any"
  | "projects:update_own"
  | "projects:update_any"
  | "projects:delete_any"
  // Quotations
  | "quotations:read_own"
  | "quotations:read_all"
  | "quotations:manage"
  | "quotations:respond"
  // Approvals
  | "approvals:read_own"
  | "approvals:respond"
  | "approvals:manage"
  // Documents & Blueprints
  | "documents:read_own"
  | "documents:upload_own"
  | "documents:read_all"
  | "documents:manage_all"
  // Messages
  | "messages:read_own"
  | "messages:send_own"
  | "messages:read_all"
  // Leads & Enquiries
  | "leads:create"
  | "leads:read_all"
  | "leads:manage"
  // Financial & Payments
  | "payments:read_own"
  | "payments:manage"
  // Administration & Auditing
  | "admin:dashboard"
  | "admin:audit_logs";

export const CUSTOMER_PERMISSIONS: ReadonlySet<Permission> = new Set([
  "profile:read",
  "profile:update",
  "projects:read_own",
  "projects:create_own",
  "quotations:read_own",
  "quotations:respond",
  "approvals:read_own",
  "approvals:respond",
  "documents:read_own",
  "documents:upload_own",
  "messages:read_own",
  "messages:send_own",
  "leads:create",
  "payments:read_own",
]);

export const ADMIN_PERMISSIONS: ReadonlySet<Permission> = new Set([
  "profile:read",
  "profile:update",
  "projects:read_own",
  "projects:read_all",
  "projects:create_own",
  "projects:create_any",
  "projects:update_own",
  "projects:update_any",
  "projects:delete_any",
  "quotations:read_own",
  "quotations:read_all",
  "quotations:manage",
  "quotations:respond",
  "approvals:read_own",
  "approvals:respond",
  "approvals:manage",
  "documents:read_own",
  "documents:upload_own",
  "documents:read_all",
  "documents:manage_all",
  "messages:read_own",
  "messages:send_own",
  "messages:read_all",
  "leads:create",
  "leads:read_all",
  "leads:manage",
  "payments:read_own",
  "payments:manage",
  "admin:dashboard",
  "admin:audit_logs",
]);

export type Actor = {
  id: string;
  role: UserRole;
};

/**
 * Checks whether an actor with a given role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  if (role === "admin") {
    return ADMIN_PERMISSIONS.has(permission);
  }
  if (role === "customer") {
    return CUSTOMER_PERMISSIONS.has(permission);
  }
  return false;
}

/**
 * Asserts that an actor holds the requested permission, throwing a 403 ServiceError if not.
 */
export function assertPermission(actor: Actor, permission: Permission): void {
  if (!actor || !hasPermission(actor.role, permission)) {
    throw new ServiceError(
      `Access denied. Missing permission: '${permission}'.`,
      "FORBIDDEN"
    );
  }
}

/**
 * Determines whether the actor is allowed to access a resource owned by `ownerId`.
 * Administrators have universal access; Customers may only access their own resources.
 */
export function canAccessResource(actor: Actor, ownerId: string): boolean {
  if (!actor || !actor.id) return false;
  if (actor.role === "admin") return true;
  return actor.role === "customer" && actor.id === ownerId;
}

/**
 * Asserts that the actor owns the target resource or is an administrator.
 */
export function assertResourceAccess(actor: Actor, ownerId: string, resourceName = "resource"): void {
  if (!canAccessResource(actor, ownerId)) {
    throw new ServiceError(
      `Access denied. You do not have permission to view or manage this ${resourceName}.`,
      "FORBIDDEN"
    );
  }
}

