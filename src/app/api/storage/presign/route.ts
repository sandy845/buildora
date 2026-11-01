import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { canAccessProject } from "@/lib/services/shared";
import {
  buildObjectKey,
  generatePresignedUploadUrl,
  isMockStorageAllowed,
  validateUpload,
} from "@/lib/storage";
import {
  apiError,
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiTooManyRequests,
  parseAndValidateJson,
  requireRouteUser,
  StoragePresignRequestSchema,
} from "@/lib/api";
import {
  getClientIp,
  getRateLimitHeaders,
  storagePresignLimiter,
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const guard = await requireRouteUser();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;

  try {
    const ip = getClientIp(req.headers);
    const rateCheck = await storagePresignLimiter.checkAsync(`${ip}:${user.id}`);
    const rateHeaders = getRateLimitHeaders(rateCheck, storagePresignLimiter.limit);

    if (!rateCheck.success) {
      const retrySeconds = Math.ceil(rateCheck.retryAfterMs / 1000);
      return apiTooManyRequests(
        `Too many upload requests. Please wait ${retrySeconds} seconds before requesting another upload URL.`,
        rateHeaders
      );
    }
    const validation = await parseAndValidateJson(req, StoragePresignRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { projectId, fileName, contentType, fileSizeBytes, category } = validation.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, customerId: true, deletedAt: true },
    });

    if (!project || project.deletedAt) {
      return apiNotFound("Project not found.");
    }

    if (!canAccessProject(user, project.customerId)) {
      return apiForbidden("You do not have access to upload documents to this project.");
    }

    const uploadValidation = validateUpload(contentType, fileSizeBytes, category, fileName);
    if (!uploadValidation.valid) {
      return apiError(uploadValidation.error, 400);
    }

    const subfolder = category === "blueprint" ? "blueprints" : "documents";
    let objectKey: string;
    try {
      objectKey = buildObjectKey(`projects/${projectId}`, subfolder, fileName);
    } catch (keyError) {
      return apiError(
        keyError instanceof Error ? keyError.message : "File name is not permitted.",
        400
      );
    }

    const result = generatePresignedUploadUrl(objectKey, contentType);
    if ("isMock" in result && result.isMock && !isMockStorageAllowed()) {
      return apiError("Storage service is not configured for production uploads.", 503, {
        code: "STORAGE_UNAVAILABLE",
      });
    }
    if ("error" in result) {
      return apiError(result.error, 500);
    }

    return apiSuccess({
      presignedUrl: result.url,
      key: result.key,
      expiresAt: result.expiresAt,
      isMock: result.isMock ?? false,
    });
  } catch (error) {
    return apiInternalError(error, "Failed to generate presigned upload URL.");
  }
}
