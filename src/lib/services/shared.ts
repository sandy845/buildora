import type { UserRole } from "@/lib/types/models";
export type { UserRole };
import { getProject } from "../db/data-access.ts";



export type ServiceActor = {
  id: string;
  role: UserRole;
};

export class ServiceError extends Error {
  readonly code: "INVALID_INPUT" | "FORBIDDEN" | "NOT_FOUND" | "DATABASE_ERROR";

  constructor(
    message: string,
    code: "INVALID_INPUT" | "FORBIDDEN" | "NOT_FOUND" | "DATABASE_ERROR",
  ) {
    super(message);
    this.code = code;
    this.name = "ServiceError";
  }
}


export function requireText(value: string | undefined | null, field: string) {
  if (!value?.trim()) {
    throw new ServiceError(`${field} is required.`, "INVALID_INPUT");
  }
  return value.trim();
}

export function requireEmail(value: string | undefined | null, field = "email") {
  const email = requireText(value, field).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    throw new ServiceError(`${field} must be a valid email address.`, "INVALID_INPUT");
  }
  return email;
}

export function requireId(value: string | undefined | null, field: string) {
  return requireText(value, field);
}

export function requirePositive(value: number, field: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ServiceError(`${field} must be greater than zero.`, "INVALID_INPUT");
  }
  return value;
}

export function requireMoney(value: number, field: string) {
  requirePositive(value, field);
  if (Math.round(value * 100) !== value * 100) {
    throw new ServiceError(`${field} must have no more than two decimal places.`, "INVALID_INPUT");
  }
  return value;
}

export function requireDate(value: Date | string | undefined | null, field: string) {
  const date = value instanceof Date ? value : new Date(value ?? "");
  if (Number.isNaN(date.getTime())) {
    throw new ServiceError(`${field} must be a valid date.`, "INVALID_INPUT");
  }
  return date;
}

export function requireObject(value: unknown, field: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ServiceError(`${field} must be an object.`, "INVALID_INPUT");
  }
  return value;
}

export function requirePatch(data: object) {
  if (Object.keys(data).length === 0) {
    throw new ServiceError("At least one field must be updated.", "INVALID_INPUT");
  }
}

export async function safeDatabaseOperation<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    console.error("Buildora database operation failed", error);
    throw new ServiceError("We could not complete that request. Please try again.", "DATABASE_ERROR");
  }
}

export async function assertProjectAccess(actor: ServiceActor, projectId: string) {
  requireId(projectId, "projectId");

  const project = await getProject({ id: projectId });
  if (!project) {
    throw new ServiceError("Project not found.", "NOT_FOUND");
  }

  if (actor.role !== "admin" && project.customerId !== actor.id) {
    throw new ServiceError("You cannot access this project.", "FORBIDDEN");
  }

  return project;
}

export function assertProjectCustomer(actor: ServiceActor, customerId: string) {
  requireId(customerId, "customerId");
  if (actor.role !== "admin" && actor.id !== customerId) {
    throw new ServiceError("Customers can create projects only for themselves.", "FORBIDDEN");
  }
}
