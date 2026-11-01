import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { canAccessProject } from "@/lib/services/shared";
import { hasPermission, type Permission } from "@/lib/auth/rbac";
import { apiForbidden, apiNotFound, apiUnauthorized } from "./response";
import type { UserRole } from "@/lib/types/models";

export type AuthenticatedRouteUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthGuardSuccess<T = AuthenticatedRouteUser> = {
  authorized: true;
  user: T;
};

export type AuthGuardFailure = {
  authorized: false;
  response: ReturnType<typeof apiUnauthorized> | ReturnType<typeof apiForbidden> | ReturnType<typeof apiNotFound>;
};

export type AuthGuardResult<T = AuthenticatedRouteUser> = AuthGuardSuccess<T> | AuthGuardFailure;

/**
 * Validates that a session exists and belongs to an active user.
 * Returns 401 Unauthorized if missing or invalid.
 */
export async function requireRouteUser(): Promise<AuthGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      authorized: false,
      response: apiUnauthorized("Authentication required. Please sign in to access this endpoint."),
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Validates that the current user possesses the 'admin' role.
 * Returns 401 Unauthorized if not signed in, or 403 Forbidden if not an admin.
 */
export async function requireAdminRoute(): Promise<AuthGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      authorized: false,
      response: apiUnauthorized("Authentication required. Please sign in as an administrator."),
    };
  }

  if (user.role !== "admin") {
    return {
      authorized: false,
      response: apiForbidden("Administrator privileges are required for this action."),
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Validates that the current user possesses a specific granular permission.
 * Returns 401 Unauthorized if not signed in, or 403 Forbidden if permission is lacking.
 */
export async function requirePermissionRoute(permission: Permission): Promise<AuthGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      authorized: false,
      response: apiUnauthorized("Authentication required. Please sign in to access this endpoint."),
    };
  }

  if (!hasPermission(user.role, permission)) {
    return {
      authorized: false,
      response: apiForbidden(`Access denied. Missing required permission: '${permission}'.`),
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Validates that the user has legitimate access to a specific project.
 * Administrators have universal access; customers can access only their own projects.
 */
export async function requireProjectRouteAccess(
  user: AuthenticatedRouteUser,
  projectId: string
): Promise<
  | { authorized: true; project: { id: string; customerId: string; name: string } }
  | AuthGuardFailure
> {
  if (!projectId) {
    return {
      authorized: false,
      response: apiNotFound("Project ID was not provided."),
    };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { id: true, customerId: true, name: true },
  });

  if (!project) {
    return {
      authorized: false,
      response: apiNotFound("Project not found or has been archived."),
    };
  }

  if (!canAccessProject(user, project.customerId)) {
    return {
      authorized: false,
      response: apiForbidden("You do not have permission to access or modify this project."),
    };
  }

  return {
    authorized: true,
    project,
  };
}

