import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generatePresignedDownloadUrl, isMockStorageAllowed } from "@/lib/storage";
import { canAccessProject } from "@/lib/services/shared";
import {
  apiError,
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  requireRouteUser,
} from "@/lib/api";

export async function GET(req: NextRequest) {
  const guard = await requireRouteUser();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;

  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key || typeof key !== "string" || !key.trim()) {
      return apiError("Missing or invalid 'key' query parameter.", 400);
    }

    const [documentVersion, designVersion] = await Promise.all([
      prisma.documentVersion.findFirst({
        where: { fileUrl: key, document: { deletedAt: null, project: { deletedAt: null } } },
        select: { document: { select: { project: { select: { customerId: true } } } } },
      }),
      prisma.designVersion.findFirst({
        where: { fileUrl: key, designAsset: { deletedAt: null, project: { deletedAt: null } } },
        select: { designAsset: { select: { project: { select: { customerId: true } } } } },
      }),
    ]);

    const customerId =
      documentVersion?.document.project.customerId ??
      designVersion?.designAsset.project.customerId;

    if (!customerId) {
      return apiNotFound("Requested file not found or has been removed.");
    }

    if (!canAccessProject(user, customerId)) {
      return apiForbidden("You do not have permission to download this file.");
    }

    const result = generatePresignedDownloadUrl(key, 3600);

    if ("isMock" in result && result.isMock && !isMockStorageAllowed()) {
      return apiError("Storage service is not configured for production downloads.", 503, {
        code: "STORAGE_UNAVAILABLE",
      });
    }

    if ("error" in result) {
      return apiError(result.error, 500);
    }

    return apiSuccess({
      downloadUrl: result.url,
      expiresAt: result.expiresAt,
      isMock: result.isMock ?? false,
    });
  } catch (error) {
    return apiInternalError(error, "Failed to generate presigned download URL.");
  }
}
